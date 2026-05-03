import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
    addTeamToModule,
    removeTeamFromModule,
    addTeamMember,
    removeTeamMember,
} from '../../store/slices/accessSlice';
import { DEPARTMENT_MODULES } from '../../utils/constants';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import {
    Users,
    UserPlus,
    DollarSign,
    FolderKanban,
    Handshake,
    Headphones,
    FileText,
    TrendingUp,
    TrendingDown,
    Plus,
    Trash2,
    Search,
    Calendar,
    Clock,
    Activity,
    Target,
    CheckCircle2,
    AlertTriangle,
    Briefcase,
    CreditCard,
    MessageCircle,
    Star,
    Zap,
    ArrowUpRight,
    X,
    BarChart3,
    UsersRound,
    Shield,
    Award,
    FileBarChart,
    Phone,
} from 'lucide-react';
import './ManagerDashboard.css';

// Module-specific stats configuration
const MODULE_STATS = {
    projects: [
        { label: 'Active Sprints', value: 3, change: '+1', positive: true, icon: Target, gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)' },
        { label: 'Total Tasks', value: 47, change: '+12', positive: true, icon: FolderKanban, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
        { label: 'Completed', value: 28, change: '+5', positive: true, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'Overdue', value: 4, change: '-2', positive: true, icon: AlertTriangle, gradient: 'linear-gradient(135deg, #E2445C, #EF4444)' },
    ],
    hr: [
        { label: 'Total Employees', value: 248, change: '+12', positive: true, icon: Users, gradient: 'linear-gradient(135deg, #A25DDC, #8B5CF6)' },
        { label: 'New Hires', value: 8, change: '+3', positive: true, icon: UserPlus, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'On Leave', value: 15, change: '+2', positive: false, icon: Calendar, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
        { label: 'Open Positions', value: 6, change: '-1', positive: true, icon: Briefcase, gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)' },
    ],
    finance: [
        { label: 'Total Revenue', value: '$284K', change: '+18%', positive: true, icon: DollarSign, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'Expenses', value: '$142K', change: '+5%', positive: false, icon: CreditCard, gradient: 'linear-gradient(135deg, #E2445C, #EF4444)' },
        { label: 'Profit Margin', value: '50%', change: '+3%', positive: true, icon: TrendingUp, gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)' },
        { label: 'Pending Invoices', value: 12, change: '-4', positive: true, icon: FileBarChart, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
    ],
    leads: [
        { label: 'Total Leads', value: 156, change: '+23', positive: true, icon: Handshake, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
        { label: 'Qualified', value: 42, change: '+8', positive: true, icon: Star, gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)' },
        { label: 'Conversion Rate', value: '27%', change: '+4%', positive: true, icon: TrendingUp, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'Lost Leads', value: 18, change: '-3', positive: true, icon: TrendingDown, gradient: 'linear-gradient(135deg, #E2445C, #EF4444)' },
    ],
    support: [
        { label: 'Open Tickets', value: 34, change: '+8', positive: false, icon: MessageCircle, gradient: 'linear-gradient(135deg, #E2445C, #EF4444)' },
        { label: 'Resolved Today', value: 12, change: '+5', positive: true, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'Avg Response', value: '2.4h', change: '-0.5h', positive: true, icon: Clock, gradient: 'linear-gradient(135deg, #579BFC, #3B82F6)' },
        { label: 'Satisfaction', value: '94%', change: '+2%', positive: true, icon: Star, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
    ],
    docs: [
        { label: 'Total Documents', value: 132, change: '+15', positive: true, icon: FileText, gradient: 'linear-gradient(135deg, #0EA5E9, #06B6D4)' },
        { label: 'Published', value: 98, change: '+8', positive: true, icon: CheckCircle2, gradient: 'linear-gradient(135deg, #00C875, #10B981)' },
        { label: 'In Draft', value: 34, change: '+7', positive: false, icon: Clock, gradient: 'linear-gradient(135deg, #FDAB3D, #F59E0B)' },
        { label: 'Contributors', value: 18, change: '+3', positive: true, icon: Users, gradient: 'linear-gradient(135deg, #A25DDC, #8B5CF6)' },
    ],
};

// Module-specific recent activity
const MODULE_ACTIVITY = {
    projects: [
        { id: 1, text: 'Sprint 24 completed — 18 tasks delivered', time: '2 hours ago', type: 'success' },
        { id: 2, text: 'New task assigned: "Implement auth flow"', time: '4 hours ago', type: 'info' },
        { id: 3, text: 'Code review requested by Hina Tariq', time: '5 hours ago', type: 'warning' },
        { id: 4, text: 'Milestone "Beta Launch" marked 80% complete', time: '1 day ago', type: 'info' },
    ],
    hr: [
        { id: 1, text: 'Zara Sheikh joined Recruitment Cell team', time: '1 hour ago', type: 'success' },
        { id: 2, text: 'Performance review cycle starting Apr 10', time: '3 hours ago', type: 'warning' },
        { id: 3, text: '3 leave requests pending approval', time: '5 hours ago', type: 'info' },
        { id: 4, text: 'New job posting: Senior Developer', time: '1 day ago', type: 'info' },
    ],
    finance: [
        { id: 1, text: 'Invoice #1042 — $12,500 payment received', time: '30 min ago', type: 'success' },
        { id: 2, text: 'Budget exceeded for Marketing department', time: '2 hours ago', type: 'warning' },
        { id: 3, text: 'Monthly expense report generated', time: '4 hours ago', type: 'info' },
        { id: 4, text: 'New vendor payment approved: $8,200', time: '1 day ago', type: 'success' },
    ],
    leads: [
        { id: 1, text: 'TechCorp deal moved to "Proposal" stage', time: '1 hour ago', type: 'success' },
        { id: 2, text: '5 new leads imported from campaign', time: '3 hours ago', type: 'info' },
        { id: 3, text: 'Follow-up reminder: DataVault Inc.', time: '5 hours ago', type: 'warning' },
        { id: 4, text: 'Lead scoring model updated', time: '1 day ago', type: 'info' },
    ],
    support: [
        { id: 1, text: 'Ticket #892 escalated to Priority 1', time: '45 min ago', type: 'warning' },
        { id: 2, text: '6 tickets resolved this morning', time: '2 hours ago', type: 'success' },
        { id: 3, text: 'Knowledge base article updated: "API Guide"', time: '4 hours ago', type: 'info' },
        { id: 4, text: 'Customer satisfaction survey sent to 120 users', time: '1 day ago', type: 'info' },
    ],
    docs: [
        { id: 1, text: '"API Documentation v2.0" published', time: '1 hour ago', type: 'success' },
        { id: 2, text: '3 documents pending review', time: '3 hours ago', type: 'warning' },
        { id: 3, text: 'New template created: "Meeting Notes"', time: '5 hours ago', type: 'info' },
        { id: 4, text: 'Collaboration invite sent to 5 team members', time: '1 day ago', type: 'info' },
    ],
};

// Module-specific quick actions
const MODULE_ACTIONS = {
    projects: ['Create Task', 'Start Sprint', 'View Board', 'Assign Member'],
    hr: ['Add Employee', 'Post Job', 'Process Payroll', 'Leave Requests'],
    finance: ['Create Invoice', 'Add Expense', 'Generate Report', 'View Budget'],
    leads: ['Add Lead', 'Import Leads', 'Send Campaign', 'View Pipeline'],
    support: ['Create Ticket', 'Start Chat', 'Update FAQ', 'View Reports'],
    docs: ['New Document', 'Create Template', 'Upload File', 'Share Document'],
};

const iconMap = {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
};

const ManagerDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { managers } = useSelector((state) => state.access);

    const moduleKey = user?.assignedModule;
    const moduleInfo = DEPARTMENT_MODULES.find((m) => m.key === moduleKey);
    const managerData = managers.find(
        (m) => m.email === user?.email && m.assignedModule === moduleKey
    );

    const stats = MODULE_STATS[moduleKey] || [];
    const activity = MODULE_ACTIVITY[moduleKey] || [];
    const quickActions = MODULE_ACTIONS[moduleKey] || [];

    // Team management state
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [showAddMember, setShowAddMember] = useState(null); // teamId or null
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddTeam = () => {
        if (!newTeamName.trim() || !managerData) return;
        dispatch(addTeamToModule({
            managerId: managerData.id,
            teamName: newTeamName.trim(),
        }));
        setNewTeamName('');
        setShowAddTeam(false);
    };

    const handleRemoveTeam = (teamId) => {
        if (!managerData) return;
        dispatch(removeTeamFromModule({
            managerId: managerData.id,
            teamId,
        }));
    };

    const handleAddMember = (teamId) => {
        if (!newMemberName.trim() || !newMemberEmail.trim() || !managerData) return;
        dispatch(addTeamMember({
            managerId: managerData.id,
            teamId,
            member: {
                name: newMemberName.trim(),
                email: newMemberEmail.trim(),
                role: newMemberRole.trim() || 'Member',
            },
        }));
        setNewMemberName('');
        setNewMemberEmail('');
        setNewMemberRole('');
        setShowAddMember(null);
    };

    const handleRemoveMember = (teamId, memberId) => {
        if (!managerData) return;
        dispatch(removeTeamMember({
            managerId: managerData.id,
            teamId,
            memberId,
        }));
    };

    const totalMembers = managerData?.teams?.reduce(
        (sum, team) => sum + team.members.length, 0
    ) || 0;

    const ModuleIcon = moduleInfo ? (iconMap[moduleInfo.icon] || FileText) : Shield;

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="mgr-dash">
            {/* Hero Header */}
            <div className="mgr-dash__hero">
                <div className="mgr-dash__hero-content">
                    <div className="mgr-dash__hero-greeting">
                        <h1 className="mgr-dash__title">
                            {greeting}, <span>{user?.name?.split(' ')[0]}</span> 👋
                        </h1>
                        <p className="mgr-dash__subtitle">
                            Welcome to your {moduleInfo?.label} dashboard. Here's what's happening today.
                        </p>
                    </div>
                    <div className="mgr-dash__hero-meta">
                        <div className="mgr-dash__hero-date">
                            <Calendar size={14} />
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </div>
                        <Badge variant="status" color={moduleInfo?.color}>
                            <Shield size={10} />
                            Manager Access
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mgr-dash__stats">
                {stats.map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="mgr-dash__stat-card glass-card"
                            style={{ animationDelay: `${idx * 0.08}s` }}
                        >
                            <div className="mgr-dash__stat-header">
                                <div
                                    className="mgr-dash__stat-icon"
                                    style={{ background: stat.gradient }}
                                >
                                    <StatIcon size={20} color="#fff" />
                                </div>
                                <span className={`mgr-dash__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                    {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {stat.change}
                                </span>
                            </div>
                            <div className="mgr-dash__stat-value">{stat.value}</div>
                            <div className="mgr-dash__stat-label">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content — 2 columns */}
            <div className="mgr-dash__content">
                {/* Left Column — Teams Management */}
                <div className="mgr-dash__primary">
                    {/* Teams Section */}
                    <div className="mgr-dash__section glass-card">
                        <div className="mgr-dash__section-header">
                            <div className="mgr-dash__section-title-group">
                                <UsersRound size={18} style={{ color: moduleInfo?.color }} />
                                <h2 className="mgr-dash__section-title">Team Management</h2>
                                <Badge variant="default">{managerData?.teams?.length || 0} teams</Badge>
                                <Badge variant="status" color="var(--info)">{totalMembers} members</Badge>
                            </div>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => setShowAddTeam(true)}
                            >
                                Add Team
                            </Button>
                        </div>

                        {/* Add Team Form */}
                        {showAddTeam && (
                            <div className="mgr-dash__add-form">
                                <input
                                    type="text"
                                    className="mgr-dash__input glass-input"
                                    placeholder="Enter team name..."
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                                    autoFocus
                                />
                                <Button variant="primary" onClick={handleAddTeam}>Create</Button>
                                <Button variant="ghost" onClick={() => { setShowAddTeam(false); setNewTeamName(''); }}>Cancel</Button>
                            </div>
                        )}

                        {/* Teams List */}
                        <div className="mgr-dash__teams">
                            {(!managerData?.teams || managerData.teams.length === 0) ? (
                                <div className="mgr-dash__empty">
                                    <UsersRound size={36} />
                                    <p>No teams created yet</p>
                                    <span>Create your first team to start managing members</span>
                                </div>
                            ) : (
                                managerData.teams.map((team) => (
                                    <div key={team.id} className="mgr-dash__team-card">
                                        <div className="mgr-dash__team-header">
                                            <div className="mgr-dash__team-info">
                                                <div
                                                    className="mgr-dash__team-dot"
                                                    style={{ background: moduleInfo?.color }}
                                                />
                                                <h3 className="mgr-dash__team-name">{team.name}</h3>
                                                <Badge variant="default">{team.members.length} members</Badge>
                                            </div>
                                            <div className="mgr-dash__team-actions">
                                                <button
                                                    className="mgr-dash__icon-btn add"
                                                    onClick={() => setShowAddMember(
                                                        showAddMember === team.id ? null : team.id
                                                    )}
                                                    title="Add member"
                                                >
                                                    <UserPlus size={14} />
                                                </button>
                                                <button
                                                    className="mgr-dash__icon-btn delete"
                                                    onClick={() => handleRemoveTeam(team.id)}
                                                    title="Remove team"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Add Member Form */}
                                        {showAddMember === team.id && (
                                            <div className="mgr-dash__add-member-form">
                                                <div className="mgr-dash__add-member-row">
                                                    <input
                                                        type="text"
                                                        className="mgr-dash__input glass-input"
                                                        placeholder="Full name"
                                                        value={newMemberName}
                                                        onChange={(e) => setNewMemberName(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="email"
                                                        className="mgr-dash__input glass-input"
                                                        placeholder="Email"
                                                        value={newMemberEmail}
                                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="mgr-dash__input glass-input"
                                                        placeholder="Role"
                                                        value={newMemberRole}
                                                        onChange={(e) => setNewMemberRole(e.target.value)}
                                                    />
                                                </div>
                                                <div className="mgr-dash__add-member-actions">
                                                    <Button variant="primary" icon={UserPlus} onClick={() => handleAddMember(team.id)}>
                                                        Add Member
                                                    </Button>
                                                    <Button variant="ghost" onClick={() => {
                                                        setShowAddMember(null);
                                                        setNewMemberName('');
                                                        setNewMemberEmail('');
                                                        setNewMemberRole('');
                                                    }}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Team Members */}
                                        {team.members.length > 0 && (
                                            <div className="mgr-dash__member-list">
                                                {team.members.map((member) => (
                                                    <div key={member.id} className="mgr-dash__member-row">
                                                        <Avatar name={member.name} size="sm" />
                                                        <div className="mgr-dash__member-info">
                                                            <div className="mgr-dash__member-name">{member.name}</div>
                                                            <div className="mgr-dash__member-email">{member.email}</div>
                                                        </div>
                                                        <Badge variant="default">{member.role}</Badge>
                                                        <div className="mgr-dash__member-date">
                                                            <Clock size={11} />
                                                            {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <button
                                                            className="mgr-dash__icon-btn delete small"
                                                            onClick={() => handleRemoveMember(team.id, member.id)}
                                                            title="Remove member"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column — Activity & Quick Actions */}
                <div className="mgr-dash__secondary">
                    {/* Quick Actions */}
                    <div className="mgr-dash__widget glass-card">
                        <h3 className="mgr-dash__widget-title">
                            <Zap size={16} style={{ color: moduleInfo?.color }} />
                            Quick Actions
                        </h3>
                        <div className="mgr-dash__quick-actions">
                            {quickActions.map((action) => (
                                <button key={action} className="mgr-dash__quick-btn">
                                    <ArrowUpRight size={14} />
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="mgr-dash__widget glass-card">
                        <h3 className="mgr-dash__widget-title">
                            <Activity size={16} style={{ color: moduleInfo?.color }} />
                            Recent Activity
                        </h3>
                        <div className="mgr-dash__activity">
                            {activity.map((item) => (
                                <div key={item.id} className={`mgr-dash__activity-item ${item.type}`}>
                                    <div className={`mgr-dash__activity-dot ${item.type}`} />
                                    <div className="mgr-dash__activity-content">
                                        <div className="mgr-dash__activity-text">{item.text}</div>
                                        <div className="mgr-dash__activity-time">
                                            <Clock size={11} />
                                            {item.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Module Info */}
                    <div className="mgr-dash__widget glass-card">
                        <h3 className="mgr-dash__widget-title">
                            <Shield size={16} style={{ color: moduleInfo?.color }} />
                            Your Access
                        </h3>
                        <div className="mgr-dash__access-info">
                            <div className="mgr-dash__access-row">
                                <span className="mgr-dash__access-label">Module</span>
                                <Badge variant="status" color={moduleInfo?.color}>
                                    {moduleInfo?.label}
                                </Badge>
                            </div>
                            <div className="mgr-dash__access-row">
                                <span className="mgr-dash__access-label">Role</span>
                                <Badge variant="status" color="var(--warning)">Manager</Badge>
                            </div>
                            <div className="mgr-dash__access-row">
                                <span className="mgr-dash__access-label">Teams</span>
                                <span className="mgr-dash__access-value">{managerData?.teams?.length || 0}</span>
                            </div>
                            <div className="mgr-dash__access-row">
                                <span className="mgr-dash__access-label">Members</span>
                                <span className="mgr-dash__access-value">{totalMembers}</span>
                            </div>
                            <div className="mgr-dash__access-row">
                                <span className="mgr-dash__access-label">Since</span>
                                <span className="mgr-dash__access-value">
                                    {managerData?.createdAt
                                        ? new Date(managerData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
