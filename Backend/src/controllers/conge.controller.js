const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const congeService = require('../services/conge.service');

const getAllConges = asyncHandler(async (req, res) => {
  const { employeId, status, type_conge } = req.query;
  const conges = await congeService.getAllConges({ employeId, status, type_conge });
  res.status(200).json(new ApiResponse(200, conges, 'Conges retrieved successfully'));
});

const getCongeById = asyncHandler(async (req, res) => {
  const conge = await congeService.getCongeById(req.params.id);
  res.status(200).json(new ApiResponse(200, conge, 'Conge retrieved successfully'));
});

const createConge = asyncHandler(async (req, res) => {
  const conge = await congeService.createConge(req.body);
  res.status(201).json(new ApiResponse(201, conge, 'Conge created successfully'));
});

const updateConge = asyncHandler(async (req, res) => {
  const conge = await congeService.updateConge(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, conge, 'Conge updated successfully'));
});

const deleteConge = asyncHandler(async (req, res) => {
  const result = await congeService.deleteConge(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const prolongerConge = asyncHandler(async (req, res) => {
  const { joursSupplementaires } = req.body;
  const conge = await congeService.prolongerConge(req.params.id, joursSupplementaires);
  res.status(200).json(new ApiResponse(200, conge, 'Conge extended successfully'));
});

module.exports = {
  getAllConges,
  getCongeById,
  createConge,
  updateConge,
  deleteConge,
  prolongerConge,
};
