const Projet = require('../models/Projet.model');
const ApiError = require('../utils/ApiError');

class ProjetService {
  async getAllProjets(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;

    const projets = await Projet.find(query)
      .populate('chefDeProjet', 'poste departement')
      .populate('membres', 'poste departement')
      .populate([
        { path: 'chefDeProjet', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    return projets;
  }

  async getProjetById(id) {
    const projet = await Projet.findById(id)
      .populate('chefDeProjet', 'poste departement')
      .populate('membres', 'poste departement')
      .populate([
        { path: 'chefDeProjet', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!projet) {
      throw new ApiError(404, 'Projet not found');
    }
    return projet;
  }

  async createProjet(data) {
    const projet = new Projet({
      nom: data.nom,
      description: data.description,
      status: data.status || 'not_started',
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      chefDeProjet: data.chefDeProjetId || null,
      membres: data.membresIds || [],
    });

    await projet.save();

    return Projet.findById(projet._id)
      .populate('chefDeProjet', 'poste departement')
      .populate('membres', 'poste departement')
      .populate([
        { path: 'chefDeProjet', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);
  }

  async updateProjet(id, data) {
    const updateData = { ...data };
    if (updateData.chefDeProjetId) {
      updateData.chefDeProjet = updateData.chefDeProjetId;
      delete updateData.chefDeProjetId;
    }
    if (updateData.membresIds) {
      updateData.membres = updateData.membresIds;
      delete updateData.membresIds;
    }

    const projet = await Projet.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('chefDeProjet', 'poste departement')
      .populate('membres', 'poste departement')
      .populate([
        { path: 'chefDeProjet', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!projet) {
      throw new ApiError(404, 'Projet not found');
    }
    return projet;
  }

  async deleteProjet(id) {
    const projet = await Projet.findByIdAndDelete(id);
    if (!projet) {
      throw new ApiError(404, 'Projet not found');
    }
    return { message: 'Projet deleted successfully' };
  }

  async assignMember(projetId, employeId) {
    const projet = await Projet.findByIdAndUpdate(
      projetId,
      { $addToSet: { membres: employeId } },
      { new: true, runValidators: true }
    )
      .populate('membres', 'poste departement')
      .populate([
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!projet) {
      throw new ApiError(404, 'Projet not found');
    }
    return projet;
  }

  async removeMember(projetId, employeId) {
    const projet = await Projet.findByIdAndUpdate(
      projetId,
      { $pull: { membres: employeId } },
      { new: true, runValidators: true }
    )
      .populate('membres', 'poste departement')
      .populate([
        { path: 'membres', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!projet) {
      throw new ApiError(404, 'Projet not found');
    }
    return projet;
  }
}

module.exports = new ProjetService();
