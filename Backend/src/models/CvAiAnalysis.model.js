const mongoose = require('mongoose');

const cvAiAnalysisSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      trim: true,
      default: '',
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilePath: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    jobCriteria: {
      jobTitle: { type: String, trim: true, default: '' },
      jobDescription: { type: String, trim: true, default: '' },
      requiredSkills: [{ type: String, trim: true }],
      experienceLevel: { type: String, trim: true, default: '' },
      languageRequirements: [{ type: String, trim: true }],
    },
    analysisResult: {
      candidate_summary: { type: String, default: '' },
      detected_skills: [{ type: String }],
      technical_skills: [{ type: String }],
      soft_skills: [{ type: String }],
      education: [{ type: String }],
      experience_summary: { type: String, default: '' },
      experience_years_estimate: { type: String, default: '' },
      languages: [{ type: String }],
      certifications: [{ type: String }],
      strongest_points: [{ type: String }],
      weak_points: [{ type: String }],
      missing_requirements: [{ type: String }],
      job_match_score: { type: Number, default: 0 },
      recommendation: {
        type: String,
        enum: ['strong_match', 'possible_match', 'weak_match'],
        default: 'possible_match',
      },
      recommended_interview_questions: [{ type: String }],
      suggested_next_step: { type: String, default: '' },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    analyzedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    chatHistory: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    pipelineStatus: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected'],
      default: 'pending',
    },
    savedToPipeline: {
      type: Boolean,
      default: false,
    },
    internalNotes: [
      {
        note: { type: String, required: true, trim: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

cvAiAnalysisSchema.index({ candidateName: 1 });
cvAiAnalysisSchema.index({ 'analysisResult.detected_skills': 1 });
cvAiAnalysisSchema.index({ 'jobCriteria.jobTitle': 1 });
cvAiAnalysisSchema.index({ 'analysisResult.job_match_score': 1 });
cvAiAnalysisSchema.index({ 'analysisResult.recommendation': 1 });
cvAiAnalysisSchema.index({ createdAt: -1 });

const CvAiAnalysis = mongoose.model('CvAiAnalysis', cvAiAnalysisSchema);

module.exports = CvAiAnalysis;
