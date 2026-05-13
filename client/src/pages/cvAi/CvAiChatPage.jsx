import { useEffect, useState } from 'react';
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

  if (loading) return <div className="crud-loading"><div className="spinner" /></div>;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CV AI Chat</h1>
          <p>Ask questions strictly based on the CV and job description.</p>
        </div>
      </div>

      <div className="cv-card">
        <div className="chat-box">
          {(data.chatHistory || []).length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>No chat yet. Try asking about skills, experience, or job fit.</p>
          ) : (
            data.chatHistory.map((item, idx) => (
              <div key={`${item.createdAt}-${idx}`} className="chat-item">
                <div className="chat-q">Q: {item.question}</div>
                <div>A: {item.answer}</div>
              </div>
            ))
          )}
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Ask a question</label>
          <textarea
            className="form-textarea"
            placeholder="Example: Does this candidate have React experience?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={chatLoading || !question.trim()} onClick={sendQuestion}>
            {chatLoading ? 'Asking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
