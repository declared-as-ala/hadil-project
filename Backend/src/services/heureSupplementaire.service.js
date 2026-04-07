const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const ApiError = require('../utils/ApiError');

class HeureSupplementaireService {
  async getAllHeuresSupplementaires(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.dateFrom) query.date = { ...query.date, $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.date = { ...query.date, $lte: new Date(filters.dateTo) };

    const heures = await HeureSupplementaire.find(query)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      })
      .sort({ date: -1 });

    return heures;
  }

  async getHeureSupplementaireById(id) {
    const heure = await HeureSupplementaire.findById(id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!heure) {
      throw new ApiError(404, 'Heure supplementaire not found');
    }
    return heure;
  }

  async createHeureSupplementaire(data) {
    const heure = new HeureSupplementaire({
      employe: data.employeId,
      heureSupplementaire: data.heureSupplementaire,
      date: data.date,
      description: data.description,
    });

    await heure.save();

    return HeureSupplementaire.findById(heure._id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async updateHeureSupplementaire(id, data) {
    const heure = await HeureSupplementaire.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!heure) {
      throw new ApiError(404, 'Heure supplementaire not found');
    }
    return heure;
  }

  async deleteHeureSupplementaire(id) {
    const heure = await HeureSupplementaire.findByIdAndDelete(id);
    if (!heure) {
      throw new ApiError(404, 'Heure supplementaire not found');
    }
    return { message: 'Heure supplementaire deleted successfully' };
  }

  async getHeuresByEmploye(employeId) {
    const heures = await HeureSupplementaire.find({ employe: employeId })
      .sort({ date: -1 })
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    return heures;
  }
}

module.exports = new HeureSupplementaireService();
