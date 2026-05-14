const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const ApiError = require('../utils/ApiError');

const EMPLOYE_POPULATE = {
  path: 'employe',
  select: 'nom prenom poste status',
  populate: { path: 'utilisateur', select: 'email role' },
};

class HeureSupplementaireService {
  async getAllHeuresSupplementaires(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.dateFrom) query.date = { ...query.date, $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.date = { ...query.date, $lte: new Date(filters.dateTo) };

    return HeureSupplementaire.find(query)
      .populate(EMPLOYE_POPULATE)
      .sort({ date: -1 });
  }

  async getHeureSupplementaireById(id) {
    const heure = await HeureSupplementaire.findById(id).populate(EMPLOYE_POPULATE);
    if (!heure) throw new ApiError(404, 'Heure supplementaire not found');
    return heure;
  }

  async createHeureSupplementaire(data) {
    const heure = await HeureSupplementaire.create({
      employe: data.employeId,
      heureSupplementaire: data.heureSupplementaire,
      date: data.date,
      description: data.description,
    });
    return HeureSupplementaire.findById(heure._id).populate(EMPLOYE_POPULATE);
  }

  async updateHeureSupplementaire(id, data) {
    const payload = { ...data };
    if (data.employeId) {
      payload.employe = data.employeId;
      delete payload.employeId;
    }
    const heure = await HeureSupplementaire.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(EMPLOYE_POPULATE);

    if (!heure) throw new ApiError(404, 'Heure supplementaire not found');
    return heure;
  }

  async deleteHeureSupplementaire(id) {
    const heure = await HeureSupplementaire.findByIdAndDelete(id);
    if (!heure) throw new ApiError(404, 'Heure supplementaire not found');
    return { message: 'Heure supplementaire deleted successfully' };
  }

  async getHeuresByEmploye(employeId) {
    return HeureSupplementaire.find({ employe: employeId })
      .sort({ date: -1 })
      .populate(EMPLOYE_POPULATE);
  }
}

module.exports = new HeureSupplementaireService();
