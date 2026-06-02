import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { messagesAPI } from '../../api/messages.api';
import { useAuth } from '../../hooks/useAuth';
import { relativeTime } from '../../utils/formatters';
import './FloatingChat.css';

export default function FloatingChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only load if the user is logged in
    if (user && user.employeeId) {
      loadUnreadMessages();
      // Optional: Polling every 30s
      const interval = setInterval(loadUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  async function loadUnreadMessages() {
    try {
      const employeeId = user?.employeeId;
      const isValidId = (v) => v && v !== 'null' && v !== 'undefined';
      if (!isValidId(employeeId)) return;

      // We only care about inbox for the floating chat
      const res = await messagesAPI.getAll({ destinataireId: employeeId });
      const allMsgs = res.data || [];
      
      // Filter unread
      const unreadMsgs = allMsgs.filter(m => !m.lu);
      setUnreadCount(unreadMsgs.length);
      
      // Keep up to 5 most recent messages (read or unread) for display
      setMessages(allMsgs.slice(0, 5));
    } catch (e) {
      // silently fail
    }
  }

  if (!user || !user.employeeId || user.employeeId === 'null') return null;

  const handleMessageClick = (msg) => {
    setIsOpen(false);
    navigate('/messages');
  };

  return (
    <div className="floating-chat-container">
      {isOpen && (
        <div className="floating-chat-panel">
          <div className="floating-chat-header">
            <h3>Derniers messages</h3>
            <button className="floating-chat-close" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="floating-chat-body">
            {messages.length === 0 ? (
              <div className="floating-chat-empty">
                Aucun message récent
              </div>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`floating-message-item ${!msg.lu ? 'unread' : ''}`}
                  onClick={() => handleMessageClick(msg)}
                >
                  <div className="floating-message-avatar">
                    {(msg.expediteur?.nom?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="floating-message-content">
                    <div className="floating-message-header">
                      <span className="floating-message-name">{msg.expediteur?.nom} {msg.expediteur?.prenom}</span>
                      <span className="floating-message-time">{relativeTime(msg.date || msg.createdAt)}</span>
                    </div>
                    <div className="floating-message-text">{msg.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="floating-chat-footer">
            <Link to="/messages" onClick={() => setIsOpen(false)}>
              Voir tous les messages
            </Link>
          </div>
        </div>
      )}

      <button className="floating-chat-toggle" onClick={() => {
        setIsOpen(!isOpen);
        if (!isOpen) loadUnreadMessages();
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {unreadCount > 0 && !isOpen && (
          <span className="floating-chat-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
}
