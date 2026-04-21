import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import {
    Headphones,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Search,
    MoreVertical,
    MessageCircle,
    Tag,
    Calendar,
    Timer,
    FileText,
    BarChart3,
    ArrowUpRight,
    User,
} from 'lucide-react';
import './Support.css';

const Support = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');

    const stats = [
        {
            label: 'Open Tickets',
            value: 23,
            change: '+5',
            positive: false,
            icon: AlertCircle,
            iconBg: 'var(--danger-light)',
            iconColor: 'var(--danger)',
        },
        {
            label: 'In Progress',
            value: 15,
            change: '+3',
            positive: true,
            icon: Clock,
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
        },
        {
            label: 'Resolved Today',
            value: 12,
            change: '+8',
            positive: true,
            icon: CheckCircle2,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Avg Response',
            value: '2.4h',
            change: '-0.8h',
            positive: true,
            icon: Timer,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
    ];

    const tickets = [
        {
            id: 'TKT-001',
            subject: 'Unable to access dashboard after update',
            customer: 'John Miller',
            customerEmail: 'john@techvision.com',
            category: 'Bug',
            status: 'Open',
            priority: 'High',
            assignee: 'Sarah Ahmed',
            createdAt: '2026-04-17T10:30:00Z',
            lastReply: '2026-04-17T14:15:00Z',
        },
        {
            id: 'TKT-002',
            subject: 'Feature request: Export to PDF functionality',
            customer: 'Emma Davis',
            customerEmail: 'emma@globalsolutions.com',
            category: 'Feature Request',
            status: 'In Progress',
            priority: 'Medium',
            assignee: 'Omar Raza',
            createdAt: '2026-04-16T09:00:00Z',
            lastReply: '2026-04-17T11:30:00Z',
        },
        {
            id: 'TKT-003',
            subject: 'Payment processing error on checkout',
            customer: 'Ryan Park',
            customerEmail: 'ryan@startupflow.com',
            category: 'Bug',
            status: 'Open',
            priority: 'Critical',
            assignee: 'Ali Hassan',
            createdAt: '2026-04-17T08:45:00Z',
            lastReply: null,
        },
        {
            id: 'TKT-004',
            subject: 'How to configure SSO integration?',
            customer: 'Sophie Chen',
            customerEmail: 'sophie@enterprisehub.com',
            category: 'Question',
            status: 'Waiting',
            priority: 'Low',
            assignee: 'Fatima Noor',
            createdAt: '2026-04-15T16:20:00Z',
            lastReply: '2026-04-16T09:45:00Z',
        },
        {
            id: 'TKT-005',
            subject: 'Slow loading times on reports page',
            customer: 'Mark Wilson',
            customerEmail: 'mark@databridge.io',
            category: 'Performance',
            status: 'In Progress',
            priority: 'High',
            assignee: 'Abbas Khan',
            createdAt: '2026-04-14T13:00:00Z',
            lastReply: '2026-04-17T10:00:00Z',
        },
        {
            id: 'TKT-006',
            subject: 'Billing invoice discrepancy',
            customer: 'Anna Lee',
            customerEmail: 'anna@cloudpeak.com',
            category: 'Billing',
            status: 'Resolved',
            priority: 'Medium',
            assignee: 'Sarah Ahmed',
            createdAt: '2026-04-13T11:30:00Z',
            lastReply: '2026-04-15T14:00:00Z',
        },
    ];

    const statuses = ['all', 'Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'];
    const priorities = ['all', 'Critical', 'High', 'Medium', 'Low'];

    const slaOverview = [
        { metric: 'First Response', target: '< 1hr', actual: '45min', status: 'met' },
        { metric: 'Resolution Time', target: '< 24hr', actual: '18hr', status: 'met' },
        { metric: 'Customer Satisfaction', target: '> 90%', actual: '94%', status: 'met' },
        { metric: 'Escalation Rate', target: '< 5%', actual: '3.2%', status: 'met' },
    ];

    const filteredTickets = tickets.filter((t) => {
        const matchesSearch =
            t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
        const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'var(--danger)';
            case 'In Progress': return 'var(--warning)';
            case 'Waiting': return '#8B5CF6';
            case 'Resolved': return 'var(--success)';
            case 'Closed': return 'var(--text-muted)';
            default: return 'var(--text-muted)';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'var(--danger)';
            case 'High': return 'var(--warning)';
            case 'Medium': return 'var(--info)';
            case 'Low': return 'var(--text-muted)';
            default: return 'var(--text-muted)';
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Bug': return 'var(--danger)';
            case 'Feature Request': return '#8B5CF6';
            case 'Question': return 'var(--info)';
            case 'Performance': return 'var(--warning)';
            case 'Billing': return 'var(--success)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="support-dashboard">
            {/* Header */}
            <div className="support-dashboard__header">
                <div>
                    <h1 className="support-dashboard__title">Customer Support</h1>
                    <p className="support-dashboard__subtitle">Manage support tickets and customer satisfaction</p>
                </div>
                <div className="support-dashboard__header-actions">
                    <Button variant="primary" icon={Plus}>
                        New Ticket
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="support-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="support-dashboard__stat-card glass-card">
                        <div className="support-dashboard__stat-header">
                            <div
                                className="support-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`support-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="support-dashboard__stat-value">{stat.value}</div>
                        <div className="support-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="support-dashboard__content">
                {/* Main */}
                <div className="support-dashboard__main">
                    <div className="support-dashboard__section glass-card">
                        <div className="support-dashboard__section-header">
                            <h2 className="support-dashboard__section-title">Support Tickets</h2>
                            <div className="support-dashboard__filters">
                                <div className="support-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="support-dashboard__filter"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    {statuses.map((s) => (
                                        <option key={s} value={s}>
                                            {s === 'all' ? 'All Statuses' : s}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="support-dashboard__filter"
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value)}
                                >
                                    {priorities.map((p) => (
                                        <option key={p} value={p}>
                                            {p === 'all' ? 'All Priorities' : p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="support-dashboard__ticket-list">
                            {filteredTickets.map((ticket) => (
                                <div key={ticket.id} className="support-dashboard__ticket-card">
                                    <div className="support-dashboard__ticket-main">
                                        <div className="support-dashboard__ticket-id">{ticket.id}</div>
                                        <div className="support-dashboard__ticket-info">
                                            <div className="support-dashboard__ticket-subject">{ticket.subject}</div>
                                            <div className="support-dashboard__ticket-meta">
                                                <span><User size={12} />{ticket.customer}</span>
                                                <span><Tag size={12} />{ticket.category}</span>
                                                <span>
                                                    <Calendar size={12} />
                                                    {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="support-dashboard__ticket-details">
                                        <Badge variant="status" color={getCategoryColor(ticket.category)}>
                                            {ticket.category}
                                        </Badge>
                                        <Badge variant="status" color={getPriorityColor(ticket.priority)}>
                                            {ticket.priority}
                                        </Badge>
                                        <Badge variant="status" color={getStatusColor(ticket.status)}>
                                            {ticket.status}
                                        </Badge>
                                        <Avatar name={ticket.assignee} size="xs" />
                                        <button className="support-dashboard__ticket-menu">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="support-dashboard__sidebar">
                    {/* SLA Overview */}
                    <div className="support-dashboard__widget glass-card">
                        <h3 className="support-dashboard__widget-title">
                            <TrendingUp size={16} />
                            SLA Overview
                        </h3>
                        <div className="support-dashboard__sla">
                            {slaOverview.map((sla) => (
                                <div key={sla.metric} className="support-dashboard__sla-item">
                                    <div className="support-dashboard__sla-header">
                                        <span className="support-dashboard__sla-metric">{sla.metric}</span>
                                        <CheckCircle2 size={14} className="support-dashboard__sla-check" />
                                    </div>
                                    <div className="support-dashboard__sla-values">
                                        <span className="support-dashboard__sla-actual">{sla.actual}</span>
                                        <span className="support-dashboard__sla-target">Target: {sla.target}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="support-dashboard__widget glass-card">
                        <h3 className="support-dashboard__widget-title">
                            <ArrowUpRight size={16} />
                            Quick Actions
                        </h3>
                        <div className="support-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={Plus} fullWidth>New Ticket</Button>
                            <Button variant="ghost" size="sm" icon={MessageCircle} fullWidth>Canned Responses</Button>
                            <Button variant="ghost" size="sm" icon={FileText} fullWidth>Generate Report</Button>
                            <Button variant="ghost" size="sm" icon={BarChart3} fullWidth>Analytics</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
