const Absence = require('../models/Absence.model');
const ApiError = require('../utils/ApiError');

class AbsenceService {
  async getAllAbsences(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.dateFrom) query.date = { ...query.date, $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.date = { ...query.date, $lte: new Date(filters.dateTo) };

    const absences = await Absence.find(query).populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    return absences;
  }

  async getAbsenceById(id) {
    const absence = await Absence.findById(id).populate('employe', 'poste departement status')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!absence) {
      throw new ApiError(404, 'Absence not found');
    }
    return absence;
  }

  async createAbsence(data) {
    const absence = new Absence({
      employe: data.employeId,
      date: data.date,
      nombre_des_heures: data.nombre_des_heures,
      raison: data.raison,
    });

    await absence.save();

    return Absence.findById(absence._id).populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });
  }

  async updateAbsence(id, data) {
    const absence = await Absence.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('employe', 'poste departement')
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    if (!absence) {
      throw new ApiError(404, 'Absence not found');
    }
    return absence;
  }

  async deleteAbsence(id) {
    const absence = await Absence.findByIdAndDelete(id);
    if (!absence) {
      throw new ApiError(404, 'Absence not found');
    }
    return { message: 'Absence deleted successfully' };
  }

  async getAbsencesByEmploye(employeId) {
    const absences = await Absence.find({ employe: employeId })
      .sort({ date: -1 })
      .populate({
        path: 'employe',
        populate: { path: 'utilisateur', select: 'nom prenom email' },
      });

    return absences;
  }
}

module.exports = new AbsenceService();
