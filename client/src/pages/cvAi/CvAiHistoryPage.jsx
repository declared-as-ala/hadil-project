import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cvAiAPI } from '../../api/cvAi.api';
import { useApiToast } from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

export default function CvAiHistoryPage() {
  const toast = useApiToast();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState(urlSearch);
  const [recommendation, setRecommendation] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadData({ search: urlSearch });
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
    if (urlSearch) loadData({ search: urlSearch });
  }, [urlSearch]);

  async function loadData(overrides = {}) {
    setLoading(true);
    try {
      const res = await cvAiAPI.getAll({
        search: overrides.search ?? search,
        recommendation,
        fromDate,
        toDate,
      });
      setRows(res.data || []);
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
      loadData();
    } catch (err) {
      toast.error(err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Historique des analyses de CV par IA</h1>
          <p>Rechercher et filtrer tous les CV analysés.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input className="form-input" placeholder="Rechercher candidat, compétence, titre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-select" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              <option value="">Toutes les recommandations</option>
              <option value="strong_match">Excellente correspondance</option>
              <option value="possible_match">Correspondance possible</option>
              <option value="weak_match">Faible correspondance</option>
            </select>
            <input className="form-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input className="form-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button className="btn btn-outline" onClick={loadData}>Appliquer</button>
          </div>
        </div>

        {loading ? (
          <div className="crud-loading"><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon="🗂️" title="Aucun enregistrement trouvé" description="Essayez d'ajuster les filtres ou d'analyser de nouveaux CV." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Titre du poste</th>
                  <th>Score</th>
                  <th>Recommandation</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.candidateName || 'Inconnu'}</td>
                    <td>{item.jobCriteria?.jobTitle || 'N/A'}</td>
                    <td>{item.analysisResult?.job_match_score || 0}%</td>
                    <td>
                      <Badge variant={item.analysisResult?.recommendation === 'strong_match' ? 'success' : item.analysisResult?.recommendation === 'weak_match' ? 'danger' : 'warning'}>
                        {item.analysisResult?.recommendation === 'strong_match' ? 'Excellente correspondance' : item.analysisResult?.recommendation === 'weak_match' ? 'Faible correspondance' : 'Correspondance possible'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={item.pipelineStatus === 'shortlisted' ? 'success' : item.pipelineStatus === 'rejected' ? 'danger' : 'warning'}>
                        {item.pipelineStatus === 'shortlisted' ? 'Sélectionné' : item.pipelineStatus === 'rejected' ? 'Rejeté' : 'En attente'}
                      </Badge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link className="btn btn-outline btn-sm" to={`/hr/cv-ai/${item.id}`}>Ouvrir</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
