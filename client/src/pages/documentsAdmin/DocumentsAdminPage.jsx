import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { documentsAdminAPI } from '../../api/documentsAdmin.api';
import { paieAPI } from '../../api/paie.api';
import { useApiToast } from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import './DocumentsAdminPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  attestation_travail: 'Attestation de travail',
  attestation_salaire: 'Attestation de salaire',
  fiche_paie: 'Fiche de paie',
  certificat_travail: 'Certificat de travail',
};

const TYPE_ICONS = {
  attestation_travail: '📋',
  attestation_salaire: '💰',
  fiche_paie: '💵',
  certificat_travail: '🎓',
};

const STATUS_LABELS = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
};

const STATUS_VARIANT = {
  en_attente: 'warning',
  acceptee: 'success',
  refusee: 'danger',
};

const TABS = [
  { key: '', label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'acceptee', label: 'Acceptées' },
  { key: 'refusee', label: 'Refusées' },
];

const EMPTY_FORM = { typeDocument: 'attestation_travail', description: '' };

const getDemandeId = (demande) => demande?.id || demande?._id || '';

// ── Document preview content ───────────────────────────────────────────────────

const formatDT = (amount) => {
  if (amount == null) return '—';
  return `${Number(amount).toFixed(2)} DT`;
};

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function buildDocumentContent(demande) {
  const emp = demande.employe || {};
  const usr = emp.utilisateur || {};
  const prenom = emp.prenom || usr.prenom || '';
  const nom = emp.nom || usr.nom || '';
  const employeNom = `${prenom} ${nom}`.trim() || '—';

  const poste = emp.poste || '—';
  const dateEmbauche = emp.dateEmbauche ? new Date(emp.dateEmbauche).toLocaleDateString('fr-FR') : '—';
  const salaireBase = emp.salaire_total || emp.salaire_base || 0;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const type = TYPE_LABELS[demande.typeDocument] || demande.typeDocument;

  return { employeNom, poste, today, type, dateEmbauche, salaireBase };
}

// ── Sub-component: Employee request card ──────────────────────────────────────

function EmployeeCard({ demande, onDownload, onDelete }) {
  const demandeId = getDemandeId(demande);

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

      <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {demande.status === 'acceptee' && (
          <button className="btn-download" onClick={() => onDownload(demande)}>
            ⬇ Télécharger
          </button>
        )}
        <button
          className="btn btn-sm btn-outline"
          onClick={() => {
            if (demandeId && window.confirm('Voulez-vous vraiment supprimer cette demande ?')) {
              onDelete(demandeId);
            }
          }}
          disabled={!demandeId}
          style={{ color: '#ef4444', borderColor: '#ef4444' }}
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}

// ── Sub-component: Admin request card ─────────────────────────────────────────

function AdminCard({ demande, onUpdateStatus, onDelete, onDownload }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(demande.commentaireAdmin || '');
  const [loading, setLoading] = useState(false);
  const demandeId = getDemandeId(demande);

  async function decide(status) {
    if (!demandeId) return;
    setLoading(true);
    await onUpdateStatus(demandeId, status, comment);
    setLoading(false);
    setOpen(false);
  }

  const emp = demande.employe || {};
  const usr = emp.utilisateur || {};
  const prenom = emp.prenom || usr.prenom || '';
  const nom = emp.nom || usr.nom || '';
  const employeeName = `${prenom} ${nom}`.trim() || 'Employé supprimé';
  const employeeInitial = (nom[0] || prenom[0] || '-').toUpperCase();
  const hasEmployee = Boolean(demande.employe && (prenom || nom));

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
          {employeeInitial}
        </div>
        <span>{employeeName}</span>
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

      <div className="doc-card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {demande.status === 'acceptee' && onDownload && (
          <button className="btn btn-sm btn-primary" onClick={() => onDownload(demande)}>
            🖨️ Imprimer / PDF
          </button>
        )}
        {demande.status === 'en_attente' && hasEmployee && (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setOpen((v) => !v)}
            disabled={!demandeId}
          >
            {open ? 'Annuler' : '✏️ Décider'}
          </button>
        )}
        <button
          className="btn btn-sm btn-outline"
          onClick={() => {
            if (demandeId && window.confirm('Voulez-vous vraiment supprimer cette demande ?')) {
              onDelete(demandeId);
            }
          }}
          disabled={!demandeId}
          style={{ color: '#ef4444', borderColor: '#ef4444' }}
        >
          🗑️ Supprimer
        </button>
      </div>

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
  const toast = useApiToast();
  const isAdmin = role === ROLES.ADMIN || role === ROLES.RH;

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [printItem, setPrintItem] = useState(null);

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
  }, [isAdmin, statusTab]);

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
    if (!id) {
      toast.error({ message: 'Identifiant de demande invalide.' });
      return;
    }

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

  // ── Admin / Employee: Delete request ───────────────────────────────────────
  async function handleDelete(id) {
    if (!id) {
      toast.error({ message: 'Identifiant de demande invalide.' });
      return;
    }

    try {
      if (isAdmin) {
        await documentsAdminAPI.delete(id);
      } else {
        await documentsAdminAPI.deleteMaDemande(id);
      }
      toast.success('Demande supprimée', 'La demande a été supprimée de l\'historique.');
      loadData();
    } catch (err) {
      toast.error(err);
    }
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
    const isFichePaie = printItem.typeDocument === 'fiche_paie';
    const [paieData, setPaieData] = useState(null);
    const [paieLoading, setPaieLoading] = useState(false);

    useEffect(() => {
      if (!isFichePaie || !printItem.employe) return;
      setPaieLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      paieAPI.getDocument({
        employeId: printItem.employe.id || printItem.employe._id,
        mois: currentMonth,
        annee: currentYear,
      })
        .then((res) => setPaieData(res.data))
        .catch(() => setPaieData(null))
        .finally(() => setPaieLoading(false));
    }, [printItem, isFichePaie]);

    const { employeNom, poste, today, type, dateEmbauche, salaireBase } = buildDocumentContent(printItem);

    const periodeLabel = isFichePaie && paieData
      ? `${MOIS_LABELS[paieData.mois] || ''} ${paieData.annee || ''}`
      : '';

    function getDocumentHtml() {
      let contentHtml = '';

      if (printItem.typeDocument === 'fiche_paie') {
        const pData = paieData || { salaire_base: salaireBase, total_heures_sup: 0, montant_heures_sup: 0, salaire_total: salaireBase, prix_heure_sup: 0 };
        contentHtml = `
          <div class="header-section">
            <div class="company-info">
              <h2>SOCIÉTÉ</h2>
              <p>Tunis, Tunisie</p>
            </div>
            <div class="doc-title-box">
              <h1>FICHE DE PAIE</h1>
              <p>Période : ${periodeLabel}</p>
            </div>
          </div>
          <div class="employee-info">
            <p><strong>Nom et prénom :</strong> ${employeNom}</p>
            <p><strong>Poste :</strong> ${poste}</p>
            <p><strong>Date d'embauche :</strong> ${dateEmbauche}</p>
          </div>
          <table class="paie-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Nombre / Base</th>
                <th>Taux</th>
                <th>Montant (DT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salaire de base</td>
                <td>1 mois</td>
                <td>-</td>
                <td>${formatDT(pData.salaire_base)}</td>
              </tr>
              <tr>
                <td>Heures supplémentaires</td>
                <td>${pData.total_heures_sup || 0} h</td>
                <td>${formatDT(pData.prix_heure_sup)}</td>
                <td>${formatDT(pData.montant_heures_sup)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Salaire Brut Total</td>
                <td>${formatDT(pData.salaire_total)}</td>
              </tr>
              <tr class="net-row">
                <td colspan="3"><strong>NET À PAYER</strong></td>
                <td><strong>${formatDT(pData.salaire_total)}</strong></td>
              </tr>
            </tbody>
          </table>
          <p class="mention">Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.</p>
        `;
      } else if (printItem.typeDocument === 'attestation_salaire') {
        contentHtml = `
          <div class="doc-title-box centered">
            <h1>ATTESTATION DE SALAIRE</h1>
          </div>
          <div class="attestation-body">
            <p>Nous soussignés, la direction de la société, attestons par la présente que :</p>
            <p class="highlight-name">Monsieur / Madame <strong>${employeNom}</strong></p>
            <p>Travaillant au sein de notre société en qualité de <strong>${poste}</strong>,</p>
            <p>Perçoit actuellement une rémunération mensuelle de base de :</p>
            <p class="salary-box"><strong>${formatDT(salaireBase)}</strong></p>
            <p>Cette attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit.</p>
          </div>
        `;
      } else if (printItem.typeDocument === 'attestation_travail') {
        contentHtml = `
          <div class="doc-title-box centered">
            <h1>ATTESTATION DE TRAVAIL</h1>
          </div>
          <div class="attestation-body">
            <p>Nous soussignés, la direction des ressources humaines de la société, attestons par la présente que :</p>
            <p class="highlight-name">Monsieur / Madame <strong>${employeNom}</strong></p>
            <p>Est régulièrement employé(e) au sein de notre entreprise depuis le <strong>${dateEmbauche}</strong>.</p>
            <p>Il/Elle occupe actuellement le poste de <strong>${poste}</strong>.</p>
            <p>Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>
          </div>
        `;
      } else if (printItem.typeDocument === 'certificat_travail') {
        contentHtml = `
          <div class="doc-title-box centered">
            <h1>CERTIFICAT DE TRAVAIL</h1>
          </div>
          <div class="attestation-body">
            <p>Nous soussignés, certifions par la présente que :</p>
            <p class="highlight-name">Monsieur / Madame <strong>${employeNom}</strong></p>
            <p>A été employé(e) dans notre société du <strong>${dateEmbauche}</strong> à ce jour.</p>
            <p>En qualité de <strong>${poste}</strong>.</p>
            <p>Il/Elle nous quitte libre de tout engagement envers notre société.</p>
            <p>Ce certificat est délivré à l'intéressé(e) pour faire valoir ce que de droit.</p>
          </div>
        `;
      } else {
        contentHtml = `<div class="doc-title-box centered"><h1>${type}</h1></div><p>Document non défini.</p>`;
      }

      return contentHtml;
    }

    function doPrint() {
      const w = window.open('', '_blank');
      w.document.write(`
        <html><head><title>${type}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 60px; color: #1f2937; line-height: 1.6; }
          .header-section { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info h2 { margin: 0; color: #111827; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .company-info p { margin: 2px 0; color: #6b7280; font-size: 14px; }
          .doc-title-box { text-align: right; }
          .doc-title-box.centered { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; margin-top: 20px; }
          .doc-title-box h1 { margin: 0; color: #4f46e5; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
          .doc-title-box p { margin: 5px 0 0; font-weight: 600; color: #374151; }
          
          .employee-info { margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .employee-info p { margin: 5px 0; font-size: 14px; }
          
          .paie-table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
          .paie-table th { background: #4f46e5; color: white; padding: 10px; text-align: left; }
          .paie-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .paie-table .total-row td { font-weight: bold; background: #f3f4f6; border-top: 2px solid #d1d5db; }
          .paie-table .net-row td { font-weight: bold; background: #ecfdf5; color: #059669; font-size: 16px; border-top: 2px solid #059669; }
          .mention { font-size: 12px; color: #6b7280; margin-top: 30px; font-style: italic; }
          
          .attestation-body { font-size: 16px; margin: 40px 0; line-height: 1.8; text-align: justify; }
          .attestation-body .highlight-name { font-size: 20px; text-align: center; margin: 30px 0; color: #111827; }
          .attestation-body .salary-box { text-align: center; font-size: 24px; color: #4f46e5; margin: 20px 0; padding: 15px; background: #f5f3ff; border-radius: 8px; border: 1px dashed #4f46e5; }
          
          .signature-section { margin-top: 80px; display: flex; justify-content: flex-end; }
          .signature-box { text-align: center; width: 250px; }
          .signature-box .date { margin-bottom: 20px; font-style: italic; }
          .signature-box .cachet { height: 100px; border-bottom: 1px solid #000; margin-top: 10px; }
        </style>
        </head><body>
          
          <div class="content-wrapper">
            ${getDocumentHtml()}
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <p class="date">Fait à Tunis, le ${today}</p>
              <p><strong>La Direction des Ressources Humaines</strong></p>
              <p>Signature & Cachet</p>
              <div class="cachet"></div>
            </div>
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
        <div className="doc-print-body" style={{ padding: '1rem', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1f2937' }}>
          {paieLoading && isFichePaie ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Chargement des données de paie...</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: getDocumentHtml() }} />
          )}
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
                <EmployeeCard
                  key={getDemandeId(d) || `${d.typeDocument}-${d.createdAt}`}
                  demande={d}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
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
                  key={getDemandeId(d) || `${d.typeDocument}-${d.createdAt}`}
                  demande={d}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
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
