const Conge = require('../models/Conge.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

const POPULATE_EMPLOYE = [
  {
    path: 'employe',
    select: 'poste departement status',
    populate: { path: 'utilisateur', select: 'nom prenom email avatar' },
  },
];

class CongeService {
  /**
   * Admin/RH: get ALL leave requests with optional filters
   */
  async getAllConges(filters = {}) {
    const query = {};
    if (filters.employeId) query.employe = filters.employeId;
    if (filters.status) query.status = filters.status;
    if (filters.type_conge) query.type_conge = filters.type_conge;
    if (filters.dateFrom) query.date_debut = { $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) {
      query.date_debut = { ...query.date_debut, $lte: new Date(filters.dateTo) };
    }

    return Conge.find(query)
      .populate(POPULATE_EMPLOYE)
      .sort({ createdAt: -1 });
  }

  /**
   * Employee: get ONLY their own leave requests
   */
  async getMyConges(userId) {
    const employe = await Employe.findOne({ utilisateur: userId });
    if (!employe) {
      throw new ApiError(404, 'Employee profile not found for this user');
    }

    return Conge.find({ employe: employe._id })
      .populate(POPULATE_EMPLOYE)
      .sort({ createdAt: -1 });
  }

  async getCongeById(id) {
    const conge = await Conge.findById(id).populate(POPULATE_EMPLOYE);
    if (!conge) throw new ApiError(404, 'Leave request not found');
    return conge;
  }

  /**
   * Employee creates their own leave request (employeId resolved from userId server-side)
   */
  async createCongeForUser(userId, data) {
    const employe = await Employe.findOne({ utilisateur: userId });
    if (!employe) {
      throw new ApiError(404, 'Employee profile not found. Please contact HR to set up your profile.');
    }

    const conge = await Conge.create({
      employe: employe._id,
      date_debut: data.date_debut,
      periode: data.periode,
      type_conge: data.type_conge,
      motif: data.motif,
      status: 'pending',
    });

    return Conge.findById(conge._id).populate(POPULATE_EMPLOYE);
  }

  /**
   * Employee updates their own leave request (only if pending)
   */
  async updateCongeForUser(userId, id, data) {
    const employe = await Employe.findOne({ utilisateur: userId });
    if (!employe) {
      throw new ApiError(404, 'Employee profile not found.');
    }

    const conge = await Conge.findOne({ _id: id, employe: employe._id });
    if (!conge) {
      throw new ApiError(404, 'Leave request not found or you are not authorized.');
    }

    if (conge.status !== 'pending') {
      throw new ApiError(400, 'Cannot modify a leave request that is already processed.');
    }

    // Update fields safely
    if (data.date_debut) conge.date_debut = data.date_debut;
    if (data.periode) conge.periode = data.periode;
    if (data.type_conge) conge.type_conge = data.type_conge;
    if (data.motif !== undefined) conge.motif = data.motif;

    await conge.save();

    return Conge.findById(conge._id).populate(POPULATE_EMPLOYE);
  }

  /**
   * Admin/RH creates a leave request for any employee (employeId in body)
   */
  async createConge(data) {
    const conge = await Conge.create({
      employe: data.employeId,
      date_debut: data.date_debut,
      periode: data.periode,
      type_conge: data.type_conge,
      motif: data.motif,
      status: 'pending',
    });

    return Conge.findById(conge._id).populate(POPULATE_EMPLOYE);
  }

  /**
   * Admin/RH: update status (approve/reject) or other fields
   */
  async updateStatus(id, status) {
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }
    const conge = await Conge.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate(POPULATE_EMPLOYE);

    if (!conge) throw new ApiError(404, 'Leave request not found');
    return conge;
  }

  async updateConge(id, data) {
    const conge = await Conge.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_EMPLOYE);

    if (!conge) throw new ApiError(404, 'Leave request not found');
    return conge;
  }

  async deleteConge(id) {
    const conge = await Conge.findByIdAndDelete(id);
    if (!conge) throw new ApiError(404, 'Leave request not found');
    return { message: 'Leave request deleted successfully' };
  }

  async prolongerConge(id, joursSupplementaires) {
    const conge = await Conge.findById(id);
    if (!conge) throw new ApiError(404, 'Leave request not found');
    await conge.prolonger(joursSupplementaires);
    return Conge.findById(conge._id).populate(POPULATE_EMPLOYE);
  }

  /**
   * Stats for Admin/RH dashboard
   */
  async getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      Conge.countDocuments(),
      Conge.countDocuments({ status: 'pending' }),
      Conge.countDocuments({ status: 'approved' }),
      Conge.countDocuments({ status: 'rejected' }),
    ]);
    return { total, pending, approved, rejected };
  }
}

module.exports = new CongeService();
