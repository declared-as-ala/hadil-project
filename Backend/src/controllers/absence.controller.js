const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const absenceService = require('../services/absence.service');

const getAllAbsences = asyncHandler(async (req, res) => {
  const { employeId, dateFrom, dateTo } = req.query;
  const absences = await absenceService.getAllAbsences({ employeId, dateFrom, dateTo });
  res.status(200).json(new ApiResponse(200, absences, 'Absences retrieved successfully'));
});

const getAbsenceById = asyncHandler(async (req, res) => {
  const absence = await absenceService.getAbsenceById(req.params.id);
  res.status(200).json(new ApiResponse(200, absence, 'Absence retrieved successfully'));
});

const createAbsence = asyncHandler(async (req, res) => {
  const absence = await absenceService.createAbsence(req.body);
  res.status(201).json(new ApiResponse(201, absence, 'Absence created successfully'));
});

const updateAbsence = asyncHandler(async (req, res) => {
  const absence = await absenceService.updateAbsence(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, absence, 'Absence updated successfully'));
});

const deleteAbsence = asyncHandler(async (req, res) => {
  const result = await absenceService.deleteAbsence(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = {
  getAllAbsences,
  getAbsenceById,
  createAbsence,
  updateAbsence,
  deleteAbsence,
};
