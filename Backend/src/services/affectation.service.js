const Affectation = require('../models/Affectation.model');
const Poste = require('../models/Poste.model');
const Employe = require('../models/Employe.model');
const Contrat = require('../models/Contrat.model');
const ApiError = require('../utils/ApiError');

const POPULATE_OPTS = [
  { path: 'employe', select: 'nom prenom', populate: { path: 'utilisateur', select: 'email role' } },
  { path: 'poste' },
];

// Close any active contracts for an employee at the given date and create a
// fresh one mirroring the (poste, salaire) of the new affectation. The
// standalone Contrats page has been folded into the Paie / Affectations
// surface; contracts are derived state now.
async function syncContratForAffectation(employeId, posteId, dateDebut) {
  if (!employeId || !posteId) return null;
  const poste = await Poste.findById(posteId);
  if (!poste) return null;

  const cutoff = new Date(dateDebut);

  // Close any open contracts (status actif and no end date) so the new one
  // can take over as the active contract.
  await Contrat.updateMany(
    { employe: employeId, status: 'actif' },
    { status: 'expire', date_de_fin: cutoff }
  );

  return Contrat.create({
    employe: employeId,
    type: 'CDI',
    salaire: poste.salaire_base ?? 0,
    posteTravail: poste.nom_poste || '',
    date_de_debut: cutoff,
    status: 'actif',
  });
}

class AffectationService {
  async getAllAffectations() {
    return Affectation.find().populate(POPULATE_OPTS).sort({ date_debut: -1 });
  }

  async getAffectationById(id) {
    const aff = await Affectation.findById(id).populate(POPULATE_OPTS);
    if (!aff) throw new ApiError(404, 'Affectation introuvable.');
    return aff;
  }

  async getAffectationActuelle(employeId) {
    return Affectation.findOne({ employe: employeId, date_fin: null }).populate(POPULATE_OPTS);
  }

  async createAffectation(data) {
    // Close any existing active affectation
    await Affectation.updateMany(
      { employe: data.employeId, date_fin: null },
      { date_fin: new Date(data.date_debut) }
    );
    const aff = await Affectation.create({
      employe: data.employeId,
      poste: data.posteId,
      date_debut: data.date_debut,
      date_fin: data.date_fin || null,
    });

    // Mirror into a fresh active Contrat
    await syncContratForAffectation(data.employeId, data.posteId, data.date_debut);

    return Affectation.findById(aff._id).populate(POPULATE_OPTS);
  }

  async updateAffectation(id, data) {
    const existing = await Affectation.findById(id);
    if (!existing) throw new ApiError(404, 'Affectation introuvable.');

    const updateData = {};
    if (data.posteId) updateData.poste = data.posteId;
    if (data.date_debut) updateData.date_debut = data.date_debut;
    if (data.date_fin !== undefined) updateData.date_fin = data.date_fin;
    const aff = await Affectation.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_OPTS);

    // If the poste changed and this is the active affectation, re-sync the contract.
    const posteChanged = data.posteId && String(data.posteId) !== String(existing.poste);
    const isActive = (data.date_fin === undefined && existing.date_fin === null) || data.date_fin === null;
    if (posteChanged && isActive) {
      await syncContratForAffectation(
        aff.employe?._id || aff.employe,
        aff.poste?._id || aff.poste,
        aff.date_debut
      );
    }

    return aff;
  }

  async deleteAffectation(id) {
    const aff = await Affectation.findById(id);
    if (!aff) throw new ApiError(404, 'Affectation introuvable.');
    const wasActive = aff.date_fin == null;
    await Affectation.findByIdAndDelete(id);
    // If we removed the active affectation, expire its mirrored contract.
    if (wasActive) {
      await Contrat.updateMany(
        { employe: aff.employe, status: 'actif' },
        { status: 'expire', date_de_fin: new Date() }
      );
    }
    return { message: 'Affectation supprimée avec succès.' };
  }

  /**
   * SYNC: For every existing employee that has a real poste string (not a role name),
   * find-or-create a Poste document and create an Affectation if none exists.
   * Also seeds a matching active Contrat for newly-created affectations.
   */
  async syncFromEmployes() {
    // These are user roles, NOT job positions — skip them
    const ROLE_NAMES = ['employe', 'employé', 'admin', 'rh', 'stagiaire', 'manager'];

    const employes = await Employe.find({ poste: { $exists: true, $ne: null, $ne: '' } })
      .populate('utilisateur', 'email');

    const results = { created: [], skipped: [], errors: [] };

    for (const emp of employes) {
      try {
        const nomPoste = (emp.poste || '').trim();

        if (!nomPoste || ROLE_NAMES.includes(nomPoste.toLowerCase())) {
          results.skipped.push({ id: emp._id, reason: `"${nomPoste}" est un rôle, pas un poste` });
          continue;
        }

        let poste = await Poste.findOne({ nom_poste: { $regex: new RegExp(`^${nomPoste}$`, 'i') } });
        if (!poste) {
          poste = await Poste.create({
            nom_poste: nomPoste,
            salaire_base: 0,
            prix_heure_sup: 0,
          });
        }

        const existing = await Affectation.findOne({ employe: emp._id, date_fin: null });
        if (existing) {
          results.skipped.push({ id: emp._id, reason: 'déjà affecté' });
          continue;
        }

        const dateDebut = emp.dateEmbauche || emp.createdAt || new Date();
        await Affectation.create({
          employe: emp._id,
          poste: poste._id,
          date_debut: dateDebut,
          date_fin: null,
        });

        // Mirror into a contract
        await syncContratForAffectation(emp._id, poste._id, dateDebut);

        results.created.push({
          employe: `${emp.prenom || ''} ${emp.nom || ''}`.trim() || emp.utilisateur?.email,
          poste: poste.nom_poste,
        });
      } catch (err) {
        results.errors.push({ employeId: emp._id, error: err.message });
      }
    }

    return results;
  }
}

module.exports = new AffectationService();
