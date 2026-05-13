import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cvAiAPI } from '../../api/cvAi.api';
import { useApiToast } from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

export default function CvAiHistoryPage() {
  const toast = useApiToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await cvAiAPI.getAll({ search, recommendation, fromDate, toDate });
      setRows(res.data || []);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this CV analysis?')) return;
    try {
      await cvAiAPI.delete(id);
      toast.success('Deleted', 'Analysis deleted successfully.');
      loadData();
    } catch (err) {
      toast.error(err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI CV Analysis History</h1>
          <p>Search and filter all analyzed CVs.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <input className="form-input" placeholder="Search candidate, skill, title..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-select" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              <option value="">All recommendations</option>
              <option value="strong_match">Strong match</option>
              <option value="possible_match">Possible match</option>
              <option value="weak_match">Weak match</option>
            </select>
            <input className="form-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input className="form-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button className="btn btn-outline" onClick={loadData}>Apply</button>
          </div>
        </div>

        {loading ? (
          <div className="crud-loading"><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon="🗂️" title="No records found" description="Try adjusting filters or analyze new CVs." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Score</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.candidateName || 'Unknown'}</td>
                    <td>{item.jobCriteria?.jobTitle || 'N/A'}</td>
                    <td>{item.analysisResult?.job_match_score || 0}%</td>
                    <td>
                      <Badge variant={item.analysisResult?.recommendation === 'strong_match' ? 'success' : item.analysisResult?.recommendation === 'weak_match' ? 'danger' : 'warning'}>
                        {item.analysisResult?.recommendation || 'possible_match'}
                      </Badge>
                    </td>
                    <td><Badge variant="info">{item.pipelineStatus}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <Link className="btn btn-outline btn-sm" to={`/hr/cv-ai/${item.id}`}>Open</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
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
