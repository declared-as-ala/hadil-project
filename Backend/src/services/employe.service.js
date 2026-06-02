const bcrypt = require('bcryptjs');
const Employe = require('../models/Employe.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getCongeEndDate = (conge) => {
  const end = new Date(conge.date_debut);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() + Math.max(Number(conge.periode) || 1, 1) - 1);
  return end;
};

const isCongeActiveOnDate = (conge, date = new Date()) => {
  if (!conge?.date_debut || conge.status !== 'approved') return false;

  const { start: todayStart, end: todayEnd } = getDayBounds(date);
  const start = new Date(conge.date_debut);
  start.setHours(0, 0, 0, 0);

  return start <= todayEnd && getCongeEndDate(conge) >= todayStart;
};

// Lazy-require to avoid circular dependency issues at startup
const getCascadeModels = () => ({
  Affectation: require('../models/Affectation.model'),
  Absence: require('../models/Absence.model'),
  Conge: require('../models/Conge.model'),
  HeureSupplementaire: require('../models/HeureSupplementaire.model'),
  DemandeDocument: require('../models/DemandeDocument.model'),
});

class EmployeService {
  async syncLeaveStatuses(currentDate = new Date()) {
    const { Conge } = getCascadeModels();
    const { end: todayEnd } = getDayBounds(currentDate);

    const approvedStartedConges = await Conge.find({
      status: 'approved',
      date_debut: { $lte: todayEnd },
    }).select('employe date_debut periode status');

    const activeEmployeIds = [
      ...new Set(
        approvedStartedConges
          .filter((conge) => isCongeActiveOnDate(conge, currentDate))
          .map((conge) => String(conge.employe))
      ),
    ];

    const updates = [];
    if (activeEmployeIds.length > 0) {
      updates.push(
        Employe.updateMany(
          { _id: { $in: activeEmployeIds }, status: { $ne: 'inactif' } },
          { status: 'en_conge' }
        )
      );
    }

    updates.push(
      Employe.updateMany(
        activeEmployeIds.length > 0
          ? { _id: { $nin: activeEmployeIds }, status: 'en_conge' }
          : { status: 'en_conge' },
        { status: 'actif' }
      )
    );

    await Promise.all(updates);
    return activeEmployeIds;
  }

  async _syncAffectationFromPosteName(employe, nomPoste, dateDebut) {
    if (!nomPoste || !nomPoste.trim()) return;

    const Poste = require('../models/Poste.model');
    const Affectation = require('../models/Affectation.model');
    const cleanPoste = nomPoste.trim();
    let poste = await Poste.findOne({
      nom_poste: { $regex: new RegExp(`^${escapeRegExp(cleanPoste)}$`, 'i') },
    });
    if (!poste && cleanPoste.toLowerCase() === 'rh') {
      poste = await Poste.create({
        nom_poste: 'RH',
        salaire_base: 0,
        prix_heure_sup: 0,
      });
    }
    if (!poste) return;

    const active = await Affectation.findOne({ employe: employe._id, date_fin: null }).populate('poste');
    if (active && String(active.poste?._id || active.poste) === String(poste._id)) return;

    const startDate = dateDebut || employe.dateEmbauche || new Date();
    await Affectation.updateMany(
      { employe: employe._id, date_fin: null },
      { date_fin: startDate }
    );
    await Affectation.create({
      employe: employe._id,
      poste: poste._id,
      date_debut: startDate,
      date_fin: null,
    });
  }

  async _ensureRhEmployeeProfiles() {
    const Poste = require('../models/Poste.model');
    const rhUsers = await User.find({ role: 'rh' });

    let rhPoste = await Poste.findOne({ nom_poste: { $regex: /^RH$/i } });
    if (!rhPoste) {
      rhPoste = await Poste.create({
        nom_poste: 'RH',
        salaire_base: 0,
        prix_heure_sup: 0,
      });
    }

    for (const user of rhUsers) {
      const existing = await Employe.findOne({ utilisateur: user._id });
      if (existing) continue;

      const localPart = (user.email || '').split('@')[0] || 'rh';
      const parts = localPart.split(/[._-]+/).filter(Boolean);
      const prenom = parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : 'RH';
      const nom = parts[1] ? parts.slice(1).join(' ').toUpperCase() : 'Utilisateur';
      const employe = await Employe.create({
        utilisateur: user._id,
        nom,
        prenom,
        poste: rhPoste.nom_poste,
        dateEmbauche: user.createdAt || new Date(),
        telephone: '',
        salaire_base: 0,
        prix_heure_sup: 0,
        status: 'actif',
      });

      await this._syncAffectationFromPosteName(employe, rhPoste.nom_poste, employe.dateEmbauche);
    }
  }

  async _getDynamicSalaryData(employeId) {
    const paieService = require('./paie.service');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    return paieService.calculerSalaire(employeId, currentMonth, currentYear);
  }

  async getAllEmployes(filters = {}) {
    await this._ensureRhEmployeeProfiles();
    await this.syncLeaveStatuses();

    const query = {};
    if (filters.status) query.status = filters.status;

    const employes = await Employe.find(query)
      .populate('utilisateur', 'email role');

    const populatedEmployes = [];
    for (const emp of employes) {
      // Exclude Admin from employee lists & statistics
      if (emp.utilisateur && emp.utilisateur.role === 'admin') {
        continue;
      }
      try {
        const dynamicData = await this._getDynamicSalaryData(emp._id);
        const empObj = emp.toObject();
        populatedEmployes.push({
          ...empObj,
          poste: dynamicData.poste || empObj.poste,
          salaire_base: dynamicData.salaire_base ?? empObj.salaire_base,
          prix_heure_sup: dynamicData.prix_heure_sup ?? empObj.prix_heure_sup,
          salaire_total: dynamicData.salaire_total ?? dynamicData.salaire_base ?? empObj.salaire_base,
        });
      } catch (err) {
        populatedEmployes.push(emp);
      }
    }

    return populatedEmployes;
  }

  async getEmployeById(id) {
    await this.syncLeaveStatuses();

    const employe = await Employe.findById(id)
      .populate('utilisateur', 'email role');

    if (!employe || (employe.utilisateur && employe.utilisateur.role === 'admin')) {
      throw new ApiError(404, 'Employe not found');
    }

    try {
      const dynamicData = await this._getDynamicSalaryData(employe._id);
      const empObj = employe.toObject();
      return {
        ...empObj,
        poste: dynamicData.poste || empObj.poste,
        salaire_base: dynamicData.salaire_base ?? empObj.salaire_base,
        prix_heure_sup: dynamicData.prix_heure_sup ?? empObj.prix_heure_sup,
        salaire_total: dynamicData.salaire_total ?? dynamicData.salaire_base ?? empObj.salaire_base,
      };
    } catch (err) {
      console.error('Failed to calculate dynamic salary for employe', err);
      return employe;
    }
  }

  /**
   * Admin creates an employee or RH user:
   * 1. Create User account (email + password + role = 'employe' or 'rh')
   * 2. Create Employee profile linked to that User
   * Rolls back the User if Employee creation fails.
   */
  async createEmploye(data) {
    const { nom, prenom, email, password, poste, dateEmbauche, telephone, salaire_base, prix_heure_sup, status, role } = data;

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Validate role: only 'employe' or 'rh' are allowed here
    const assignedRole = role === 'rh' ? 'rh' : 'employe';

    // 1. Create User account
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
    });

    try {
      // 2. Create Employee profile linked to User
      const employe = await Employe.create({
        utilisateur: user._id,
        nom,
        prenom,
        poste: poste || '',
        dateEmbauche: dateEmbauche || null,
        telephone: telephone || '',
        salaire_base: salaire_base ?? 0,
        prix_heure_sup: prix_heure_sup ?? 0,
        status: status || 'actif',
      });

      await this._syncAffectationFromPosteName(employe, poste, dateEmbauche);

      return Employe.findById(employe._id).populate('utilisateur', 'email role');
    } catch (err) {
      // Rollback: delete user if employee creation failed
      await User.findByIdAndDelete(user._id);
      throw err;
    }
  }

  async updateEmploye(id, data) {
    const { role, ...employeData } = data;

    const employe = await Employe.findByIdAndUpdate(id, employeData, {
      new: true,
      runValidators: true,
    }).populate('utilisateur', 'email role');

    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }

    if (role && employe.utilisateur) {
      const assignedRole = role === 'rh' ? 'rh' : 'employe';
      await User.findByIdAndUpdate(employe.utilisateur._id, { role: assignedRole });
      employe.utilisateur.role = assignedRole;
    }

    if (data.poste) {
      await this._syncAffectationFromPosteName(employe, data.poste, data.dateEmbauche);
    }

    return employe;
  }

  async deleteEmploye(id) {
    const employe = await Employe.findById(id);
    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }

    // Cascade delete all related data
    const { Affectation, Absence, Conge, HeureSupplementaire, DemandeDocument } = getCascadeModels();

    await Promise.allSettled([
      Affectation.deleteMany({ employe: employe._id }),
      Absence.deleteMany({ employe: employe._id }),
      Conge.deleteMany({ employe: employe._id }),
      HeureSupplementaire.deleteMany({ employe: employe._id }),
      DemandeDocument.deleteMany({ employe: employe._id }),
    ]);

    // Delete the linked User account
    await User.findByIdAndDelete(employe.utilisateur);

    // Delete the Employee profile
    await Employe.findByIdAndDelete(id);

    return { message: 'Employe and all related data deleted successfully' };
  }
}

module.exports = new EmployeService();
