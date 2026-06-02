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

const FRENCH_UNAVAILABLE_MESSAGE = "Cette information n'est pas disponible dans le CV.";

const ANALYSIS_SYSTEM_PROMPT = [
  'Vous etes un assistant RH.',
  'Analysez uniquement le CV et la description du poste fournis.',
  'Ne jamais inventer des informations et ne jamais juger les caracteristiques protegees.',
  'Repondez en JSON strict, mais toutes les valeurs textuelles doivent etre en francais.',
  'Gardez seulement les noms propres et les noms de technologies dans leur forme originale.',
].join(' ');

const CHAT_SYSTEM_PROMPT = [
  'Vous etes un assistant RH conversationnel.',
  'Repondez uniquement a partir du CV et de la description du poste fournis.',
  'Repondez toujours en francais.',
  `Si une information manque, repondez exactement: "${FRENCH_UNAVAILABLE_MESSAGE}"`,
  'Ne jamais inferer les caracteristiques protegees.',
].join(' ');

const RECOMMENDATION_LABELS = {
  strong_match: 'Excellente correspondance',
  possible_match: 'Correspondance possible',
  weak_match: 'Faible correspondance',
};

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

const normalizeAnalysis = (obj = {}) => {
  let score = Number.isFinite(obj.job_match_score) ? obj.job_match_score : 0;
  // If the model returned a decimal score between 0 and 1, convert to a percentage
  if (score > 0 && score <= 1.0) {
    score = Math.round(score * 100);
  } else {
    score = Math.round(score);
  }
  score = Math.max(0, Math.min(100, score));

  return {
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
    job_match_score: score,
    recommendation: ['strong_match', 'possible_match', 'weak_match'].includes(obj.recommendation)
      ? obj.recommendation
      : 'possible_match',
    recommended_interview_questions: Array.isArray(obj.recommended_interview_questions)
      ? obj.recommended_interview_questions
      : [],
    suggested_next_step: obj.suggested_next_step || '',
  };
};

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
    if (!file) throw new ApiError(400, 'Le fichier CV est requis');
    const allowedMime = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const allowedExt = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMime.includes(file.mimetype) || !allowedExt.includes(ext)) {
      throw new ApiError(400, 'Seuls les fichiers PDF, DOCX et TXT sont autorises');
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) throw new ApiError(400, 'La taille du fichier doit etre inferieure ou egale a 8 Mo');
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
    if (!extractedText) throw new ApiError(400, "Impossible d'extraire le texte du CV");

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

  async callXai(messages, temperature = 0.2, isJson = false, retries = 1) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new ApiError(500, "La cle API de l'IA n'est pas configuree");

    const url = `${DEFAULT_BASE_URL}/chat/completions`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), XAI_TIMEOUT_MS);
        const requestBody = {
          model: DEFAULT_MODEL,
          messages,
          temperature,
          ...(isJson ? { response_format: { type: 'json_object' } } : {}),
        };
        console.log('[AI CV DEBUG] isJson:', isJson, 'requestBody:', JSON.stringify(requestBody));

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
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
            "La requete de configuration IA a echoue. Verifiez la cle API, le modele et l'URL de base."
          );
        }
        if (attempt === retries) {
          console.error('[AI CV] xAI call failed', { message: error.message, attempt });
          if (error.name === 'AbortError') {
            throw new ApiError(504, "La requete IA a expire. Veuillez reessayer.");
          }
          throw new ApiError(502, "Le fournisseur IA est indisponible. Veuillez reessayer.");
        }
      }
    }
    throw new ApiError(502, "Le fournisseur IA est indisponible. Veuillez reessayer.");
  }

  async analyzeCv(id, criteria, analystId) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');

    const jobCriteria = {
      jobTitle: criteria.jobTitle || '',
      jobDescription: criteria.jobDescription || '',
      requiredSkills: Array.isArray(criteria.requiredSkills) ? criteria.requiredSkills : [],
      experienceLevel: criteria.experienceLevel || '',
      languageRequirements: Array.isArray(criteria.languageRequirements) ? criteria.languageRequirements : [],
    };

    const userPrompt = [
      'Analyse ce CV candidat uniquement a partir des donnees fournies.',
      'IMPORTANT: toutes les phrases, resumes, points forts, points faibles, exigences manquantes, questions et recommandations doivent etre rediges en francais.',
      'Les cles JSON doivent rester exactement comme dans le modele demande, mais les valeurs textuelles doivent etre en francais.',
      `CV_TEXT: ${truncateForPrompt(doc.extractedText)}`,
      `JOB_TITLE: ${jobCriteria.jobTitle}`,
      `JOB_DESCRIPTION: ${truncateForPrompt(jobCriteria.jobDescription)}`,
      `REQUIRED_SKILLS: ${jobCriteria.requiredSkills.join(', ')}`,
      `EXPERIENCE_LEVEL: ${jobCriteria.experienceLevel}`,
      `LANGUAGE_REQUIREMENTS: ${jobCriteria.languageRequirements.join(', ')}`,
      'Retourne un JSON strict avec ces champs (job_match_score doit etre un entier entre 0 et 100):',
      '{"candidate_summary":"","detected_skills":[],"technical_skills":[],"soft_skills":[],"education":[],"experience_summary":"","experience_years_estimate":"","languages":[],"certifications":[],"strongest_points":[],"weak_points":[],"missing_requirements":[],"job_match_score":0,"recommendation":"strong_match | possible_match | weak_match","recommended_interview_questions":[],"suggested_next_step":""}',
    ].join('\n');

    const raw = await this.callXai(
      [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      0.1,
      true
    );

    const parsed = parseAiJson(raw);
    if (!parsed) throw new ApiError(502, "La reponse de l'IA n'a pas pu etre interpretee");
    const normalized = normalizeAnalysis(parsed);

    doc.jobCriteria = jobCriteria;
    doc.analysisResult = normalized;
    doc.analyzedBy = analystId;
    await doc.save();

    return doc;
  }

  async chat(id, question, askedBy) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');
    if (!question || !question.trim()) throw new ApiError(400, 'La question est requise');

    const prompt = [
      `CV_TEXT: ${truncateForPrompt(doc.extractedText)}`,
      `JOB_TITLE: ${doc.jobCriteria?.jobTitle || ''}`,
      `JOB_DESCRIPTION: ${truncateForPrompt(doc.jobCriteria?.jobDescription || '')}`,
      `QUESTION: ${question}`,
      'Reponds uniquement a partir du CV et de la description du poste.',
      `Reponds toujours en francais. Si l'information manque, reponds exactement: "${FRENCH_UNAVAILABLE_MESSAGE}"`,
    ].join('\n');

    const answerRaw = await this.callXai(
      [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      0.2,
      false
    );

    const answer = sanitizeText(answerRaw) || FRENCH_UNAVAILABLE_MESSAGE;
    doc.chatHistory.push({ question: question.trim(), answer, askedBy });
    await doc.save();

    return { answer, chatHistory: doc.chatHistory };
  }

  async clearChat(id) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');
    doc.chatHistory = [];
    await doc.save();
    return doc;
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
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');
    return doc;
  }

  async updatePipeline(id, payload, userId) {
    const doc = await CvAiAnalysis.findById(id);
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');

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
    if (!doc) throw new ApiError(404, 'Analyse de CV introuvable');
    if (doc.originalFilePath && fs.existsSync(doc.originalFilePath)) {
      try {
        fs.unlinkSync(doc.originalFilePath);
      } catch (err) {
        console.error(`Failed to delete physical file at ${doc.originalFilePath}:`, err);
      }
    }
    return { message: 'Analyse de CV supprimee avec succes' };
  }

  async generateAnalysisPdf(id) {
    const doc = await this.getById(id);
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 40 });
      const chunks = [];
      pdf.on('data', (chunk) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf.fontSize(18).text("Rapport d'analyse de CV par IA", { underline: true });
      pdf.moveDown();
      pdf.fontSize(12).text(`Candidat : ${doc.candidateName || 'Inconnu'}`);
      pdf.text(`Poste : ${doc.jobCriteria?.jobTitle || 'N/A'}`);
      pdf.text(`Score d'adequation : ${doc.analysisResult?.job_match_score || 0}/100`);
      const recommendationLabel =
        RECOMMENDATION_LABELS[doc.analysisResult?.recommendation] || RECOMMENDATION_LABELS.possible_match;
      pdf.text(`Recommandation : ${recommendationLabel}`);
      pdf.moveDown();
      pdf.text(`Resume : ${doc.analysisResult?.candidate_summary || ''}`);
      pdf.moveDown();
      pdf.text(`Points forts : ${(doc.analysisResult?.strongest_points || []).join(', ')}`);
      pdf.text(`Points faibles : ${(doc.analysisResult?.weak_points || []).join(', ')}`);
      pdf.text(`Exigences manquantes : ${(doc.analysisResult?.missing_requirements || []).join(', ')}`);
      pdf.moveDown();
      pdf.text("La recommandation de l'IA n'est qu'une aide. La decision finale doit etre prise par les RH.");
      pdf.end();
    });
  }
}

module.exports = new AiCvService();
