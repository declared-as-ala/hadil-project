import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { messagesAPI } from '../../api/messages.api';
import { employesAPI } from '../../api/employes.api';
import { useAuth } from '../../hooks/useAuth';
import { useApiToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { formatDate, relativeTime } from '../../utils/formatters';
import '../CrudPage.css';
import './Messages.css';

export default function MessagesPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const toast = useApiToast();
  const [messages, setMessages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('inbox'); // 'inbox' | 'sent'
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ destinataireId: '', message: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => { loadData(); }, [view]);

  async function loadData() {
    setLoading(true);
    try {
      // Messages store Employe IDs — only pass the filter when we have a real ID
      const employeeId = user?.employeeId;
      const isValidId = (v) => v && v !== 'null' && v !== 'undefined';

      const msgParams = isValidId(employeeId)
        ? (view === 'inbox' ? { destinataireId: employeeId } : { expediteurId: employeeId })
        : {}; // admin with no employee record: load all messages

      const [mRes, eRes] = await Promise.all([
        messagesAPI.getAll(msgParams),
        employesAPI.getAll(),
      ]);
      setMessages(mRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleSend(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await messagesAPI.send(form);
      toast.success('Sent', 'Message has been sent.');
      setShowForm(false);
      setForm({ destinataireId: '', message: '' });
      // If user had no employeeId, the backend just auto-created one — refresh to store it
      const isValidId = (v) => v && v !== 'null' && v !== 'undefined';
      if (!isValidId(user?.employeeId)) await refreshUser();
      loadData();
    } catch (err) { toast.error(err); }
    finally { setFormLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await messagesAPI.delete(deleteTarget);
      toast.success('Deleted', 'Message removed.');
      setMessages((p) => p.filter((m) => m.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { toast.error(err); }
    finally { setDeleteLoading(false); }
  }

  async function handleMarkRead(id) {
    try {
      await messagesAPI.markAsRead(id);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, lu: true } : m));
    } catch (err) { /* silently fail */ }
  }

  function getOtherParty(msg) {
    if (view === 'inbox') return msg.expediteur || {};
    return msg.destinataire || {};
  }

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>{t('messages.title')}</h1><p>{t('messages.subtitle')}</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t('messages.new')}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${view === 'inbox' ? 'active' : ''}`} onClick={() => setView('inbox')}>
          {t('messages.tabs.inbox')} {messages.filter((m) => !m.lu).length > 0 && (
            <span style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 'var(--text-xs)', marginLeft: 6 }}>
              {messages.filter((m) => !m.lu).length}
            </span>
          )}
        </button>
        <button className={`tab ${view === 'sent' ? 'active' : ''}`} onClick={() => setView('sent')}>{t('messages.tabs.sent')}</button>
      </div>

      <div className="table-container">
        {messages.length === 0 ? (
          <EmptyState icon="💬" title={view === 'inbox' ? 'No messages' : 'No sent messages'} description={view === 'inbox' ? 'Your inbox is empty.' : 'You haven\'t sent any messages yet.'} />
        ) : (
          <div className="message-list">
            {messages.map((msg) => {
              const other = getOtherParty(msg);
              return (
                <div
                  key={msg.id}
                  className={`message-item ${!msg.lu && view === 'inbox' ? 'message-unread' : ''}`}
                  onClick={() => { handleMarkRead(msg.id); setSelectedMessage(msg); }}
                >
                  <div className="message-avatar">
                    {(other.nom?.[0] || 'M').toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header-row">
                      <span className="message-sender">{other.nom} {other.prenom}</span>
                      <span className="message-date">{relativeTime(msg.date || msg.createdAt)}</span>
                    </div>
                    <div className="message-preview">{msg.message}</div>
                    <div className="message-meta">
                      {msg.lu ? <Badge variant="gray">{t('messages.read')}</Badge> : <Badge variant="info">{t('messages.unread')}</Badge>}
                    </div>
                  </div>
                  <button className="btn-icon danger" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg.id); }}>
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Message"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={formLoading}>{formLoading ? 'Sending...' : 'Send'}</button>
        </>}>
        <form onSubmit={handleSend}>
          <div className="form-group">
            <label className="form-label form-label-required">To</label>
            <select className="form-select" value={form.destinataireId} onChange={(e) => setForm({ ...form, destinataireId: e.target.value })} required>
              <option value="">Select recipient...</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.prenom}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Message</label>
            <textarea className="form-textarea" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
        </form>
      </Modal>

      {/* Message Detail Modal */}
      {selectedMessage && (() => {
        const other = view === 'inbox' ? selectedMessage.expediteur : selectedMessage.destinataire;
        return (
        <Modal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} title="Message" size="lg">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <strong>{view === 'inbox' ? t('messages.from') + ' ' : t('messages.to') + ' '}</strong>
                {other?.nom || ''} {other?.prenom || ''}
                {other?.utilisateur?.email && (
                  <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)', marginLeft: 6 }}>
                    ({other.utilisateur.email})
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>
                {formatDate(selectedMessage.date || selectedMessage.createdAt)}
              </span>
            </div>
          </div>
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', padding: 16, fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--gray-800)' }}>
            {selectedMessage.message}
          </div>
        </Modal>
        );
      })()}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('messages.deleteTitle')} message={t('messages.deleteMsg')} loading={deleteLoading} />
    </div>
  );
}
