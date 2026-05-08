import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import {
    Headphones, Plus, Clock, CheckCircle2, AlertCircle, TrendingUp, Search,
    MoreVertical, MessageCircle, Tag, Calendar, Timer, FileText, BarChart3,
    ArrowUpRight, User, X, Send, Lock, Upload, PieChart,
} from 'lucide-react';
import './Support.css';

const Support = () => {
    const [activeTab, setActiveTab] = useState('tickets');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'Medium'
    });

    const tabs = [
        { id: 'tickets', label: 'All Tickets', icon: Headphones },
        { id: 'new', label: 'New Ticket', icon: Plus },
        { id: 'dashboard', label: 'Agent Dashboard', icon: BarChart3 },
    ];

    const stats = [
        { label: 'Open Tickets', value: 23, icon: AlertCircle, iconBg: 'var(--danger-light)', iconColor: 'var(--danger)' },
        { label: 'In Progress', value: 15, icon: Clock, iconBg: 'var(--warning-light)', iconColor: 'var(--warning)' },
        { label: 'Resolved Today', value: 12, icon: CheckCircle2, iconBg: 'var(--success-light)', iconColor: 'var(--success)' },
        { label: 'Avg Response', value: '2.4h', icon: Timer, iconBg: 'var(--info-light)', iconColor: 'var(--info)' },
    ];

    const [tickets, setTickets] = useState([
        { id: 'TKT-001', subject: 'Unable to access dashboard after update', customer: 'John Miller', email: 'john@techvision.com', category: 'Bug', status: 'Open', priority: 'High', assignee: 'Sarah Ahmed', createdAt: '2026-04-17T10:30:00Z', sla: '2h 15m',
            messages: [
                { from: 'customer', name: 'John Miller', text: 'Hi, I can\'t access the dashboard since the last update. Getting a 403 error.', time: '10:30 AM' },
                { from: 'agent', name: 'Sarah Ahmed', text: 'Hi John, thanks for reporting this. Can you try clearing your browser cache and trying again?', time: '10:45 AM' },
                { from: 'customer', name: 'John Miller', text: 'Still getting the same error after clearing cache.', time: '11:00 AM' },
            ],
            internalNotes: [{ name: 'Sarah Ahmed', text: 'Looks like a permissions issue. Escalating to engineering.', time: '11:15 AM' }],
            tags: ['dashboard', 'access', 'urgent'] },
        { id: 'TKT-002', subject: 'Feature request: Export to PDF functionality', customer: 'Emma Davis', email: 'emma@globalsolutions.com', category: 'Feature Request', status: 'In Progress', priority: 'Medium', assignee: 'Omar Raza', createdAt: '2026-04-16T09:00:00Z', sla: '18h',
            messages: [{ from: 'customer', name: 'Emma Davis', text: 'Would love to be able to export reports to PDF format.', time: '9:00 AM' }], internalNotes: [], tags: ['export', 'feature'] },
        { id: 'TKT-003', subject: 'Payment processing error on checkout', customer: 'Ryan Park', email: 'ryan@startupflow.com', category: 'Bug', status: 'Open', priority: 'Critical', assignee: 'Ali Hassan', createdAt: '2026-04-17T08:45:00Z', sla: '45m',
            messages: [{ from: 'customer', name: 'Ryan Park', text: 'Checkout is failing with "Payment Error" message.', time: '8:45 AM' }], internalNotes: [], tags: ['payment', 'critical'] },
        { id: 'TKT-004', subject: 'How to configure SSO integration?', customer: 'Sophie Chen', email: 'sophie@enterprisehub.com', category: 'Question', status: 'Pending Customer', priority: 'Low', assignee: 'Fatima Noor', createdAt: '2026-04-15T16:20:00Z', sla: 'Resolved',
            messages: [{ from: 'customer', name: 'Sophie Chen', text: 'Need help setting up SSO.', time: '4:20 PM' }, { from: 'agent', name: 'Fatima Noor', text: 'Please check our docs at /help/sso. Let me know if you need more help.', time: '4:45 PM' }], internalNotes: [], tags: ['sso', 'setup'] },
        { id: 'TKT-005', subject: 'Slow loading times on reports page', customer: 'Mark Wilson', email: 'mark@databridge.io', category: 'Performance', status: 'In Progress', priority: 'High', assignee: 'Abbas Khan', createdAt: '2026-04-14T13:00:00Z', sla: '6h',
            messages: [{ from: 'customer', name: 'Mark Wilson', text: 'Reports page takes 30+ seconds to load.', time: '1:00 PM' }], internalNotes: [], tags: ['performance'] },
        { id: 'TKT-006', subject: 'Billing invoice discrepancy', customer: 'Anna Lee', email: 'anna@cloudpeak.com', category: 'Billing', status: 'Resolved', priority: 'Medium', assignee: 'Sarah Ahmed', createdAt: '2026-04-13T11:30:00Z', sla: 'Resolved',
            messages: [{ from: 'customer', name: 'Anna Lee', text: 'My invoice shows an extra charge.', time: '11:30 AM' }, { from: 'agent', name: 'Sarah Ahmed', text: 'This has been corrected. A refund will appear in 2-3 business days.', time: '2:00 PM' }], internalNotes: [], tags: ['billing'] },
    ]);

    const handleAddTicket = () => {
        setIsModalOpen(true);
    };

    const handleSaveTicket = () => {
        if (!formData.subject) return;
        
        const newTicket = {
            id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
            subject: formData.subject,
            customer: 'New Customer',
            email: 'customer@email.com',
            category: 'Support',
            status: 'Open',
            priority: formData.priority,
            assignee: 'Abbas Khan',
            createdAt: new Date().toISOString(),
            sla: '4h',
            messages: [{ from: 'customer', name: 'New Customer', text: formData.description || 'New ticket created.', time: 'Just now' }],
            internalNotes: [],
            tags: ['new']
        };
        setTickets(prev => [...prev, newTicket]);
        setSelectedTicket(newTicket);
        setIsModalOpen(false);
        setFormData({ subject: '', description: '', priority: 'Medium' });
    };

    const statuses = ['all', 'Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];
    const getStatusColor = (s) => ({ Open: 'var(--danger)', 'In Progress': 'var(--warning)', 'Pending Customer': '#8B5CF6', Resolved: 'var(--success)', Closed: 'var(--text-muted)' }[s] || 'var(--text-muted)');
    const getPriorityColor = (p) => ({ Critical: 'var(--danger)', High: 'var(--warning)', Medium: 'var(--info)', Low: 'var(--text-muted)' }[p] || 'var(--text-muted)');
    const filteredTickets = tickets.filter(t => {
        const match = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch = selectedStatus === 'all' || t.status === selectedStatus;
        return match && statusMatch;
    });

    return (
        <div className="support-dashboard">
            <div className="support-dashboard__header">
                <div><h1>Customer Support</h1><p>Manage support tickets and customer satisfaction</p></div>
                <Button variant="primary" icon={Plus} onClick={handleAddTicket}>New Ticket</Button>
            </div>

            <div className="support-dashboard__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="sup-stat-card glass-card">
                        <div className="sup-stat-card__icon" style={{ background: stat.iconBg, color: stat.iconColor }}><stat.icon size={20} /></div>
                        <div className="sup-stat-card__value">{stat.value}</div>
                        <div className="sup-stat-card__label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="sup-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`sup-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* === TICKETS LIST === */}
            {activeTab === 'tickets' && (
                <div className="sup-section glass-card">
                    <div className="sup-section__header">
                        <div className="sup-search"><Search size={16} /><input placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>)}
                        </select>
                    </div>
                    <table className="sup-table">
                        <thead><tr><th>Ticket #</th><th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th><th>Assignee</th><th>SLA</th></tr></thead>
                        <tbody>
                            {filteredTickets.map(t => (
                                <tr key={t.id} onClick={() => setSelectedTicket(t)} className="sup-table__row">
                                    <td className="sup-ticket-id">{t.id}</td>
                                    <td><strong>{t.subject}</strong></td>
                                    <td>{t.customer}</td>
                                    <td><Badge variant="status" color={getPriorityColor(t.priority)}>{t.priority}</Badge></td>
                                    <td><Badge variant="status" color={getStatusColor(t.status)}>{t.status}</Badge></td>
                                    <td><Avatar name={t.assignee} size="xs" /></td>
                                    <td><span className={`sup-sla ${t.sla === 'Resolved' ? 'resolved' : ''}`}><Timer size={12} /> {t.sla}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === NEW TICKET FORM === */}
            {activeTab === 'new' && (
                <div className="sup-section glass-card">
                    <h2 className="sup-form-title">Create New Ticket</h2>
                    <div className="sup-form">
                        <div className="sup-form-row"><label>Subject</label><input type="text" placeholder="Brief summary of the issue..." /></div>
                        <div className="sup-form-row"><label>Description</label><textarea placeholder="Describe the issue in detail..." rows={5} /></div>
                        <div className="sup-form-grid">
                            <div className="sup-form-row"><label>Priority</label><select><option>Low</option><option>Medium</option><option selected>High</option><option>Critical</option></select></div>
                            <div className="sup-form-row"><label>Category</label><select><option>Bug</option><option>Feature Request</option><option>Question</option><option>Billing</option><option>Performance</option></select></div>
                        </div>
                        <div className="sup-form-row"><label>Attachments</label><div className="sup-upload-area"><Upload size={20} /><span>Click to upload or drag files here</span></div></div>
                        <div className="sup-form-actions"><Button variant="primary" icon={Send}>Submit Ticket</Button><Button variant="ghost">Cancel</Button></div>
                    </div>
                </div>
            )}

            {/* === AGENT DASHBOARD === */}
            {activeTab === 'dashboard' && (
                <div className="sup-dashboard-grid">
                    <div className="sup-metric-card glass-card">
                        <h3>My Open Tickets</h3><div className="sup-metric-big">8</div>
                    </div>
                    <div className="sup-metric-card glass-card">
                        <h3>Avg Response Time</h3><div className="sup-metric-big">1.8h</div>
                    </div>
                    <div className="sup-metric-card glass-card">
                        <h3>SLA Compliance</h3><div className="sup-metric-big sup-metric-green">94%</div>
                    </div>
                    <div className="sup-chart-card glass-card">
                        <h3>Tickets by Status</h3>
                        <div className="sup-donut-chart">
                            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--danger)" strokeWidth="14" strokeDasharray="92 314" transform="rotate(-90 60 60)" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--warning)" strokeWidth="14" strokeDasharray="60 314" strokeDashoffset="-92" transform="rotate(-90 60 60)" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--success)" strokeWidth="14" strokeDasharray="100 314" strokeDashoffset="-152" transform="rotate(-90 60 60)" />
                            </svg>
                            <div className="sup-donut-legend"><span className="sup-legend-open">● Open (23)</span><span className="sup-legend-progress">● In Progress (15)</span><span className="sup-legend-resolved">● Resolved (12)</span></div>
                        </div>
                    </div>
                    <div className="sup-chart-card glass-card">
                        <h3>Recent Activity</h3>
                        <div className="sup-recent-activity">
                            {[
                                { agent: 'Sarah Ahmed', action: 'resolved TKT-006', time: '2h ago' },
                                { agent: 'Abbas Khan', action: 'replied to TKT-005', time: '3h ago' },
                                { agent: 'Ali Hassan', action: 'escalated TKT-003', time: '5h ago' },
                                { agent: 'Fatima Noor', action: 'replied to TKT-004', time: '6h ago' },
                            ].map((a, i) => (
                                <div key={i} className="sup-activity-item"><Avatar name={a.agent} size="xs" /><div><span><strong>{a.agent}</strong> {a.action}</span><span className="sup-activity-time">{a.time}</span></div></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* === TICKET DETAIL === */}
            {selectedTicket && (
                <>
                    <div className="sup-detail-overlay" onClick={() => setSelectedTicket(null)} />
                    <div className="sup-detail-panel glass-elevated">
                        <div className="sup-detail-header">
                            <div><span className="sup-detail-id">{selectedTicket.id}</span><h2>{selectedTicket.subject}</h2></div>
                            <button onClick={() => setSelectedTicket(null)}><X size={18} /></button>
                        </div>
                        <div className="sup-detail-body">
                            <div className="sup-detail-sidebar">
                                <div className="sup-detail-field"><label>Status</label><Badge variant="status" color={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge></div>
                                <div className="sup-detail-field"><label>Priority</label><Badge variant="status" color={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge></div>
                                <div className="sup-detail-field"><label>Assignee</label><div className="sup-assignee"><Avatar name={selectedTicket.assignee} size="sm" /><span>{selectedTicket.assignee}</span></div></div>
                                <div className="sup-detail-field"><label>Tags</label><div className="sup-tags">{selectedTicket.tags.map(t => <span key={t} className="sup-tag">{t}</span>)}</div></div>
                            </div>
                            <div className="sup-detail-thread">
                                <h4>Conversation</h4>
                                {selectedTicket.messages.map((msg, i) => (
                                    <div key={i} className={`sup-message sup-message--${msg.from}`}>
                                        <Avatar name={msg.name} size="sm" />
                                        <div className="sup-message__content">
                                            <div className="sup-message__header"><strong>{msg.name}</strong><span>{msg.time}</span></div>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {selectedTicket.internalNotes.length > 0 && (
                                    <>
                                        <div className="sup-internal-divider"><Lock size={12} /><span>Internal Notes</span></div>
                                        {selectedTicket.internalNotes.map((note, i) => (
                                            <div key={i} className="sup-message sup-message--internal">
                                                <Avatar name={note.name} size="sm" />
                                                <div className="sup-message__content"><div className="sup-message__header"><strong>{note.name}</strong><span>{note.time}</span></div><p>{note.text}</p></div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                <div className="sup-reply-box"><textarea placeholder="Type your reply..." /><div className="sup-reply-actions"><Button variant="primary" size="sm" icon={Send}>Reply</Button><Button variant="ghost" size="sm" icon={Lock}>Internal Note</Button></div></div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Ticket"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveTicket} disabled={!formData.subject}>Create Ticket</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Subject</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. System Access Issue"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Priority</label>
                        <select
                            className="dw-form-input"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Description</label>
                        <textarea
                            className="dw-form-input dw-form-textarea"
                            placeholder="Describe your issue..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Support;
