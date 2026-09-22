import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../socket';
import { MessageSquare, Send, X } from 'lucide-react';

export default function ChatBox() {
  const { messages, currentPlayerId, room } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When a new message comes in, if not open, increment unread
  useEffect(() => {
      if (!isOpen && messages.length > 0) {
         const lastMsg = messages[messages.length - 1];
         if (lastMsg.senderId !== currentPlayerId) {
             setUnread(prev => prev + 1);
         }
      }
  }, [messages]);

  // When opened, clear unread and scroll to bottom
  useEffect(() => {
      if (isOpen) {
          setUnread(0);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [isOpen, messages.length]);

  if (!room) return null;

  const sendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;
      socket.emit('room:chat', { text: text.trim() });
      setText('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end pointer-events-none">
        
        {/* Chat Window */}
        {isOpen && (
            <div className="w-80 h-96 bg-navy-950/95 border border-white/20 rounded-xl shadow-2xl flex flex-col mb-4 pointer-events-auto overflow-hidden backdrop-blur-md">
                <div className="bg-white/5 border-b border-white/10 p-3 flex justify-between items-center shrink-0">
                    <h3 className="font-bold tracking-widest text-sm flex items-center gap-2">
                        <MessageSquare size={16} className="text-neon-blue" /> 
                        COMMS
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-white/30 text-xs mt-10 tracking-widest">
                            NO MESSAGES YET
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.senderId === currentPlayerId;
                            return (
                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-white/40 tracking-widest mb-1 px-1">
                                        {msg.sender.toUpperCase()}
                                    </span>
                                    <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${isMe ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-tr-none' : 'bg-white/10 text-white/90 border border-white/10 rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={sendMessage} className="shrink-0 p-3 bg-white/5 border-t border-white/10 flex gap-2">
                    <input 
                        type="text" 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="SEND MESSAGE..."
                        className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-neon-blue/50 text-white placeholder-white/30"
                    />
                    <button type="submit" disabled={!text.trim()} className="bg-neon-blue text-navy-950 p-2 rounded hover:bg-white disabled:opacity-50 transition-colors">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        )}

        {/* Toggle Button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isOpen ? 'bg-white/10 text-white/50 hover:text-white' : 'bg-neon-blue text-navy-900 hover:bg-white hover:scale-105'} relative`}
        >
            {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            {!isOpen && unread > 0 && (
                <div className="absolute -top-1 -right-1 bg-neon-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse border border-navy-900">
                    {unread > 9 ? '9+' : unread}
                </div>
            )}
        </button>

    </div>
  );
}
