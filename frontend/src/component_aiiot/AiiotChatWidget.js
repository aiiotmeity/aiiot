import React, { useState } from 'react';
import { Bot, MessageSquare, X } from 'lucide-react'; // Premium Vector Icons

const AiiotChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'Arial, sans-serif' }}>
      
      {/* CHAT WINDOW INTERFACE */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '0',
          width: '400px',
          height: '600px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}>
          {/* Widget Header */}
          <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={22} strokeWidth={2.5} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>AI Research Assistant</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', opacity: 0.9, color: 'white' }}>Center for AI-IoT Innovations</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Embedded Streamlit Cloud RAG Core */}
          <iframe
            src="https://advanced-chatbot-8wxync7kx9ekkovfmqj6bh.streamlit.app/?embed=true"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="AI-IoT "
            allow="clipboard-write"
          />
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
        }}
      >
        {/* Render Vector Icon conditionally instead of text emojis */}
        {isOpen ? (
          <MessageSquare size={28} color="white" strokeWidth={2} />
        ) : (
          <Bot size={30} color="white" strokeWidth={2} />
        )}
      </button>

      {/* Embedded Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AiiotChatWidget;