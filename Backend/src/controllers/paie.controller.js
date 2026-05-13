const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const paieService = require('../services/paie.service');

const getAllPaies = asyncHandler(async (req, res) => {
  const { employeId, mois, annee } = req.query;
  const paies = await paieService.getAllPaies({ employeId, mois, annee });
  res.status(200).json(new ApiResponse(200, paies, 'Fiches de paie récupérées'));
});

const getPaieById = asyncHandler(async (req, res) => {
  const paie = await paieService.getPaieById(req.params.id);
  res.status(200).json(new ApiResponse(200, paie, 'Fiche de paie récupérée'));
});

const getMesPaies = asyncHandler(async (req, res) => {
  const employeId = req.user.employeeId;
  if (!employeId) return res.status(200).json(new ApiResponse(200, [], 'Aucun profil employé'));
  const paies = await paieService.getPaiesByEmploye(employeId);
  res.status(200).json(new ApiResponse(200, paies, 'Vos fiches de paie'));
});

const genererPaie = asyncHandler(async (req, res) => {
  const { employeId, mois, annee } = req.body;
  const paie = await paieService.genererPaie(employeId, mois, annee);
  res.status(201).json(new ApiResponse(201, paie, 'Fiche de paie générée'));
});

const genererToutesPaies = asyncHandler(async (req, res) => {
  const { mois, annee } = req.body;
  const paies = await paieService.genererToutesPaies(mois, annee);
  res.status(201).json(new ApiResponse(201, paies, `${paies.length} fiche(s) générée(s)`));
});

const calculerSalaire = asyncHandler(async (req, res) => {
  const { employeId, mois, annee } = req.query;
  const data = await paieService.calculerSalaire(employeId, parseInt(mois), parseInt(annee));
  res.status(200).json(new ApiResponse(200, data, 'Calcul effectué'));
});

const getPaieDocument = asyncHandler(async (req, res) => {
  const employeId = req.user.employeeId || req.query.employeId;
  const mois = parseInt(req.query.mois) || new Date().getMonth() + 1;
  const annee = parseInt(req.query.annee) || new Date().getFullYear();
  if (!employeId) return res.status(200).json(new ApiResponse(200, null, 'Aucun profil employé'));
  const data = await paieService.getPaieDataForDocument(employeId, mois, annee);
  res.status(200).json(new ApiResponse(200, data, 'Données de paie pour document'));
});

const deletePaie = asyncHandler(async (req, res) => {
  const result = await paieService.deletePaie(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = {
  getAllPaies, getPaieById, getMesPaies,
  genererPaie, genererToutesPaies, calculerSalaire,
  getPaieDocument, deletePaie,
};
