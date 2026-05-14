const Absence = require('../models/Absence.model');
const ApiError = require('../utils/ApiError');

// Populate Employe (with its nom/prenom/poste/status) plus the linked user's email.
const EMPLOYE_POPULATE = {
  path: 'employe',
  select: 'nom prenom poste status',
  populate: { path: 'utilisateur', select: 'email role' },
};

class AbsenceService {
  async getAllAbsences(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.dateFrom) query.date = { ...query.date, $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.date = { ...query.date, $lte: new Date(filters.dateTo) };

    return Absence.find(query)
      .populate(EMPLOYE_POPULATE)
      .sort({ date: -1 });
  }

  async getAbsenceById(id) {
    const absence = await Absence.findById(id).populate(EMPLOYE_POPULATE);
    if (!absence) throw new ApiError(404, 'Absence not found');
    return absence;
  }

  async createAbsence(data) {
    const absence = await Absence.create({
      employe: data.employeId,
      date: data.date,
      nombre_des_heures: data.nombre_des_heures,
      raison: data.raison,
    });
    return Absence.findById(absence._id).populate(EMPLOYE_POPULATE);
  }

  async updateAbsence(id, data) {
    const payload = { ...data };
    if (data.employeId) {
      payload.employe = data.employeId;
      delete payload.employeId;
    }
    const absence = await Absence.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate(EMPLOYE_POPULATE);

    if (!absence) throw new ApiError(404, 'Absence not found');
    return absence;
  }

  async deleteAbsence(id) {
    const absence = await Absence.findByIdAndDelete(id);
    if (!absence) throw new ApiError(404, 'Absence not found');
    return { message: 'Absence deleted successfully' };
  }

  async getAbsencesByEmploye(employeId) {
    return Absence.find({ employe: employeId })
      .sort({ date: -1 })
      .populate(EMPLOYE_POPULATE);
  }
}

module.exports = new AbsenceService();
