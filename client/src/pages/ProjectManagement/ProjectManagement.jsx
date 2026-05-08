import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Avatar from '../../components/common/Avatar/Avatar';
import {
    FolderKanban,
    Plus,
    Calendar,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Search,
    MoreVertical,
    Users,
    Target,
    FileText,
    BarChart3,
    ArrowRight,
    Filter,
    UserPlus,
    X,
} from 'lucide-react';
import { mockMembers } from '../../utils/mockData';
import { setCreateModalOpen, assignMember, removeMember } from '../../store/slices/projectSlice';
import { openModal, addToast } from '../../store/slices/uiSlice';
import './ProjectManagement.css';

const ProjectManagement = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const projectList = useSelector((state) => state.project.projects);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [activeAssignId, setActiveAssignId] = useState(null);

    const handleAddTask = () => {
        dispatch(openModal('addTask'));
    };

    const handleGenerateReport = () => {
        dispatch(addToast({
            title: 'Report Generated',
            message: 'Monthly project performance report is ready for download.',
            type: 'success'
        }));
    };

    const handleViewAnalytics = () => {
        dispatch(addToast({
            title: 'Opening Analytics',
            message: 'Redirecting to project analytics dashboard...',
            type: 'info'
        }));
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setActiveAssignId(null);
        if (activeAssignId) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeAssignId]);

    const handleAssign = (e, projectId, memberName) => {
        e.stopPropagation();
        dispatch(assignMember({ projectId, memberName }));
    };

    const handleUnassign = (e, projectId, memberName) => {
        e.stopPropagation();
        dispatch(removeMember({ projectId, memberName }));
    };

    const stats = [
        {
            label: 'Active Projects',
            value: projectList.length,
            change: '+3',
            positive: true,
            icon: FolderKanban,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'Total Tasks',
            value: 186,
            change: '+24',
            positive: true,
            icon: Target,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
        {
            label: 'Completed',
            value: 142,
            change: '+18',
            positive: true,
            icon: CheckCircle2,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Overdue',
            value: 5,
            change: '-2',
            positive: true,
            icon: AlertTriangle,
            iconBg: 'var(--danger-light)',
            iconColor: 'var(--danger)',
        },
    ];

    const handleAddProject = () => {
        dispatch(setCreateModalOpen(true));
    };

    const statuses = ['all', 'Planning', 'In Progress', 'Completed', 'On Hold'];

    const deadlines = [
        { id: 1, title: 'Sprint 24 Review', date: '2026-04-22', project: 'Dashboard Redesign' },
        { id: 2, title: 'API Specification Freeze', date: '2026-04-25', project: 'API Gateway' },
        { id: 3, title: 'Beta Release - Mobile', date: '2026-05-01', project: 'Mobile App' },
    ];

    const filteredProjects = projectList.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'var(--warning)';
            case 'Completed': return 'var(--success)';
            case 'Planning': return 'var(--info)';
            case 'On Hold': return 'var(--text-muted)';
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

    return (
        <div className="pm-dashboard">
            {/* Header */}
            <div className="pm-dashboard__header">
                <div>
                    <h1 className="pm-dashboard__title">Project Management</h1>
                    <p className="pm-dashboard__subtitle">Track and manage all your projects in one place</p>
                </div>
                <div className="pm-dashboard__header-actions">
                    <Button variant="primary" icon={Plus} onClick={handleAddProject}>
                        New Project
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="pm-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="pm-dashboard__stat-card glass-card">
                        <div className="pm-dashboard__stat-header">
                            <div
                                className="pm-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`pm-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="pm-dashboard__stat-value">{stat.value}</div>
                        <div className="pm-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="pm-dashboard__content">
                {/* Main - Project List */}
                <div className="pm-dashboard__main">
                    <div className="pm-dashboard__section glass-card">
                        <div className="pm-dashboard__section-header">
                            <h2 className="pm-dashboard__section-title">All Projects</h2>
                            <div className="pm-dashboard__filters">
                                <div className="pm-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="pm-dashboard__status-filter"
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

                        <div className="pm-dashboard__project-list">
                            {filteredProjects.map((project) => (
                                <div 
                                    key={project.id} 
                                    className={`pm-dashboard__project-card ${activeAssignId === project.id ? 'active-dropdown' : ''}`}
                                    style={{ 
                                        zIndex: activeAssignId === project.id ? 100 : 1,
                                        position: 'relative'
                                    }}
                                >
                                    <div 
                                        className="pm-dashboard__project-main" 
                                        onClick={() => navigate(`/board/board-1`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="pm-dashboard__project-info">
                                            <div className="pm-dashboard__project-name">{project.name}</div>
                                            <div className="pm-dashboard__project-desc">{project.description}</div>
                                            <div className="pm-dashboard__project-meta">
                                                <Badge variant="status" color={getStatusColor(project.status)}>
                                                    {project.status}
                                                </Badge>
                                                <Badge variant="status" color={getPriorityColor(project.priority)}>
                                                    {project.priority}
                                                </Badge>
                                                <span className="pm-dashboard__project-tasks">
                                                    <CheckCircle2 size={12} />
                                                    {project.tasksDone}/{project.tasksTotal} tasks
                                                </span>
                                                <span className="pm-dashboard__project-date">
                                                    <Calendar size={12} />
                                                    {new Date(project.dueDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pm-dashboard__project-right">
                                        <div className="pm-dashboard__project-progress-wrap">
                                            <div className="pm-dashboard__progress-bar">
                                                <div
                                                    className="pm-dashboard__progress-fill"
                                                    style={{
                                                        width: `${project.progress}%`,
                                                        background:
                                                            project.progress === 100
                                                                ? 'var(--success)'
                                                                : project.progress > 60
                                                                    ? 'var(--primary-500)'
                                                                    : 'var(--warning)',
                                                    }}
                                                />
                                            </div>
                                            <span className="pm-dashboard__progress-text">{project.progress}%</span>
                                        </div>
                                        <div className="pm-dashboard__project-members">
                                            {project.members.map((name) => (
                                                <div key={name} className="pm-dashboard__member-wrapper">
                                                    <Avatar name={name} size="xs" />
                                                    <button 
                                                        className="pm-dashboard__member-remove"
                                                        onClick={(e) => handleUnassign(e, project.id, name)}
                                                    >
                                                        <X size={8} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="pm-dashboard__assign-wrap">
                                                <button 
                                                    className="pm-dashboard__member-add"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveAssignId(activeAssignId === project.id ? null : project.id);
                                                    }}
                                                >
                                                    <UserPlus size={12} />
                                                </button>
                                                
                                                {activeAssignId === project.id && (
                                                    <div className="pm-dashboard__assign-dropdown glass-dropdown" onClick={e => e.stopPropagation()}>
                                                        <div className="pm-dashboard__assign-title">Assign Members</div>
                                                        {mockMembers.map(member => {
                                                            const isAssigned = project.members.includes(member.name);
                                                            return (
                                                                <button 
                                                                    key={member._id}
                                                                    className={`pm-dashboard__assign-option ${isAssigned ? 'assigned' : ''}`}
                                                                    onClick={(e) => isAssigned ? handleUnassign(e, project.id, member.name) : handleAssign(e, project.id, member.name)}
                                                                >
                                                                    <Avatar name={member.name} size="xs" />
                                                                    <span>{member.name}</span>
                                                                    {isAssigned && <CheckCircle2 size={12} className="check" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button className="pm-dashboard__project-menu">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="pm-dashboard__sidebar">
                    {/* Upcoming Deadlines */}
                    <div className="pm-dashboard__widget glass-card">
                        <h3 className="pm-dashboard__widget-title">
                            <Clock size={16} />
                            Upcoming Deadlines
                        </h3>
                        <div className="pm-dashboard__deadlines">
                            {deadlines.map((d) => (
                                <div key={d.id} className="pm-dashboard__deadline">
                                    <div className="pm-dashboard__deadline-date">
                                        {new Date(d.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="pm-dashboard__deadline-info">
                                        <div className="pm-dashboard__deadline-title">{d.title}</div>
                                        <div className="pm-dashboard__deadline-project">{d.project}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pm-dashboard__widget glass-card">
                        <h3 className="pm-dashboard__widget-title">
                            <TrendingUp size={16} />
                            Quick Actions
                        </h3>
                        <div className="pm-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={Plus} fullWidth onClick={handleAddProject}>
                                New Project
                            </Button>
                            <Button variant="ghost" size="sm" icon={Target} fullWidth onClick={handleAddTask}>
                                Add Task
                            </Button>
                            <Button variant="ghost" size="sm" icon={FileText} fullWidth onClick={handleGenerateReport}>
                                Generate Report
                            </Button>
                            <Button variant="ghost" size="sm" icon={BarChart3} fullWidth onClick={handleViewAnalytics}>
                                View Analytics
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagement;
