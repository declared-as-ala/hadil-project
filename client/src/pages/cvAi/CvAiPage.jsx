import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState(urlSearch);
  const [recommendation, setRecommendation] = useState('');
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [form, setForm] = useState({
    jobTitle: '',
    jobDescription: '',
    requiredSkills: '',
    experienceLevel: '',
    languageRequirements: '',
  });

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (activeTab === 'pipeline' && !item.savedToPipeline) return false;
      if (recommendation && item.analysisResult?.recommendation !== recommendation) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (item.candidateName || '').toLowerCase().includes(q) ||
        (item.jobCriteria?.jobTitle || '').toLowerCase().includes(q) ||
        (item.analysisResult?.detected_skills || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [history, recommendation, search, activeTab]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

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
      toast.warning('CV manquant', 'Veuillez télécharger un CV au format PDF, DOCX ou TXT.');
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
      toast.success('Analyse terminée', 'Le CV a été analysé avec succès.');
      navigate(`/hr/cv-ai/${id}`);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette analyse de CV ?')) return;
    try {
      await cvAiAPI.delete(id);
      toast.success('Supprimée', 'Analyse supprimée avec succès.');
      loadHistory();
    } catch (err) {
      toast.error(err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analyseur de CV par IA</h1>
          <p>Téléchargez, analysez et examinez les CV des candidats avec l'aide de l'IA.</p>
        </div>
      </div>

      <div className="cv-grid">
        <div className="cv-card">
          <h3 className="card-title">Télécharger et Analyser</h3>
          
          <label className="file-upload-area" style={{ display: 'block', marginTop: 12 }}>
            <span className="file-upload-icon">📂</span>
            <span style={{ fontWeight: 600, display: 'block', fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>
              {file ? file.name : "Sélectionner un fichier CV"}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
              Formats autorisés : PDF, DOCX, TXT
            </span>
            <input 
              type="file" 
              style={{ display: 'none' }} 
              accept=".pdf,.docx,.txt" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </label>
          <div className="form-group">
            <label className="form-label">Titre du poste </label>
            <input className="form-input" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Compétences requises (séparées par des virgules)</label>
              <input className="form-input" value={form.requiredSkills} onChange={(e) => setForm((p) => ({ ...p, requiredSkills: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Niveau d'expérience</label>
              <input className="form-input" value={form.experienceLevel} onChange={(e) => setForm((p) => ({ ...p, experienceLevel: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Exigences linguistiques (séparées par des virgules)</label>
            <input className="form-input" value={form.languageRequirements} onChange={(e) => setForm((p) => ({ ...p, languageRequirements: e.target.value }))} />
          </div>
          <div className="cv-two-actions">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyse en cours...' : 'Analyser le CV'}
            </button>
          </div>
          <p className="cv-warning">La recommandation de l'IA n'est qu'une aide. La décision finale doit être prise par les RH.</p>
        </div>

        <div className="cv-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: 12 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Candidatures</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                onClick={() => setActiveTab('history')}
              >
                Toutes ({history.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                onClick={() => setActiveTab('pipeline')}
              >
                Pipeline ({history.filter(h => h.savedToPipeline).length})
              </button>
            </div>
          </div>
          <div className="table-filters">
            <input className="form-input" placeholder="Rechercher candidat, compétence, titre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-select" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              <option value="">Toutes les recommandations</option>
              <option value="strong_match">Excellente correspondance</option>
              <option value="possible_match">Correspondance possible</option>
              <option value="weak_match">Faible correspondance</option>
            </select>
          </div>
          {historyLoading ? (
            <div className="crud-loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🤖" title="Aucune analyse pour le moment" description="Téléchargez et analysez votre premier CV." />
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {filtered.slice(0, 8).map((item) => (
                <div key={item.id} className="cv-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.candidateName || 'Candidat inconnu'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{item.jobCriteria?.jobTitle || 'Aucun titre de poste'}</div>
                    </div>
                    <Badge variant="primary">{item.analysisResult?.job_match_score || 0}%</Badge>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge variant={item.analysisResult?.recommendation === 'strong_match' ? 'success' : item.analysisResult?.recommendation === 'weak_match' ? 'danger' : 'warning'}>
                      {item.analysisResult?.recommendation === 'strong_match' ? 'Excellente correspondance' : item.analysisResult?.recommendation === 'weak_match' ? 'Faible correspondance' : 'Correspondance possible'}
                    </Badge>
                    {item.savedToPipeline && <Badge variant="primary">Pipeline</Badge>}
                    <Badge variant={item.pipelineStatus === 'shortlisted' ? 'success' : item.pipelineStatus === 'rejected' ? 'danger' : 'warning'}>
                      {item.pipelineStatus === 'shortlisted' ? 'Sélectionné' : item.pipelineStatus === 'rejected' ? 'Rejeté' : 'En attente'}
                    </Badge>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <Link to={`/hr/cv-ai/${item.id}`} className="btn btn-outline btn-sm">Ouvrir</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
              {filtered.length > 8 && (
                <Link to="/hr/cv-ai/history" className="btn btn-outline">Voir tout l'historique</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
