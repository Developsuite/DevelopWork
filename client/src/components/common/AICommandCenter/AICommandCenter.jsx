import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../../store/slices/uiSlice';
import {
    Sparkles,
    X,
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    ChevronDown,
    ChevronUp,
    Zap,
    Clock,
    RotateCcw,
    Mic,
    MicOff,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiCommandService } from '../../../services/aiCommandService';
import './AICommandCenter.css';

const SUGGESTED_COMMANDS = [
    'Show me all overdue tasks',
    'Create a high-priority task for tomorrow',
    'List all leads in Qualified stage',
    'Schedule a team meeting for next Monday',
    'Show this month\'s financial summary',
    'Search employees by name',
];

const riskLabels = {
    read: 'Read Only',
    low: 'Low Risk',
    external: 'External',
    sensitive: 'Sensitive',
    destructive: 'Destructive',
};

const riskColors = {
    read: 'var(--success)',
    low: 'var(--primary-500)',
    external: 'var(--warning)',
    sensitive: 'var(--danger)',
    destructive: 'var(--danger)',
};

const AICommandCenter = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTools, setActiveTools] = useState([]);
    const [pendingActions, setPendingActions] = useState([]);
    const [actionHistory, setActionHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceLang, setVoiceLang] = useState('ur-PK');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTools, pendingActions]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Speech recognition setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ur-PK';

            recognition.onresult = (event) => {
                let final = '';
                let interim = '';
                for (let i = 0; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += t + ' ';
                    } else {
                        interim = t;
                    }
                }
                setInput((final + interim).trim());
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (e) => {
                console.warn('[Voice] Error:', e.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch {}
            }
        };
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            dispatch(addToast({ title: 'Unsupported', message: 'Voice input is not available in this browser.', type: 'warning' }));
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.lang = voiceLang;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const cycleVoiceLang = () => {
        const langs = ['ur-PK', 'en-US'];
        const next = langs[(langs.indexOf(voiceLang) + 1) % langs.length];
        setVoiceLang(next);
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleSend = async (text) => {
        const userMessage = (text || input).trim();
        if (!userMessage || isLoading) return;
        setInput('');
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const userMsg = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setActiveTools([]);
        setPendingActions([]);

        try {
            const allMessages = [...messages, userMsg].filter(m => m.role === 'user' || m.role === 'assistant');

            const result = await aiCommandService.sendMessage(allMessages, user, {
                onToolCall: (info) => {
                    setActiveTools(prev => [...prev, info]);
                },
            });

            setActiveTools([]);

            if (result.actions?.length > 0) {
                const pending = result.actions.filter(a => a.status === 'awaiting_confirmation');
                const completed = result.actions.filter(a => a.status === 'completed');

                if (pending.length > 0) {
                    setPendingActions(pending);
                }
                if (completed.length > 0) {
                    setActionHistory(prev => [...completed.map(a => ({
                        ...a,
                        timestamp: new Date().toISOString(),
                    })), ...prev]);
                }
            }

            if (result.message?.content) {
                setMessages(prev => [...prev, result.message]);
            }
        } catch (error) {
            console.error('[AICommandCenter] Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `**Error:** ${error.message}`,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAction = async (action) => {
        const idx = pendingActions.indexOf(action);
        setPendingActions(prev => prev.map((a, i) => i === idx ? { ...a, status: 'executing' } : a));

        try {
            const result = await aiCommandService.executeConfirmedAction(action.toolName, action.args);

            setPendingActions(prev => prev.filter((_, i) => i !== idx));
            setActionHistory(prev => [{
                ...action,
                status: 'completed',
                result,
                timestamp: new Date().toISOString(),
            }, ...prev]);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `**Action completed:** ${result.message}`,
            }]);

            dispatch(addToast({ title: 'Action Executed', message: result.message, type: 'success' }));
        } catch (err) {
            setPendingActions(prev => prev.map((a, i) => i === idx ? { ...a, status: 'failed', error: err.message } : a));
            dispatch(addToast({ title: 'Action Failed', message: err.message, type: 'error' }));
        }
    };

    const handleCancelAction = (action) => {
        setPendingActions(prev => prev.filter(a => a !== action));
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Action **${action.toolName}** was cancelled.`,
        }]);
    };

    const handleConfirmAll = async () => {
        const toConfirm = pendingActions.filter(a => a.status === 'awaiting_confirmation');
        for (const action of toConfirm) {
            await handleConfirmAction(action);
        }
    };

    const handleCancelAll = () => {
        const names = pendingActions.map(a => a.toolName).join(', ');
        setPendingActions([]);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `All pending actions cancelled (${names}).`,
        }]);
    };

    const formatArgValue = (key, val) => {
        if (val === null || val === undefined) return '—';
        if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? (v.name || v.text || JSON.stringify(v)) : v).join(', ');
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const formatToolName = (name) => name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (!isAdmin) return null;

    return (
        <div className={`aicc-container ${isExpanded ? 'aicc-container--expanded' : ''}`}>
            {/* Trigger Button */}
            {!isOpen && (
                <button className="aicc-trigger" onClick={() => setIsOpen(true)} aria-label="Open AI Command Center">
                    <div className="aicc-trigger__inner">
                        <img src="/images/newai.png" alt="AI" className="aicc-trigger__img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <span className="aicc-trigger__fallback"><Sparkles size={24} /></span>
                    </div>
                    {pendingActions.length > 0 && (
                        <span className="aicc-trigger__badge">{pendingActions.length}</span>
                    )}
                </button>
            )}

            {/* Command Center Window */}
            {isOpen && (
                <div className={`aicc-window ${isExpanded ? 'aicc-window--expanded' : ''}`}>
                    {/* Header */}
                    <div className="aicc-header">
                        <div className="aicc-header__left">
                            <div className="aicc-header__avatar">
                                <img src="/images/newai.png" alt="" className="aicc-header__avatar-img" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                            <div className="aicc-header__info">
                                <h3>AI Command Center</h3>
                                <span><Shield size={10} /> Admin Only</span>
                            </div>
                        </div>
                        <div className="aicc-header__right">
                            <button className="aicc-header__btn" onClick={() => setShowHistory(!showHistory)} title="Action history">
                                <Clock size={16} />
                            </button>
                            <button className="aicc-header__btn" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Collapse' : 'Expand'}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            <button className="aicc-header__btn" onClick={() => { setIsOpen(false); setIsExpanded(false); }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Action History Panel */}
                    {showHistory && (
                        <div className="aicc-history">
                            <div className="aicc-history__title">Recent Actions</div>
                            {actionHistory.length === 0 ? (
                                <div className="aicc-history__empty">No actions yet</div>
                            ) : (
                                actionHistory.slice(0, 10).map((action, i) => (
                                    <div key={i} className={`aicc-history__item aicc-history__item--${action.status}`}>
                                        <span className="aicc-history__icon">
                                            {action.status === 'completed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        </span>
                                        <div className="aicc-history__text">
                                            <strong>{formatToolName(action.toolName)}</strong>
                                            <small>{action.result?.message || action.error || ''}</small>
                                        </div>
                                        <time>{new Date(action.timestamp).toLocaleTimeString()}</time>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    <div className="aicc-messages">
                        {messages.length === 0 && !isLoading && (
                            <div className="aicc-welcome">
                                <div className="aicc-welcome__icon">
                                    <Zap size={28} />
                                </div>
                                <h4>Welcome to AI Command Center</h4>
                                <p>Manage your workspace with natural language commands.</p>
                                <div className="aicc-suggestions">
                                    {SUGGESTED_COMMANDS.map((cmd, i) => (
                                        <button key={i} className="aicc-suggestion" onClick={() => { setInput(cmd); handleSend(cmd); }}>
                                            {cmd}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            msg.content ? (
                                <div key={i} className={`aicc-msg aicc-msg--${msg.role}`}>
                                    <div className="aicc-msg__bubble">
                                        {msg.role === 'assistant' ? (
                                            <div className="aicc-msg__markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                                        ) : (
                                            <span>{msg.content}</span>
                                        )}
                                    </div>
                                </div>
                            ) : null
                        ))}

                        {/* Active tool calls indicator */}
                        {isLoading && activeTools.length > 0 && (
                            <div className="aicc-msg aicc-msg--assistant">
                                <div className="aicc-msg__bubble aicc-msg__bubble--tools">
                                    {activeTools.map((t, i) => (
                                        <div key={i} className="aicc-tool-status">
                                            <Loader2 size={12} className="aicc-spinning" />
                                            <span>{formatToolName(t.name)}</span>
                                            <span className="aicc-tool-risk" style={{ color: riskColors[t.risk] }}>
                                                {riskLabels[t.risk]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && activeTools.length === 0 && (
                            <div className="aicc-msg aicc-msg--assistant">
                                <div className="aicc-msg__bubble aicc-msg__bubble--loading">
                                    <Loader2 size={14} className="aicc-spinning" />
                                    <span>Processing...</span>
                                </div>
                            </div>
                        )}

                        {/* Pending Action Cards */}
                        {pendingActions.length > 0 && (
                            <div className="aicc-actions">
                                <div className="aicc-actions__header">
                                    <AlertTriangle size={14} />
                                    <span>{pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} awaiting confirmation</span>
                                </div>
                                {pendingActions.map((action, i) => (
                                    <div key={i} className={`aicc-action-card aicc-action-card--${action.risk}`}>
                                        <div className="aicc-action-card__header">
                                            <strong>{formatToolName(action.toolName)}</strong>
                                            <span className="aicc-action-card__risk" style={{ background: riskColors[action.risk] + '20', color: riskColors[action.risk] }}>
                                                {riskLabels[action.risk]}
                                            </span>
                                        </div>
                                        <div className="aicc-action-card__fields">
                                            {(action.confirmFields?.length > 0 ? action.confirmFields : Object.keys(action.args))
                                                .filter(key => action.args[key] !== undefined && action.args[key] !== null && action.args[key] !== '')
                                                .map(key => (
                                                    <div key={key} className="aicc-action-card__field">
                                                        <span className="aicc-action-card__label">{key.replace(/_/g, ' ')}</span>
                                                        <span className="aicc-action-card__value">{formatArgValue(key, action.args[key])}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div className="aicc-action-card__buttons">
                                            {action.status === 'executing' ? (
                                                <span className="aicc-action-card__executing"><Loader2 size={14} className="aicc-spinning" /> Executing...</span>
                                            ) : action.status === 'failed' ? (
                                                <>
                                                    <span className="aicc-action-card__error"><XCircle size={14} /> {action.error}</span>
                                                    <button className="aicc-btn aicc-btn--ghost" onClick={() => handleConfirmAction(action)}><RotateCcw size={12} /> Retry</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="aicc-btn aicc-btn--danger" onClick={() => handleCancelAction(action)}>Cancel</button>
                                                    <button className="aicc-btn aicc-btn--primary" onClick={() => handleConfirmAction(action)}>
                                                        <CheckCircle2 size={12} /> Confirm
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {pendingActions.filter(a => a.status === 'awaiting_confirmation').length > 1 && (
                                    <div className="aicc-actions__bulk">
                                        <button className="aicc-btn aicc-btn--ghost" onClick={handleCancelAll}>Cancel All</button>
                                        <button className="aicc-btn aicc-btn--primary" onClick={handleConfirmAll}>
                                            <CheckCircle2 size={12} /> Confirm All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form className="aicc-input" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <button type="button" className="aicc-input__lang" onClick={cycleVoiceLang} title={`Voice: ${voiceLang === 'ur-PK' ? 'Urdu' : 'English'}`}>
                            {voiceLang === 'ur-PK' ? 'UR' : 'EN'}
                        </button>
                        <button type="button" className={`aicc-input__voice ${isListening ? 'aicc-input__voice--active' : ''}`} onClick={toggleVoice} title="Voice input">
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={isListening ? 'Listening...' : 'Type a command or ask a question...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="aicc-input__send" disabled={!input.trim() || isLoading}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AICommandCenter;
