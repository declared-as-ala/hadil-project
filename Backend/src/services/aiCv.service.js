const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const ApiError = require('../utils/ApiError');
const CvAiAnalysis = require('../models/CvAiAnalysis.model');

const MAX_PROMPT_CHARS = 12000;
const XAI_TIMEOUT_MS = 25000;
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4-latest';
const DEFAULT_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';

const ANALYSIS_SYSTEM_PROMPT =
  'You are an HR assistant. Analyze only the provided CV and job description. Do not invent information. Do not judge protected characteristics. Return professional, structured, factual hiring support.';

const CHAT_SYSTEM_PROMPT =
  'You are an HR assistant chatbot. Answer ONLY from the provided CV and job description. If data is missing, answer exactly: "This information is not available in the CV." Never infer protected characteristics.';

const ensureUploadsDir = () => {
  const dir = path.join(__dirname, '../../uploads/cv-ai');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const sanitizeText = (text) =>
  (text || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncateForPrompt = (text) => {
  const clean = sanitizeText(text);
  if (clean.length <= MAX_PROMPT_CHARS) return clean;
  return `${clean.slice(0, MAX_PROMPT_CHARS)} ...[TRUNCATED DUE TO LENGTH]`;
};

const parseAiJson = (raw) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_e) {
    const match = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const body = match[1] || match[0];
    try {
      return JSON.parse(body);
    } catch (_e2) {
      return null;
    }
  }
};

const normalizeAnalysis = (obj = {}) => ({
  candidate_summary: obj.candidate_summary || '',
  detected_skills: Array.isArray(obj.detected_skills) ? obj.detected_skills : [],
  technical_skills: Array.isArray(obj.technical_skills) ? obj.technical_skills : [],
  soft_skills: Array.isArray(obj.soft_skills) ? obj.soft_skills : [],
  education: Array.isArray(obj.education) ? obj.education : [],
  experience_summary: obj.experience_summary || '',
  experience_years_estimate: obj.experience_years_estimate || '',
  languages: Array.isArray(obj.languages) ? obj.languages : [],
  certifications: Array.isArray(obj.certifications) ? obj.certifications : [],
  strongest_points: Array.isArray(obj.strongest_points) ? obj.strongest_points : [],
  weak_points: Array.isArray(obj.weak_points) ? obj.weak_points : [],
  missing_requirements: Array.isArray(obj.missing_requirements) ? obj.missing_requirements : [],
  job_match_score: Number.isFinite(obj.job_match_score) ? Math.max(0, Math.min(100, obj.job_match_score)) : 0,
  recommendation: ['strong_match', 'possible_match', 'weak_match'].includes(obj.recommendation)
    ? obj.recommendation
    : 'possible_match',
  recommended_interview_questions: Array.isArray(obj.recommended_interview_questions)
    ? obj.recommended_interview_questions
    : [],
  suggested_next_step: obj.suggested_next_step || '',
});

class AiCvService {
  getUploadConfig() {
    return {
      destination: (req, file, cb) => cb(null, ensureUploadsDir()),
      filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      },
    };
  }

  validateUpload(file) {
    if (!file) throw new ApiError(400, 'CV file is required');
    const allowedMime = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const allowedExt = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMime.includes(file.mimetype) || !allowedExt.includes(ext)) {
      throw new ApiError(400, 'Only PDF, DOCX, and TXT files are allowed');
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) throw new ApiError(400, 'File size must be <= 8MB');
  }

  async extractTextFromFile(filePath, mimeType) {
    const buffer = await fs.promises.readFile(filePath);
    if (mimeType === 'application/pdf') {
      const result = await pdfParse(buffer);
      return sanitizeText(result.text);
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return sanitizeText(result.value);
    }
    return sanitizeText(buffer.toString('utf-8'));
  }

  detectCandidateName(extractedText, fallbackFileName) {
    const lines = (extractedText || '').split(/[.!?\n]/).map((l) => l.trim()).filter(Boolean);
    const likely = lines.find((line) => /^[A-Z][a-zA-Z'-]+(\s+[A-Z][a-zA-Z'-]+){1,3}$/.test(line));
    if (likely) return likely;
    return (fallbackFileName || '').replace(path.extname(fallbackFileName || ''), '').replace(/[_-]/g, ' ');
  }

  async uploadCv(file, userId) {
    this.validateUpload(file);
    const extractedText = await this.extractTextFromFile(file.path, file.mimetype);
    if (!extractedText) throw new ApiError(400, 'Unable to extract text from the CV');

    const candidateName = this.detectCandidateName(extractedText, file.originalname);
    const created = await CvAiAnalysis.create({
      candidateName,
      originalFileName: file.originalname,
      originalFilePath: file.path,
      mimeType: file.mimetype,
      extractedText,
      uploadedBy: userId,
      analysisResult: normalizeAnalysis(),
    });

    return created;
  }

  async callXai(messages, temperature = 0.2, retries = 1) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new ApiError(500, 'XAI_API_KEY is not configured');

    const url = `${DEFAULT_BASE_URL}/chat/completions`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), XAI_TIMEOUT_MS);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages,
            temperature,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const txt = await response.text();
          const error = new Error(`xAI request failed (${response.status}): ${txt.slice(0, 300)}`);
          error.status = response.status;
          // 4xx means caller/config issue; retrying only makes response slower.
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          throw error;
        }

        const payload = await response.json();
        return payload?.choices?.[0]?.message?.content || '';
      } catch (error) {
        const isClientError = Number(error.status) >= 400 && Number(error.status) < 500;
        if (isClientError) {
          console.error('[AI CV] xAI client error', { message: error.message });
          throw new ApiError(
            Number(error.status) === 401 || Number(error.status) === 403 ? 401 : 400,
            'AI configuration request failed. Verify API key, model, and base URL.'
          );
        }
        if (attempt === retries) {
          console.error('[AI CV] xAI call failed', { message: error.message, attempt });
          if (error.name === 'AbortError') {
            throw new ApiError(504, 'AI request timed out. Please retry.');
          }
          throw new ApiError(502, 'AI provider unavailable. Please retry.');
        }
      }
    }
    throw new ApiError(502, 'AI provider unavailable. Please retry.');
  }

  async analyzeCv(id, criteria, analystId) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'CV analysis record not found');

    const jobCriteria = {
      jobTitle: criteria.jobTitle || '',
      jobDescription: criteria.jobDescription || '',
      requiredSkills: Array.isArray(criteria.requiredSkills) ? criteria.requiredSkills : [],
      experienceLevel: criteria.experienceLevel || '',
      languageRequirements: Array.isArray(criteria.languageRequirements) ? criteria.languageRequirements : [],
    };

    const userPrompt = [
      'Analyze this candidate CV based only on provided data.',
      `CV_TEXT: ${truncateForPrompt(doc.extractedText)}`,
      `JOB_TITLE: ${jobCriteria.jobTitle}`,
      `JOB_DESCRIPTION: ${truncateForPrompt(jobCriteria.jobDescription)}`,
      `REQUIRED_SKILLS: ${jobCriteria.requiredSkills.join(', ')}`,
      `EXPERIENCE_LEVEL: ${jobCriteria.experienceLevel}`,
      `LANGUAGE_REQUIREMENTS: ${jobCriteria.languageRequirements.join(', ')}`,
      'Return strict JSON with fields:',
      '{"candidate_summary":"","detected_skills":[],"technical_skills":[],"soft_skills":[],"education":[],"experience_summary":"","experience_years_estimate":"","languages":[],"certifications":[],"strongest_points":[],"weak_points":[],"missing_requirements":[],"job_match_score":0,"recommendation":"strong_match | possible_match | weak_match","recommended_interview_questions":[],"suggested_next_step":""}',
    ].join('\n');

    const raw = await this.callXai(
      [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      0.1
    );

    const parsed = parseAiJson(raw);
    if (!parsed) throw new ApiError(502, 'AI response could not be parsed');
    const normalized = normalizeAnalysis(parsed);

    doc.jobCriteria = jobCriteria;
    doc.analysisResult = normalized;
    doc.analyzedBy = analystId;
    await doc.save();

    return doc;
  }

  async chat(id, question, askedBy) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'CV analysis record not found');
    if (!question || !question.trim()) throw new ApiError(400, 'Question is required');

    const prompt = [
      `CV_TEXT: ${truncateForPrompt(doc.extractedText)}`,
      `JOB_TITLE: ${doc.jobCriteria?.jobTitle || ''}`,
      `JOB_DESCRIPTION: ${truncateForPrompt(doc.jobCriteria?.jobDescription || '')}`,
      `QUESTION: ${question}`,
      'Remember: answer only from the given CV/job description.',
    ].join('\n');

    const answerRaw = await this.callXai(
      [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      0.2
    );

    const answer = sanitizeText(answerRaw) || 'This information is not available in the CV.';
    doc.chatHistory.push({ question: question.trim(), answer, askedBy });
    await doc.save();

    return { answer, chatHistory: doc.chatHistory };
  }

  async list(query = {}) {
    const mongoQuery = {};

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      mongoQuery.$or = [
        { candidateName: regex },
        { 'jobCriteria.jobTitle': regex },
        { 'analysisResult.detected_skills': regex },
      ];
    }
    if (query.recommendation) {
      mongoQuery['analysisResult.recommendation'] = query.recommendation;
    }
    if (query.fromDate || query.toDate) {
      mongoQuery.createdAt = {};
      if (query.fromDate) mongoQuery.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) mongoQuery.createdAt.$lte = new Date(query.toDate);
    }
    if (query.minScore || query.maxScore) {
      mongoQuery['analysisResult.job_match_score'] = {};
      if (query.minScore) mongoQuery['analysisResult.job_match_score'].$gte = Number(query.minScore);
      if (query.maxScore) mongoQuery['analysisResult.job_match_score'].$lte = Number(query.maxScore);
    }

    return CvAiAnalysis.find(mongoQuery)
      .select('-extractedText')
      .populate('uploadedBy', 'nom prenom email role')
      .populate('analyzedBy', 'nom prenom email role')
      .sort({ createdAt: -1 });
  }

  async getById(id) {
    const doc = await CvAiAnalysis.findById(id)
      .populate('uploadedBy', 'nom prenom email role')
      .populate('analyzedBy', 'nom prenom email role')
      .populate('chatHistory.askedBy', 'nom prenom email role')
      .populate('internalNotes.addedBy', 'nom prenom email role');
    if (!doc) throw new ApiError(404, 'CV analysis record not found');
    return doc;
  }

  async updatePipeline(id, payload, userId) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'CV analysis record not found');

    if (payload.pipelineStatus) {
      doc.pipelineStatus = payload.pipelineStatus;
    }
    if (typeof payload.savedToPipeline === 'boolean') {
      doc.savedToPipeline = payload.savedToPipeline;
    }
    if (payload.note) {
      doc.internalNotes.push({ note: payload.note.trim(), addedBy: userId });
    }

    await doc.save();
    return doc;
  }

  async deleteById(id) {
    const doc = await CvAiAnalysis.findByIdAndDelete(id);
    if (!doc) throw new ApiError(404, 'CV analysis record not found');
    if (doc.originalFilePath && fs.existsSync(doc.originalFilePath)) {
      fs.unlinkSync(doc.originalFilePath);
    }
    return { message: 'CV analysis deleted successfully' };
  }

  async generateAnalysisPdf(id) {
    const doc = await this.getById(id);
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 40 });
      const chunks = [];
      pdf.on('data', (chunk) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf.fontSize(18).text('AI CV Analysis Report', { underline: true });
      pdf.moveDown();
      pdf.fontSize(12).text(`Candidate: ${doc.candidateName || 'Unknown'}`);
      pdf.text(`Job Title: ${doc.jobCriteria?.jobTitle || 'N/A'}`);
      pdf.text(`Match Score: ${doc.analysisResult?.job_match_score || 0}/100`);
      pdf.text(`Recommendation: ${doc.analysisResult?.recommendation || 'possible_match'}`);
      pdf.moveDown();
      pdf.text(`Summary: ${doc.analysisResult?.candidate_summary || ''}`);
      pdf.moveDown();
      pdf.text(`Strongest Points: ${(doc.analysisResult?.strongest_points || []).join(', ')}`);
      pdf.text(`Weak Points: ${(doc.analysisResult?.weak_points || []).join(', ')}`);
      pdf.text(`Missing Requirements: ${(doc.analysisResult?.missing_requirements || []).join(', ')}`);
      pdf.moveDown();
      pdf.text('AI recommendation is only an assistant. Final decision must be made by HR.');
      pdf.end();
    });
  }
}

module.exports = new AiCvService();
