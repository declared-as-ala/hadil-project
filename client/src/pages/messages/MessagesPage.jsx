import { useState, useEffect, useRef, useMemo } from 'react';

import { messagesAPI } from '../../api/messages.api';
import { employesAPI } from '../../api/employes.api';
import { useAuth } from '../../hooks/useAuth';
import { useApiToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { relativeTime } from '../../utils/formatters';
import './Messages.css';

export default function MessagesPage() {
  const { user, refreshUser } = useAuth();
  const toast = useApiToast();
  
  const [messages, setMessages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatTarget, setNewChatTarget] = useState('');
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadData() {
    setLoading(true);
    try {
      const employeeId = user?.employeeId;
      const isValidId = (v) => v && v !== 'null' && v !== 'undefined';

      // Load ALL messages involving the user
      const msgParams = isValidId(employeeId) ? { participantId: employeeId } : {};

      const [mRes, eRes] = await Promise.all([
        messagesAPI.getAll(msgParams),
        employesAPI.getAll(),
      ]);
      setMessages(mRes.data || []);
      setEmployes(eRes.data || []);
    } catch (err) { toast.error(err); }
    finally { setLoading(false); }
  }

  async function handleSend(destinataireId, text) {
    if (!text.trim() || !destinataireId) return;
    setSending(true);
    try {
      await messagesAPI.send({ destinataireId, message: text });
      setMessageText('');
      setShowNewChat(false);
      setNewChatTarget('');
      
      const isValidId = (v) => v && v !== 'null' && v !== 'undefined';
      if (!isValidId(user?.employeeId)) await refreshUser();
      
      await loadData();
      if (!activeConversationId) {
        setActiveConversationId(destinataireId);
      }
    } catch (err) { toast.error(err); }
    finally { setSending(false); }
  }

  const markConversationAsRead = async (participantId) => {
    const unreadMessages = messages.filter(m => 
      !m.lu && m.expediteur?.id === participantId && m.destinataire?.id === user?.employeeId
    );
    
    if (unreadMessages.length > 0) {
      try {
        await Promise.all(unreadMessages.map(m => messagesAPI.markAsRead(m.id)));
        setMessages(prev => prev.map(m => 
          (m.expediteur?.id === participantId && !m.lu) ? { ...m, lu: true } : m
        ));
      } catch (e) { /* ignore */ }
    }
  };

  const handleSelectConversation = (participantId) => {
    setActiveConversationId(participantId);
    markConversationAsRead(participantId);
  };

  // Group messages by conversation
  const conversations = useMemo(() => {
    const groups = {};
    const myId = user?.employeeId;
    
    messages.forEach(msg => {
      const isSentByMe = msg.expediteur?.id === myId;
      const otherUser = isSentByMe ? msg.destinataire : msg.expediteur;
      if (!otherUser) return;
      
      const otherId = otherUser.id;
      if (!groups[otherId]) {
        groups[otherId] = {
          user: otherUser,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      
      groups[otherId].messages.push(msg);
      
      if (!isSentByMe && !msg.lu) {
        groups[otherId].unreadCount++;
      }
      
      if (!groups[otherId].lastMessage || new Date(msg.date || msg.createdAt) > new Date(groups[otherId].lastMessage?.date || groups[otherId].lastMessage?.createdAt || 0)) {
        groups[otherId].lastMessage = msg;
      }
    });
    
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.lastMessage?.date || a.lastMessage?.createdAt || 0);
      const dateB = new Date(b.lastMessage?.date || b.lastMessage?.createdAt || 0);
      return dateB - dateA;
    });
  }, [messages, user?.employeeId]);

  const activeConversation = conversations.find(c => c.user.id === activeConversationId);
  // Sort messages oldest first for chat view
  const activeMessages = activeConversation ? [...activeConversation.messages].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)) : [];

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1>Messages</h1>
          <p>Messagerie interne entre employés.</p>
        </div>
      </div>

      <div className="messages-layout">
        {/* Sidebar */}
        <div className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h2>Conversations</h2>
            <button className="new-chat-btn" onClick={() => setShowNewChat(true)}>
              ✉️ Nouveau message
            </button>
          </div>
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                Aucune conversation
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.user.id} 
                  className={`conversation-item ${activeConversationId === conv.user.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv.user.id)}
                >
                  <div className="conversation-avatar">
                    {(conv.user.nom?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <div className="conversation-name">{conv.user.nom} {conv.user.prenom}</div>
                      <div className="conversation-date">{relativeTime(conv.lastMessage?.date || conv.lastMessage?.createdAt)}</div>
                    </div>
                    <div className="conversation-preview">
                      {conv.lastMessage?.expediteur?.id === user?.employeeId ? 'Vous: ' : ''}
                      {conv.lastMessage?.message}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="conversation-unread-badge">{conv.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConversation ? (
          <div className="chat-area">
            <div className="chat-header">
              <div className="conversation-avatar" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                {(activeConversation.user.nom?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h3>{activeConversation.user.nom} {activeConversation.user.prenom}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{activeConversation.user.poste || activeConversation.user.utilisateur?.email}</span>
              </div>
            </div>
            
            <div className="chat-messages">
              {activeMessages.map(msg => {
                const isSentByMe = msg.expediteur?.id === user?.employeeId;
                return (
                  <div key={msg.id} className={`chat-message-row ${isSentByMe ? 'sent' : 'received'}`}>
                    <div className="chat-bubble">
                      {msg.message}
                    </div>
                    <div className="chat-time">
                      {new Date(msg.date || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-area">
              <form 
                className="chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(activeConversation.user.id, messageText);
                }}
              >
                <textarea
                  className="chat-input-textarea"
                  placeholder="Écrivez un message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(activeConversation.user.id, messageText);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  className="chat-send-btn" 
                  disabled={!messageText.trim() || sending}
                  title="Envoyer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Vos messages</h3>
            <p>Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal 
        isOpen={showNewChat} 
        onClose={() => setShowNewChat(false)} 
        title="Nouvelle conversation"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNewChat(false)}>Annuler</button>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSend(newChatTarget, messageText)} 
              disabled={!newChatTarget || !messageText.trim() || sending}
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label form-label-required">Destinataire</label>
          <select 
            className="form-select" 
            value={newChatTarget} 
            onChange={(e) => setNewChatTarget(e.target.value)}
          >
            <option value="">Sélectionner un employé...</option>
            {employes.filter(e => e.id !== user?.employeeId).map(e => (
              <option key={e.id} value={e.id}>{e.nom} {e.prenom} - {e.poste}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label form-label-required">Message</label>
          <textarea 
            className="form-textarea" 
            rows={4} 
            value={messageText} 
            onChange={(e) => setMessageText(e.target.value)} 
            placeholder="Votre premier message..."
          />
        </div>
      </Modal>
    </div>
  );
}
