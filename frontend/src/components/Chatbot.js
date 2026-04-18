import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ChatBot.css';
import { buildApiUrl } from '../utils/api';

const ChatBot = ({ user, availableMovies, movieHistory, currentView, onAction, onSelectMovie }) => {
    const SERVICE_UNAVAILABLE_MESSAGE = 'I am unable to reach the AI service right now. Please make sure backend is running and try again.';
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi, I am BookMySeat AI. Ask me about movies, booking steps, navigation, or get personalized recommendations.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasServiceErrorNotice, setHasServiceErrorNotice] = useState(false);
    const messagesEndRef = useRef(null);

    const userAge = useMemo(() => {
        if (Number.isFinite(Number(user?.age))) return Number(user.age);
        if (user?.dob) {
            const birthDate = new Date(user.dob);
            if (!Number.isNaN(birthDate.getTime())) {
                const diffMs = Date.now() - birthDate.getTime();
                return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
            }
        }
        return null;
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isSending]);

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isSending) return;

        const userMsg = { role: 'user', content: trimmedInput };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        const conversationHistory = messages
            .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
            .slice(-10)
            .map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

        try {
            const requestBody = JSON.stringify({
                userMessage: trimmedInput,
                userProfile: {
                    id: user?._id || user?.id || user?.uid,
                    name: user?.name || user?.displayName || user?.email,
                    age: userAge,
                    dob: user?.dob,
                    email: user?.email,
                    role: user?.role || 'user',
                },
                appContext: {
                    currentView: currentView || 'home',
                },
                conversationHistory,
                movieHistory: movieHistory || [],
                availableMovies: availableMovies || []
            });

            let response = await fetch(buildApiUrl('/api/ai/recommend'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: requestBody,
            });

            if (!response.ok) {
                response = await fetch(buildApiUrl('/api/chat/message'), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody,
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Chat service returned an error');
            }

            const data = await response.json();
            setHasServiceErrorNotice(false);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.response || 'I could not generate a response right now. Please try again.',
                    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
                    quickActions: Array.isArray(data.quickActions) ? data.quickActions : [],
                },
            ]);
        } catch (error) {
            if (!hasServiceErrorNotice) {
                setMessages((prev) => [...prev, { role: 'assistant', content: SERVICE_UNAVAILABLE_MESSAGE }]);
                setHasServiceErrorNotice(true);
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle AI assistant">
                {isOpen ? '×' : '🎬 AI Assistant'}
            </button>
            
            {isOpen && (
                <div className="chat-window" role="dialog" aria-label="BookMySeat AI chat assistant">
                    <div className="chat-header">
                        <div>
                            <div className="chat-title">BookMySeat AI</div>
                            <div className="chat-subtitle">Smart booking and movie assistant</div>
                        </div>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}`}>
                                <div className="message-bubble">
                                    <div>{msg.content}</div>
                                    {msg.role === 'assistant' && Array.isArray(msg.recommendations) && msg.recommendations.length > 0 && (
                                        <div className="chat-recommendations">
                                            {msg.recommendations.slice(0, 4).map((movie, idx) => (
                                                <button
                                                    key={`${movie.title}-${idx}`}
                                                    type="button"
                                                    className="chat-reco-card"
                                                    onClick={() => onSelectMovie?.(movie)}
                                                >
                                                    <div className="chat-reco-title">{movie.title}</div>
                                                    <div className="chat-reco-meta">{movie.genre || 'Genre not listed'}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {msg.role === 'assistant' && Array.isArray(msg.quickActions) && msg.quickActions.length > 0 && (
                                        <div className="chat-quick-actions">
                                            {msg.quickActions.slice(0, 4).map((action, idx) => (
                                                <button
                                                    key={`${action.label || action.target || action.type}-${idx}`}
                                                    type="button"
                                                    className="chat-action-btn"
                                                    onClick={() => onAction?.(action)}
                                                >
                                                    {action.label || 'Open'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isSending && (
                            <div className="message assistant">
                                <div className="message-bubble typing-bubble">Thinking...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <input 
                            id="chatMessage"
                            name="chatMessage"
                            value={input}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            aria-label="Chat message"
                        />
                        <button onClick={handleSend} disabled={isSending || !input.trim()}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;