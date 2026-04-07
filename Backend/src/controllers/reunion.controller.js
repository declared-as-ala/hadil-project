const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const reunionService = require('../services/reunion.service');

const getAllReunions = asyncHandler(async (req, res) => {
  const { projetId, dateFrom, dateTo } = req.query;
  const reunions = await reunionService.getAllReunions({ projetId, dateFrom, dateTo });
  res.status(200).json(new ApiResponse(200, reunions, 'Reunions retrieved successfully'));
});

const getReunionById = asyncHandler(async (req, res) => {
  const reunion = await reunionService.getReunionById(req.params.id);
  res.status(200).json(new ApiResponse(200, reunion, 'Reunion retrieved successfully'));
});

const createReunion = asyncHandler(async (req, res) => {
  const reunion = await reunionService.createReunion(req.body);
  res.status(201).json(new ApiResponse(201, reunion, 'Reunion created successfully'));
});

const updateReunion = asyncHandler(async (req, res) => {
  const reunion = await reunionService.updateReunion(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, reunion, 'Reunion updated successfully'));
});

const deleteReunion = asyncHandler(async (req, res) => {
  const result = await reunionService.deleteReunion(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const assignReunionToProject = asyncHandler(async (req, res) => {
  const { projetId } = req.body;
  const reunion = await reunionService.assignReunionToProject(req.params.id, projetId);
  res.status(200).json(new ApiResponse(200, reunion, 'Reunion assigned to project'));
});

module.exports = {
  getAllReunions,
  getReunionById,
  createReunion,
  updateReunion,
  deleteReunion,
  assignReunionToProject,
};
