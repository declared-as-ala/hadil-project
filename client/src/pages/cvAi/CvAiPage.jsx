import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvAiAPI } from '../../api/cvAi.api';
import { useApiToast } from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import './CvAiPage.css';

const asList = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export default function CvAiPage() {
  const toast = useApiToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    jobTitle: '',
    jobDescription: '',
    requiredSkills: '',
    experienceLevel: '',
    languageRequirements: '',
  });

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (recommendation && item.analysisResult?.recommendation !== recommendation) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (item.candidateName || '').toLowerCase().includes(q) ||
        (item.jobCriteria?.jobTitle || '').toLowerCase().includes(q) ||
        (item.analysisResult?.detected_skills || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [history, recommendation, search]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await cvAiAPI.getAll();
      setHistory(res.data || []);
    } catch (err) {
      toast.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      toast.warning('Missing CV', 'Please upload a PDF, DOCX, or TXT CV.');
      return;
    }
    setLoading(true);
    try {
      const uploadRes = await cvAiAPI.uploadCv(file);
      const id = uploadRes.data?.id;
      await cvAiAPI.analyze(id, {
        jobTitle: form.jobTitle,
        jobDescription: form.jobDescription,
        requiredSkills: asList(form.requiredSkills),
        experienceLevel: form.experienceLevel,
        languageRequirements: asList(form.languageRequirements),
      });
      toast.success('Analysis complete', 'CV has been analyzed successfully.');
      navigate(`/hr/cv-ai/${id}`);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI CV Analyzer</h1>
          <p>Upload, analyze, and review candidate CVs with AI assistance.</p>
        </div>
      </div>

      <div className="cv-grid">
        <div className="cv-card">
          <h3 className="card-title">Upload and Analyze</h3>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label form-label-required">CV File (PDF, DOCX, TXT)</label>
            <input type="file" className="form-input" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Job Title (optional)</label>
            <input className="form-input" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description (optional)</label>
            <textarea className="form-textarea" value={form.jobDescription} onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Required Skills (comma separated)</label>
              <input className="form-input" value={form.requiredSkills} onChange={(e) => setForm((p) => ({ ...p, requiredSkills: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <input className="form-input" value={form.experienceLevel} onChange={(e) => setForm((p) => ({ ...p, experienceLevel: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Language Requirements (comma separated)</label>
            <input className="form-input" value={form.languageRequirements} onChange={(e) => setForm((p) => ({ ...p, languageRequirements: e.target.value }))} />
          </div>
          <div className="cv-two-actions">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze CV'}
            </button>
          </div>
          <p className="cv-warning">AI recommendation is only an assistant. Final decision must be made by HR.</p>
        </div>

        <div className="cv-card">
          <h3 className="card-title">History</h3>
          <div className="table-filters" style={{ marginTop: 12 }}>
            <input className="form-input" placeholder="Search candidate, skill, title..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-select" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              <option value="">All recommendations</option>
              <option value="strong_match">Strong match</option>
              <option value="possible_match">Possible match</option>
              <option value="weak_match">Weak match</option>
            </select>
          </div>
          {historyLoading ? (
            <div className="crud-loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🤖" title="No analyses yet" description="Upload and analyze your first CV." />
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {filtered.slice(0, 8).map((item) => (
                <div key={item.id} className="cv-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.candidateName || 'Unknown candidate'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{item.jobCriteria?.jobTitle || 'No job title'}</div>
                    </div>
                    <Badge variant="primary">{item.analysisResult?.job_match_score || 0}%</Badge>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Badge variant={item.analysisResult?.recommendation === 'strong_match' ? 'success' : item.analysisResult?.recommendation === 'weak_match' ? 'danger' : 'warning'}>
                      {item.analysisResult?.recommendation || 'possible_match'}
                    </Badge>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/hr/cv-ai/${item.id}`} className="btn btn-outline btn-sm">Open analysis</Link>
                  </div>
                </div>
              ))}
              {filtered.length > 8 && (
                <Link to="/hr/cv-ai/history" className="btn btn-outline">View full history</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
