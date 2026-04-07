const Tache = require('../models/Tache.model');
const ApiError = require('../utils/ApiError');

class TacheService {
  async getAllTaches(filters = {}) {
    const query = {};
    if (filters.projetId) query.projet = filters.projetId;
    if (filters.status) query.status = filters.status;
    if (filters.assigneAId) query.assigneA = filters.assigneAId;
    if (filters.priorite) query.priorite = filters.priorite;

    const taches = await Tache.find(query)
      .populate('projet', 'nom description status')
      .populate('assigneA', 'poste departement')
      .populate([
        { path: 'assigneA', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ])
      .sort({ createdAt: -1 });

    return taches;
  }

  async getTacheById(id) {
    const tache = await Tache.findById(id)
      .populate('projet', 'nom description status')
      .populate('assigneA', 'poste departement')
      .populate([
        { path: 'assigneA', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!tache) {
      throw new ApiError(404, 'Tache not found');
    }
    return tache;
  }

  async createTache(data) {
    const tache = new Tache({
      projet: data.projetId,
      description: data.description,
      status: data.status || 'not_started',
      assigneA: data.assigneAId || null,
      priorite: data.priorite || 'medium',
      dateEcheance: data.dateEcheance,
    });

    await tache.save();

    return Tache.findById(tache._id)
      .populate('projet', 'nom description status')
      .populate('assigneA', 'poste departement')
      .populate([
        { path: 'assigneA', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);
  }

  async updateTache(id, data) {
    const updateData = { ...data };
    if (updateData.assigneAId) {
      updateData.assigneA = updateData.assigneAId;
      delete updateData.assigneAId;
    }

    const tache = await Tache.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('projet', 'nom description status')
      .populate('assigneA', 'poste departement')
      .populate([
        { path: 'assigneA', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!tache) {
      throw new ApiError(404, 'Tache not found');
    }
    return tache;
  }

  async deleteTache(id) {
    const tache = await Tache.findByIdAndDelete(id);
    if (!tache) {
      throw new ApiError(404, 'Tache not found');
    }
    return { message: 'Tache deleted successfully' };
  }

  async assignTacheToProject(tacheId, projetId) {
    const tache = await Tache.findByIdAndUpdate(
      tacheId,
      { projet: projetId },
      { new: true, runValidators: true }
    )
      .populate('projet', 'nom description status')
      .populate('assigneA', 'poste departement')
      .populate([
        { path: 'assigneA', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!tache) {
      throw new ApiError(404, 'Tache not found');
    }
    return tache;
  }
}

module.exports = new TacheService();
