const Reunion = require('../models/Reunion.model');
const ApiError = require('../utils/ApiError');

class ReunionService {
  async getAllReunions(filters = {}) {
    const query = {};
    if (filters.projetId) query.projet = filters.projetId;
    if (filters.dateFrom) query.date_debut = { ...query.date_debut, $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) query.date_debut = { ...query.date_debut, $lte: new Date(filters.dateTo) };

    const reunions = await Reunion.find(query)
      .populate('projet', 'nom description status')
      .populate('participants', 'poste departement')
      .populate('organisateur', 'poste departement')
      .populate([
        { path: 'participants', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'organisateur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ])
      .sort({ date_debut: -1 });

    return reunions;
  }

  async getReunionById(id) {
    const reunion = await Reunion.findById(id)
      .populate('projet', 'nom description status')
      .populate('participants', 'poste departement')
      .populate('organisateur', 'poste departement')
      .populate([
        { path: 'participants', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'organisateur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!reunion) {
      throw new ApiError(404, 'Reunion not found');
    }
    return reunion;
  }

  async createReunion(data) {
    const reunion = new Reunion({
      projet: data.projetId,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      description: data.description,
      lieu: data.lieu,
      participants: data.participantsIds || [],
      organisateur: data.organisateurId || null,
    });

    await reunion.save();

    return Reunion.findById(reunion._id)
      .populate('projet', 'nom description status')
      .populate('participants', 'poste departement')
      .populate('organisateur', 'poste departement')
      .populate([
        { path: 'participants', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'organisateur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);
  }

  async updateReunion(id, data) {
    const updateData = { ...data };
    if (updateData.participantsIds) {
      updateData.participants = updateData.participantsIds;
      delete updateData.participantsIds;
    }
    if (updateData.organisateurId) {
      updateData.organisateur = updateData.organisateurId;
      delete updateData.organisateurId;
    }

    const reunion = await Reunion.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('projet', 'nom description status')
      .populate('participants', 'poste departement')
      .populate('organisateur', 'poste departement')
      .populate([
        { path: 'participants', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'organisateur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!reunion) {
      throw new ApiError(404, 'Reunion not found');
    }
    return reunion;
  }

  async deleteReunion(id) {
    const reunion = await Reunion.findByIdAndDelete(id);
    if (!reunion) {
      throw new ApiError(404, 'Reunion not found');
    }
    return { message: 'Reunion deleted successfully' };
  }

  async assignReunionToProject(reunionId, projetId) {
    const reunion = await Reunion.findByIdAndUpdate(
      reunionId,
      { projet: projetId },
      { new: true, runValidators: true }
    )
      .populate('projet', 'nom description status')
      .populate('participants', 'poste departement')
      .populate([
        { path: 'participants', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!reunion) {
      throw new ApiError(404, 'Reunion not found');
    }
    return reunion;
  }
}

module.exports = new ReunionService();
