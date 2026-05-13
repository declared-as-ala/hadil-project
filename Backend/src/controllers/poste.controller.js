const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const posteService = require('../services/poste.service');

const getAllPostes = asyncHandler(async (req, res) => {
  const postes = await posteService.getAllPostes();
  res.status(200).json(new ApiResponse(200, postes, 'Postes récupérés'));
});

const getPosteById = asyncHandler(async (req, res) => {
  const poste = await posteService.getPosteById(req.params.id);
  res.status(200).json(new ApiResponse(200, poste, 'Poste récupéré'));
});

const createPoste = asyncHandler(async (req, res) => {
  const poste = await posteService.createPoste(req.body);
  res.status(201).json(new ApiResponse(201, poste, 'Poste créé'));
});

const updatePoste = asyncHandler(async (req, res) => {
  const poste = await posteService.updatePoste(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, poste, 'Poste mis à jour'));
});

const deletePoste = asyncHandler(async (req, res) => {
  const result = await posteService.deletePoste(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = { getAllPostes, getPosteById, createPoste, updatePoste, deletePoste };
