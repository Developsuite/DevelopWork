import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import {
    Handshake,
    Plus,
    TrendingUp,
    DollarSign,
    Target,
    Users,
    Search,
    MoreVertical,
    Mail,
    Phone,
    Globe,
    Calendar,
    ArrowUpRight,
    FileText,
    BarChart3,
    Filter,
} from 'lucide-react';
import './Leads.css';

const Leads = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const stats = [
        {
            label: 'Total Leads',
            value: 342,
            change: '+28',
            positive: true,
            icon: Users,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'Qualified',
            value: 89,
            change: '+12',
            positive: true,
            icon: Target,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Conversion Rate',
            value: '26%',
            change: '+4.2%',
            positive: true,
            icon: TrendingUp,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
        {
            label: 'Pipeline Value',
            value: '$1.2M',
            change: '+18%',
            positive: true,
            icon: DollarSign,
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
        },
    ];

    const leads = [
        {
            id: 1,
            name: 'TechVision Corp',
            contact: 'John Miller',
            email: 'john@techvision.com',
            phone: '+1 555 0101',
            source: 'Website',
            status: 'Qualified',
            priority: 'High',
            value: 85000,
            lastContact: '2026-04-15',
        },
        {
            id: 2,
            name: 'Global Solutions Ltd',
            contact: 'Emma Davis',
            email: 'emma@globalsolutions.com',
            phone: '+1 555 0102',
            source: 'Referral',
            status: 'Proposal',
            priority: 'Critical',
            value: 120000,
            lastContact: '2026-04-14',
        },
        {
            id: 3,
            name: 'StartupFlow Inc',
            contact: 'Ryan Park',
            email: 'ryan@startupflow.com',
            phone: '+1 555 0103',
            source: 'LinkedIn',
            status: 'New Lead',
            priority: 'Medium',
            value: 35000,
            lastContact: '2026-04-16',
        },
        {
            id: 4,
            name: 'Enterprise Hub',
            contact: 'Sophie Chen',
            email: 'sophie@enterprisehub.com',
            phone: '+1 555 0104',
            source: 'Website',
            status: 'Contacted',
            priority: 'High',
            value: 65000,
            lastContact: '2026-04-13',
        },
        {
            id: 5,
            name: 'DataBridge Analytics',
            contact: 'Mark Wilson',
            email: 'mark@databridge.io',
            phone: '+1 555 0105',
            source: 'Conference',
            status: 'Qualified',
            priority: 'Medium',
            value: 45000,
            lastContact: '2026-04-12',
        },
        {
            id: 6,
            name: 'CloudPeak Systems',
            contact: 'Anna Lee',
            email: 'anna@cloudpeak.com',
            phone: '+1 555 0106',
            source: 'Referral',
            status: 'Closed Won',
            priority: 'High',
            value: 95000,
            lastContact: '2026-04-10',
        },
    ];

    const statuses = ['all', 'New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];

    const pipelineSummary = [
        { stage: 'New Leads', count: 45, value: '$340K', color: 'var(--info)' },
        { stage: 'Contacted', count: 32, value: '$280K', color: 'var(--warning)' },
        { stage: 'Qualified', count: 89, value: '$1.2M', color: 'var(--primary-500)' },
        { stage: 'Proposal', count: 18, value: '$450K', color: '#8B5CF6' },
        { stage: 'Won', count: 24, value: '$620K', color: 'var(--success)' },
    ];

    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contact.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New Lead': return 'var(--info)';
            case 'Contacted': return 'var(--warning)';
            case 'Qualified': return 'var(--primary-500)';
            case 'Proposal': return '#8B5CF6';
            case 'Closed Won': return 'var(--success)';
            case 'Closed Lost': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="leads-dashboard">
            {/* Header */}
            <div className="leads-dashboard__header">
                <div>
                    <h1 className="leads-dashboard__title">Leads Management</h1>
                    <p className="leads-dashboard__subtitle">Track and manage your sales pipeline</p>
                </div>
                <div className="leads-dashboard__header-actions">
                    <Button variant="primary" icon={Plus}>
                        Add Lead
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="leads-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="leads-dashboard__stat-card glass-card">
                        <div className="leads-dashboard__stat-header">
                            <div
                                className="leads-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`leads-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                <TrendingUp size={14} />
                                {stat.change}
                            </span>
                        </div>
                        <div className="leads-dashboard__stat-value">{stat.value}</div>
                        <div className="leads-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="leads-dashboard__content">
                {/* Main */}
                <div className="leads-dashboard__main">
                    <div className="leads-dashboard__section glass-card">
                        <div className="leads-dashboard__section-header">
                            <h2 className="leads-dashboard__section-title">Lead Pipeline</h2>
                            <div className="leads-dashboard__filters">
                                <div className="leads-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search leads..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="leads-dashboard__status-filter"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    {statuses.map((s) => (
                                        <option key={s} value={s}>
                                            {s === 'all' ? 'All Statuses' : s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="leads-dashboard__lead-list">
                            {filteredLeads.map((lead) => (
                                <div key={lead.id} className="leads-dashboard__lead-card">
                                    <div className="leads-dashboard__lead-main">
                                        <div className="leads-dashboard__lead-avatar">
                                            <Handshake size={18} />
                                        </div>
                                        <div className="leads-dashboard__lead-info">
                                            <div className="leads-dashboard__lead-name">{lead.name}</div>
                                            <div className="leads-dashboard__lead-contact">{lead.contact}</div>
                                            <div className="leads-dashboard__lead-meta">
                                                <span><Mail size={12} />{lead.email}</span>
                                                <span><Phone size={12} />{lead.phone}</span>
                                                <span><Globe size={12} />{lead.source}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="leads-dashboard__lead-details">
                                        <div className="leads-dashboard__lead-value">
                                            {formatCurrency(lead.value)}
                                        </div>
                                        <Badge variant="status" color={getStatusColor(lead.status)}>
                                            {lead.status}
                                        </Badge>
                                        <span className="leads-dashboard__lead-date">
                                            <Calendar size={12} />
                                            {new Date(lead.lastContact).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                        <button className="leads-dashboard__lead-menu">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="leads-dashboard__sidebar">
                    {/* Pipeline Summary */}
                    <div className="leads-dashboard__widget glass-card">
                        <h3 className="leads-dashboard__widget-title">
                            <BarChart3 size={16} />
                            Pipeline Summary
                        </h3>
                        <div className="leads-dashboard__pipeline">
                            {pipelineSummary.map((stage) => (
                                <div key={stage.stage} className="leads-dashboard__pipeline-item">
                                    <div className="leads-dashboard__pipeline-header">
                                        <span className="leads-dashboard__pipeline-stage">
                                            <span
                                                className="leads-dashboard__pipeline-dot"
                                                style={{ background: stage.color }}
                                            />
                                            {stage.stage}
                                        </span>
                                        <span className="leads-dashboard__pipeline-count">{stage.count}</span>
                                    </div>
                                    <div className="leads-dashboard__pipeline-value">{stage.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="leads-dashboard__widget glass-card">
                        <h3 className="leads-dashboard__widget-title">
                            <ArrowUpRight size={16} />
                            Quick Actions
                        </h3>
                        <div className="leads-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={Plus} fullWidth>Import Leads</Button>
                            <Button variant="ghost" size="sm" icon={FileText} fullWidth>Export Report</Button>
                            <Button variant="ghost" size="sm" icon={Mail} fullWidth>Email Campaign</Button>
                            <Button variant="ghost" size="sm" icon={BarChart3} fullWidth>Analytics</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leads;
