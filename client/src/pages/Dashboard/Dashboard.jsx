import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { mockUser, mockBoards, mockNotifications } from '../../utils/mockData';
import { BOARD_TYPES } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import {
    LayoutDashboard,
    Users,
    DollarSign,
    Handshake,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Plus,
    ListTodo,
    ArrowRight,
} from 'lucide-react';
import './Dashboard.css';

const boardTypeIcons = {
    project: LayoutDashboard,
    hr: Users,
    finance: DollarSign,
    crm: Handshake,
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const stats = [
        {
            label: 'Total Tasks',
            value: 42,
            change: '+8',
            positive: true,
            icon: ListTodo,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'In Progress',
            value: 12,
            change: '+3',
            positive: true,
            icon: Clock,
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
        },
        {
            label: 'Completed',
            value: 24,
            change: '+5',
            positive: true,
            icon: CheckCircle2,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Overdue',
            value: 3,
            change: '-2',
            positive: false,
            icon: AlertTriangle,
            iconBg: 'var(--danger-light)',
            iconColor: 'var(--danger)',
        },
    ];

    return (
        <div className="dashboard">
            {/* Welcome Header */}
            <div className="dashboard__header">
                <h1 className="dashboard__greeting">
                    Good morning, <span>{(user?.name || 'User').split(' ')[0]}</span> 👋
                </h1>
                <p className="dashboard__date">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="dashboard__stat-card glass-card">
                        <div className="dashboard__stat-header">
                            <div
                                className="dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="dashboard__stat-value">{stat.value}</div>
                        <div className="dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Boards */}
            <div className="dashboard__section">
                <div className="dashboard__section-header">
                    <h2 className="dashboard__section-title">Recent Boards</h2>
                    <Button variant="ghost" size="sm" icon={Plus}>
                        New Board
                    </Button>
                </div>
                <div className="dashboard__boards-grid">
                    {mockBoards.map((board) => {
                        const typeInfo = BOARD_TYPES[board.type];
                        const TypeIcon = boardTypeIcons[board.type] || LayoutDashboard;
                        return (
                            <div
                                key={board._id}
                                className="dashboard__board-card glass-card"
                                onClick={() => navigate(`/board/${board._id}`)}
                            >
                                <span
                                    className="dashboard__board-type"
                                    style={{ background: typeInfo.color }}
                                >
                                    <TypeIcon size={12} />
                                    {typeInfo.label}
                                </span>
                                <div className="dashboard__board-name">{board.name}</div>
                                <div className="dashboard__board-meta">
                                    <span className="dashboard__board-meta-item">
                                        <ListTodo size={12} />
                                        {board.columns.length} columns
                                    </span>
                                    <span className="dashboard__board-meta-item">
                                        <Clock size={12} />
                                        Updated 2h ago
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Activity Feed */}
            <div className="dashboard__section">
                <div className="dashboard__section-header">
                    <h2 className="dashboard__section-title">Recent Activity</h2>
                    <Button variant="ghost" size="sm" icon={ArrowRight} iconRight>
                        View all
                    </Button>
                </div>
                <div className="dashboard__activity glass-card" style={{ padding: '8px' }}>
                    {mockNotifications.map((notification) => (
                        <div key={notification._id} className="dashboard__activity-item">
                            <Avatar name="DW" size="sm" />
                            <div className="dashboard__activity-content">
                                <div className="dashboard__activity-text">{notification.message}</div>
                                <div className="dashboard__activity-time">
                                    {formatRelativeTime(notification.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
