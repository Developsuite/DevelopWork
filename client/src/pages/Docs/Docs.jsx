import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import {
    FileText,
    Plus,
    Search,
    Clock,
    Share2,
    Edit3,
    Folder,
    MoreVertical,
    Upload,
    Download,
    Star,
    Eye,
    BookOpen,
    Layout,
    File,
    Image,
    Video,
    Link2,
} from 'lucide-react';
import './Docs.css';

const Docs = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const stats = [
        {
            label: 'Total Documents',
            value: 156,
            change: '+12',
            positive: true,
            icon: FileText,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
        {
            label: 'Shared',
            value: 89,
            change: '+5',
            positive: true,
            icon: Share2,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'Recent Edits',
            value: 24,
            change: '+8',
            positive: true,
            icon: Edit3,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Templates',
            value: 18,
            change: '+2',
            positive: true,
            icon: Layout,
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
        },
    ];

    const documents = [
        {
            id: 1,
            title: 'Product Roadmap 2026',
            category: 'Strategy',
            type: 'document',
            owner: 'Abbas Khan',
            lastEdited: '2026-04-17T14:30:00Z',
            shared: true,
            sharedWith: 12,
            starred: true,
            views: 48,
        },
        {
            id: 2,
            title: 'Engineering Wiki - API Documentation',
            category: 'Technical',
            type: 'wiki',
            owner: 'Ali Hassan',
            lastEdited: '2026-04-16T10:15:00Z',
            shared: true,
            sharedWith: 24,
            starred: false,
            views: 156,
        },
        {
            id: 3,
            title: 'Brand Guidelines v3.0',
            category: 'Design',
            type: 'document',
            owner: 'Sarah Ahmed',
            lastEdited: '2026-04-15T16:45:00Z',
            shared: true,
            sharedWith: 8,
            starred: true,
            views: 32,
        },
        {
            id: 4,
            title: 'Onboarding Checklist',
            category: 'HR',
            type: 'template',
            owner: 'Omar Raza',
            lastEdited: '2026-04-14T09:00:00Z',
            shared: true,
            sharedWith: 18,
            starred: false,
            views: 67,
        },
        {
            id: 5,
            title: 'Quarterly Revenue Report — Q1',
            category: 'Finance',
            type: 'spreadsheet',
            owner: 'Fatima Noor',
            lastEdited: '2026-04-13T11:30:00Z',
            shared: false,
            sharedWith: 3,
            starred: false,
            views: 15,
        },
        {
            id: 6,
            title: 'Meeting Notes — Sprint Retro',
            category: 'General',
            type: 'document',
            owner: 'Abbas Khan',
            lastEdited: '2026-04-17T17:00:00Z',
            shared: true,
            sharedWith: 6,
            starred: false,
            views: 22,
        },
    ];

    const categories = ['all', 'Strategy', 'Technical', 'Design', 'HR', 'Finance', 'General'];

    const recentActivity = [
        { id: 1, user: 'Sarah Ahmed', action: 'edited', doc: 'Brand Guidelines v3.0', time: '2 hours ago' },
        { id: 2, user: 'Ali Hassan', action: 'shared', doc: 'API Documentation', time: '5 hours ago' },
        { id: 3, user: 'Abbas Khan', action: 'created', doc: 'Meeting Notes — Sprint Retro', time: '1 day ago' },
    ];

    const filteredDocs = documents.filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'document': return FileText;
            case 'wiki': return BookOpen;
            case 'template': return Layout;
            case 'spreadsheet': return File;
            default: return FileText;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'document': return 'var(--info)';
            case 'wiki': return '#8B5CF6';
            case 'template': return 'var(--warning)';
            case 'spreadsheet': return 'var(--success)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div className="docs-dashboard">
            {/* Header */}
            <div className="docs-dashboard__header">
                <div>
                    <h1 className="docs-dashboard__title">Documentation</h1>
                    <p className="docs-dashboard__subtitle">Create, collaborate, and share your team's knowledge</p>
                </div>
                <div className="docs-dashboard__header-actions">
                    <Button variant="ghost" icon={Upload}>
                        Upload
                    </Button>
                    <Button variant="primary" icon={Plus}>
                        New Document
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="docs-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="docs-dashboard__stat-card glass-card">
                        <div className="docs-dashboard__stat-header">
                            <div
                                className="docs-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`docs-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="docs-dashboard__stat-value">{stat.value}</div>
                        <div className="docs-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="docs-dashboard__content">
                {/* Main */}
                <div className="docs-dashboard__main">
                    <div className="docs-dashboard__section glass-card">
                        <div className="docs-dashboard__section-header">
                            <h2 className="docs-dashboard__section-title">All Documents</h2>
                            <div className="docs-dashboard__filters">
                                <div className="docs-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="docs-dashboard__category-filter"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c === 'all' ? 'All Categories' : c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="docs-dashboard__doc-list">
                            {filteredDocs.map((doc) => {
                                const TypeIcon = getTypeIcon(doc.type);
                                return (
                                    <div key={doc.id} className="docs-dashboard__doc-card">
                                        <div className="docs-dashboard__doc-main">
                                            <div
                                                className="docs-dashboard__doc-icon"
                                                style={{
                                                    background: `${getTypeColor(doc.type)}15`,
                                                    color: getTypeColor(doc.type),
                                                }}
                                            >
                                                <TypeIcon size={18} />
                                            </div>
                                            <div className="docs-dashboard__doc-info">
                                                <div className="docs-dashboard__doc-title">
                                                    {doc.starred && <Star size={14} className="docs-dashboard__star" />}
                                                    {doc.title}
                                                </div>
                                                <div className="docs-dashboard__doc-meta">
                                                    <span><Clock size={12} />
                                                        {new Date(doc.lastEdited).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                    <span><Eye size={12} />{doc.views} views</span>
                                                    {doc.shared && (
                                                        <span><Share2 size={12} />{doc.sharedWith} people</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="docs-dashboard__doc-details">
                                            <Badge variant="default">{doc.category}</Badge>
                                            <Badge variant="status" color={getTypeColor(doc.type)}>
                                                {doc.type}
                                            </Badge>
                                            <Avatar name={doc.owner} size="xs" />
                                            <button className="docs-dashboard__doc-menu">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="docs-dashboard__sidebar">
                    {/* Recent Activity */}
                    <div className="docs-dashboard__widget glass-card">
                        <h3 className="docs-dashboard__widget-title">
                            <Clock size={16} />
                            Recent Activity
                        </h3>
                        <div className="docs-dashboard__activity">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="docs-dashboard__activity-item">
                                    <Avatar name={activity.user} size="xs" />
                                    <div className="docs-dashboard__activity-info">
                                        <div className="docs-dashboard__activity-text">
                                            <strong>{activity.user}</strong> {activity.action} "{activity.doc}"
                                        </div>
                                        <div className="docs-dashboard__activity-time">{activity.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="docs-dashboard__widget glass-card">
                        <h3 className="docs-dashboard__widget-title">
                            <Edit3 size={16} />
                            Quick Actions
                        </h3>
                        <div className="docs-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={Plus} fullWidth>New Document</Button>
                            <Button variant="ghost" size="sm" icon={Upload} fullWidth>Upload File</Button>
                            <Button variant="ghost" size="sm" icon={Layout} fullWidth>Templates</Button>
                            <Button variant="ghost" size="sm" icon={Download} fullWidth>Export All</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
