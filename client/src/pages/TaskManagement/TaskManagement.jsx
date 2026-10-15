import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    CheckSquare,
    Plus,
    Search,
    Filter,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Users,
    UserCheck,
    FolderKanban,
    AlertTriangle,
    BarChart3,
    LayoutGrid,
    Table2,
    Trash2,
    Pencil,
    Send,
    ExternalLink,
    Briefcase,
    TrendingUp,
    Shield,
    Loader2
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { managerService } from '../../services/managerService';
import { addToast } from '../../store/slices/uiSlice';
import Avatar from '../../components/common/Avatar/Avatar';
import Modal from '../../components/common/Modal/Modal';
import Button from '../../components/common/Button/Button';
import './TaskManagement.css';

const STATUS_COLUMNS = [
    { key: 'Not Started', label: 'Not Started', color: '#6C7A96' },
    { key: 'In Progress', label: 'In Progress', color: '#FDAB3D' },
    { key: 'In Review', label: 'In Review', color: '#A25DDC' },
    { key: 'Done', label: 'Done', color: '#00C875' },
    { key: 'Stuck', label: 'Stuck', color: '#E2445C' },
];

const TaskManagement = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    // Data states
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        assignee_name: '',
        priority: 'Medium',
        status: 'Not Started',
        deadline: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksData, projectsData, usersData] = await Promise.all([
                projectService.getAllTasks(),
                projectService.getAll(),
                managerService.getAllUsers()
            ]);
            setTasks(tasksData || []);
            setProjects(projectsData || []);
            setTeamMembers(usersData || []);
        } catch (err) {
            console.error('Failed to load task management data:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to load tasks and team data.', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const setTab = (tab) => {
        setSearchParams({ tab });
    };

    // KPI Counters
    const stats = useMemo(() => {
        const total = tasks.length;
        const inProgress = tasks.filter(t => (t.status || '').toLowerCase() === 'in progress').length;
        const inReview = tasks.filter(t => (t.status || '').toLowerCase() === 'in review').length;
        const done = tasks.filter(t => (t.status || '').toLowerCase() === 'done').length;
        const notStarted = tasks.filter(t => (t.status || '').toLowerCase() === 'not started' || !t.status).length;
        const urgent = tasks.filter(t => (t.priority || '').toLowerCase() === 'urgent' && (t.status || '').toLowerCase() !== 'done').length;

        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, inProgress, inReview, done, notStarted, urgent, completionRate };
    }, [tasks]);

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            const tStatus = t.status || 'Not Started';
            const tPriority = t.priority || 'Medium';

            // Status filter
            if (statusFilter !== 'all' && tStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;

            // Priority filter
            if (priorityFilter !== 'all' && tPriority.toLowerCase() !== priorityFilter.toLowerCase()) return false;

            // Assignee filter
            if (assigneeFilter !== 'all') {
                if (t.assignee_id !== assigneeFilter && t.assignee_name !== assigneeFilter) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (t.title || '').toLowerCase().includes(q);
                const matchDesc = (t.description || '').toLowerCase().includes(q);
                const matchAssignee = (t.assignee_name || '').toLowerCase().includes(q);
                const matchProj = (t.project_name || '').toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchAssignee && !matchProj) return false;
            }

            return true;
        });
    }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery]);

    // Workload per team member for Delegation Center
    const workloadByMember = useMemo(() => {
        return teamMembers.map((member) => {
            const memberTasks = tasks.filter(t => t.assignee_id === member.id || (t.assignee_name && t.assignee_name.toLowerCase() === (member.name || '').toLowerCase()));
            const active = memberTasks.filter(t => (t.status || '').toLowerCase() !== 'done');
            const done = memberTasks.filter(t => (t.status || '').toLowerCase() === 'done');
            return {
                ...member,
                totalTasks: memberTasks.length,
                activeTasks: active.length,
                completedTasks: done.length,
                recentTasks: active.slice(0, 3)
            };
        }).sort((a, b) => b.activeTasks - a.activeTasks);
    }, [teamMembers, tasks]);

    const handleOpenCreateModal = (prefillAssignee = null) => {
        setEditingTask(null);
        setTaskForm({
            title: '',
            description: '',
            project_id: projects.length > 0 ? projects[0].id : '',
            assignee_id: prefillAssignee ? prefillAssignee.id : '',
            assignee_name: prefillAssignee ? prefillAssignee.name : '',
            priority: 'Medium',
            status: 'Not Started',
            deadline: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title || '',
            description: task.description || '',
            project_id: task.project_id || '',
            assignee_id: task.assignee_id || '',
            assignee_name: task.assignee_name || '',
            priority: task.priority || 'Medium',
            status: task.status || 'Not Started',
            deadline: task.deadline ? task.deadline.split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleSaveTask = async (e) => {
        e?.preventDefault();
        if (!taskForm.title.trim()) {
            dispatch(addToast({ title: 'Validation', message: 'Task title is required.', type: 'warning' }));
            return;
        }

        try {
            const selectedMember = teamMembers.find(m => m.id === taskForm.assignee_id);
            const payload = {
                title: taskForm.title.trim(),
                description: taskForm.description || null,
                project_id: taskForm.project_id || (projects.length > 0 ? projects[0].id : null),
                assignee_id: taskForm.assignee_id || null,
                assignee_name: selectedMember ? selectedMember.name : (taskForm.assignee_name || null),
                priority: taskForm.priority,
                status: taskForm.status,
                deadline: taskForm.deadline || null
            };

            if (editingTask) {
                await projectService.updateTask(editingTask.id, payload);
                dispatch(addToast({ title: 'Task Updated', message: 'Task changes saved successfully.', type: 'success' }));
            } else {
                await projectService.createTask(payload);
                dispatch(addToast({ title: 'Task Delegated', message: `Task assigned to ${payload.assignee_name || 'team'}.`, type: 'success' }));
            }

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving task:', err);
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to save task.', type: 'error' }));
        }
    };

    const handleQuickStatusChange = async (taskId, newStatus) => {
        try {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            await projectService.updateTask(taskId, { status: newStatus });
            dispatch(addToast({ title: 'Status Updated', message: `Task moved to ${newStatus}`, type: 'success' }));
        } catch (err) {
            console.error('Failed to update status:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to update task status.', type: 'error' }));
            loadData();
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            await projectService.deleteTask(taskId);
            dispatch(addToast({ title: 'Deleted', message: 'Task removed successfully.', type: 'success' }));
        } catch (err) {
            console.error('Error deleting task:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to delete task.', type: 'error' }));
            loadData();
        }
    };

    const getPriorityBadge = (priority) => {
        const p = (priority || 'medium').toLowerCase();
        return (
            <span className={`task-priority-pill task-priority--${p}`}>
                <span className="task-priority-dot" />
                {priority || 'Medium'}
            </span>
        );
    };

    const getDeadlineBadge = (deadlineStr, status) => {
        if (!deadlineStr) return <span className="task-deadline-pill task-deadline--none">No deadline</span>;
        if ((status || '').toLowerCase() === 'done') {
            return <span className="task-deadline-pill task-deadline--done">Completed</span>;
        }

        const now = new Date();
        const due = new Date(deadlineStr);
        const diffMs = due.setHours(23, 59, 59, 999) - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <span className="task-deadline-pill task-deadline--overdue">Overdue ({Math.abs(diffDays)}d)</span>;
        }
        if (diffDays === 0) {
            return <span className="task-deadline-pill task-deadline--today">Due Today</span>;
        }
        if (diffDays === 1) {
            return <span className="task-deadline-pill task-deadline--soon">Due Tomorrow</span>;
        }
        return <span className="task-deadline-pill task-deadline--normal">Due in {diffDays}d</span>;
    };

    return (
        <div className="task-management-page">
            {/* Top Module Header */}
            <div className="task-header glass-card">
                <div className="task-header__top">
                    <div className="task-header__info">
                        <div className="task-header__badge">
                            <CheckSquare size={13} color="var(--primary-500)" />
                            <span>Enterprise Task Center</span>
                        </div>
                        <h1>Task Management & Delegation</h1>
                        <p>Assign, monitor, and delegate operational deliverables to any employee or manager across the organization.</p>
                    </div>

                    <div className="task-header__actions">
                        <button className="task-btn task-btn--secondary" onClick={loadData} title="Refresh tasks">
                            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
                            <span>Sync</span>
                        </button>
                        <button className="task-btn task-btn--primary" onClick={() => handleOpenCreateModal()}>
                            <Plus size={16} />
                            <span>Assign New Task</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="task-kpi-strip">
                    <div className="task-kpi-item" onClick={() => { setTab('all'); setStatusFilter('all'); }}>
                        <span className="task-kpi-num">{stats.total}</span>
                        <span className="task-kpi-txt">Total Tasks</span>
                    </div>
                    <div className="task-kpi-divider" />
                    <div className="task-kpi-item" onClick={() => { setTab('all'); setStatusFilter('in progress'); }}>
                        <span className="task-kpi-num" style={{ color: '#FDAB3D' }}>{stats.inProgress}</span>
                        <span className="task-kpi-txt">In Progress</span>
                    </div>
                    <div className="task-kpi-divider" />
                    <div className="task-kpi-item" onClick={() => { setTab('all'); setStatusFilter('in review'); }}>
                        <span className="task-kpi-num" style={{ color: '#A25DDC' }}>{stats.inReview}</span>
                        <span className="task-kpi-txt">In Review</span>
                    </div>
                    <div className="task-kpi-divider" />
                    <div className="task-kpi-item" onClick={() => { setTab('all'); setStatusFilter('done'); }}>
                        <span className="task-kpi-num" style={{ color: '#00C875' }}>{stats.done}</span>
                        <span className="task-kpi-txt">Completed</span>
                    </div>
                    <div className="task-kpi-divider" />
                    <div className="task-kpi-item">
                        <span className="task-kpi-num" style={{ color: 'var(--primary-500)' }}>{stats.completionRate}%</span>
                        <span className="task-kpi-txt">Completion Rate</span>
                    </div>
                    {stats.urgent > 0 && (
                        <>
                            <div className="task-kpi-divider" />
                            <div className="task-kpi-item" onClick={() => { setTab('all'); setPriorityFilter('urgent'); }}>
                                <span className="task-kpi-num" style={{ color: '#E2445C' }}>{stats.urgent}</span>
                                <span className="task-kpi-txt">Urgent Tasks</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="task-nav-bar">
                <div className="task-tabs-group">
                    <button
                        className={`task-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setTab('all')}
                    >
                        <Table2 size={16} />
                        <span>All Tasks Directory</span>
                        <span className="task-tab-badge">{tasks.length}</span>
                    </button>

                    <button
                        className={`task-tab-btn ${activeTab === 'delegated' ? 'active' : ''}`}
                        onClick={() => setTab('delegated')}
                    >
                        <UserCheck size={16} />
                        <span>Delegation Center</span>
                        <span className="task-tab-badge">{teamMembers.length} Members</span>
                    </button>

                    <button
                        className={`task-tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
                        onClick={() => setTab('kanban')}
                    >
                        <LayoutGrid size={16} />
                        <span>Kanban Board</span>
                    </button>

                    <button
                        className={`task-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setTab('analytics')}
                    >
                        <BarChart3 size={16} />
                        <span>Workload & Velocity</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: ALL TASKS DIRECTORY */}
            {activeTab === 'all' && (
                <div className="task-content-section glass-card">
                    {/* Filters Strip */}
                    <div className="task-filters-row">
                        <div className="task-search-box">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search by task title, description, project, or assignee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="task-filters-group">
                            <select
                                className="task-filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="not started">Not Started</option>
                                <option value="in progress">In Progress</option>
                                <option value="in review">In Review</option>
                                <option value="done">Done</option>
                                <option value="stuck">Stuck</option>
                            </select>

                            <select
                                className="task-filter-select"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <select
                                className="task-filter-select"
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                            >
                                <option value="all">All Team Members</option>
                                {teamMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.role})
                                    </option>
                                ))}
                            </select>

                            {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
                                <button
                                    className="task-clear-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setPriorityFilter('all');
                                        setAssigneeFilter('all');
                                    }}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="task-empty-box">
                            <Loader2 size={32} className="spinning" color="var(--primary-500)" />
                            <p>Loading enterprise tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="task-empty-box">
                            <CheckSquare size={44} style={{ opacity: 0.25, color: 'var(--primary-500)' }} />
                            <h3>No tasks match your criteria</h3>
                            <p>Try adjusting your search filters or assign a new task to get started.</p>
                            <button className="task-btn task-btn--primary" onClick={() => handleOpenCreateModal()}>
                                <Plus size={15} /> Assign First Task
                            </button>
                        </div>
                    ) : (
                        <div className="task-table-wrapper">
                            <table className="task-table">
                                <thead>
                                    <tr>
                                        <th>Task Name & Deliverables</th>
                                        <th>Assignee</th>
                                        <th>Project</th>
                                        <th>Priority</th>
                                        <th>Deadline</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map((task) => (
                                        <tr key={task.id} className={task.status === 'Done' ? 'task-row--done' : ''}>
                                            <td className="task-cell-title">
                                                <div className="task-title-wrap">
                                                    <span className="task-main-title">{task.title}</span>
                                                    {task.description && (
                                                        <span className="task-sub-desc">{task.description}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="task-assignee-pill">
                                                    <Avatar name={task.assignee_name || 'Unassigned'} size="xs" />
                                                    <span className="task-assignee-name">{task.assignee_name || 'Unassigned'}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="task-project-tag">
                                                    <FolderKanban size={12} />
                                                    {task.project_name || 'General'}
                                                </span>
                                            </td>

                                            <td>{getPriorityBadge(task.priority)}</td>

                                            <td>{getDeadlineBadge(task.deadline, task.status)}</td>

                                            <td>
                                                <select
                                                    className={`task-status-selector status-${(task.status || 'not-started').toLowerCase().replace(' ', '-')}`}
                                                    value={task.status || 'Not Started'}
                                                    onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                                                >
                                                    <option value="Not Started">Not Started</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="In Review">In Review</option>
                                                    <option value="Done">Done</option>
                                                    <option value="Stuck">Stuck</option>
                                                </select>
                                            </td>

                                            <td style={{ textAlign: 'right' }}>
                                                <div className="task-row-actions">
                                                    <button
                                                        className="task-action-btn"
                                                        onClick={() => handleOpenEditModal(task)}
                                                        title="Edit task"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="task-action-btn task-action-btn--danger"
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        title="Delete task"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DELEGATION CENTER (Team Workload & Direct Assignment) */}
            {activeTab === 'delegated' && (
                <div className="task-delegation-grid">
                    {workloadByMember.map((member) => (
                        <div key={member.id} className="delegation-card glass-card">
                            <div className="delegation-card__header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Avatar name={member.name || 'Member'} src={member.avatar_url} size="md" />
                                    <div>
                                        <h3 className="delegation-member-name">{member.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <span className={`delegation-role-tag role--${member.role || 'employee'}`}>
                                                {member.role === 'manager' ? 'Manager' : member.role === 'admin' ? 'Admin' : 'Employee'}
                                            </span>
                                            <span className="delegation-dept-tag">{member.department || 'Operations'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="delegation-assign-btn"
                                    onClick={() => handleOpenCreateModal(member)}
                                    title={`Delegate task to ${member.name}`}
                                >
                                    <Plus size={14} />
                                    <span>Assign Task</span>
                                </button>
                            </div>

                            <div className="delegation-workload-bar-wrap">
                                <div className="delegation-workload-labels">
                                    <span>Active Workload</span>
                                    <span>{member.activeTasks} active / {member.totalTasks} total</span>
                                </div>
                                <div className="delegation-workload-track">
                                    <div
                                        className="delegation-workload-fill"
                                        style={{
                                            width: `${member.totalTasks > 0 ? (member.completedTasks / member.totalTasks) * 100 : 0}%`,
                                            background: '#00C875'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Recent Active Tasks for this Person */}
                            <div className="delegation-tasks-preview">
                                <span className="delegation-preview-label">Current Responsibilities:</span>
                                {member.recentTasks.length === 0 ? (
                                    <div className="delegation-no-tasks">No active tasks assigned. Available for delegation.</div>
                                ) : (
                                    <div className="delegation-preview-list">
                                        {member.recentTasks.map((t) => (
                                            <div key={t.id} className="delegation-preview-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className={`priority-mini-dot priority-dot--${(t.priority || 'medium').toLowerCase()}`} />
                                                    <span className="delegation-preview-title">{t.title}</span>
                                                </div>
                                                <span className="delegation-preview-status">{t.status || 'Not Started'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: KANBAN BOARD */}
            {activeTab === 'kanban' && (
                <div className="task-kanban-board">
                    {STATUS_COLUMNS.map((col) => {
                        const colTasks = tasks.filter(t => (t.status || 'Not Started').toLowerCase() === col.key.toLowerCase());

                        return (
                            <div key={col.key} className="kanban-column glass-card">
                                <div className="kanban-column-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="kanban-col-dot" style={{ background: col.color }} />
                                        <h3>{col.label}</h3>
                                    </div>
                                    <span className="kanban-col-count">{colTasks.length}</span>
                                </div>

                                <div className="kanban-cards-list">
                                    {colTasks.length === 0 ? (
                                        <div className="kanban-col-empty">No tasks in this lane</div>
                                    ) : (
                                        colTasks.map((task) => (
                                            <div key={task.id} className="kanban-task-card">
                                                <div className="kanban-card-top">
                                                    <span className="task-project-tag">
                                                        <FolderKanban size={11} />
                                                        {task.project_name || 'General'}
                                                    </span>
                                                    {getPriorityBadge(task.priority)}
                                                </div>

                                                <h4 className="kanban-task-title">{task.title}</h4>
                                                {task.description && (
                                                    <p className="kanban-task-desc">{task.description}</p>
                                                )}

                                                <div className="kanban-card-footer">
                                                    <div className="task-assignee-pill">
                                                        <Avatar name={task.assignee_name || 'U'} size="xs" />
                                                        <span>{task.assignee_name ? task.assignee_name.split(' ')[0] : 'Unassigned'}</span>
                                                    </div>

                                                    <select
                                                        className="kanban-move-select"
                                                        value={task.status || 'Not Started'}
                                                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                                                    >
                                                        {STATUS_COLUMNS.map(c => (
                                                            <option key={c.key} value={c.key}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 4: WORKLOAD & ANALYTICS */}
            {activeTab === 'analytics' && (
                <div className="task-analytics-grid">
                    <div className="analytics-card glass-card">
                        <h3>Delivery Velocity & Health</h3>
                        <div className="analytics-metric-big">
                            <span>{stats.completionRate}%</span>
                            <span className="analytics-metric-sub">Overall Task Completion</span>
                        </div>
                        <div className="analytics-progress-bar">
                            <div className="analytics-progress-fill" style={{ width: `${stats.completionRate}%` }} />
                        </div>
                        <div className="analytics-stats-row">
                            <div>
                                <span className="stat-label">Done Tasks</span>
                                <span className="stat-val" style={{ color: '#00C875' }}>{stats.done}</span>
                            </div>
                            <div>
                                <span className="stat-label">In Progress</span>
                                <span className="stat-val" style={{ color: '#FDAB3D' }}>{stats.inProgress}</span>
                            </div>
                            <div>
                                <span className="stat-label">In Review</span>
                                <span className="stat-val" style={{ color: '#A25DDC' }}>{stats.inReview}</span>
                            </div>
                            <div>
                                <span className="stat-label">Urgent Pending</span>
                                <span className="stat-val" style={{ color: '#E2445C' }}>{stats.urgent}</span>
                            </div>
                        </div>
                    </div>

                    <div className="analytics-card glass-card">
                        <h3>Staff Workload Distribution</h3>
                        <div className="analytics-workload-list">
                            {workloadByMember.slice(0, 6).map((m) => (
                                <div key={m.id} className="analytics-workload-row">
                                    <div className="analytics-member-meta">
                                        <Avatar name={m.name || 'Member'} size="xs" />
                                        <span>{m.name}</span>
                                        <span className="analytics-role-pill">{m.role}</span>
                                    </div>
                                    <span className="analytics-count-pill">{m.activeTasks} active tasks</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT TASK MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? 'Edit Task Assignment' : 'Assign New Task'}
            >
                <form onSubmit={handleSaveTask} className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Task Title *</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Complete Q3 Financial Audit or Setup Hiring Pipeline"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="dw-form-group">
                        <label className="dw-form-label">Deliverables & Detailed Instructions</label>
                        <textarea
                            className="dw-form-textarea"
                            rows={3}
                            placeholder="Detail what must be delivered, checklist items, links, or expectations..."
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                    </div>

                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Assign To *</label>
                            <select
                                className="dw-form-input"
                                value={taskForm.assignee_id}
                                onChange={(e) => {
                                    const mId = e.target.value;
                                    const selected = teamMembers.find(m => m.id === mId);
                                    setTaskForm({
                                        ...taskForm,
                                        assignee_id: mId,
                                        assignee_name: selected ? selected.name : ''
                                    });
                                }}
                            >
                                <option value="">Select Employee or Manager</option>
                                {teamMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} &bull; {m.role === 'employee' ? 'Employee' : m.role === 'manager' ? 'Manager' : 'Admin'} ({m.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="dw-form-group">
                            <label className="dw-form-label">Associated Project (Optional)</label>
                            <select
                                className="dw-form-input"
                                value={taskForm.project_id}
                                onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                            >
                                <option value="">Operational Task (No Project)</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Priority</label>
                            <select
                                className="dw-form-input"
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                            >
                                <option value="Urgent">Urgent</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div className="dw-form-group">
                            <label className="dw-form-label">Initial Status</label>
                            <select
                                className="dw-form-input"
                                value={taskForm.status}
                                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Done">Done</option>
                                <option value="Stuck">Stuck</option>
                            </select>
                        </div>

                        <div className="dw-form-group">
                            <label className="dw-form-label">Target Deadline</label>
                            <input
                                type="date"
                                className="dw-form-input"
                                value={taskForm.deadline}
                                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">
                            {editingTask ? 'Save Changes' : 'Delegate Task'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TaskManagement;
