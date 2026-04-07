const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const projetService = require('../services/projet.service');

const getAllProjets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const projets = await projetService.getAllProjets({ status });
  res.status(200).json(new ApiResponse(200, projets, 'Projets retrieved successfully'));
});

const getProjetById = asyncHandler(async (req, res) => {
  const projet = await projetService.getProjetById(req.params.id);
  res.status(200).json(new ApiResponse(200, projet, 'Projet retrieved successfully'));
});

const createProjet = asyncHandler(async (req, res) => {
  const projet = await projetService.createProjet(req.body);
  res.status(201).json(new ApiResponse(201, projet, 'Projet created successfully'));
});

const updateProjet = asyncHandler(async (req, res) => {
  const projet = await projetService.updateProjet(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, projet, 'Projet updated successfully'));
});

const deleteProjet = asyncHandler(async (req, res) => {
  const result = await projetService.deleteProjet(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const assignMember = asyncHandler(async (req, res) => {
  const { employeId } = req.body;
  const projet = await projetService.assignMember(req.params.id, employeId);
  res.status(200).json(new ApiResponse(200, projet, 'Member assigned to project'));
});

const removeMember = asyncHandler(async (req, res) => {
  const { employeId } = req.body;
  const projet = await projetService.removeMember(req.params.id, employeId);
  res.status(200).json(new ApiResponse(200, projet, 'Member removed from project'));
});

module.exports = {
  getAllProjets,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet,
  assignMember,
  removeMember,
};
