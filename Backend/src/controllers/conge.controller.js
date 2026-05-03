const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const congeService = require('../services/conge.service');

/**
 * GET /api/conges
 * Admin/RH only — returns ALL leave requests with optional filters
 */
const getAllConges = asyncHandler(async (req, res) => {
  const { employeId, status, type_conge, dateFrom, dateTo } = req.query;
  const conges = await congeService.getAllConges({ employeId, status, type_conge, dateFrom, dateTo });
  res.status(200).json(new ApiResponse(200, conges, 'Leave requests retrieved successfully'));
});

/**
 * GET /api/conges/my
 * Employee only — returns ONLY their own leave requests
 */
const getMyConges = asyncHandler(async (req, res) => {
  const conges = await congeService.getMyConges(req.user.id);
  res.status(200).json(new ApiResponse(200, conges, 'My leave requests retrieved successfully'));
});

/**
 * GET /api/conges/:id
 * Admin/RH — get single leave request by ID
 */
const getCongeById = asyncHandler(async (req, res) => {
  const conge = await congeService.getCongeById(req.params.id);
  res.status(200).json(new ApiResponse(200, conge, 'Leave request retrieved successfully'));
});

/**
 * POST /api/conges
 * Employee — creates their own leave request (employeId resolved server-side)
 */
const createConge = asyncHandler(async (req, res) => {
  const conge = await congeService.createCongeForUser(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, conge, 'Leave request submitted successfully'));
});

/**
 * PUT /api/conges/my/:id
 * Employee — modifies their own leave request (only if pending)
 */
const updateCongeForUser = asyncHandler(async (req, res) => {
  const conge = await congeService.updateCongeForUser(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, conge, 'Leave request updated successfully'));
});

/**
 * POST /api/conges/admin
 * Admin/RH — creates a leave request for a specific employee
 */
const createCongeAdmin = asyncHandler(async (req, res) => {
  const conge = await congeService.createConge(req.body);
  res.status(201).json(new ApiResponse(201, conge, 'Leave request created successfully'));
});

/**
 * PATCH /api/conges/:id/status
 * Admin/RH — approve or reject a leave request
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');
  const conge = await congeService.updateStatus(req.params.id, status);
  res.status(200).json(new ApiResponse(200, conge, `Leave request ${status} successfully`));
});

/**
 * PUT /api/conges/:id
 * Admin/RH — full update
 */
const updateConge = asyncHandler(async (req, res) => {
  const conge = await congeService.updateConge(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, conge, 'Leave request updated successfully'));
});

/**
 * DELETE /api/conges/:id
 * Admin only
 */
const deleteConge = asyncHandler(async (req, res) => {
  const result = await congeService.deleteConge(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

/**
 * POST /api/conges/:id/prolonger
 * Admin/RH — extend a leave
 */
const prolongerConge = asyncHandler(async (req, res) => {
  const { joursSupplementaires } = req.body;
  const conge = await congeService.prolongerConge(req.params.id, joursSupplementaires);
  res.status(200).json(new ApiResponse(200, conge, 'Leave extended successfully'));
});

/**
 * GET /api/conges/stats
 * Admin/RH — aggregated statistics
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await congeService.getStats();
  res.status(200).json(new ApiResponse(200, stats, 'Leave statistics retrieved'));
});

module.exports = {
  getAllConges,
  getMyConges,
  getCongeById,
  createConge,
  updateCongeForUser,
  createCongeAdmin,
  updateStatus,
  updateConge,
  deleteConge,
  prolongerConge,
  getStats,
};
