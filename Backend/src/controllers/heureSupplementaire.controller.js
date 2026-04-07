const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const heureSupplementaireService = require('../services/heureSupplementaire.service');

const getAllHeuresSupplementaires = asyncHandler(async (req, res) => {
  const { employeId, dateFrom, dateTo } = req.query;
  const heures = await heureSupplementaireService.getAllHeuresSupplementaires({ employeId, dateFrom, dateTo });
  res.status(200).json(new ApiResponse(200, heures, 'Heures supplementaires retrieved successfully'));
});

const getHeureSupplementaireById = asyncHandler(async (req, res) => {
  const heure = await heureSupplementaireService.getHeureSupplementaireById(req.params.id);
  res.status(200).json(new ApiResponse(200, heure, 'Heure supplementaire retrieved successfully'));
});

const createHeureSupplementaire = asyncHandler(async (req, res) => {
  const heure = await heureSupplementaireService.createHeureSupplementaire(req.body);
  res.status(201).json(new ApiResponse(201, heure, 'Heure supplementaire created successfully'));
});

const updateHeureSupplementaire = asyncHandler(async (req, res) => {
  const heure = await heureSupplementaireService.updateHeureSupplementaire(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, heure, 'Heure supplementaire updated successfully'));
});

const deleteHeureSupplementaire = asyncHandler(async (req, res) => {
  const result = await heureSupplementaireService.deleteHeureSupplementaire(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = {
  getAllHeuresSupplementaires,
  getHeureSupplementaireById,
  createHeureSupplementaire,
  updateHeureSupplementaire,
  deleteHeureSupplementaire,
};
