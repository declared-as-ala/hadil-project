const DemandeEtReclamation = require('../models/DemandeEtReclamation.model');
const ApiError = require('../utils/ApiError');

class DemandeService {
  async getAllDemandes(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.status) query.status = filters.status;

    const demandes = await DemandeEtReclamation.find(query)
      .populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      })
      .sort({ createdAt: -1 });

    return demandes;
  }

  async getDemandeById(id) {
    const demande = await DemandeEtReclamation.findById(id)
      .populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!demande) {
      throw new ApiError(404, 'Demande not found');
    }
    return demande;
  }

  async createDemande(data) {
    const demande = new DemandeEtReclamation({
      sujet: data.sujet,
      description: data.description,
      employe: data.employeId,
      status: 'pending',
    });

    await demande.save();

    return DemandeEtReclamation.findById(demande._id)
      .populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async updateDemande(id, data) {
    const demande = await DemandeEtReclamation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!demande) {
      throw new ApiError(404, 'Demande not found');
    }
    return demande;
  }

  async deleteDemande(id) {
    const demande = await DemandeEtReclamation.findByIdAndDelete(id);
    if (!demande) {
      throw new ApiError(404, 'Demande not found');
    }
    return { message: 'Demande deleted successfully' };
  }

  async consulterDemandes(employeId) {
    const query = employeId ? { employe: employeId } : {};
    const demandes = await DemandeEtReclamation.find(query)
      .populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      })
      .sort({ createdAt: -1 });

    return demandes;
  }
}

module.exports = new DemandeService();
