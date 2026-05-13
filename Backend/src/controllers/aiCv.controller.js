const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const aiCvService = require('../services/aiCv.service');

const upload = multer({
  storage: multer.diskStorage(aiCvService.getUploadConfig()),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const uploadCv = asyncHandler(async (req, res) => {
  const doc = await aiCvService.uploadCv(req.file, req.user.id);
  res.status(201).json(new ApiResponse(201, doc, 'CV uploaded successfully'));
});

const analyzeCv = asyncHandler(async (req, res) => {
  const doc = await aiCvService.analyzeCv(req.params.id, req.body, req.user.id);
  res.status(200).json(new ApiResponse(200, doc, 'CV analyzed successfully'));
});

const chatWithCv = asyncHandler(async (req, res) => {
  const result = await aiCvService.chat(req.params.id, req.body.question, req.user.id);
  res.status(200).json(new ApiResponse(200, result, 'Chat response generated'));
});

const listCvAnalyses = asyncHandler(async (req, res) => {
  const data = await aiCvService.list(req.query);
  res.status(200).json(new ApiResponse(200, data, 'CV analyses retrieved successfully'));
});

const getCvAnalysisById = asyncHandler(async (req, res) => {
  const doc = await aiCvService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, doc, 'CV analysis retrieved successfully'));
});

const updatePipeline = asyncHandler(async (req, res) => {
  const doc = await aiCvService.updatePipeline(req.params.id, req.body, req.user.id);
  res.status(200).json(new ApiResponse(200, doc, 'Pipeline status updated'));
});

const exportAnalysisPdf = asyncHandler(async (req, res) => {
  const pdfBuffer = await aiCvService.generateAnalysisPdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="cv-analysis-${req.params.id}.pdf"`);
  res.status(200).send(pdfBuffer);
});

const deleteCvAnalysis = asyncHandler(async (req, res) => {
  const result = await aiCvService.deleteById(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

module.exports = {
  upload,
  uploadCv,
  analyzeCv,
  chatWithCv,
  listCvAnalyses,
  getCvAnalysisById,
  updatePipeline,
  exportAnalysisPdf,
  deleteCvAnalysis,
};
