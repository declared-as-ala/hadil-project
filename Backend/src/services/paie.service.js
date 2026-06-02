const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const Employe = require('../models/Employe.model');
const Affectation = require('../models/Affectation.model');
const ApiError = require('../utils/ApiError');

const POPULATE_USER = { path: 'utilisateur', select: 'email role' };

class PaieService {
  _normalizePeriod(mois, annee) {
    const now = new Date();
    const parsedMois = Number.parseInt(mois, 10) || now.getMonth() + 1;
    const parsedAnnee = Number.parseInt(annee, 10) || now.getFullYear();

    if (parsedMois < 1 || parsedMois > 12) {
      throw new ApiError(400, 'Le mois doit etre compris entre 1 et 12.');
    }
    if (parsedAnnee < 1900) {
      throw new ApiError(400, "L'annee est invalide.");
    }

    return { mois: parsedMois, annee: parsedAnnee };
  }

  _periodRange(mois, annee) {
    return {
      startDate: new Date(annee, mois - 1, 1),
      endDate: new Date(annee, mois, 0, 23, 59, 59, 999),
    };
  }

  async _findActiveAffectation(employeId, mois, annee) {
    const { startDate, endDate } = this._periodRange(mois, annee);
    return Affectation.findOne({
      employe: employeId,
      date_debut: { $lte: endDate },
      $or: [{ date_fin: null }, { date_fin: { $gte: startDate } }],
    })
      .populate('poste')
      .sort({ date_debut: -1 });
  }

  async _calculateForEmploye(employe, mois, annee) {
    const { startDate, endDate } = this._periodRange(mois, annee);
    const activeAffectation = await this._findActiveAffectation(employe._id, mois, annee);
    const posteDoc = activeAffectation?.poste || null;

    const salaireBase = Number(posteDoc?.salaire_base) || 0;
    const prixHeureSup = Number(posteDoc?.prix_heure_sup) || 0;

    const heures = await HeureSupplementaire.find({
      employe: employe._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalHeuresSup = heures.reduce(
      (sum, h) => sum + (Number(h.heureSupplementaire) || 0),
      0
    );
    const montantHeuresSup = totalHeuresSup * prixHeureSup;
    const salaireTotal = salaireBase + montantHeuresSup;

    return {
      id: `calc-${employe._id}-${annee}-${mois}`,
      employe,
      poste: posteDoc?.nom_poste || employe.poste || '',
      affectation: activeAffectation
        ? {
            id: activeAffectation._id,
            date_debut: activeAffectation.date_debut,
            date_fin: activeAffectation.date_fin,
          }
        : null,
      mois,
      annee,
      salaire_base: salaireBase,
      total_heures_sup: totalHeuresSup,
      prix_heure_sup: prixHeureSup,
      montant_heures_sup: montantHeuresSup,
      salaire_total: salaireTotal,
      isCalculated: true,
    };
  }

  async calculerSalaire(employeId, mois, annee) {
    const period = this._normalizePeriod(mois, annee);
    const employe = await Employe.findById(employeId).populate(POPULATE_USER);
    if (!employe) {
      throw new ApiError(404, 'Employe introuvable.');
    }
    if (employe.utilisateur?.role === 'admin') {
      throw new ApiError(404, 'Employe introuvable.');
    }

    return this._calculateForEmploye(employe, period.mois, period.annee);
  }

  async getAllPaies(filters = {}) {
    const period = this._normalizePeriod(filters.mois, filters.annee);
    const query = filters.employeId ? { _id: filters.employeId } : {};
    const employes = await Employe.find(query).populate(POPULATE_USER).sort({ nom: 1, prenom: 1 });
    const result = [];

    for (const employe of employes) {
      if (employe.utilisateur?.role === 'admin') continue;
      result.push(await this._calculateForEmploye(employe, period.mois, period.annee));
    }

    return result;
  }

  async getPaiesByEmploye(employeId, filters = {}) {
    const { annee } = this._normalizePeriod(filters.mois, filters.annee);
    if (filters.mois) {
      return [await this.calculerSalaire(employeId, filters.mois, annee)];
    }

    const now = new Date();
    const lastMonth = annee === now.getFullYear() ? now.getMonth() + 1 : 12;
    const result = [];
    for (let mois = lastMonth; mois >= 1; mois -= 1) {
      result.push(await this.calculerSalaire(employeId, mois, annee));
    }
    return result;
  }

  async getPaieDataForDocument(employeId, mois, annee) {
    return this.calculerSalaire(employeId, mois, annee);
  }
}

module.exports = new PaieService();
