const bcrypt = require('bcryptjs');
const Employe = require('../models/Employe.model');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;

// Lazy-require to avoid circular dependency issues at startup
const getCascadeModels = () => ({
  Affectation: require('../models/Affectation.model'),
  Paie: require('../models/Paie.model'),
  Absence: require('../models/Absence.model'),
  Conge: require('../models/Conge.model'),
  HeureSupplementaire: require('../models/HeureSupplementaire.model'),
});

class EmployeService {
  async getAllEmployes(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.departement) query.departement = filters.departement;

    const employes = await Employe.find(query)
      .populate('utilisateur', 'email role')
      .populate('stagiairesEncadres', 'sujetDeStage status');

    return employes;
  }

  async getEmployeById(id) {
    const employe = await Employe.findById(id)
      .populate('utilisateur', 'email role');

    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }
    return employe;
  }

  /**
   * Admin creates an employee:
   * 1. Create User account (email + password + role = 'employe')
   * 2. Create Employee profile linked to that User
   * Rolls back the User if Employee creation fails.
   */
  async createEmploye(data) {
    const { nom, prenom, email, password, poste, departement, dateEmbauche, telephone, salaire_base, prix_heure_sup, status } = data;

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // 1. Create User account
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: 'employe',
    });

    try {
      // 2. Create Employee profile linked to User
      const employe = await Employe.create({
        utilisateur: user._id,
        nom,
        prenom,
        poste: poste || '',
        departement: departement || '',
        dateEmbauche: dateEmbauche || null,
        telephone: telephone || '',
        salaire_base: salaire_base ?? 0,
        prix_heure_sup: prix_heure_sup ?? 0,
        status: status || 'actif',
      });

      return Employe.findById(employe._id).populate('utilisateur', 'email role');
    } catch (err) {
      // Rollback: delete user if employee creation failed
      await User.findByIdAndDelete(user._id);
      throw err;
    }
  }

  async updateEmploye(id, data) {
    const employe = await Employe.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('utilisateur', 'email role');

    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }
    return employe;
  }

  async deleteEmploye(id) {
    const employe = await Employe.findById(id);
    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }

    // Cascade delete all related data
    const { Affectation, Paie, Absence, Conge, HeureSupplementaire } = getCascadeModels();

    await Promise.allSettled([
      Affectation.deleteMany({ employe: employe._id }),
      Paie.deleteMany({ employe: employe._id }),
      Absence.deleteMany({ employe: employe._id }),
      Conge.deleteMany({ employe: employe._id }),
      HeureSupplementaire.deleteMany({ employe: employe._id }),
    ]);

    // Delete the linked User account
    await User.findByIdAndDelete(employe.utilisateur);

    // Delete the Employee profile
    await Employe.findByIdAndDelete(id);

    return { message: 'Employe and all related data deleted successfully' };
  }
}

module.exports = new EmployeService();
