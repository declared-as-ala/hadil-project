const Contrat = require('../models/Contrat.model');
const ApiError = require('../utils/ApiError');

const EMPLOYE_POPULATE = {
  path: 'employe',
  select: 'nom prenom poste status',
  populate: { path: 'utilisateur', select: 'email role' },
};

class ContratService {
  async getAllContrats(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    return Contrat.find(query)
      .populate(EMPLOYE_POPULATE)
      .sort({ date_de_debut: -1 });
  }

  async getContratById(id) {
    const contrat = await Contrat.findById(id).populate(EMPLOYE_POPULATE);
    if (!contrat) throw new ApiError(404, 'Contrat not found');
    return contrat;
  }

  async createContrat(data) {
    const contratData = {
      employe: data.employeId,
      type: data.type,
      salaire: data.salaire,
      clausesGeneral: data.clausesGeneral,
      posteTravail: data.posteTravail,
      date_de_debut: data.date_de_debut,
      periode_essai: data.periode_essai,
      status: 'actif',
    };

    if (data.type === 'CDD' && data.date_de_fin) {
      contratData.date_de_fin = data.date_de_fin;
    }

    const contrat = await Contrat.create(contratData);
    return Contrat.findById(contrat._id).populate(EMPLOYE_POPULATE);
  }

  async updateContrat(id, data) {
    const payload = { ...data };
    if (data.employeId) {
      payload.employe = data.employeId;
      delete payload.employeId;
    }
    const contrat = await Contrat.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(EMPLOYE_POPULATE);

    if (!contrat) throw new ApiError(404, 'Contrat not found');
    return contrat;
  }

  async deleteContrat(id) {
    const contrat = await Contrat.findByIdAndDelete(id);
    if (!contrat) throw new ApiError(404, 'Contrat not found');
    return { message: 'Contrat deleted successfully' };
  }

  async renouvelerContrat(id, notes) {
    const contrat = await Contrat.findById(id);
    if (!contrat) throw new ApiError(404, 'Contrat not found');
    await contrat.renouveler(notes);
    return Contrat.findById(contrat._id).populate(EMPLOYE_POPULATE);
  }

  async getContratsByEmploye(employeId) {
    return Contrat.find({ employe: employeId })
      .sort({ date_de_debut: -1 })
      .populate(EMPLOYE_POPULATE);
  }
}

module.exports = new ContratService();
