const Conge = require('../models/Conge.model');
const ApiError = require('../utils/ApiError');

class CongeService {
  async getAllConges(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.status) query.status = filters.status;
    if (filters.type_conge) query.type_conge = filters.type_conge;

    const conges = await Conge.find(query)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      })
      .sort({ date_debut: -1 });

    return conges;
  }

  async getCongeById(id) {
    const conge = await Conge.findById(id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!conge) {
      throw new ApiError(404, 'Conge not found');
    }
    return conge;
  }

  async createConge(data) {
    const conge = new Conge({
      employe: data.employeId,
      date_debut: data.date_debut,
      periode: data.periode,
      type_conge: data.type_conge,
      motif: data.motif,
      status: 'pending',
    });

    await conge.save();

    return Conge.findById(conge._id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async updateConge(id, data) {
    const conge = await Conge.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!conge) {
      throw new ApiError(404, 'Conge not found');
    }
    return conge;
  }

  async deleteConge(id) {
    const conge = await Conge.findByIdAndDelete(id);
    if (!conge) {
      throw new ApiError(404, 'Conge not found');
    }
    return { message: 'Conge deleted successfully' };
  }

  async prolongerConge(id, joursSupplementaires) {
    const conge = await Conge.findById(id);
    if (!conge) {
      throw new ApiError(404, 'Conge not found');
    }

    await conge.prolonger(joursSupplementaires);

    return Conge.findById(conge._id)
      .populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async getCongesByEmploye(employeId) {
    const conges = await Conge.find({ employe: employeId })
      .sort({ date_debut: -1 })
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    return conges;
  }
}

module.exports = new CongeService();
