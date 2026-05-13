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
      toast.success('Updated', 'Pipeline data updated.');
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
        if (!res.ok) throw new Error('Download failed');
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
          <h1>CV Analysis Result</h1>
          <p>{data.candidateName || 'Unknown candidate'} - {data.jobCriteria?.jobTitle || 'No role provided'}</p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-outline" to={`/hr/cv-ai/${id}/chat`}>Open AI Chat</Link>
          <button className="btn btn-primary" onClick={downloadPdf}>Download PDF</button>
        </div>
      </div>

      <div className="cv-card" style={{ marginBottom: 16 }}>
        <div className="score-wrap">
          <strong>Match Score</strong>
          <div className="score-bar"><span style={{ width: `${score}%` }} /></div>
          <strong>{score}%</strong>
        </div>
        <p className="cv-warning">AI recommendation is only an assistant. Final decision must be made by HR.</p>
      </div>

      <div className="cv-grid">
        <div className="cv-card">
          <h3 className="card-title">Summary</h3>
          <p style={{ marginTop: 10 }}>{analysis.candidate_summary || 'No summary available.'}</p>

          <h4 style={{ marginTop: 16 }}>Skills</h4>
          <div className="badge-list" style={{ marginTop: 8 }}>
            {(analysis.detected_skills || []).map((skill) => (
              <Badge key={skill} variant="primary">{skill}</Badge>
            ))}
          </div>

          <div className="split-list" style={{ marginTop: 16 }}>
            <div>
              <h4>Strongest Points</h4>
              <ul style={{ marginLeft: 18, marginTop: 6 }}>
                {(analysis.strongest_points || []).map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
            <div>
              <h4>Weak Points</h4>
              <ul style={{ marginLeft: 18, marginTop: 6 }}>
                {(analysis.weak_points || []).map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="cv-card">
          <h3 className="card-title">Recommendation</h3>
          <Badge variant={analysis.recommendation === 'strong_match' ? 'success' : analysis.recommendation === 'weak_match' ? 'danger' : 'warning'}>
            {analysis.recommendation || 'possible_match'}
          </Badge>
          <h4 style={{ marginTop: 16 }}>Missing Requirements</h4>
          <ul style={{ marginLeft: 18, marginTop: 6 }}>
            {(analysis.missing_requirements || []).map((x) => <li key={x}>{x}</li>)}
          </ul>
          <h4 style={{ marginTop: 16 }}>Interview Questions</h4>
          <ul style={{ marginLeft: 18, marginTop: 6 }}>
            {(analysis.recommended_interview_questions || []).map((x) => <li key={x}>{x}</li>)}
          </ul>
          <h4 style={{ marginTop: 16 }}>Suggested Next Step</h4>
          <p>{analysis.suggested_next_step || 'No suggestion available.'}</p>
        </div>
      </div>

      <div className="cv-card" style={{ marginTop: 16 }}>
        <h3 className="card-title">Pipeline Actions</h3>
        <div className="cv-two-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-outline" disabled={saving} onClick={() => updatePipeline({ savedToPipeline: true })}>Save to pipeline</button>
          <button className="btn btn-success" disabled={saving} onClick={() => updatePipeline({ pipelineStatus: 'shortlisted' })}>Mark shortlisted</button>
          <button className="btn btn-danger" disabled={saving} onClick={() => updatePipeline({ pipelineStatus: 'rejected' })}>Mark rejected</button>
          <button className="btn btn-outline" disabled={saving} onClick={() => updatePipeline({ pipelineStatus: 'pending' })}>Mark pending</button>
        </div>
        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Internal HR Note</label>
          <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={!note.trim() || saving} onClick={() => updatePipeline({ note })}>
            Add note
          </button>
        </div>
      </div>
    </div>
  );
}
