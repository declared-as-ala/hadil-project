const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const demandeDocumentService = require('../services/demandeDocument.service');

/* Employee: create a document request (auto-resolves employeId from token) */
const createDemande = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const demande = await demandeDocumentService.createDemande(userId, req.body);
  res.status(201).json(new ApiResponse(201, demande, 'Demande créée avec succès.'));
});

/* Employee: fetch own requests */
const getMesDemandes = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const demandes = await demandeDocumentService.getMesDemandes(userId);
  res.status(200).json(new ApiResponse(200, demandes, 'Demandes récupérées.'));
});

/* Admin / RH: fetch all requests */
const getAllDemandes = asyncHandler(async (req, res) => {
  const { status, employeId } = req.query;
  const demandes = await demandeDocumentService.getAllDemandes({ status, employeId });
  res.status(200).json(new ApiResponse(200, demandes, 'Toutes les demandes récupérées.'));
});

/* Admin / RH: update status + optional comment */
const updateStatut = asyncHandler(async (req, res) => {
  const demande = await demandeDocumentService.updateStatut(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, demande, 'Statut mis à jour.'));
});

/* Admin: delete */
const deleteDemande = asyncHandler(async (req, res) => {
  const result = await demandeDocumentService.deleteDemande(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = { createDemande, getMesDemandes, getAllDemandes, updateStatut, deleteDemande };
