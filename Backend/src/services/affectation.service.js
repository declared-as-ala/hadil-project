const Affectation = require('../models/Affectation.model');
const Poste = require('../models/Poste.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

const POPULATE_OPTS = [
  { path: 'employe', populate: { path: 'utilisateur', select: 'nom prenom email' } },
  { path: 'poste' },
];

class AffectationService {
  async getAllAffectations() {
    return Affectation.find().populate(POPULATE_OPTS).sort({ date_debut: -1 });
  }

  async getAffectationById(id) {
    const aff = await Affectation.findById(id).populate(POPULATE_OPTS);
    if (!aff) throw new ApiError(404, 'Affectation introuvable.');
    return aff;
  }

  async getAffectationActuelle(employeId) {
    return Affectation.findOne({ employe: employeId, date_fin: null }).populate(POPULATE_OPTS);
  }

  async createAffectation(data) {
    // Close any existing active affectation
    await Affectation.updateMany(
      { employe: data.employeId, date_fin: null },
      { date_fin: new Date(data.date_debut) }
    );
    const aff = new Affectation({
      employe: data.employeId,
      poste: data.posteId,
      date_debut: data.date_debut,
      date_fin: data.date_fin || null,
    });
    await aff.save();
    return Affectation.findById(aff._id).populate(POPULATE_OPTS);
  }

  async updateAffectation(id, data) {
    const updateData = {};
    if (data.posteId) updateData.poste = data.posteId;
    if (data.date_debut) updateData.date_debut = data.date_debut;
    if (data.date_fin !== undefined) updateData.date_fin = data.date_fin;
    const aff = await Affectation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(POPULATE_OPTS);
    if (!aff) throw new ApiError(404, 'Affectation introuvable.');
    return aff;
  }

  async deleteAffectation(id) {
    const aff = await Affectation.findByIdAndDelete(id);
    if (!aff) throw new ApiError(404, 'Affectation introuvable.');
    return { message: 'Affectation supprimée avec succès.' };
  }

  /**
   * SYNC: For every existing employee that has a real poste string (not a role name),
   * find-or-create a Poste document and create an Affectation if none exists.
   */
  async syncFromEmployes() {
    // These are user roles, NOT job positions — skip them
    const ROLE_NAMES = ['employe', 'employé', 'admin', 'rh', 'stagiaire', 'manager'];

    const employes = await Employe.find({ poste: { $exists: true, $ne: null, $ne: '' } })
      .populate('utilisateur', 'nom prenom email');

    const results = { created: [], skipped: [], errors: [] };

    for (const emp of employes) {
      try {
        const nomPoste = (emp.poste || '').trim();

        // Skip empty or role-name values
        if (!nomPoste || ROLE_NAMES.includes(nomPoste.toLowerCase())) {
          results.skipped.push({ id: emp._id, reason: `"${nomPoste}" est un rôle, pas un poste` });
          continue;
        }

        // 1. Find or create Poste by name (case-insensitive)
        let poste = await Poste.findOne({ nom_poste: { $regex: new RegExp(`^${nomPoste}$`, 'i') } });
        if (!poste) {
          poste = await Poste.create({
            nom_poste: nomPoste,
            salaire_base: 0,
            prix_heure_sup: 0,
          });
        }

        // 2. Check if employee already has an active affectation
        const existing = await Affectation.findOne({ employe: emp._id, date_fin: null });
        if (existing) {
          results.skipped.push({ id: emp._id, reason: 'déjà affecté' });
          continue;
        }

        // 3. Create affectation
        const dateDebut = emp.dateEmbauche || emp.createdAt || new Date();
        await Affectation.create({
          employe: emp._id,
          poste: poste._id,
          date_debut: dateDebut,
          date_fin: null,
        });

        results.created.push({
          employe: `${emp.utilisateur?.prenom || ''} ${emp.utilisateur?.nom || ''}`.trim(),
          poste: poste.nom_poste,
        });
      } catch (err) {
        results.errors.push({ employeId: emp._id, error: err.message });
      }
    }

    return results;
  }
}

module.exports = new AffectationService();
