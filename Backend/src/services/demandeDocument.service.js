const DemandeDocument = require('../models/DemandeDocument.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

const POPULATE_OPTS = [
  { path: 'employe', select: 'poste departement', populate: { path: 'utilisateur', select: 'nom prenom email' } },
];

class DemandeDocumentService {
  /* ── helpers ─────────────────────────────── */
  async _findEmployeByUserId(userId) {
    const User = require('../models/User.model');
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Utilisateur introuvable.');

    const employe = await Employe.findOneAndUpdate(
      { utilisateur: userId },
      { $setOnInsert: { utilisateur: userId, poste: user.role || 'employe', status: 'actif' } },
      { upsert: true, new: true }
    );
    
    return employe;
  }

  /* ── Employee: create ────────────────────── */
  async createDemande(userId, data) {
    const employe = await this._findEmployeByUserId(userId);
    const demande = await DemandeDocument.create({
      typeDocument: data.typeDocument,
      description: data.description,
      employe: employe._id,
      status: 'en_attente',
    });
    return DemandeDocument.findById(demande._id).populate(POPULATE_OPTS);
  }

  /* ── Employee: own requests ──────────────── */
  async getMesDemandes(userId) {
    const employe = await this._findEmployeByUserId(userId);
    return DemandeDocument.find({ employe: employe._id })
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });
  }

  /* ── Admin / RH: all requests (with filter) */
  async getAllDemandes(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.employeId) query.employe = filters.employeId;
    return DemandeDocument.find(query)
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });
  }

  /* ── Admin / RH: update status ───────────── */
  async updateStatut(id, data) {
    const demande = await DemandeDocument.findByIdAndUpdate(
      id,
      { status: data.status, commentaireAdmin: data.commentaireAdmin },
      { new: true, runValidators: true }
    ).populate(POPULATE_OPTS);
    if (!demande) throw new ApiError(404, 'Demande de document introuvable.');
    return demande;
  }

  /* ── Admin: delete ───────────────────────── */
  async deleteDemande(id) {
    const demande = await DemandeDocument.findByIdAndDelete(id);
    if (!demande) throw new ApiError(404, 'Demande de document introuvable.');
    return { message: 'Demande supprimée avec succès.' };
  }
}

module.exports = new DemandeDocumentService();
