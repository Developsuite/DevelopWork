import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import {
    Handshake, Plus, TrendingUp, DollarSign, Target, Users, Search, MoreVertical,
    Mail, Phone, Globe, Calendar, ArrowUpRight, FileText, BarChart3, X, MessageCircle,
} from 'lucide-react';
import './Leads.css';

const Leads = () => {
    const [activeTab, setActiveTab] = useState('pipeline');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        company: '',
        value: '',
        contact: ''
    });

    const tabs = [
        { id: 'pipeline', label: 'Pipeline', icon: Target },
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    const stats = [
        { label: 'Total Leads', value: 342, change: '+28', icon: Users, iconBg: 'var(--primary-50)', iconColor: 'var(--primary-500)' },
        { label: 'Qualified', value: 89, change: '+12', icon: Target, iconBg: 'var(--success-light)', iconColor: 'var(--success)' },
        { label: 'Conversion Rate', value: '26%', change: '+4.2%', icon: TrendingUp, iconBg: 'var(--info-light)', iconColor: 'var(--info)' },
        { label: 'Pipeline Value', value: '$1.2M', change: '+18%', icon: DollarSign, iconBg: 'var(--warning-light)', iconColor: 'var(--warning)' },
    ];

    const [leads, setLeads] = useState([
        { id: 1, company: 'TechVision Corp', contact: 'John Miller', email: 'john@techvision.com', phone: '+1 555 0101', source: 'Website', stage: 'Qualified', probability: 60, value: 85000, lastContact: '2026-04-15', rep: 'Abbas Khan', daysInStage: 5, nextAction: 'Follow up call', nextDate: '2026-04-20',
            activity: [{ type: 'call', text: 'Discovery call — 30 min', date: '2026-04-15' }, { type: 'email', text: 'Sent pricing deck', date: '2026-04-12' }] },
        { id: 2, company: 'Global Solutions Ltd', contact: 'Emma Davis', email: 'emma@globalsolutions.com', phone: '+1 555 0102', source: 'Referral', stage: 'Proposal', probability: 80, value: 120000, lastContact: '2026-04-14', rep: 'Sarah Ahmed', daysInStage: 3, nextAction: 'Negotiate terms', nextDate: '2026-04-18',
            activity: [{ type: 'meeting', text: 'Demo presentation', date: '2026-04-14' }, { type: 'email', text: 'Sent proposal document', date: '2026-04-13' }] },
        { id: 3, company: 'StartupFlow Inc', contact: 'Ryan Park', email: 'ryan@startupflow.com', phone: '+1 555 0103', source: 'LinkedIn', stage: 'New Lead', probability: 20, value: 35000, lastContact: '2026-04-16', rep: 'Ali Hassan', daysInStage: 1, nextAction: 'Initial outreach', nextDate: '2026-04-19',
            activity: [{ type: 'note', text: 'Inbound via LinkedIn ad', date: '2026-04-16' }] },
        { id: 4, company: 'Enterprise Hub', contact: 'Sophie Chen', email: 'sophie@enterprisehub.com', phone: '+1 555 0104', source: 'Cold Outreach', stage: 'Contacted', probability: 35, value: 65000, lastContact: '2026-04-13', rep: 'Omar Raza', daysInStage: 4, nextAction: 'Schedule demo', nextDate: '2026-04-21',
            activity: [{ type: 'call', text: 'Cold call — interested', date: '2026-04-13' }] },
        { id: 5, company: 'DataBridge Analytics', contact: 'Mark Wilson', email: 'mark@databridge.io', phone: '+1 555 0105', source: 'Conference', stage: 'Qualified', probability: 55, value: 45000, lastContact: '2026-04-12', rep: 'Abbas Khan', daysInStage: 6, nextAction: 'Technical review', nextDate: '2026-04-22',
            activity: [{ type: 'meeting', text: 'Met at TechConf 2026', date: '2026-04-10' }] },
        { id: 6, company: 'CloudPeak Systems', contact: 'Anna Lee', email: 'anna@cloudpeak.com', phone: '+1 555 0106', source: 'Referral', stage: 'Won', probability: 100, value: 95000, lastContact: '2026-04-10', rep: 'Sarah Ahmed', daysInStage: 0, nextAction: null, nextDate: null,
            activity: [{ type: 'note', text: 'Contract signed!', date: '2026-04-10' }] },
    ]);

    const handleAddLead = () => {
        setIsModalOpen(true);
    };

    const handleSaveLead = () => {
        if (!formData.company) return;
        
        const newLead = {
            id: Date.now(),
            company: formData.company,
            contact: formData.contact || 'New Contact',
            email: 'contact@company.com',
            phone: '+1 555 0000',
            source: 'Manual',
            stage: 'New Lead',
            probability: 10,
            value: parseInt(formData.value) || 0,
            lastContact: new Date().toISOString().split('T')[0],
            rep: 'Abbas Khan',
            daysInStage: 0,
            nextAction: 'First outreach',
            nextDate: null,
            activity: [{ type: 'note', text: 'Lead added manually', date: new Date().toISOString().split('T')[0] }]
        };
        setLeads(prev => [...prev, newLead]);
        setIsModalOpen(false);
        setFormData({ company: '', value: '', contact: '' });
    };

    const stages = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const stageColors = { 'New Lead': '#579BFC', Contacted: '#FDAB3D', Qualified: '#A25DDC', Proposal: '#00C875', Negotiation: '#E09F3E', Won: '#00C875', Lost: '#E2445C' };
    const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
    const sizeClass = (v) => v >= 100000 ? 'large' : v >= 50000 ? 'medium' : 'small';

    const analyticsData = [
        { rep: 'Abbas Khan', won: 8, lost: 2, winRate: 80, avgCycle: 18 },
        { rep: 'Sarah Ahmed', won: 6, lost: 3, winRate: 67, avgCycle: 22 },
        { rep: 'Ali Hassan', won: 4, lost: 1, winRate: 80, avgCycle: 15 },
        { rep: 'Omar Raza', won: 5, lost: 4, winRate: 56, avgCycle: 25 },
    ];

    return (
        <div className="leads-dashboard">
            <div className="leads-dashboard__header">
                <div><h1 className="leads-dashboard__title">Leads Management</h1><p className="leads-dashboard__subtitle">Track and manage your sales pipeline</p></div>
                <Button variant="primary" icon={Plus} onClick={handleAddLead}>Add Lead</Button>
            </div>

            <div className="leads-dashboard__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="leads-stat-card glass-card">
                        <div className="leads-stat-card__icon" style={{ background: stat.iconBg, color: stat.iconColor }}><stat.icon size={20} /></div>
                        <div className="leads-stat-card__value">{stat.value}</div>
                        <div className="leads-stat-card__label">{stat.label}</div>
                        <span className="leads-stat-card__change">{stat.change}</span>
                    </div>
                ))}
            </div>

            <div className="crm-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`crm-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* === PIPELINE KANBAN === */}
            {activeTab === 'pipeline' && (
                <div className="crm-pipeline">
                    {stages.filter(s => s !== 'Lost').map(stage => (
                        <div key={stage} className="crm-pipeline-col">
                            <div className="crm-pipeline-col__header">
                                <span className="crm-pipeline-col__dot" style={{ background: stageColors[stage] }} />
                                <span className="crm-pipeline-col__title">{stage}</span>
                                <span className="crm-pipeline-col__count">{leads.filter(l => l.stage === stage).length}</span>
                            </div>
                            <div className="crm-pipeline-col__body">
                                {leads.filter(l => l.stage === stage).map(lead => (
                                    <div key={lead.id} className={`crm-lead-card glass-card crm-deal-${sizeClass(lead.value)}`} onClick={() => setSelectedLead(lead)}>
                                        <div className="crm-lead-card__company">{lead.company}</div>
                                        <div className="crm-lead-card__contact">{lead.contact}</div>
                                        <div className="crm-lead-card__value">{formatCurrency(lead.value)}</div>
                                        <div className="crm-lead-card__meta">
                                            <span>{lead.probability}%</span>
                                            <span>{lead.daysInStage}d in stage</span>
                                        </div>
                                        <div className="crm-lead-card__rep"><Avatar name={lead.rep} size="xs" /><span>{lead.rep}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* === CONTACTS TABLE === */}
            {activeTab === 'contacts' && (
                <div className="crm-section glass-card">
                    <div className="crm-section__header">
                        <h2>All Contacts</h2>
                        <div className="crm-search"><Search size={16} /><input placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                    </div>
                    <table className="crm-table">
                        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Last Contact</th><th>Status</th><th>Rep</th><th>Actions</th></tr></thead>
                        <tbody>
                            {leads.filter(l => l.contact.toLowerCase().includes(searchQuery.toLowerCase()) || l.company.toLowerCase().includes(searchQuery.toLowerCase())).map(lead => (
                                <tr key={lead.id}>
                                    <td><strong>{lead.contact}</strong></td>
                                    <td>{lead.company}</td>
                                    <td className="crm-email">{lead.email}</td>
                                    <td>{lead.phone}</td>
                                    <td>{new Date(lead.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                    <td><Badge variant="status" color={stageColors[lead.stage]}>{lead.stage}</Badge></td>
                                    <td><Avatar name={lead.rep} size="xs" /></td>
                                    <td className="crm-actions">
                                        <button title="Email"><Mail size={14} /></button>
                                        <button title="Call"><Phone size={14} /></button>
                                        <button title="Note"><MessageCircle size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === ANALYTICS === */}
            {activeTab === 'analytics' && (
                <div className="crm-analytics-grid">
                    <div className="crm-analytics-card glass-card">
                        <h3>Win Rate by Rep</h3>
                        <div className="crm-win-rates">
                            {analyticsData.map(a => (
                                <div key={a.rep} className="crm-win-rate-item">
                                    <div className="crm-win-rate-header"><Avatar name={a.rep} size="sm" /><span>{a.rep}</span><strong>{a.winRate}%</strong></div>
                                    <div className="crm-win-rate-bar"><div className="crm-win-rate-fill" style={{ width: `${a.winRate}%` }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="crm-analytics-card glass-card">
                        <h3>Pipeline Funnel</h3>
                        <div className="crm-funnel">
                            {stages.filter(s => s !== 'Lost' && s !== 'Negotiation').map((stage, i) => {
                                const count = leads.filter(l => l.stage === stage).length;
                                const widthPct = 100 - (i * 15);
                                return (
                                    <div key={stage} className="crm-funnel-stage" style={{ width: `${widthPct}%`, background: stageColors[stage] }}>
                                        <span>{stage}</span><strong>{count}</strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="crm-analytics-card glass-card">
                        <h3>Average Deal Cycle</h3>
                        <div className="crm-cycle-list">
                            {analyticsData.map(a => (
                                <div key={a.rep} className="crm-cycle-item">
                                    <span>{a.rep}</span><strong>{a.avgCycle} days</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* === LEAD DETAIL PANEL === */}
            {selectedLead && (
                <>
                    <div className="crm-detail-overlay" onClick={() => setSelectedLead(null)} />
                    <div className="crm-detail-panel glass-elevated">
                        <div className="crm-detail-panel__header">
                            <h2>{selectedLead.company}</h2>
                            <button onClick={() => setSelectedLead(null)}><X size={18} /></button>
                        </div>
                        <div className="crm-detail-panel__body">
                            <div className="crm-detail-section">
                                <h4>Contact Info</h4>
                                <div className="crm-detail-field"><Mail size={14} /><span>{selectedLead.email}</span></div>
                                <div className="crm-detail-field"><Phone size={14} /><span>{selectedLead.phone}</span></div>
                                <div className="crm-detail-field"><Users size={14} /><span>{selectedLead.contact}</span></div>
                                <div className="crm-detail-field"><Globe size={14} /><span>{selectedLead.source}</span></div>
                            </div>
                            <div className="crm-detail-section">
                                <h4>Deal Info</h4>
                                <div className="crm-detail-deal-value">{formatCurrency(selectedLead.value)}</div>
                                <div className="crm-detail-probability">
                                    <span>Probability</span>
                                    <div className="crm-prob-bar"><div className="crm-prob-fill" style={{ width: `${selectedLead.probability}%` }} /></div>
                                    <span>{selectedLead.probability}%</span>
                                </div>
                                <Badge variant="status" color={stageColors[selectedLead.stage]}>{selectedLead.stage}</Badge>
                            </div>
                            {selectedLead.nextAction && (
                                <div className="crm-detail-section">
                                    <h4>Next Action</h4>
                                    <div className="crm-next-action">
                                        <span>{selectedLead.nextAction}</span>
                                        <span className="crm-next-date"><Calendar size={12} /> {selectedLead.nextDate}</span>
                                    </div>
                                </div>
                            )}
                            <div className="crm-detail-section">
                                <h4>Activity Timeline</h4>
                                <div className="crm-activity-list">
                                    {selectedLead.activity.map((a, i) => (
                                        <div key={i} className="crm-activity-item">
                                            <div className="crm-activity-dot" />
                                            <div><span>{a.text}</span><span className="crm-activity-date">{a.date}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Lead"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveLead} disabled={!formData.company}>Add Lead</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Company Name</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Acme Corp"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Primary Contact</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. John Smith"
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Deal Value ($)</label>
                        <input
                            type="number"
                            className="dw-form-input"
                            placeholder="e.g. 50000"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Leads;
