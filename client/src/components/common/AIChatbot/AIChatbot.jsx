import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiService } from '../../../services/aiService';
import './AIChatbot.css';

const AIChatbot = () => {
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hi ${user?.name?.split(' ')[0]}! I'm Zappy, your DevelopWork AI Assistant. I can help you find projects, check tasks, or fetch team details. How can I help?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        
        // Add user message to UI
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const responseMessage = await aiService.sendMessage(newMessages, user);
            setMessages(prev => [...prev, responseMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Sorry, I encountered an error: ${error.message}. Please try again later.` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-container">
            {/* Chat Bubble Button */}
            {!isOpen && (
                <div className="ai-chatbot-widget-group">
                    <div className="ai-widget-bubble">Need help?</div>
                    <button 
                        className="ai-chatbot-trigger" 
                        onClick={() => setIsOpen(true)}
                        aria-label="Open AI Assistant"
                    >
                        <div className="ai-trigger-badge">
                             <img src="/images/newai.png" alt="Zappy" className="ai-custom-icon" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                             <Sparkles size={24} className="ai-icon-fallback" style={{ display: 'none' }} />
                        </div>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chatbot-window glass-card">
                    {/* Header */}
                    <div className="ai-chatbot-header">
                        <div className="ai-chatbot-header-title">
                            <div className="ai-avatar">
                                <img src="/images/newai.png" alt="Zappy" className="ai-header-icon" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                            <div>
                                <h3>Zappy AI</h3>
                                <span>Powered by DevelopWork</span>
                            </div>
                        </div>
                        <button className="ai-chatbot-close" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="ai-chatbot-messages">
                        {messages.map((msg, index) => (
                            msg.role !== 'tool' && msg.content ? (
                                <div key={index} className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                                    <div className="ai-message-content markdown-body">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : null
                        ))}
                        {isLoading && (
                            <div className="ai-message assistant">
                                <div className="ai-message-content loading">
                                    <Loader2 size={16} className="spinning" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form className="ai-chatbot-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="ai-send-btn"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
