'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { StrudelEditorHandle } from '@/components/strudel-editor';

const StrudelEditor = dynamic(() => import('@/components/strudel-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-zinc-600 font-mono text-sm">
      loading strudel...
    </div>
  ),
});

const INITIAL_CODE = `// AI DJ — waiting for your command
// Click here then Ctrl+Enter to start · Ctrl+. to stop

setcpm(128 / 4)

$: sound("bd ~ bd ~")
  .bank("RolandTR909")
  .gain(1.2)
`;

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Ready. Click the editor, Ctrl+Enter to start, then tell me what you want.' },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const editorRef = useRef<StrudelEditorHandle>(null);
  const currentCodeRef = useRef<string>(INITIAL_CODE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isThinking) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsThinking(true);
    scrollToBottom();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, currentCode: currentCodeRef.current }),
      });

      const data = await res.json();

      if (data.code && editorRef.current) {
        currentCodeRef.current = data.code;
        editorRef.current.setCode(data.code);
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.message ?? 'Done.' },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Try again.' },
      ]);
    } finally {
      setIsThinking(false);
      scrollToBottom();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-300">
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
        <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
          AI DJ
        </span>
        <span className="font-mono text-xs text-zinc-600">
          Ctrl+Enter to play · Ctrl+. to stop
        </span>
      </header>

      <div className="flex-1 overflow-hidden">
        <StrudelEditor ref={editorRef} />
      </div>

      <div className="h-36 overflow-y-auto px-5 py-3 border-t border-zinc-800 flex flex-col gap-2 text-sm font-mono">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-white' : 'text-zinc-500'}>
            <span className="text-zinc-700 mr-2">{msg.role === 'user' ? '>' : '$'}</span>
            {msg.text}
          </div>
        ))}
        {isThinking && (
          <div className="text-zinc-600">
            <span className="mr-2">$</span>thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-800 shrink-0">
        <span className="text-zinc-600 font-mono text-sm">{'>'}</span>
        <input
          className="flex-1 bg-transparent font-mono text-sm text-white placeholder-zinc-700 outline-none"
          placeholder="go darker · drop the kick · bring in acid · slower..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          autoFocus
        />
        <button
          onClick={sendMessage}
          disabled={isThinking || !input.trim()}
          className="font-mono text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-30 transition-colors"
        >
          send
        </button>
      </div>
    </div>
  );
}
