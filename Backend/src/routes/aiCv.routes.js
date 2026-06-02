const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const aiCvController = require('../controllers/aiCv.controller');
const {
  aiCvParamsSchema,
  analyzeCvSchema,
  chatSchema,
  listSchema,
  updatePipelineSchema,
} = require('../validations/aiCv.validation');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'rh'));

router.post('/upload', aiCvController.upload.single('cvFile'), aiCvController.uploadCv);
router.post('/analyze/:id', validate(aiCvParamsSchema), validate(analyzeCvSchema), aiCvController.analyzeCv);
router.post('/chat/:id', validate(aiCvParamsSchema), validate(chatSchema), aiCvController.chatWithCv);
router.delete('/:id/chat', validate(aiCvParamsSchema), aiCvController.clearChat);
router.get('/', validate(listSchema), aiCvController.listCvAnalyses);
router.get('/:id', validate(aiCvParamsSchema), aiCvController.getCvAnalysisById);
router.patch('/:id/pipeline', validate(aiCvParamsSchema), validate(updatePipelineSchema), aiCvController.updatePipeline);
router.get('/:id/export-pdf', validate(aiCvParamsSchema), aiCvController.exportAnalysisPdf);
router.delete('/:id', validate(aiCvParamsSchema), aiCvController.deleteCvAnalysis);

module.exports = router;
