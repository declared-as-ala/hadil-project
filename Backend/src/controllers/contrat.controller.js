const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const contratService = require('../services/contrat.service');

const getAllContrats = asyncHandler(async (req, res) => {
  const { employeId, type, status } = req.query;
  const contrats = await contratService.getAllContrats({ employeId, type, status });
  res.status(200).json(new ApiResponse(200, contrats, 'Contrats retrieved successfully'));
});

const getContratById = asyncHandler(async (req, res) => {
  const contrat = await contratService.getContratById(req.params.id);
  res.status(200).json(new ApiResponse(200, contrat, 'Contrat retrieved successfully'));
});

const createContrat = asyncHandler(async (req, res) => {
  const contrat = await contratService.createContrat(req.body);
  res.status(201).json(new ApiResponse(201, contrat, 'Contrat created successfully'));
});

const updateContrat = asyncHandler(async (req, res) => {
  const contrat = await contratService.updateContrat(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, contrat, 'Contrat updated successfully'));
});

const deleteContrat = asyncHandler(async (req, res) => {
  const result = await contratService.deleteContrat(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const renouvelerContrat = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const contrat = await contratService.renouvelerContrat(req.params.id, notes);
  res.status(200).json(new ApiResponse(200, contrat, 'Contrat renewed successfully'));
});

module.exports = {
  getAllContrats,
  getContratById,
  createContrat,
  updateContrat,
  deleteContrat,
  renouvelerContrat,
};
