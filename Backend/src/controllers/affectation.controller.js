const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const affectationService = require('../services/affectation.service');

const getAllAffectations = asyncHandler(async (req, res) => {
  const affectations = await affectationService.getAllAffectations();
  res.status(200).json(new ApiResponse(200, affectations, 'Affectations récupérées'));
});

const getAffectationById = asyncHandler(async (req, res) => {
  const aff = await affectationService.getAffectationById(req.params.id);
  res.status(200).json(new ApiResponse(200, aff, 'Affectation récupérée'));
});

const getAffectationActuelle = asyncHandler(async (req, res) => {
  const aff = await affectationService.getAffectationActuelle(req.params.employeId);
  res.status(200).json(new ApiResponse(200, aff, 'Affectation actuelle'));
});

const createAffectation = asyncHandler(async (req, res) => {
  const aff = await affectationService.createAffectation(req.body);
  res.status(201).json(new ApiResponse(201, aff, 'Affectation créée'));
});

const updateAffectation = asyncHandler(async (req, res) => {
  const aff = await affectationService.updateAffectation(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, aff, 'Affectation mise à jour'));
});

const deleteAffectation = asyncHandler(async (req, res) => {
  const result = await affectationService.deleteAffectation(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

// POST /api/affectations/sync — auto-create from existing employee poste strings
const syncFromEmployes = asyncHandler(async (req, res) => {
  const results = await affectationService.syncFromEmployes();
  res.status(200).json(new ApiResponse(200, results,
    `Sync terminé : ${results.created.length} affectation(s) créée(s), ${results.skipped.length} ignorée(s).`
  ));
});

module.exports = {
  getAllAffectations,
  getAffectationById,
  getAffectationActuelle,
  createAffectation,
  updateAffectation,
  deleteAffectation,
  syncFromEmployes,
};
