import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cvAiAPI } from '../../api/cvAi.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import './CvAiPage.css';

export default function CvAiDetailPage() {
  const { id } = useParams();
  const toast = useApiToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await cvAiAPI.getById(id);
      setData(res.data);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updatePipeline(payload) {
    setSaving(true);
    try {
      await cvAiAPI.updatePipeline(id, payload);
      toast.success('Mis à jour', 'Données du pipeline mises à jour.');
      setNote('');
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  }

  function downloadPdf() {
    const token = localStorage.getItem('token');
    fetch(cvAiAPI.exportPdfUrl(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Échec du téléchargement');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv-analysis-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => toast.error({ message: err.message }));
  }

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;
  if (!data) return null;

  const analysis = data.analysisResult || {};
  const score = analysis.job_match_score || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Résultat de l'analyse du CV</h1>
          <p>{data.candidateName || 'Candidat inconnu'} - {data.jobCriteria?.jobTitle || 'Aucun poste fourni'}</p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-outline" to={`/hr/cv-ai/${id}/chat`}>Ouvrir le chat IA</Link>
          <button className="btn btn-primary" onClick={downloadPdf}>Télécharger le PDF</button>
        </div>
      </div>

      <div className="cv-card" style={{ marginBottom: 16 }}>
        <div className="score-wrap">
          <div className="score-header">
            <strong style={{ fontSize: 'var(--text-base)', color: 'var(--gray-700)' }}>Score d'adéquation au poste</strong>
            <strong style={{ fontSize: 'var(--text-xl)', color: 'var(--color-primary)' }}>{score}%</strong>
          </div>
          <div className="score-bar"><span style={{ width: `${score}%` }} /></div>
        </div>
      </div>

      <div className="cv-grid">
        <div className="cv-card">
          <h3 className="card-title">Résumé & Compétences</h3>
          <p style={{ marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--gray-600)', lineHeight: '1.5' }}>
            {analysis.candidate_summary || 'Aucun résumé disponible.'}
          </p>

          <h4 style={{ marginTop: 16, fontSize: 'var(--text-sm)', fontWeight: 600 }}>Compétences Détectées</h4>
          <div className="badge-list" style={{ marginTop: 8 }}>
            {(analysis.detected_skills || []).map((skill) => (
              <Badge key={skill} variant="primary">{skill}</Badge>
            ))}
          </div>

          <div className="split-list" style={{ marginTop: 20 }}>
            <div className="points-forts-container">
              <h4>🟢 Points forts</h4>
              <ul style={{ paddingLeft: '1.2rem', marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>
                {(analysis.strongest_points || []).map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}
              </ul>
            </div>
            <div className="points-faibles-container">
              <h4>🔴 Points faibles / écarts</h4>
              <ul style={{ paddingLeft: '1.2rem', marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>
                {(analysis.weak_points || []).map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="cv-card">
          <h3 className="card-title">Recommandation</h3>
          <div style={{ marginBottom: 12 }}>
            <Badge variant={analysis.recommendation === 'strong_match' ? 'success' : analysis.recommendation === 'weak_match' ? 'danger' : 'warning'}>
              {analysis.recommendation === 'strong_match' ? 'Excellente correspondance' : analysis.recommendation === 'weak_match' ? 'Faible correspondance' : 'Correspondance possible'}
            </Badge>
          </div>
          
          <div className="cv-detail-section">
            <strong>Exigences manquantes</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
              {(analysis.missing_requirements || []).length === 0 ? (
                <li>Aucune exigence manquante détectée.</li>
              ) : (
                (analysis.missing_requirements || []).map((x, i) => <li key={i}>{x}</li>)
              )}
            </ul>
          </div>
          
          <div className="cv-detail-section" style={{ marginTop: 12 }}>
            <strong>Questions d'entretien suggérées</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
              {(analysis.recommended_interview_questions || []).map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}
            </ul>
          </div>
          
          <div className="cv-detail-section" style={{ marginTop: 12 }}>
            <strong>Étape suivante suggérée</strong>
            <p style={{ marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--gray-600)', lineHeight: '1.4' }}>
              {analysis.suggested_next_step || 'Aucune suggestion disponible.'}
            </p>
          </div>
        </div>
      </div>

      <div className="cv-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Actions du pipeline</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {data.savedToPipeline && <Badge variant="primary">Enregistré dans le pipeline</Badge>}
            <Badge variant={data.pipelineStatus === 'shortlisted' ? 'success' : data.pipelineStatus === 'rejected' ? 'danger' : 'warning'}>
              {data.pipelineStatus === 'shortlisted' ? 'Sélectionné' : data.pipelineStatus === 'rejected' ? 'Rejeté' : 'En attente'}
            </Badge>
          </div>
        </div>
        <div className="cv-two-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-outline"
            disabled={saving}
            onClick={() => updatePipeline({ savedToPipeline: !data.savedToPipeline })}
          >
            {data.savedToPipeline ? 'Retirer du pipeline' : 'Enregistrer dans le pipeline'}
          </button>
          <button
            className="btn btn-success"
            disabled={saving || data.pipelineStatus === 'shortlisted'}
            onClick={() => updatePipeline({ pipelineStatus: 'shortlisted' })}
          >
            Sélectionner
          </button>
          <button
            className="btn btn-danger"
            disabled={saving || data.pipelineStatus === 'rejected'}
            onClick={() => updatePipeline({ pipelineStatus: 'rejected' })}
          >
            Rejeter
          </button>
          <button
            className="btn btn-outline"
            disabled={saving || data.pipelineStatus === 'pending'}
            onClick={() => updatePipeline({ pipelineStatus: 'pending' })}
          >
            Mettre en attente
          </button>
        </div>
        {(data.internalNotes || []).length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: '8px' }}>
            <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>Notes enregistrées :</strong>
            {data.internalNotes.map((n, idx) => (
              <div key={idx} style={{ padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', fontSize: 'var(--text-sm)' }}>
                <p style={{ margin: 0, color: 'var(--gray-800)' }}>{n.note}</p>
                <span style={{ fontSize: '10px', color: 'var(--gray-400)', display: 'block', marginTop: 4 }}>
                  Ajoutée le {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Note RH interne</label>
          <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={!note.trim() || saving} onClick={() => updatePipeline({ note })}>
            Ajouter une note
          </button>
        </div>
      </div>
    </div>
  );
}
