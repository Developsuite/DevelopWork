import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    AlertCircle,
    CheckSquare,
    FolderKanban,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    ArrowUpRight,
    Shield,
    Users,
    DollarSign,
    Handshake,
    FileText,
    ChevronDown,
    ChevronUp,
    ListTodo,
    AlertTriangle,
    Sparkles,
    Briefcase,
    Video,
    ClipboardList
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { permissionsService } from '../../services/permissionsService';
import { addToast } from '../../store/slices/uiSlice';
import Avatar from '../../components/common/Avatar/Avatar';
import { supabase } from '../../lib/supabase';
import './EmployeeDashboard.css';

const modIconMap = {
    projects: FolderKanban,
    tasks: CheckSquare,
    hr: Users,
    finance: DollarSign,
    leads: Handshake,
    clients: Users,
    docs: FileText,
    meetings: Video
};

const EmployeeDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'operational' | 'project'
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [permittedModules, setPermittedModules] = useState(() => permissionsService.getAccessibleModules(user));

    // Sync permissions dynamically and from Supabase database (multi-device)
    useEffect(() => {
        let isMounted = true;
        const updateModules = async () => {
            if (!user) return;
            if (isMounted) {
                setPermittedModules(permissionsService.getAccessibleModules(user));
            }
            if (user.id) {
                try {
                    await permissionsService.fetchUserPermissions(user.id);
                    if (isMounted) {
                        setPermittedModules(permissionsService.getAccessibleModules(user));
                    }
                } catch (e) {
                    console.warn('[EmployeeDashboard] Permissions sync warning:', e);
                }
            }
        };

        updateModules();
        window.addEventListener('dwPermissionsUpdated', updateModules);
        window.addEventListener('focus', updateModules);

        // Realtime sync when Workspace Admin grants permissions from another device
        let channel = null;
        if (user?.id) {
            try {
                channel = supabase
                    .channel(`emp-dashboard-perms-${user.id}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                        (payload) => {
                            if (payload.new) {
                                permissionsService.fetchUserPermissions(user.id).then(() => {
                                    if (isMounted) {
                                        setPermittedModules(permissionsService.getAccessibleModules({
                                            ...user,
                                            assignedModule: payload.new.assigned_module,
                                            permissions: payload.new.permissions
                                        }));
                                    }
                                });
                            }
                        }
                    )
                    .subscribe();
            } catch (err) {
                console.warn('[EmployeeDashboard] Realtime subscription not available:', err);
            }
        }

        return () => {
            isMounted = false;
            window.removeEventListener('dwPermissionsUpdated', updateModules);
            window.removeEventListener('focus', updateModules);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [user]);

    const loadTasks = async () => {
        if (!user) return;
        setLoadingTasks(true);
        try {
            const data = await projectService.getTasksByAssignee(user.id, user.name, user.email);
            setTasks(data || []);
        } catch (error) {
            console.error('Failed to load employee tasks:', error);
            dispatch(addToast({ title: 'Error', message: 'Failed to load your tasks', type: 'error' }));
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        loadTasks();

        const handleTasksUpdate = () => loadTasks();
        window.addEventListener('dwTasksUpdated', handleTasksUpdate);
        window.addEventListener('focus', handleTasksUpdate);

        // Realtime sync for tasks assigned by admin or project manager
        let taskChannel = null;
        try {
            taskChannel = supabase
                .channel(`emp-tasks-sync-${user?.id || 'emp'}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tasks' },
                    () => {
                        loadTasks();
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[EmployeeDashboard] Realtime task sync not available:', err);
        }

        return () => {
            window.removeEventListener('dwTasksUpdated', handleTasksUpdate);
            window.removeEventListener('focus', handleTasksUpdate);
            if (taskChannel) {
                supabase.removeChannel(taskChannel);
            }
        };
    }, [user?.id, user?.name, user?.email]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            // Optimistic update
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
            await projectService.updateTask(taskId, { status: newStatus });
            dispatch(addToast({ title: 'Status Updated', message: `Task moved to "${newStatus}"`, type: 'success' }));
        } catch (error) {
            console.error('Failed to update task status:', error);
            dispatch(addToast({ title: 'Error', message: 'Failed to update task status', type: 'error' }));
            loadTasks(); // Revert on failure
        }
    };

    // Calculate KPI counts
    const counts = useMemo(() => {
        const total = tasks.length;
        const operational = tasks.filter((t) => t.is_operational).length;
        const project = tasks.filter((t) => !t.is_operational).length;
        const inProgress = tasks.filter((t) => (t.status || '').toLowerCase() === 'in progress').length;
        const inReview = tasks.filter((t) => (t.status || '').toLowerCase() === 'in review').length;
        const notStarted = tasks.filter((t) => (t.status || '').toLowerCase() === 'not started' || !t.status).length;
        const done = tasks.filter((t) => (t.status || '').toLowerCase() === 'done').length;
        const urgent = tasks.filter((t) => (t.priority || '').toLowerCase() === 'urgent' && (t.status || '').toLowerCase() !== 'done').length;
        return { total, operational, project, inProgress, inReview, notStarted, done, urgent };
    }, [tasks]);

    // Filtered tasks based on search & filters
    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            const tStatus = (t.status || 'not started').toLowerCase();
            const tPriority = (t.priority || 'medium').toLowerCase();

            // Scope filter (Daily Operational vs Project tasks)
            if (scopeFilter === 'operational' && !t.is_operational) return false;
            if (scopeFilter === 'project' && t.is_operational) return false;

            // Status filter
            if (statusFilter === 'active' && tStatus === 'done') return false;
            if (statusFilter !== 'all' && statusFilter !== 'active' && tStatus !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && tPriority !== priorityFilter) return false;

            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = (t.title || '').toLowerCase().includes(query);
                const matchProj = (t.project_name || '').toLowerCase().includes(query);
                const matchDesc = (t.description || '').toLowerCase().includes(query);
                if (!matchTitle && !matchProj && !matchDesc) return false;
            }

            return true;
        });
    }, [tasks, scopeFilter, statusFilter, priorityFilter, searchQuery]);

    const getPriorityBadgeClass = (priority) => {
        switch ((priority || '').toLowerCase()) {
            case 'urgent': return 'priority-badge--urgent';
            case 'high': return 'priority-badge--high';
            case 'medium': return 'priority-badge--medium';
            case 'low': return 'priority-badge--low';
            default: return 'priority-badge--medium';
        }
    };

    const getDeadlineInfo = (deadlineStr, status) => {
        if (!deadlineStr) return { text: 'No deadline set', className: 'deadline--none' };
        if ((status || '').toLowerCase() === 'done') {
            return { text: `Completed (${new Date(deadlineStr).toLocaleDateString()})`, className: 'deadline--done' };
        }

        const now = new Date();
        const due = new Date(deadlineStr);
        const diffMs = due.setHours(23, 59, 59, 999) - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, className: 'deadline--overdue' };
        }
        if (diffDays === 0) {
            return { text: 'Due today', className: 'deadline--today' };
        }
        if (diffDays === 1) {
            return { text: 'Due tomorrow', className: 'deadline--soon' };
        }
        return { text: `Due in ${diffDays} days`, className: 'deadline--normal' };
    };

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    return (
        <div className="employee-cockpit">
            {/* Top Welcome & KPI Header */}
            <div className="cockpit-welcome glass-card">
                <div className="cockpit-welcome__main">
                    <div className="cockpit-welcome__user">
                        <Avatar name={user?.name || 'Employee'} src={user?.avatar} size="lg" />
                        <div>
                            <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'Team Member'}!</h1>
                            <p>Here is your personal command center, task assignments, and permitted workspace tools.</p>
                        </div>
                    </div>

                    <div className="cockpit-welcome__date">
                        <CalendarDays size={18} />
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* KPI Stat Cards Row */}
                <div className="cockpit-kpi-grid">
                    <div className="cockpit-kpi-card" onClick={() => setStatusFilter('all')}>
                        <div className="cockpit-kpi-icon" style={{ background: 'rgba(87, 155, 252, 0.12)', color: '#579BFC' }}>
                            <ListTodo size={20} />
                        </div>
                        <div className="cockpit-kpi-content">
                            <span className="cockpit-kpi-value">{counts.total}</span>
                            <span className="cockpit-kpi-label">Total Assigned</span>
                        </div>
                    </div>

                    <div className="cockpit-kpi-card" onClick={() => setStatusFilter('in progress')}>
                        <div className="cockpit-kpi-icon" style={{ background: 'rgba(253, 171, 61, 0.12)', color: '#FDAB3D' }}>
                            <Clock size={20} />
                        </div>
                        <div className="cockpit-kpi-content">
                            <span className="cockpit-kpi-value">{counts.inProgress}</span>
                            <span className="cockpit-kpi-label">In Progress</span>
                        </div>
                    </div>

                    <div className="cockpit-kpi-card" onClick={() => setStatusFilter('in review')}>
                        <div className="cockpit-kpi-icon" style={{ background: 'rgba(162, 93, 220, 0.12)', color: '#A25DDC' }}>
                            <AlertCircle size={20} />
                        </div>
                        <div className="cockpit-kpi-content">
                            <span className="cockpit-kpi-value">{counts.inReview}</span>
                            <span className="cockpit-kpi-label">In Review</span>
                        </div>
                    </div>

                    <div className="cockpit-kpi-card" onClick={() => setStatusFilter('done')}>
                        <div className="cockpit-kpi-icon" style={{ background: 'rgba(0, 200, 117, 0.12)', color: '#00C875' }}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="cockpit-kpi-content">
                            <span className="cockpit-kpi-value">{counts.done}</span>
                            <span className="cockpit-kpi-label">Completed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout: Tasks + RBAC Workspaces */}
            <div className="cockpit-layout-grid">
                {/* Left/Main Column: Interactive Task Board */}
                <div className="cockpit-tasks-section glass-card">
                    <div className="cockpit-section-header">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckSquare size={20} color="var(--primary-400)" />
                                <h2>My Assigned Tasks</h2>
                                <span className="cockpit-count-badge">{filteredTasks.length}</span>
                            </div>
                            <p className="cockpit-section-sub">Tasks delegated by Workspace Admin & Department Managers.</p>
                        </div>

                        <button className="cockpit-refresh-btn" onClick={loadTasks} title="Refresh tasks">
                            <RefreshCw size={15} className={loadingTasks ? 'spinning' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Filter Tabs & Search Controls */}
                    <div className="cockpit-controls-bar">
                        {/* Scope Selector: All vs Daily General Tasks vs Project Tasks */}
                        <div className="cockpit-scope-selector-strip">
                            <button
                                type="button"
                                className={`cockpit-scope-chip ${scopeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setScopeFilter('all')}
                            >
                                All Assigned ({tasks.length})
                            </button>
                            <button
                                type="button"
                                className={`cockpit-scope-chip scope--op ${scopeFilter === 'operational' ? 'active' : ''}`}
                                onClick={() => setScopeFilter('operational')}
                            >
                                <ClipboardList size={13} />
                                Daily General Tasks ({counts.operational})
                            </button>
                            <button
                                type="button"
                                className={`cockpit-scope-chip scope--proj ${scopeFilter === 'project' ? 'active' : ''}`}
                                onClick={() => setScopeFilter('project')}
                            >
                                <FolderKanban size={13} />
                                Project Tasks ({counts.project})
                            </button>
                        </div>

                        <div className="cockpit-filter-tabs">
                            <button
                                className={`cockpit-tab ${statusFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('all')}
                            >
                                All ({counts.total})
                            </button>
                            <button
                                className={`cockpit-tab ${statusFilter === 'active' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('active')}
                            >
                                Active ({counts.total - counts.done})
                            </button>
                            <button
                                className={`cockpit-tab ${statusFilter === 'in progress' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('in progress')}
                            >
                                In Progress ({counts.inProgress})
                            </button>
                            <button
                                className={`cockpit-tab ${statusFilter === 'in review' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('in review')}
                            >
                                In Review ({counts.inReview})
                            </button>
                            <button
                                className={`cockpit-tab ${statusFilter === 'done' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('done')}
                            >
                                Done ({counts.done})
                            </button>
                        </div>

                        <div className="cockpit-search-row">
                            <div className="cockpit-search-input-wrap">
                                <Search size={14} />
                                <input
                                    type="text"
                                    placeholder="Search by title or project..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <select
                                className="cockpit-priority-select"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="cockpit-tasks-list">
                        {loadingTasks ? (
                            <div className="cockpit-empty-state">
                                <Loader2 size={32} className="spinning" color="var(--primary-400)" />
                                <p>Loading your assigned tasks...</p>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="cockpit-empty-state">
                                <CheckCircle2 size={40} color="var(--success)" style={{ opacity: 0.8 }} />
                                <h3>No tasks found</h3>
                                <p>
                                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || scopeFilter !== 'all'
                                        ? 'No tasks match your active filters.'
                                        : 'You have no assigned tasks right now! Check back later or notify your manager.'}
                                </p>
                            </div>
                        ) : (
                            filteredTasks.map((task) => {
                                const deadlineInfo = getDeadlineInfo(task.deadline, task.status);
                                const isExpanded = expandedTaskId === task.id;

                                return (
                                    <div key={task.id} className={`cockpit-task-card ${task.status === 'Done' ? 'task-card--done' : ''}`}>
                                        <div className="cockpit-task-card__header">
                                            <div className="cockpit-task-card__title-area">
                                                <div className="cockpit-task-card__badges">
                                                    <span className={`priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                                                        <span className="priority-badge__dot" />
                                                        {task.priority || 'Medium'}
                                                    </span>
                                                    {task.is_operational ? (
                                                        <span className="cockpit-scope-pill scope--operational" title="General daily task completed by employee independently of projects">
                                                            <ClipboardList size={12} />
                                                            Daily General Task
                                                        </span>
                                                    ) : (
                                                        <span className="cockpit-scope-pill scope--project" title={`Project task: ${task.project_name}`}>
                                                            <FolderKanban size={12} />
                                                            Project: {task.project_name}
                                                        </span>
                                                    )}
                                                    <span className={`cockpit-deadline-pill ${deadlineInfo.className}`}>
                                                        <Clock size={12} />
                                                        {deadlineInfo.text}
                                                    </span>
                                                </div>

                                                <h3 className="cockpit-task-card__title">{task.title || 'Untitled Task'}</h3>
                                            </div>

                                            {/* Status Dropdown */}
                                            <div className="cockpit-task-card__actions">
                                                <select
                                                    className="cockpit-status-dropdown"
                                                    value={task.status || 'Not Started'}
                                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                >
                                                    <option value="Not Started">Not Started</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="In Review">In Review</option>
                                                    <option value="Done">Done</option>
                                                    <option value="Stuck">Stuck</option>
                                                </select>

                                                {task.status !== 'Done' && (
                                                    <button
                                                        className="cockpit-complete-btn"
                                                        onClick={() => handleStatusChange(task.id, 'Done')}
                                                        title="Mark task as Done"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    className="cockpit-expand-btn"
                                                    onClick={() => toggleExpand(task.id)}
                                                    title={isExpanded ? 'Collapse' : 'Expand details'}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable Details & Deliverables */}
                                        {isExpanded && (
                                            <div className="cockpit-task-card__expanded">
                                                <div className="cockpit-task-desc-block">
                                                    <span className="cockpit-field-label">Deliverables & Instructions:</span>
                                                    <p className="cockpit-task-desc-text">
                                                        {task.description || 'No additional instructions provided for this task.'}
                                                    </p>
                                                </div>

                                                <div className="cockpit-task-meta-row">
                                                    <div>
                                                        <span className="cockpit-field-label">Assignee:</span>
                                                        <span className="cockpit-meta-val">{task.assignee_name || user?.name || 'You'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="cockpit-field-label">Assigned On:</span>
                                                        <span className="cockpit-meta-val">
                                                            {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Recent'}
                                                        </span>
                                                    </div>
                                                    {task.deadline && (
                                                        <div>
                                                            <span className="cockpit-field-label">Target Deadline:</span>
                                                            <span className="cockpit-meta-val">
                                                                {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: RBAC Permitted Workspaces & Modules */}
                <div className="cockpit-sidebar-section">
                    <div className="cockpit-rbac-card glass-card">
                        <div className="cockpit-section-header">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={18} color="var(--primary-400)" />
                                    <h3>Permitted Workspaces</h3>
                                </div>
                                <p className="cockpit-section-sub">Granular modules granted by Workspace Admin</p>
                            </div>
                        </div>

                        {permittedModules.length === 0 ? (
                            <div className="cockpit-no-perms-card">
                                <Shield size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <h4>Core Task Access Active</h4>
                                <p>
                                    You currently have direct access to your task cockpit. If you need access to Recruitment, Invoices, or Projects, contact your Workspace Admin.
                                </p>
                            </div>
                        ) : (
                            <div className="cockpit-modules-list">
                                {permittedModules.map((mod) => {
                                    const ModIcon = modIconMap[mod.key] || FolderKanban;
                                    const accessibleFeatures = permissionsService.getAccessibleFeatures(user, mod.key);

                                    return (
                                        <div key={mod.key} className="cockpit-module-card">
                                            <div className="cockpit-module-card__top">
                                                <div className="cockpit-module-icon" style={{ background: `${mod.color}1a`, color: mod.color }}>
                                                    <ModIcon size={18} />
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <h4 className="cockpit-module-title">{mod.label}</h4>
                                                    <span className="cockpit-module-feat-count">
                                                        {accessibleFeatures.length} accessible sub-feature{accessibleFeatures.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <button
                                                    className="cockpit-launch-btn"
                                                    onClick={() => navigate(`/${mod.key}`)}
                                                    title={`Launch ${mod.label}`}
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </div>

                                            {/* Accessible Feature Tags */}
                                            <div className="cockpit-module-tags">
                                                {accessibleFeatures.slice(0, 3).map((feat) => (
                                                    <span
                                                        key={feat.key}
                                                        className="cockpit-feat-tag"
                                                        onClick={() => navigate(feat.path)}
                                                        title={`Go directly to ${feat.label}`}
                                                    >
                                                        {feat.label}
                                                    </span>
                                                ))}
                                                {accessibleFeatures.length > 3 && (
                                                    <span className="cockpit-feat-tag-more">
                                                        +{accessibleFeatures.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Guidance / Tip Widget */}
                    <div className="cockpit-tip-card glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlertTriangle size={16} color="#FDAB3D" />
                            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Workflow Tip</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            When you finish task deliverables, update the status to <strong>In Review</strong> so your manager is notified for sign-off.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
