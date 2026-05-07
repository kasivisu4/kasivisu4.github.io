'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { chatResponses, chatFallback } from '@/lib/data';

// ── Lightweight markdown renderer for bold (**text**) in chat responses
function ChatMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-cyan-400">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </span>
  );
}

// ── Simulate LLM streaming response
function useStreamText(targetText, enabled) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!enabled) return;
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i += 2; // 2 chars per tick for speed
      setDisplayed(targetText.slice(0, i));
      if (i >= targetText.length) clearInterval(interval);
    }, 14);
    return () => clearInterval(interval);
  }, [targetText, enabled]);

  return displayed;
}

// ── Match a user query to the best response
function getResponse(query) {
  const lower = query.toLowerCase();
  for (const { patterns, response } of chatResponses) {
    if (patterns.some((p) => lower.includes(p))) return response;
  }
  return chatFallback;
}

// ── Suggested starter questions
const SUGGESTIONS = [
  'What LLM projects has Kasi built?',
  'Tell me about his FastAPI experience.',
  'What data pipelines has he worked on?',
  'What are his top skills?',
];

// ── Single message bubble
function MessageBubble({ msg, onStream }) {
  const isBot = msg.role === 'bot';
  const [streaming, setStreaming] = useState(msg.streaming ?? false);
  const streamedText = useStreamText(msg.content, streaming);
  const onStreamRef = useRef(onStream);

  useEffect(() => {
    onStreamRef.current = onStream;
  }, [onStream]);

  useEffect(() => {
    if (streaming && streamedText === msg.content) setStreaming(false);
    // Notify parent to scroll on every streamed character
    if (streaming) onStreamRef.current?.();
  }, [streamedText, msg.content, streaming]);

  const displayText = streaming ? streamedText : msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
        ${isBot ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
        {isBot ? <Bot size={13} /> : <User size={13} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed
        ${isBot
          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-tl-sm'
          : 'bg-cyan-500 text-white rounded-tr-sm'
        }`}>
        {isBot ? (
          <>
            <ChatMarkdown text={displayText} />
            {streaming && <span className="ml-0.5 inline-block w-1 h-3 bg-cyan-400 animate-pulse" />}
          </>
        ) : (
          displayText
        )}
      </div>
    </motion.div>
  );
}

// ── Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="shrink-0 w-7 h-7 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
        <Bot size={13} />
      </div>
      <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/80">
        <div className="flex gap-1 items-center h-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'bot',
      content: "Hi! I'm a demo assistant for Kasi's portfolio. Ask me anything about his experience, projects, or skills — or try one of the suggestions below!",
      streaming: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  const sendMessage = (text) => {
    const q = text.trim();
    if (!q || thinking) return;

    const userMsg = { id: Date.now(), role: 'user', content: q, streaming: false };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate LLM latency
    const delay = 500 + Math.random() * 600;
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: getResponse(q),
        streaming: true,
      };
      setMessages((m) => [...m, botMsg]);
      setThinking(false);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl
          flex items-center justify-center transition-all duration-200
          ${open
            ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-none'
            : 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50'
          }`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 20, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            className="absolute"
          >
            {open ? <X size={22} /> : <MessageSquare size={22} />}
          </motion.span>
        </AnimatePresence>

        {/* Notification dot when closed */}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950 animate-pulse" />
        )}
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)]
              glass-card shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Ask about Kasi</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-500">Demo AI · Powered by mock LLM</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                    onStream={scrollToBottom}
                />
              ))}
              {thinking && <TypingIndicator />}
              <div ref={endRef} />
            </div>

            {/* Suggestions (shown only when 1 message = initial) */}
            {messages.length === 1 && !thinking && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full
                      border border-cyan-400/20 text-cyan-500 dark:text-cyan-400
                      bg-cyan-400/5 hover:bg-cyan-400/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-white/5 flex gap-2 items-end"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about Kasi…"
                disabled={thinking}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm resize-none
                  bg-slate-100 dark:bg-slate-800/70 border border-transparent
                  focus:border-cyan-400/40 focus:outline-none
                  text-slate-900 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-600
                  disabled:opacity-50 transition-colors"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || thinking}
                className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white
                  flex items-center justify-center shrink-0
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Send"
              >
                <Send size={14} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
