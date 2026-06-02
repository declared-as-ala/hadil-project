const DemandeDocument = require('../models/DemandeDocument.model');
const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

const POPULATE_OPTS = [
  { path: 'employe', select: 'nom prenom poste dateEmbauche salaire_base', populate: { path: 'utilisateur', select: 'nom prenom email' } },
];

class DemandeDocumentService {
  _withId(value) {
    if (!value || typeof value !== 'object') return value;

    if (!value.id && value._id) {
      value.id = value._id.toString ? value._id.toString() : value._id;
    }

    return value;
  }

  _serializeDemande(demande) {
    if (!demande) return demande;

    const obj = demande.toJSON
      ? demande.toJSON()
      : demande.toObject
        ? demande.toObject({ virtuals: true })
        : { ...demande };

    this._withId(obj);
    this._withId(obj.employe);
    this._withId(obj.employe?.utilisateur);

    return obj;
  }

  _getEmployeId(demande) {
    const employe = demande?.employe;
    if (!employe) return null;
    if (typeof employe === 'string') return employe;
    return employe._id || employe.id || null;
  }

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

  async _enrichDemande(demande) {
    if (!demande) return demande;

    const demObj = this._serializeDemande(demande);
    const employeId = this._getEmployeId(demande);
    if (!employeId || !demObj.employe) return demObj;

    let dynamicData = {};
    try {
      const paieService = require('./paie.service');
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      dynamicData = await paieService.calculerSalaire(employeId, currentMonth, currentYear);

      demObj.employe = {
        ...demObj.employe,
        poste: dynamicData.poste || demObj.employe.poste,
        salaire_base: dynamicData.salaire_base ?? demObj.employe.salaire_base,
        salaire_total: dynamicData.salaire_total ?? dynamicData.salaire_base ?? demObj.employe.salaire_base,
      };
      return demObj;
    } catch (err) {
      console.error('Failed to calculate dynamic salary for populated employee', err);
      return demObj;
    }
  }

  async _enrichDemandes(demandes) {
    if (!demandes || !demandes.length) return demandes;
    const enriched = [];
    for (const d of demandes) {
      if (!d?.employe) continue;
      enriched.push(await this._enrichDemande(d));
    }
    return enriched;
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
    const resDoc = await DemandeDocument.findById(demande._id).populate(POPULATE_OPTS);
    return this._enrichDemande(resDoc);
  }

  /* ── Employee: own requests ──────────────── */
  async getMesDemandes(userId) {
    const employe = await this._findEmployeByUserId(userId);
    const demandes = await DemandeDocument.find({ employe: employe._id })
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });
    return this._enrichDemandes(demandes);
  }

  /* ── Admin / RH: all requests (with filter) */
  async getAllDemandes(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.employeId) query.employe = filters.employeId;
    const demandes = await DemandeDocument.find(query)
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });
    return this._enrichDemandes(demandes);
  }

  /* ── Admin / RH: update status ───────────── */
  async updateStatut(id, data) {
    const demande = await DemandeDocument.findByIdAndUpdate(
      id,
      { status: data.status, commentaireAdmin: data.commentaireAdmin },
      { new: true, runValidators: true }
    ).populate(POPULATE_OPTS);
    if (!demande) throw new ApiError(404, 'Demande de document introuvable.');
    return this._enrichDemande(demande);
  }

  /* ── Admin: delete any ───────────────────── */
  async deleteDemande(id) {
    const demande = await DemandeDocument.findByIdAndDelete(id);
    if (!demande) throw new ApiError(404, 'Demande de document introuvable.');
    return { message: 'Demande supprimée avec succès.' };
  }

  /* ── Employee: delete own */
  async deleteMaDemande(userId, id) {
    const employe = await this._findEmployeByUserId(userId);
    const demande = await DemandeDocument.findOne({ _id: id, employe: employe._id });
    if (!demande) throw new ApiError(404, 'Demande introuvable ou accès refusé.');
    await DemandeDocument.findByIdAndDelete(id);
    return { message: 'Demande supprimée avec succès.' };
  }
}

module.exports = new DemandeDocumentService();
