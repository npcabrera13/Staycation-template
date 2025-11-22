import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getConciergeResponse } from '../services/geminiService';

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "Hello! I'm your virtual concierge. Ask me anything about our rooms or amenities.", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setLoading(true);

    const response = await getConciergeResponse(userMsg);
    
    setMessages(prev => [...prev, { text: response, isUser: false }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-teal-600 transition-transform transform hover:scale-110 flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[450px] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
                <h3 className="font-bold">Concierge AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 rounded p-1">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.isUser ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none text-xs text-gray-500 flex items-center">
                        Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white flex">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="Ask about the pool..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-secondary text-white px-4 py-2 rounded-r-md hover:bg-gray-800 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;