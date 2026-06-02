const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const paieService = require('../services/paie.service');

const getAllPaies = asyncHandler(async (req, res) => {
  const { employeId, mois, annee } = req.query;
  const paies = await paieService.getAllPaies({ employeId, mois, annee });
  res.status(200).json(new ApiResponse(200, paies, 'Fiches de paie calculees'));
});

const getMesPaies = asyncHandler(async (req, res) => {
  const employeId = req.user.employeeId;
  if (!employeId) {
    return res.status(200).json(new ApiResponse(200, [], 'Aucun profil employe'));
  }

  const { mois, annee } = req.query;
  const paies = await paieService.getPaiesByEmploye(employeId, { mois, annee });
  res.status(200).json(new ApiResponse(200, paies, 'Vos fiches de paie calculees'));
});

const calculerSalaire = asyncHandler(async (req, res) => {
  const { employeId, mois, annee } = req.query;
  const data = await paieService.calculerSalaire(employeId, mois, annee);
  res.status(200).json(new ApiResponse(200, data, 'Calcul effectue'));
});

const getPaieDocument = asyncHandler(async (req, res) => {
  const employeId = req.user.employeeId || req.query.employeId;
  const mois = req.query.mois || new Date().getMonth() + 1;
  const annee = req.query.annee || new Date().getFullYear();

  if (!employeId) {
    return res.status(200).json(new ApiResponse(200, null, 'Aucun profil employe'));
  }

  const data = await paieService.getPaieDataForDocument(employeId, mois, annee);
  res.status(200).json(new ApiResponse(200, data, 'Donnees de paie pour document'));
});

module.exports = {
  getAllPaies,
  getMesPaies,
  calculerSalaire,
  getPaieDocument,
};
