const Paie = require('../models/Paie.model');
const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

// Populate only the employe (with its linked user for name/email)
const POPULATE_OPTS = [
  { path: 'employe', populate: { path: 'utilisateur', select: 'email role' } },
];

class PaieService {
  /**
   * Calculate salary for an employee using data stored directly on the Employee document.
   * salaire_base and prix_heure_sup are no longer read from a Poste affectation.
   */
  async calculerSalaire(employeId, mois, annee) {
    const employe = await Employe.findById(employeId);
    if (!employe) {
      throw new ApiError(404, "Employé introuvable.");
    }

    let salaire_base = employe.salaire_base ?? 0;
    let prix_heure_sup = employe.prix_heure_sup ?? 0;
    let poste = employe.poste || '';

    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0, 23, 59, 59);

    // Look for an active affectation during this month
    const Affectation = require('../models/Affectation.model');
    const activeAffectation = await Affectation.findOne({
      employe: employeId,
      date_debut: { $lte: endDate },
      $or: [{ date_fin: null }, { date_fin: { $gte: startDate } }]
    }).populate('poste').sort({ date_debut: -1 });

    if (activeAffectation && activeAffectation.poste) {
      salaire_base = activeAffectation.poste.salaire_base ?? salaire_base;
      prix_heure_sup = activeAffectation.poste.prix_heure_sup ?? prix_heure_sup;
      poste = activeAffectation.poste.nom_poste || poste;
    }


    const heures = await HeureSupplementaire.find({
      employe: employeId,
      date: { $gte: startDate, $lte: endDate },
    });

    const total_heures_sup = heures.reduce((sum, h) => sum + h.heureSupplementaire, 0);
    const montant_heures_sup = total_heures_sup * prix_heure_sup;
    const salaire_total = salaire_base + montant_heures_sup;

    return {
      employe: employeId,
      poste,
      mois,
      annee,
      salaire_base,
      total_heures_sup,
      prix_heure_sup,
      montant_heures_sup,
      salaire_total,
    };
  }

  async genererPaie(employeId, mois, annee) {
    const salaryData = await this.calculerSalaire(employeId, mois, annee);
    const paie = await Paie.findOneAndUpdate(
      { employe: employeId, mois, annee },
      salaryData,
      { new: true, upsert: true, runValidators: true }
    );
    return Paie.findById(paie._id).populate(POPULATE_OPTS);
  }

  /**
   * Generate payroll for all active employees.
   */
  async genererToutesPaies(mois, annee) {
    const employes = await Employe.find({ status: 'actif' });
    const results = [];
    for (const emp of employes) {
      try {
        const paie = await this.genererPaie(emp._id, mois, annee);
        results.push(paie);
      } catch (err) {
        console.warn(`Paie skipped for ${emp._id}: ${err.message}`);
      }
    }
    return results;
  }

  async getAllPaies(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.mois) query.mois = parseInt(filters.mois);
    if (filters.annee) query.annee = parseInt(filters.annee);
    return Paie.find(query).populate(POPULATE_OPTS).sort({ annee: -1, mois: -1 });
  }

  async getPaiesByEmploye(employeId) {
    return Paie.find({ employe: employeId }).populate(POPULATE_OPTS).sort({ annee: -1, mois: -1 });
  }

  async getPaieById(id) {
    const paie = await Paie.findById(id).populate(POPULATE_OPTS);
    if (!paie) throw new ApiError(404, 'Fiche de paie introuvable.');
    return paie;
  }

  async getPaieDataForDocument(employeId, mois, annee) {
    let paie = await Paie.findOne({ employe: employeId, mois, annee }).populate(POPULATE_OPTS);
    if (!paie) {
      try {
        const data = await this.calculerSalaire(employeId, mois, annee);
        const emp = await Employe.findById(employeId).populate('utilisateur', 'email role');
        return { ...data, employe: emp };
      } catch {
        return null;
      }
    }
    return paie;
  }

  async deletePaie(id) {
    const paie = await Paie.findByIdAndDelete(id);
    if (!paie) throw new ApiError(404, 'Fiche de paie introuvable.');
    return { message: 'Fiche de paie supprimée avec succès.' };
  }
}

module.exports = new PaieService();
