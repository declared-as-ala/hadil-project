const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const stagiaireService = require('../services/stagiaire.service');

const getAllStagiaires = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const stagiaires = await stagiaireService.getAllStagiaires({ status });
  res.status(200).json(new ApiResponse(200, stagiaires, 'Stagiaires retrieved successfully'));
});

const getStagiaireById = asyncHandler(async (req, res) => {
  const stagiaire = await stagiaireService.getStagiaireById(req.params.id);
  res.status(200).json(new ApiResponse(200, stagiaire, 'Stagiaire retrieved successfully'));
});

const createStagiaire = asyncHandler(async (req, res) => {
  const stagiaire = await stagiaireService.createStagiaire(req.body);
  res.status(201).json(new ApiResponse(201, stagiaire, 'Stagiaire created successfully'));
});

const updateStagiaire = asyncHandler(async (req, res) => {
  const stagiaire = await stagiaireService.updateStagiaire(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, stagiaire, 'Stagiaire updated successfully'));
});

const deleteStagiaire = asyncHandler(async (req, res) => {
  const result = await stagiaireService.deleteStagiaire(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const assignEncadrant = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;
  const { encadrantId } = req.body;
  const stagiaire = await stagiaireService.assignEncadrant(stagiaireId, encadrantId);
  res.status(200).json(new ApiResponse(200, stagiaire, 'Encadrant assigned successfully'));
});

const demanderAssistance = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;
  const { message } = req.body;
  const result = await stagiaireService.demanderAssistance(stagiaireId, message);
  res.status(200).json(new ApiResponse(200, result, 'Assistance request sent'));
});

const gererSujetDeStage = asyncHandler(async (req, res) => {
  const { stagiaireId } = req.params;
  const { sujet } = req.body;
  const stagiaire = await stagiaireService.gererSujetDeStage(stagiaireId, sujet);
  res.status(200).json(new ApiResponse(200, stagiaire, 'Sujet de stage updated'));
});

module.exports = {
  getAllStagiaires,
  getStagiaireById,
  createStagiaire,
  updateStagiaire,
  deleteStagiaire,
  assignEncadrant,
  demanderAssistance,
  gererSujetDeStage,
};
