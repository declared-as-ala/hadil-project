const Contrat = require('../models/Contrat.model');
const ApiError = require('../utils/ApiError');

class ContratService {
  async getAllContrats(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const contrats = await Contrat.find(query)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      })
      .sort({ date_de_debut: -1 });

    return contrats;
  }

  async getContratById(id) {
    const contrat = await Contrat.findById(id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!contrat) {
      throw new ApiError(404, 'Contrat not found');
    }
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

    // Only set date_de_fin for CDD contracts
    if (data.type === 'CDD' && data.date_de_fin) {
      contratData.date_de_fin = data.date_de_fin;
    }

    const contrat = new Contrat(contratData);
    await contrat.save();

    return Contrat.findById(contrat._id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async updateContrat(id, data) {
    const contrat = await Contrat.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!contrat) {
      throw new ApiError(404, 'Contrat not found');
    }
    return contrat;
  }

  async deleteContrat(id) {
    const contrat = await Contrat.findByIdAndDelete(id);
    if (!contrat) {
      throw new ApiError(404, 'Contrat not found');
    }
    return { message: 'Contrat deleted successfully' };
  }

  async renouvelerContrat(id, notes) {
    const contrat = await Contrat.findById(id);
    if (!contrat) {
      throw new ApiError(404, 'Contrat not found');
    }

    await contrat.renouveler(notes);

    return Contrat.findById(contrat._id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async getContratsByEmploye(employeId) {
    const contrats = await Contrat.find({ employe: employeId })
      .sort({ date_de_debut: -1 })
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    return contrats;
  }
}

module.exports = new ContratService();
