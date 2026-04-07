const Stagiaire = require('../models/Stagiaire.model');
const ApiError = require('../utils/ApiError');

class StagiaireService {
  async getAllStagiaires(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;

    const stagiaires = await Stagiaire.find(query)
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('encadrant', 'poste departement');

    return stagiaires;
  }

  async getStagiaireById(id) {
    const stagiaire = await Stagiaire.findById(id)
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('encadrant', 'poste departement');

    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    return stagiaire;
  }

  async createStagiaire(data) {
    const existing = await Stagiaire.findOne({ utilisateur: data.utilisateurId });
    if (existing) {
      throw new ApiError(409, 'This user is already registered as a stagiaire');
    }

    const stagiaire = new Stagiaire({
      utilisateur: data.utilisateurId,
      sujetDeStage: data.sujetDeStage,
      encadrant: data.encadrantId || null,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      status: data.status || 'actif',
    });

    await stagiaire.save();

    return Stagiaire.findById(stagiaire._id)
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('encadrant', 'poste departement');
  }

  async updateStagiaire(id, data) {
    const updateData = { ...data };
    if (updateData.encadrantId) {
      updateData.encadrant = updateData.encadrantId;
      delete updateData.encadrantId;
    }

    const stagiaire = await Stagiaire.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('encadrant', 'poste departement');

    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    return stagiaire;
  }

  async deleteStagiaire(id) {
    const stagiaire = await Stagiaire.findByIdAndDelete(id);
    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    return { message: 'Stagiaire deleted successfully' };
  }

  async assignEncadrant(stagiaireId, encadrantId) {
    const stagiaire = await Stagiaire.findByIdAndUpdate(
      stagiaireId,
      { encadrant: encadrantId },
      { new: true, runValidators: true }
    )
      .populate('utilisateur', 'nom prenom email')
      .populate('encadrant', 'nom prenom poste departement');

    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    return stagiaire;
  }

  async demanderAssistance(stagiaireId, message) {
    const stagiaire = await Stagiaire.findById(stagiaireId).populate('encadrant');
    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    if (!stagiaire.encadrant) {
      throw new ApiError(400, 'No encadrant assigned to this stagiaire');
    }
    return {
      message: 'Assistance request sent to encadrant',
      stagiaire: stagiaire.utilisateur,
      encadrant: stagiaire.encadrant,
      assistanceMessage: message,
    };
  }

  async gererSujetDeStage(stagiaireId, sujet) {
    const stagiaire = await Stagiaire.findByIdAndUpdate(
      stagiaireId,
      { sujetDeStage: sujet },
      { new: true, runValidators: true }
    ).populate('utilisateur', 'nom prenom email');

    if (!stagiaire) {
      throw new ApiError(404, 'Stagiaire not found');
    }
    return stagiaire;
  }
}

module.exports = new StagiaireService();
