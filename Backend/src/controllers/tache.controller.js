const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const tacheService = require('../services/tache.service');

const getAllTaches = asyncHandler(async (req, res) => {
  const { projetId, status, assigneAId, priorite } = req.query;
  const taches = await tacheService.getAllTaches({ projetId, status, assigneAId, priorite });
  res.status(200).json(new ApiResponse(200, taches, 'Taches retrieved successfully'));
});

const getTacheById = asyncHandler(async (req, res) => {
  const tache = await tacheService.getTacheById(req.params.id);
  res.status(200).json(new ApiResponse(200, tache, 'Tache retrieved successfully'));
});

const createTache = asyncHandler(async (req, res) => {
  const tache = await tacheService.createTache(req.body);
  res.status(201).json(new ApiResponse(201, tache, 'Tache created successfully'));
});

const updateTache = asyncHandler(async (req, res) => {
  const tache = await tacheService.updateTache(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, tache, 'Tache updated successfully'));
});

const deleteTache = asyncHandler(async (req, res) => {
  const result = await tacheService.deleteTache(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const assignTacheToProject = asyncHandler(async (req, res) => {
  const { projetId } = req.body;
  const tache = await tacheService.assignTacheToProject(req.params.id, projetId);
  res.status(200).json(new ApiResponse(200, tache, 'Tache assigned to project'));
});

module.exports = {
  getAllTaches,
  getTacheById,
  createTache,
  updateTache,
  deleteTache,
  assignTacheToProject,
};
