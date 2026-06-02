import { useState, useEffect, useContext, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { paieAPI, postesAPI, affectationsAPI } from '../../api/paie.api';

import { employesAPI } from '../../api/employes.api';
import { useApiToast } from '../../components/common/Toast';
import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import './PaiePage.css';

const MOIS_LABELS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const formatDT = (v) => v == null ? '—' : `${Number(v).toFixed(2)} DT`;
const now = new Date();

export default function PaiePage() {
  const { role } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const isAdmin = role === ROLES.ADMIN || role === ROLES.RH;
  return isAdmin ? <AdminPaieView externalSearch={urlSearch} /> : <EmployeePaieView />;
}

// ══════════════════════════════════════════════════
// ADMIN VIEW
// ══════════════════════════════════════════════════
function AdminPaieView({ externalSearch = '' }) {
  const toast = useApiToast();
  const [tab, setTab] = useState('paies');
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [paies, setPaies] = useState([]);
  const [paieSearch, setPaieSearch] = useState(externalSearch);
  const [postes, setPostes] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [employes, setEmployes] = useState([]);

  const [showPosteForm, setShowPosteForm] = useState(false);
  const [posteForm, setPosteForm] = useState({ nom_poste: '', salaire_base: '', prix_heure_sup: '' });
  const [editingPosteId, setEditingPosteId] = useState(null);
  const [editingPosteData, setEditingPosteData] = useState({ salaire_base: '', prix_heure_sup: '' });
  const [showAffForm, setShowAffForm] = useState(false);
  const [affForm, setAffForm] = useState({ employeId: '', posteId: '', date_debut: '' });

  const loadPaies = useCallback(async () => {
    setLoading(true);
    try { const r = await paieAPI.getAll({ mois, annee }); setPaies(r.data || []); }
    catch (e) { toast.error(e); } finally { setLoading(false); }
  }, [mois, annee]);

  const loadPostes = useCallback(async () => {
    setLoading(true);
    try { const r = await postesAPI.getAll(); setPostes(r.data || []); }
    catch (e) { toast.error(e); } finally { setLoading(false); }
  }, []);

  const loadAffectations = useCallback(async () => {
    setLoading(true);
    try {
      const [aR, eR, pR] = await Promise.all([affectationsAPI.getAll(), employesAPI.getAll(), postesAPI.getAll()]);
      setAffectations(aR.data || []); setEmployes(eR.data || []); setPostes(pR.data || []);
    } catch (e) { toast.error(e); } finally { setLoading(false); }
  }, []);



  useEffect(() => {
    if (tab === 'paies') loadPaies();
    else if (tab === 'postes') loadPostes();
    else if (tab === 'affectations') loadAffectations();
  }, [tab, loadPaies, loadPostes, loadAffectations]);

  useEffect(() => {
    setPaieSearch(externalSearch);
    if (externalSearch) setTab('paies');
  }, [externalSearch]);



  // ── Sync from existing employees ──────────────────
  async function handleSync() {
    setSyncing(true);
    try {
      const r = await affectationsAPI.syncFromEmployes();
      const { created = [], skipped = [] } = r.data || {};
      toast.success('Synchronisation terminée',
        `✅ ${created.length} affectation(s) créée(s), ${skipped.length} déjà existante(s).`);
      loadAffectations();
    } catch (e) { toast.error(e); }
    finally { setSyncing(false); }
  }

  async function handleCreatePoste(e) {
    e.preventDefault();
    try {
      await postesAPI.create({ nom_poste: posteForm.nom_poste, salaire_base: Number(posteForm.salaire_base), prix_heure_sup: Number(posteForm.prix_heure_sup) });
      toast.success('Poste créé'); setShowPosteForm(false); setPosteForm({ nom_poste: '', salaire_base: '', prix_heure_sup: '' }); loadPostes();
    } catch (e) { toast.error(e); }
  }

  async function handleDeletePoste(id) {
    if (!window.confirm('Supprimer ce poste ?')) return;
    try { await postesAPI.delete(id); toast.success('Supprimé'); loadPostes(); } catch (e) { toast.error(e); }
  }

  async function handleSavePoste(id) {
    try {
      await postesAPI.update(id, {
        salaire_base: Number(editingPosteData.salaire_base),
        prix_heure_sup: Number(editingPosteData.prix_heure_sup),
      });
      toast.success('Poste mis à jour', 'Les montants ont été enregistrés.');
      setEditingPosteId(null);
      loadPostes();
    } catch (e) { toast.error(e); }
  }

  async function handleCreateAffectation(e) {
    e.preventDefault();
    try {
      await affectationsAPI.create({ employeId: affForm.employeId, posteId: affForm.posteId, date_debut: affForm.date_debut });
      toast.success('Affectation créée'); setShowAffForm(false); setAffForm({ employeId: '', posteId: '', date_debut: '' }); loadAffectations();
    } catch (e) { toast.error(e); }
  }

  async function handleDeleteAffectation(id) {
    if (!window.confirm('Supprimer cette affectation ?')) return;
    try { await affectationsAPI.delete(id); toast.success('Supprimé'); loadAffectations(); } catch (e) { toast.error(e); }
  }

  const searchValue = paieSearch.trim().toLowerCase();
  const filteredPaies = searchValue
    ? paies.filter((p) => {
        const emp = p.employe || {};
        const searchable = [
          emp.nom,
          emp.prenom,
          emp.utilisateur?.email,
          p.poste,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(searchValue);
      })
    : paies;
  const totalSalaires = filteredPaies.reduce((s, p) => s + (p.salaire_total || 0), 0);
  const totalHS = filteredPaies.reduce((s, p) => s + (p.total_heures_sup || 0), 0);

  return (
    <div>
      {/* Hero */}
      <div className="paie-hero">
        <div><h1>Gestion de Paie</h1><p>Consultez les fiches calculees depuis les postes, affectations et heures supplementaires.</p></div>
        <div className="paie-hero-icon">💰</div>
      </div>

      {/* Tabs */}
      <div className="paie-tabs">
        {[['paies','💰 Fiches de paie'],['postes','🏷️ Postes'],['affectations','🔗 Affectations']].map(([k,l]) => (
          <button key={k} className={`paie-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── TAB: Fiches de paie ─────────────────────── */}
      {tab === 'paies' && <>
        <div className="paie-action-bar">
          <div className="form-group"><label>Mois</label>
            <select value={mois} onChange={e => setMois(Number(e.target.value))}>
              {MOIS_LABELS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Année</label>
            <select value={annee} onChange={e => setAnnee(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Employé</label>
            <input
              type="text"
              value={paieSearch}
              onChange={e => setPaieSearch(e.target.value)}
              placeholder="Nom, prénom ou email..."
            />
          </div>
        </div>

        <div className="paie-stats">
          {[['purple','👥','Employés',filteredPaies.length],['green','💰','Total salaires',formatDT(totalSalaires)],
            ['blue','⏰','Total heures sup',totalHS+'h'],['orange','📅','Période',MOIS_LABELS[mois]+' '+annee]
          ].map(([c,ic,l,v]) => (
            <div key={l} className="paie-stat-card">
              <div className={`paie-stat-icon ${c}`}>{ic}</div>
              <div className="paie-stat-info"><h3>{l}</h3><p>{v}</p></div>
            </div>
          ))}
        </div>

        {loading ? <div className="paie-loading"><div className="spinner"/></div>
        : paies.length === 0 ? (
          <div className="paie-empty">
            <div className="paie-empty-icon">📭</div>
            <h3>Aucune fiche de paie</h3>
            <p>Aucune fiche calculable pour cette periode. Verifiez les affectations et les postes.</p>
          </div>
        ) : filteredPaies.length === 0 ? (
          <div className="paie-empty">
            <div className="paie-empty-icon">🔍</div>
            <h3>Aucun employé trouvé</h3>
            <p>Essayez avec un autre nom, prénom, email ou poste.</p>
          </div>
        ) : (
          <div className="paie-table-container">
            <div className="paie-table-header"><h2>Fiches de paie calculees — {MOIS_LABELS[mois]} {annee}</h2><span>{filteredPaies.length} / {paies.length} fiche(s)</span></div>
            <table className="paie-table">
              <thead><tr><th>Employé</th><th>Poste</th><th>Salaire base</th><th>Heures sup</th><th>Montant HS</th><th>Salaire total</th></tr></thead>
              <tbody>
                {filteredPaies.map(p => {
                  const emp = p.employe;
                  return (
                    <tr key={p.id}>
                      <td><div className="paie-employee-cell">
                        <div className="paie-avatar">{(emp?.nom?.[0]||'?').toUpperCase()}</div>
                        <div><div className="paie-employee-name">{emp?.prenom} {emp?.nom}</div><div className="paie-employee-email">{emp?.utilisateur?.email}</div></div>
                      </div></td>
                      <td><span className="paie-badge">{p.poste||'—'}</span></td>
                      <td>{formatDT(p.salaire_base)}</td>
                      <td>{p.total_heures_sup||0}h</td>
                      <td>{formatDT(p.montant_heures_sup)}</td>
                      <td><span className="paie-salary-total">{formatDT(p.salaire_total)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>}

      {/* ── TAB: Postes ─────────────────────────────── */}
      {tab === 'postes' && <div className="paie-section">
        <div className="paie-section-header">
          <h2>🏷️ Gestion des Postes</h2>
          <button className="btn-generate" onClick={() => setShowPosteForm(!showPosteForm)}>
            {showPosteForm ? '✕ Annuler' : '+ Nouveau poste'}
          </button>
        </div>

        {showPosteForm && (
          <div className="paie-form-card">
            <h2>Créer un poste</h2>
            <form onSubmit={handleCreatePoste}>
              <div className="paie-form-grid">
                <div className="form-group">
                  <label className="form-label form-label-required">Nom du poste</label>
                  <input className="form-input" value={posteForm.nom_poste} onChange={e => setPosteForm({...posteForm, nom_poste:e.target.value})} placeholder="ex: Développeur Senior" required/>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Salaire de base (DT)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={posteForm.salaire_base} onChange={e => setPosteForm({...posteForm, salaire_base:e.target.value})} placeholder="ex: 2500" required/>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Prix heure sup (DT)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={posteForm.prix_heure_sup} onChange={e => setPosteForm({...posteForm, prix_heure_sup:e.target.value})} placeholder="ex: 25" required/>
                </div>
              </div>
              <div style={{marginTop:'1rem',display:'flex',justifyContent:'flex-end'}}>
                <button type="submit" className="btn-generate">💾 Enregistrer</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div className="paie-loading"><div className="spinner"/></div>
        : postes.length === 0 ? (
          <div className="paie-empty"><div className="paie-empty-icon">🏷️</div><h3>Aucun poste</h3><p>Créez un poste pour commencer.</p></div>
        ) : (
          <div className="paie-table-container">
            <div className="paie-table-header"><h2>Liste des postes</h2><span>{postes.length} poste(s)</span></div>
            <table className="paie-table">
              <thead><tr><th>Nom du poste</th><th>Salaire de base</th><th>Prix heure sup</th><th>Actions</th></tr></thead>
              <tbody>
                {postes.map(p => {
                  const isEditing = editingPosteId === p.id;
                  return (
                    <tr key={p.id}>
                      <td><span className="paie-badge">{p.nom_poste}</span></td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number" min="0" step="0.01"
                            value={editingPosteData.salaire_base}
                            onChange={e => setEditingPosteData({...editingPosteData, salaire_base: e.target.value})}
                            style={{width:'110px',padding:'0.3rem 0.5rem',borderRadius:'6px',border:'1.5px solid #7c3aed',fontSize:'0.85rem'}}
                          />
                        ) : formatDT(p.salaire_base)}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number" min="0" step="0.01"
                            value={editingPosteData.prix_heure_sup}
                            onChange={e => setEditingPosteData({...editingPosteData, prix_heure_sup: e.target.value})}
                            style={{width:'100px',padding:'0.3rem 0.5rem',borderRadius:'6px',border:'1.5px solid #7c3aed',fontSize:'0.85rem'}}
                          />
                        ) : formatDT(p.prix_heure_sup)}
                      </td>
                      <td style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSavePoste(p.id)}
                              style={{fontSize:'0.75rem',padding:'0.3rem 0.7rem',borderRadius:'6px',border:'none',background:'#059669',color:'#fff',cursor:'pointer'}}
                            >💾 Enregistrer</button>
                            <button
                              onClick={() => setEditingPosteId(null)}
                              style={{fontSize:'0.75rem',padding:'0.3rem 0.7rem',borderRadius:'6px',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer'}}
                            >✕ Annuler</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingPosteId(p.id); setEditingPosteData({ salaire_base: p.salaire_base, prix_heure_sup: p.prix_heure_sup }); }}
                              style={{fontSize:'0.75rem',padding:'0.3rem 0.7rem',borderRadius:'6px',border:'none',background:'#7c3aed',color:'#fff',cursor:'pointer'}}
                            >✏️ Modifier</button>
                            <button
                              onClick={() => handleDeletePoste(p.id)}
                              style={{fontSize:'0.75rem',padding:'0.3rem 0.7rem',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer'}}
                            >🗑️ Supprimer</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* ── TAB: Affectations ───────────────────────── */}
      {tab === 'affectations' && <div className="paie-section">
        <div className="paie-section-header">
          <h2>🔗 Affectations Employé ↔ Poste</h2>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {/* SYNC BUTTON */}
            <button
              className="btn-generate"
              onClick={handleSync}
              disabled={syncing}
              style={{background:'linear-gradient(135deg,#0ea5e9,#6366f1)',fontSize:'0.85rem'}}
              title="Lit les postes existants des employés et crée automatiquement les affectations manquantes"
            >
              {syncing ? '⏳ Sync...' : '🔄 Sync depuis employés'}
            </button>
            <button className="btn-generate" onClick={() => setShowAffForm(!showAffForm)}>
              {showAffForm ? '✕ Annuler' : '+ Nouvelle affectation'}
            </button>
          </div>
        </div>

        {/* Sync explanation banner */}
        <div style={{background:'rgba(99,102,241,0.06)',border:'1.5px solid rgba(99,102,241,0.2)',borderRadius:'10px',padding:'0.75rem 1rem',marginBottom:'1rem',fontSize:'0.85rem',color:'var(--gray-500)'}}>
          💡 <strong>Sync automatique</strong> — Lit le champ <code>poste</code> de chaque employé existant, crée le Poste correspondant (avec salaire 0 DT à ajuster), et crée l'affectation. Les employés déjà affectés sont ignorés.
        </div>

        {showAffForm && (
          <div className="paie-form-card">
            <h2>Affecter un employé à un poste</h2>
            <form onSubmit={handleCreateAffectation}>
              <div className="paie-form-grid">
                <div className="form-group">
                  <label className="form-label form-label-required">Employé</label>
                  <select className="form-select" value={affForm.employeId} onChange={e => setAffForm({...affForm,employeId:e.target.value})} required>
                    <option value="">— Sélectionner —</option>
                    {employes.map(emp => <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Poste</label>
                  <select className="form-select" value={affForm.posteId} onChange={e => setAffForm({...affForm,posteId:e.target.value})} required>
                    <option value="">— Sélectionner —</option>
                    {postes.map(p => <option key={p.id} value={p.id}>{p.nom_poste} ({formatDT(p.salaire_base)})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Date de début</label>
                  <input className="form-input" type="date" value={affForm.date_debut} onChange={e => setAffForm({...affForm,date_debut:e.target.value})} required/>
                </div>
              </div>
              <div style={{marginTop:'1rem',display:'flex',justifyContent:'flex-end'}}>
                <button type="submit" className="btn-generate">💾 Affecter</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div className="paie-loading"><div className="spinner"/></div>
        : affectations.length === 0 ? (
          <div className="paie-empty">
            <div className="paie-empty-icon">🔗</div>
            <h3>Aucune affectation</h3>
            <p>Cliquez sur <strong>🔄 Sync depuis employés</strong> pour importer automatiquement les postes existants.</p>
          </div>
        ) : (
          <div className="paie-table-container">
            <div className="paie-table-header"><h2>Affectations</h2><span>{affectations.length} affectation(s)</span></div>
            <table className="paie-table">
              <thead><tr><th>Employé</th><th>Poste</th><th>Salaire base</th><th>Prix HS</th><th>Date début</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {affectations.map(a => {
                  const emp = a.employe;
                  const isActive = !a.date_fin;
                  return (
                    <tr key={a.id}>
                      <td><div className="paie-employee-cell">
                        <div className="paie-avatar">{(emp?.nom?.[0]||'?').toUpperCase()}</div>
                        <div><div className="paie-employee-name">{emp?.prenom} {emp?.nom}</div><div className="paie-employee-email">{emp?.utilisateur?.email}</div></div>
                      </div></td>
                      <td><span className="paie-badge">{a.poste?.nom_poste||'—'}</span></td>
                      <td>{formatDT(a.poste?.salaire_base)}</td>
                      <td>{formatDT(a.poste?.prix_heure_sup)}</td>
                      <td>{new Date(a.date_debut).toLocaleDateString('fr-FR')}</td>
                      <td><span className="paie-badge" style={{background:isActive?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',color:isActive?'#059669':'#ef4444'}}>{isActive?'✅ Actif':'⛔ Terminé'}</span></td>
                      <td><button onClick={() => handleDeleteAffectation(a.id)} style={{fontSize:'0.75rem',padding:'0.3rem 0.7rem',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer'}}>🗑️</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>}


    </div>
  );
}

// ══════════════════════════════════════════════════
// EMPLOYEE VIEW
// ══════════════════════════════════════════════════
function EmployeePaieView() {
  const toast = useApiToast();
  const [paies, setPaies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(now.getFullYear());

  const loadMesPaies = useCallback(() => {
    setLoading(true);
    paieAPI.getMesPaies({ annee })
      .then(r => setPaies(r.data || []))
      .catch(e => toast.error(e))
      .finally(() => setLoading(false));
  }, [annee]);

  useEffect(() => {
    loadMesPaies();
  }, [loadMesPaies]);

  if (loading) return <div className="paie-loading"><div className="spinner"/></div>;

  return (
    <div>
      <div className="paie-hero">
        <div><h1>Mes Fiches de Paie</h1><p>Consultez vos salaires calcules depuis votre poste et vos heures supplementaires.</p></div>
        <div className="paie-hero-icon">💵</div>
      </div>

      <div className="paie-action-bar">
        <div className="form-group"><label>Annee</label>
          <select value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {paies.length === 0 ? (
        <div className="paie-empty">
          <div className="paie-empty-icon">📭</div>
          <h3>Aucune fiche de paie</h3>
          <p>Aucune fiche calculable pour cette annee. Verifiez votre affectation de poste.</p>
        </div>
      ) : (
        <div className="paie-cards-grid">
          {paies.map(p => (
            <div key={p.id} className="paie-card">
              <div className="paie-card-header">
                <span className="paie-card-month">📅 {MOIS_LABELS[p.mois]} {p.annee}</span>
                <span className="paie-card-total">{formatDT(p.salaire_total)}</span>
              </div>
              <div className="paie-card-details">
                {[['Poste', p.poste||'—'],['Salaire de base',formatDT(p.salaire_base)],
                  ['Heures supplémentaires',(p.total_heures_sup||0)+'h'],['Prix/heure sup',formatDT(p.prix_heure_sup)],
                  ['Montant heures sup',formatDT(p.montant_heures_sup)]].map(([l,v]) => (
                  <div key={l} className="paie-card-row">
                    <span className="paie-card-label">{l}</span>
                    <span className="paie-card-value">{v}</span>
                  </div>
                ))}
                <div className="paie-card-row" style={{borderBottom:'none',paddingTop:'0.5rem'}}>
                  <span className="paie-card-label" style={{fontWeight:700}}>💰 Salaire total</span>
                  <span className="paie-card-value" style={{color:'#059669',fontSize:'1.1rem'}}>{formatDT(p.salaire_total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
