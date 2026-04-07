const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const demandeService = require('../services/demande.service');

const getAllDemandes = asyncHandler(async (req, res) => {
  const { employeId, status } = req.query;
  const demandes = await demandeService.getAllDemandes({ employeId, status });
  res.status(200).json(new ApiResponse(200, demandes, 'Demandes retrieved successfully'));
});

const getDemandeById = asyncHandler(async (req, res) => {
  const demande = await demandeService.getDemandeById(req.params.id);
  res.status(200).json(new ApiResponse(200, demande, 'Demande retrieved successfully'));
});

const createDemande = asyncHandler(async (req, res) => {
  const demande = await demandeService.createDemande(req.body);
  res.status(201).json(new ApiResponse(201, demande, 'Demande created successfully'));
});

const updateDemande = asyncHandler(async (req, res) => {
  const demande = await demandeService.updateDemande(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, demande, 'Demande updated successfully'));
});

const deleteDemande = asyncHandler(async (req, res) => {
  const result = await demandeService.deleteDemande(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const consulterDemandes = asyncHandler(async (req, res) => {
  const { employeId } = req.query;
  const demandes = await demandeService.consulterDemandes(employeId);
  res.status(200).json(new ApiResponse(200, demandes, 'Demandes consulted successfully'));
});

module.exports = {
  getAllDemandes,
  getDemandeById,
  createDemande,
  updateDemande,
  deleteDemande,
  consulterDemandes,
};
