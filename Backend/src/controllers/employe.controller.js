const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const employeService = require('../services/employe.service');

const getAllEmployes = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const employes = await employeService.getAllEmployes({ status });

  res.status(200).json(new ApiResponse(200, employes, 'Employes retrieved successfully'));
});

const getEmployeById = asyncHandler(async (req, res) => {
  const employe = await employeService.getEmployeById(req.params.id);
  res.status(200).json(new ApiResponse(200, employe, 'Employe retrieved successfully'));
});

const createEmploye = asyncHandler(async (req, res) => {
  const employe = await employeService.createEmploye(req.body);
  res.status(201).json(new ApiResponse(201, employe, 'Employe created successfully'));
});

const updateEmploye = asyncHandler(async (req, res) => {
  const employe = await employeService.updateEmploye(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, employe, 'Employe updated successfully'));
});

const deleteEmploye = asyncHandler(async (req, res) => {
  const result = await employeService.deleteEmploye(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = {
  getAllEmployes,
  getEmployeById,
  createEmploye,
  updateEmploye,
  deleteEmploye,
};
