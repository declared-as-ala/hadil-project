import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { cvAiAPI } from '../../api/cvAi.api';
import { useApiToast } from '../../components/common/Toast';
import './CvAiPage.css';

export default function CvAiChatPage() {
  const { id } = useParams();
  const toast = useApiToast();
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState('');

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

  async function sendQuestion() {
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      await cvAiAPI.chat(id, question.trim());
      setQuestion('');
      loadData();
    } catch (err) {
      toast.error(err);
    } finally {
      setChatLoading(false);
    }
  }

  async function clearChat() {
    if (!window.confirm("Effacer tout l'historique de cette discussion ?")) return;
    try {
      await cvAiAPI.clearChat(id);
      toast.success('Discussion effacée', "L'historique de la discussion a été réinitialisé.");
      loadData();
    } catch (err) {
      toast.error(err);
    }
  }

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Chat IA pour CV</h1>
          <p>Posez des questions basées uniquement sur le CV et la description du poste.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            style={{ color: 'var(--red-500)', borderColor: 'var(--red-500)' }}
            disabled={(data.chatHistory || []).length === 0}
            onClick={clearChat}
          >
            Effacer la discussion
          </button>
        </div>
      </div>

      <div className="cv-card">
        <div className="chat-box">
          {(data.chatHistory || []).length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', textAlign: 'center', margin: 'auto' }}>
              Aucune discussion pour le moment. Posez des questions sur les compétences ou l'expérience du candidat.
            </p>
          ) : (
            data.chatHistory.map((item, idx) => (
              <React.Fragment key={`${item.createdAt}-${idx}`}>
                <div className="chat-bubble user">
                  {item.question}
                  <span className="chat-meta">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="chat-bubble ai">
                  {item.answer}
                  <span className="chat-meta">
                    IA Assistant
                  </span>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Poser une question</label>
          <textarea
            className="form-textarea"
            placeholder="Exemple : Ce candidat a-t-il de l'expérience avec React ?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={chatLoading || !question.trim()} onClick={sendQuestion}>
            {chatLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
