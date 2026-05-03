import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { documentsAdminAPI } from '../../api/documentsAdmin.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import './DocumentsAdminPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  attestation_travail:  'Attestation de travail',
  attestation_salaire:  'Attestation de salaire',
  fiche_paie:           'Fiche de paie',
  certificat_travail:   'Certificat de travail',
};

const TYPE_ICONS = {
  attestation_travail:  '📋',
  attestation_salaire:  '💰',
  fiche_paie:           '💵',
  certificat_travail:   '🎓',
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  acceptee:   'Acceptée',
  refusee:    'Refusée',
};

const STATUS_VARIANT = {
  en_attente: 'warning',
  acceptee:   'success',
  refusee:    'danger',
};

const TABS = [
  { key: '',           label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'acceptee',   label: 'Acceptées' },
  { key: 'refusee',    label: 'Refusées' },
];

const EMPTY_FORM = { typeDocument: 'attestation_travail', description: '' };

// ── Document preview content ───────────────────────────────────────────────────

function buildDocumentContent(demande) {
  const employeNom = `${demande.employe?.utilisateur?.prenom || ''} ${demande.employe?.utilisateur?.nom || ''}`.trim();
  const poste = demande.employe?.poste || '—';
  const dept  = demande.employe?.departement || '—';
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const type  = TYPE_LABELS[demande.typeDocument] || demande.typeDocument;

  return { employeNom, poste, dept, today, type };
}

// ── Sub-component: Employee request card ──────────────────────────────────────

function EmployeeCard({ demande, onDownload }) {
  return (
    <div className="doc-card" data-status={demande.status}>
      <div className="doc-card-header">
        <div className="doc-card-type">
          <div className="doc-card-type-icon">{TYPE_ICONS[demande.typeDocument] || '📄'}</div>
          <div className="doc-card-type-name">{TYPE_LABELS[demande.typeDocument]}</div>
        </div>
        <Badge variant={STATUS_VARIANT[demande.status]}>{STATUS_LABELS[demande.status]}</Badge>
      </div>

      {demande.description && (
        <div className="doc-card-description">{demande.description}</div>
      )}

      <div className="doc-card-date" style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
        📅 Soumise le {formatDate(demande.createdAt)}
      </div>

      {demande.commentaireAdmin && (
        <div className="doc-card-comment">
          <strong>Réponse RH / Admin</strong>
          {demande.commentaireAdmin}
        </div>
      )}

      {demande.status === 'acceptee' && (
        <div className="doc-card-actions">
          <button className="btn-download" onClick={() => onDownload(demande)}>
            ⬇ Télécharger
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Admin request card ─────────────────────────────────────────

function AdminCard({ demande, onUpdateStatus }) {
  const [open, setOpen]       = useState(false);
  const [comment, setComment] = useState(demande.commentaireAdmin || '');
  const [loading, setLoading] = useState(false);

  async function decide(status) {
    setLoading(true);
    await onUpdateStatus(demande.id, status, comment);
    setLoading(false);
    setOpen(false);
  }

  const emp = demande.employe?.utilisateur;

  return (
    <div className="doc-card" data-status={demande.status}>
      <div className="doc-card-header">
        <div className="doc-card-type">
          <div className="doc-card-type-icon">{TYPE_ICONS[demande.typeDocument] || '📄'}</div>
          <div className="doc-card-type-name">{TYPE_LABELS[demande.typeDocument]}</div>
        </div>
        <Badge variant={STATUS_VARIANT[demande.status]}>{STATUS_LABELS[demande.status]}</Badge>
      </div>

      <div className="doc-card-employee">
        <div className="avatar avatar-sm">
          {(emp?.nom?.[0] || '?').toUpperCase()}
        </div>
        <span>{emp?.prenom} {emp?.nom}</span>
      </div>

      {demande.description && (
        <div className="doc-card-description">{demande.description}</div>
      )}

      <div className="doc-card-date" style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
        📅 {formatDate(demande.createdAt)}
      </div>

      {demande.commentaireAdmin && !open && (
        <div className="doc-card-comment">
          <strong>Commentaire</strong>
          {demande.commentaireAdmin}
        </div>
      )}

      {demande.status === 'en_attente' && (
        <div className="doc-card-actions">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Annuler' : '✏️ Décider'}
          </button>
        </div>
      )}

      {open && (
        <div className="doc-decision-panel">
          <label>Commentaire (optionnel)</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire de réponse…"
            style={{ fontSize: 'var(--text-xs)' }}
          />
          <div className="doc-decision-btns">
            <button
              className="btn btn-sm btn-primary"
              disabled={loading}
              onClick={() => decide('acceptee')}
            >
              ✅ Accepter
            </button>
            <button
              className="btn btn-sm btn-danger"
              disabled={loading}
              onClick={() => decide('refusee')}
            >
              ❌ Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DocumentsAdminPage() {
  const { role } = useContext(AuthContext);
  const toast    = useApiToast();
  const isAdmin  = role === ROLES.ADMIN || role === ROLES.RH;

  const [demandes,    setDemandes]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [statusTab,   setStatusTab]   = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [printItem,   setPrintItem]   = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        res = await documentsAdminAPI.getAll({ status: statusTab || undefined });
      } else {
        res = await documentsAdminAPI.getMesDemandes();
      }
      setDemandes(res.data || []);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, statusTab]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  // ── Employee: submit form ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.typeDocument) return;
    setFormLoading(true);
    try {
      await documentsAdminAPI.create(form);
      toast.success('Demande envoyée', 'Votre demande a été soumise avec succès.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setFormLoading(false);
    }
  }

  // ── Admin: update status ───────────────────────────────────────────────────
  async function handleUpdateStatus(id, status, commentaireAdmin) {
    try {
      await documentsAdminAPI.updateStatut(id, { status, commentaireAdmin });
      toast.success('Statut mis à jour', `La demande a été ${status === 'acceptee' ? 'acceptée' : 'refusée'}.`);
      loadData();
    } catch (err) {
      toast.error(err);
    }
  }

  // ── Employee: "download" — opens print preview modal ──────────────────────
  function handleDownload(demande) {
    setPrintItem(demande);
  }

  // ── Tab counts (admin only) ────────────────────────────────────────────────
  function tabCount(key) {
    if (!key) return demandes.length;
    return demandes.filter((d) => d.status === key).length;
  }

  // ── Filtered list for admin tabs (employee sees all own) ──────────────────
  const displayed = isAdmin && statusTab
    ? demandes.filter((d) => d.status === statusTab)
    : demandes;

  // ── Print modal content ────────────────────────────────────────────────────
  function PrintModal() {
    if (!printItem) return null;
    const { employeNom, poste, dept, today, type } = buildDocumentContent(printItem);

    function doPrint() {
      const w = window.open('', '_blank');
      w.document.write(`
        <html><head><title>${type}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 60px; color: #1f2937; }
          h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; }
          table { border-collapse: collapse; width: 100%; margin: 24px 0; }
          td { padding: 8px 12px; border: 1px solid #e5e7eb; }
          td:first-child { font-weight: 600; width: 40%; background: #f9fafb; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
          .signature { text-align: right; margin-top: 80px; }
        </style>
        </head><body>
        <h1>${type}</h1>
        <p>L'entreprise certifie que :</p>
        <table>
          <tr><td>Nom et prénom</td><td>${employeNom}</td></tr>
          <tr><td>Poste occupé</td><td>${poste}</td></tr>
          <tr><td>Département</td><td>${dept}</td></tr>
          <tr><td>Type de document</td><td>${type}</td></tr>
          <tr><td>Date de délivrance</td><td>${today}</td></tr>
        </table>
        <p>Ce document est délivré à l'intéressé(e) pour servir et valoir ce que de droit.</p>
        <div class="signature">
          <p>Fait le ${today}</p>
          <br/><br/>
          <p>Signature &amp; Cachet</p>
          <p>____________________</p>
        </div>
        </body></html>
      `);
      w.document.close();
      w.print();
    }

    return (
      <Modal
        isOpen={!!printItem}
        onClose={() => setPrintItem(null)}
        title={`Document : ${type}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setPrintItem(null)}>Fermer</button>
            <button className="btn btn-primary" onClick={doPrint}>🖨️ Imprimer / Enregistrer PDF</button>
          </>
        }
      >
        <div className="doc-print-body">
          <div className="doc-print-title">{type}</div>
          <p>L'entreprise certifie que :</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <tbody>
              {[
                ['Nom et prénom', employeNom],
                ['Poste occupé', poste],
                ['Département', dept],
                ['Type de document', type],
                ['Date de délivrance', today],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '6px 10px', border: '1px solid var(--border-color)', background: 'var(--gray-50)', fontWeight: 600, width: '40%' }}>{k}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid var(--border-color)' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
            Ce document est délivré à l'intéressé(e) pour servir et valoir ce que de droit.
          </p>
        </div>
      </Modal>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="doc-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="doc-hero">
        <div className="doc-hero-info">
          <h1>Documents Administratifs</h1>
          <p>
            {isAdmin
              ? 'Gérez et traitez les demandes de documents des employés.'
              : 'Faites une demande de document administratif en quelques clics.'}
          </p>
        </div>
        <div className="doc-hero-icon">📂</div>
      </div>

      {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────── */}
      {!isAdmin && (
        <>
          {/* Request form card */}
          <div className="doc-form-card">
            <h2>📝 Nouvelle demande</h2>
            <form onSubmit={handleSubmit}>
              <div className="doc-form-grid">
                <div className="form-group">
                  <label className="form-label form-label-required">Type de document</label>
                  <select
                    id="typeDocument"
                    className="form-select"
                    value={form.typeDocument}
                    onChange={(e) => setForm({ ...form, typeDocument: e.target.value })}
                    required
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    value={new Date().toLocaleDateString('fr-FR')}
                    readOnly
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Description (optionnelle)</label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    rows={3}
                    placeholder="Précisez vos besoins si nécessaire…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  id="btn-envoyer-demande"
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Envoi…' : '📤 Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>

          {/* History */}
          <div className="doc-section-header">
            <h2>🗂️ Historique de mes demandes</h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>
              {demandes.length} demande{demandes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {demandes.length === 0 ? (
            <div className="doc-empty">
              <div className="doc-empty-icon">📭</div>
              <h3>Aucune demande</h3>
              <p>Vous n'avez encore soumis aucune demande de document.</p>
            </div>
          ) : (
            <div className="doc-cards-grid">
              {demandes.map((d) => (
                <EmployeeCard key={d.id} demande={d} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ADMIN / RH VIEW ───────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Filter tabs */}
          <div className="doc-filter-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                id={`tab-${tab.key || 'all'}`}
                className={`doc-filter-tab ${statusTab === tab.key ? 'active' : ''}`}
                onClick={() => setStatusTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">{tabCount(tab.key)}</span>
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="doc-section-header">
            <h2>
              {statusTab ? STATUS_LABELS[statusTab] : 'Toutes les demandes'}
            </h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)' }}>
              {displayed.length} demande{displayed.length !== 1 ? 's' : ''}
            </span>
          </div>

          {displayed.length === 0 ? (
            <div className="doc-empty">
              <div className="doc-empty-icon">📭</div>
              <h3>Aucune demande</h3>
              <p>Il n'y a aucune demande{statusTab ? ` ${STATUS_LABELS[statusTab].toLowerCase()}` : ''} pour le moment.</p>
            </div>
          ) : (
            <div className="doc-cards-grid">
              {displayed.map((d) => (
                <AdminCard
                  key={d.id}
                  demande={d}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Print/Download modal */}
      <PrintModal />
    </div>
  );
}
