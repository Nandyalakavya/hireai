import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { askCopilot } from '../services/api';
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Trash2,
  MessageSquare
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const Copilot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '### HireAI Copilot\n\nI can help you understand candidate rankings. Try asking me one of the suggested prompts below, or write your own!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substring(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Why is Candidate #1 ranked first?',
    'Why is Sofia below Priya?',
    'Show candidates with Python and LLM experience',
    'Who has strongest Retrieval experience?',
    'Which candidates have missing skills?',
    'Compare Priya and Amara'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askCopilot(text, sessionId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer }
      ]);
    } catch (err) {
      console.error('Error sending query to Copilot:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '**Error**: Failed to contact HireAI ranking analysis service.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (!window.confirm('Clear conversation history?')) return;
    setMessages([
      {
        role: 'assistant',
        content: '### HireAI Copilot\n\nI can help you understand candidate rankings. Try asking me one of the suggested prompts below, or write your own!'
      }
    ]);
  };

  // Custom Markdown parser & renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];
    const elements: React.ReactNode[] = [];

    // Helper to clear and push accumulated table
    const pushTable = (keyIndex: number) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIndex}`} className="my-3 overflow-x-auto rounded-lg border border-card-border bg-background max-w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-card-border font-bold text-text-main">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="py-2.5 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border text-text-muted">
                {tableRows.map((r, ri) => (
                  <tr key={ri} className="hover:bg-background/40">
                    {r.map((val, ci) => (
                      <td key={ci} className="py-2 px-4 whitespace-nowrap">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table formatting
      if (trimmed.startsWith('|')) {
        const parts = line.split('|').map((p) => p.trim()).filter((p) => p !== '');
        
        if (line.includes('---')) {
          // Separator row
          return;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = parts;
        } else {
          tableRows.push(parts);
        }
        return;
      } else if (inTable) {
        // Table ended, push table element
        pushTable(idx);
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-bold text-text-main mt-4 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" /> {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={idx} className="text-xs font-bold text-text-main mt-3 mb-1">{trimmed.replace('#### ', '')}</h4>
        );
        return;
      }

      // Lists
      if (trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        const processed = content.split('**').map((part, i) => {
          return i % 2 === 1 ? <strong key={i} className="font-bold text-text-main">{part}</strong> : part;
        });
        elements.push(
          <li key={idx} className="list-disc list-inside ml-2 text-xs text-text-muted leading-relaxed mt-0.5">
            {processed}
          </li>
        );
        return;
      }

      // Paragraph
      if (trimmed === '') {
        return;
      }

      // Bold text formatting inside paragraphs
      const processedLine = line.split('**').map((part, i) => {
        return i % 2 === 1 ? <strong key={i} className="font-bold text-text-main">{part}</strong> : part;
      });

      elements.push(
        <p key={idx} className="text-xs text-text-muted leading-relaxed mt-1.5">
          {processedLine}
        </p>
      );
    });

    // Handle table if message finishes with a table
    if (inTable) {
      pushTable(lines.length);
    }

    return elements;
  };

  return (
    <div className="flex-grow flex flex-col h-screen bg-background overflow-hidden">
      <Header title="Recruiter Copilot" subtitle="Ask questions about candidates, rankings, and skill gaps" />

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-6 overflow-hidden">
        
        {/* Chat window */}
        <div className="flex-grow bg-card border border-card-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
          
          {/* Clear chat button */}
          <div className="p-3 border-b border-card-border flex justify-between items-center bg-card">
            <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary" /> Active Recruiter Session
            </span>
            <button
              onClick={handleClearChat}
              className="p-1 text-text-muted hover:text-danger rounded hover:bg-background transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Icon avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-500 text-white'
                        : 'bg-primary-light text-primary'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`p-4 rounded-xl border text-sm shadow-sm ${
                      isUser
                        ? 'bg-primary border-primary/10 text-white rounded-tr-none'
                        : 'bg-background border-card-border text-text-main rounded-tl-none'
                    }`}>
                      {isUser ? (
                        <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 bg-background border border-card-border rounded-xl text-xs text-text-muted italic">
                  HireAI is reviewing rankings...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts list */}
          <div className="p-4 bg-background/40 border-t border-card-border space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Suggested Prompts</span>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-card hover:bg-primary-light/40 border border-card-border hover:border-primary/20 rounded-lg text-[11px] font-semibold text-text-main transition-colors text-left disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input text box */}
          <div className="p-4 border-t border-card-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask about candidate experience, missing database skills, or rank analysis..."
                className="flex-grow px-4 py-2.5 rounded-lg border border-card-border bg-background text-text-main placeholder-text-muted text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-md shadow-primary/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
export default Copilot;
