import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/uiSlice';
import { projectService } from '../../services/projectService';
import { clientsService } from '../../services/clientsService';
import { managerService } from '../../services/managerService';
import { isEmpty, isPositiveNumber } from '../../utils/validation';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    FolderKanban, Plus, Calendar, Clock, TrendingUp, AlertTriangle,
    CheckCircle2, Search, MoreVertical, Users, Target, FileText,
    BarChart3, ArrowRight, Filter, UserPlus, X, LayoutGrid, List,
    ChevronRight, Briefcase, ExternalLink, Trash2, Pencil, Timer
} from 'lucide-react';
import './ProjectManagement.css';

const ProjectManagement = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = useSelector((state) => state.ui.theme);
    
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'projects');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);
    const [viewingProject, setViewingProject] = useState(null);
    
    const [projectList, setProjectList] = useState([]);
    const [clients, setClients] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectSprintMap, setProjectSprintMap] = useState({});
    
    // Project Form State
    const [projectForm, setProjectForm] = useState({
        name: '', description: '', status: 'Planning', priority: 'Medium', dueDate: '', client_id: '', amount: 0
    });

    // Real tasks from DB
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '', project_id: '', priority: 'Medium', status: 'Not Started', deadline: '', assignee_id: '', assignee_name: '', description: ''
    });

    const loadAllData = async () => {
        try {
            const [projData, clientData, taskData, usersData] = await Promise.all([
                projectService.getAll(),
                clientsService.getClients(),
                projectService.getAllTasks(),
                managerService.getAllUsers()
            ]);
            setProjectList(projData);
            setClients(clientData);
            setTasks(taskData);
            setTeamMembers(usersData);
            // Load sprints for each project
            const sprintMap = {};
            await Promise.all(projData.map(async (p) => {
                try {
                    const sprints = await projectService.getSprints(p.id);
                    if (sprints.length > 0) sprintMap[p.id] = sprints[0];
                } catch(e) { /* no sprints */ }
            }));
            setProjectSprintMap(sprintMap);
        } catch (err) {
            console.error("Failed to load PM data:", err);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    // Filtered projects
    const filteredProjects = useMemo(() => {
        return projectList.filter(p => {
            const matchSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchPriority = priorityFilter === 'all' || p.priority === priorityFilter;
            return matchSearch && matchStatus && matchPriority;
        });
    }, [projectList, searchQuery, statusFilter, priorityFilter]);

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchSearch = !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || t.status === statusFilter;
            const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
            return matchSearch && matchStatus && matchPriority;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const renderTag = (val) => {
        if (!val) return null;
        const slug = val.toLowerCase().replace(/\s+/g, '-');
        return (
            <span className={`pm__tag pm__tag--${slug}`}>
                <span className="pm__tag-dot"></span>
                {val}
            </span>
        );
    };

    const { user } = useSelector((state) => state.auth);
    
    const handleViewSprintBoard = (e, projectId) => {
        e.stopPropagation();
        const basePath = user?.role === 'manager' ? '/manager/projects/sprint' : '/board/board-1';
        navigate(`${basePath}?project=${projectId}`);
        const sprint = projectSprintMap[projectId];
        dispatch(addToast({ title: 'Sprint Board', message: sprint ? `Opening ${sprint.name}` : 'Opening Sprint Dashboard', type: 'info' }));
    };

    const draggingProgressRef = useRef(null);

    const handleProgressMouseDown = (e, projectId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        let newProgress = Math.max(0, Math.min(100, Math.round((x / width) * 100)));
        
        draggingProgressRef.current = { id: projectId, rect, progress: newProgress };
        setProjectList(prev => prev.map(p => p.id === projectId ? { ...p, progress: newProgress } : p));
    };

    const handleGlobalMouseMove = useCallback((e) => {
        if (!draggingProgressRef.current) return;
        const { id, rect } = draggingProgressRef.current;
        const x = e.clientX - rect.left;
        const width = rect.width;
        let newProgress = Math.max(0, Math.min(100, Math.round((x / width) * 100)));
        
        if (draggingProgressRef.current.progress !== newProgress) {
            draggingProgressRef.current.progress = newProgress;
            setProjectList(prev => prev.map(p => p.id === id ? { ...p, progress: newProgress } : p));
        }
    }, []);

    const handleGlobalMouseUp = useCallback(async () => {
        if (draggingProgressRef.current) {
            const { id, progress } = draggingProgressRef.current;
            draggingProgressRef.current = null;
            
            try {
                await projectService.update(id, { progress });
            } catch (err) {
                dispatch(addToast({ title: 'Error', message: 'Failed to update progress.', type: 'error' }));
            }
        }
    }, [dispatch]);

    useEffect(() => {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [handleGlobalMouseMove, handleGlobalMouseUp]);

    // --- OVERVIEW VIEW ---
    const renderOverview = () => {
        const activeCount = projectList.filter(p => p.status === 'In Progress').length;
        const doneTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
        const completionPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
        const atRisk = projectList.filter(p => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'Completed').length;

        const stats = [
            { label: 'Active Projects', value: activeCount || projectList.length, img: '/assets/project/new/1.png', change: `${projectList.length} total` },
            { label: 'Total Tasks', value: tasks.length, img: '/assets/project/new/2.png', change: `${doneTasks} done` },
            { label: 'Completion', value: `${completionPct}%`, img: '/assets/project/new/3.png', change: `+${completionPct > 0 ? completionPct : 0}%` },
            { label: 'At Risk', value: atRisk, img: '/assets/project/new/4.png', change: atRisk > 0 ? `-${atRisk}` : '+0' },
        ];

        // Build real upcoming deadlines from tasks with deadlines
        const upcomingDeadlines = tasks
            .filter(t => t.deadline && new Date(t.deadline) >= new Date() && t.status !== 'Done')
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5)
            .map(t => {
                const d = new Date(t.deadline);
                return { title: t.title, date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), project: t.project_name, priority: t.priority };
            });

        // Compute real health
        const total = projectList.length || 1;
        const onTrack = projectList.filter(p => p.status === 'In Progress' || p.status === 'Completed').length;
        const onHold = projectList.filter(p => p.status === 'On Hold').length;
        const delayed = atRisk;
        const onTrackPct = Math.round((onTrack / total) * 100);
        const atRiskPct = Math.round((onHold / total) * 100);
        const delayedPct = Math.round((delayed / total) * 100);

        return (
            <div className="pm__overview">
                <div className="pm__stats-grid">
                    {stats.map(stat => (
                        <div key={stat.label} className="pm__stat-card">
                            <div className="pm__stat-info">
                                <span className="pm__stat-value">{stat.value}</span>
                                <span className="pm__stat-label">{stat.label}</span>
                                <div className={`pm__stat-trend ${stat.change.startsWith('+') || stat.change.includes('total') || stat.change.includes('done') ? 'positive' : 'negative'}`}>
                                    <TrendingUp size={10} style={{marginRight: '4px'}}/>
                                    {stat.change}
                                </div>
                            </div>
                            <div className="pm__stat-img">
                                <img src={stat.img} alt={stat.label} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pm__overview-content">
                    <div className="pm__widget">
                        <div className="pm__widget-header">
                            <h3>Upcoming Deadlines</h3>
                            <Button variant="ghost" size="sm" onClick={() => handleTabChange('tasks')}>View All</Button>
                        </div>
                        <div className="pm__deadline-list">
                            {upcomingDeadlines.length === 0 && <p style={{color:'var(--text-muted)', fontSize:'13px'}}>No upcoming deadlines found.</p>}
                            {upcomingDeadlines.map((d, i) => (
                                <div key={i} className="pm__deadline-item">
                                    <div className="pm__deadline-date">
                                        <strong>{d.date.split(' ')[1]}</strong>
                                        <span>{d.date.split(' ')[0]}</span>
                                    </div>
                                    <div className="pm__deadline-info">
                                        <h4>{d.title}</h4>
                                        <span>{d.project}</span>
                                    </div>
                                    {renderTag(d.priority)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pm__widget">
                        <div className="pm__widget-header">
                            <h3>Project Health</h3>
                            <Button variant="ghost" size="sm" onClick={() => handleTabChange('projects')}>Details</Button>
                        </div>
                        <div className="pm__health-chart">
                            <div className="pm__health-item">
                                <label>On Track</label>
                                <div className="pm__health-bar"><div className="fill success" style={{width: `${onTrackPct}%`}}></div></div>
                                <span>{onTrackPct}%</span>
                            </div>
                            <div className="pm__health-item">
                                <label>On Hold</label>
                                <div className="pm__health-bar"><div className="fill warning" style={{width: `${atRiskPct}%`}}></div></div>
                                <span>{atRiskPct}%</span>
                            </div>
                            <div className="pm__health-item">
                                <label>Overdue</label>
                                <div className="pm__health-bar"><div className="fill danger" style={{width: `${delayedPct}%`}}></div></div>
                                <span>{delayedPct}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- PROJECTS VIEW ---
    const renderProjects = () => (
        <div className={`pm__projects pm__projects--${viewMode}`}>
            {filteredProjects.length === 0 && <p style={{color:'var(--text-muted)',padding:'40px',textAlign:'center',width:'100%'}}>No projects match your filters.</p>}
            {filteredProjects.map(project => (
                <div key={project.id} className="pm__project-card" onClick={() => { setViewingProject(project); setIsProjectDetailsModalOpen(true); }}>
                    <div className="pm__project-card-header">
                        <div className="pm__project-card-title">
                            <h3>{project.name}</h3>
                            <p>{project.description}</p>
                        </div>
                        <div className="pm__project-card-actions">
                            <button onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditMode(true);
                                setSelectedProject(project);
                                setProjectForm({
                                    name: project.name,
                                    description: project.description || '',
                                    status: project.status,
                                    priority: project.priority || 'Medium',
                                    dueDate: project.due_date || '',
                                    client_id: project.client_id || '',
                                    amount: project.amount || 0
                                });
                                setIsAddProjectModalOpen(true); 
                            }}><Pencil size={14}/></button>
                            <button onClick={(e) => handleDeleteProject(e, project.id)} style={{color: 'var(--danger)'}}><Trash2 size={14}/></button>
                            <button className="pm__sprint-btn" onClick={(e) => handleViewSprintBoard(e, project.id)}>
                                <ExternalLink size={14} />
                                <span>Sprint Board</span>
                            </button>
                        </div>
                    </div>

                    <div className="pm__project-card-meta">
                        <div className="pm__meta-group">
                            <label>Status</label>
                            {renderTag(project.status)}
                        </div>
                        <div className="pm__meta-group">
                            <label>Priority</label>
                            {renderTag(project.priority)}
                        </div>
                        <div className="pm__meta-group">
                            <label>Deadline</label>
                            <div className="pm__deadline-pill">
                                <Timer size={12} />
                                {project.due_date ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                            </div>
                        </div>
                    </div>

                    <div className="pm__project-card-progress">
                        <div className="pm__progress-info">
                            <span>Progress</span>
                            <strong>{project.progress || 0}%</strong>
                        </div>
                        <div className="pm__progress-bar" onMouseDown={(e) => handleProgressMouseDown(e, project.id)} style={{cursor: 'pointer'}}>
                            <div className="pm__progress-fill" style={{ width: `${project.progress || 0}%`, background: (project.progress || 0) > 80 ? 'var(--success)' : 'var(--primary-500)' }}>
                                <div className="pm__progress-thumb"></div>
                            </div>
                        </div>
                        <div className="pm__progress-stats">
                            <span><CheckCircle2 size={12}/> {project.tasks_done || 0} Tasks Done</span>
                            <span>{project.tasks_total || 0} Total</span>
                        </div>
                    </div>

                    <div className="pm__project-card-footer">
                        <div className="pm__project-team">
                            {(project.project_members || []).slice(0, 3).map((m, idx) => <Avatar key={idx} name={m.user_id} size="xs" />)}
                        </div>
                        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={(e) => { e.stopPropagation(); setViewingProject(project); setIsProjectDetailsModalOpen(true); }}>Project Details</Button>
                    </div>
                </div>
            ))}
        </div>
    );

    // --- TASKS VIEW ---
    const renderTasks = () => (
        <div className="pm__tasks-container">
            <table className="pm__tasks-table">
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assignee</th>
                        <th>Deadline</th>
                        <th style={{width: '100px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'var(--text-muted)',padding:'40px'}}>No tasks found. Create one to get started!</td></tr>}
                    {filteredTasks.map(task => (
                        <tr key={task.id}>
                            <td><strong>{task.title}</strong></td>
                            <td><span className="pm__project-link">{task.project_name}</span></td>
                            <td>{renderTag(task.status)}</td>
                            <td>{renderTag(task.priority)}</td>
                            <td>
                                <div className="pm__task-assignee">
                                    <Avatar name={task.assignee_name || 'Unassigned'} size="xs" />
                                    <span>{task.assignee_name || 'Unassigned'}</span>
                                </div>
                            </td>
                            <td>
                                <div className="pm__task-deadline">
                                    <Clock size={12} />
                                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}
                                </div>
                            </td>
                            <td>
                                <div className="pm__task-actions">
                                    <button className="pm__icon-btn" onClick={() => handleEditTask(task)}><Pencil size={14}/></button>
                                    <button className="pm__icon-btn danger" onClick={() => handleDeleteTask(task.id)}><Trash2 size={14}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const handleCreateProject = async () => {
        if (isEmpty(projectForm.name)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Project name is required.', type: 'warning' }));
            return;
        }
        if (projectForm.amount && !isPositiveNumber(projectForm.amount)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Budget amount must be a positive number.', type: 'warning' }));
            return;
        }
        try {
            const payload = {
                name: projectForm.name,
                description: projectForm.description,
                status: projectForm.status,
                priority: projectForm.priority,
                due_date: projectForm.dueDate ? projectForm.dueDate : null,
                client_id: projectForm.client_id ? projectForm.client_id : null,
                amount: parseFloat(projectForm.amount) || 0
            };

            if (editMode && selectedProject) {
                await projectService.update(selectedProject.id, payload);
                dispatch(addToast({ title: 'Success', message: 'Project updated successfully.', type: 'success' }));
            } else {
                await projectService.create(payload);
                dispatch(addToast({ title: 'Success', message: 'Project created successfully.', type: 'success' }));
            }
            
            setIsAddProjectModalOpen(false);
            setProjectForm({ name: '', description: '', status: 'Planning', priority: 'Medium', dueDate: '', client_id: '', amount: 0 });
            setEditMode(false);
            setSelectedProject(null);
            await loadAllData();
        } catch (err) {
            console.error("Project save error:", err);
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to save project.', type: 'error' }));
        }
    };

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this project? All associated tasks will also be deleted.")) return;
        try {
            await projectService.delete(id);
            await loadAllData();
            dispatch(addToast({ title: 'Deleted', message: 'Project has been removed.', type: 'info' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: 'Failed to delete project.', type: 'error' }));
        }
    };

    // --- TASK CRUD ---
    const handleCreateTask = async () => {
        if (isEmpty(taskForm.title) || isEmpty(taskForm.project_id)) {
            dispatch(addToast({ title: 'Validation', message: 'Task title and project are required.', type: 'warning' }));
            return;
        }
        try {
            const selectedMember = teamMembers.find(m => m.id === taskForm.assignee_id);
            const payload = {
                title: taskForm.title,
                project_id: taskForm.project_id,
                priority: taskForm.priority,
                status: taskForm.status,
                deadline: taskForm.deadline || null,
                assignee_id: taskForm.assignee_id || null,
                assignee_name: selectedMember ? selectedMember.name : (taskForm.assignee_name || null),
                description: taskForm.description || null
            };
            if (editingTask) {
                await projectService.updateTask(editingTask.id, payload);
                dispatch(addToast({ title: 'Updated', message: 'Task updated successfully.', type: 'success' }));
            } else {
                await projectService.createTask(payload);
                dispatch(addToast({ title: 'Created', message: 'Task created successfully.', type: 'success' }));
            }
            setIsAddTaskModalOpen(false);
            setEditingTask(null);
            setTaskForm({ title: '', project_id: '', priority: 'Medium', status: 'Not Started', deadline: '', assignee_id: '', assignee_name: '', description: '' });
            await loadAllData();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to save task.', type: 'error' }));
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title,
            project_id: task.project_id,
            priority: task.priority || 'Medium',
            status: task.status || 'Not Started',
            deadline: task.deadline || '',
            assignee_id: task.assignee_id || '',
            assignee_name: task.assignee_name || '',
            description: task.description || ''
        });
        setIsAddTaskModalOpen(true);
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await projectService.deleteTask(id);
            await loadAllData();
            dispatch(addToast({ title: 'Deleted', message: 'Task removed.', type: 'info' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: 'Failed to delete task.', type: 'error' }));
        }
    };

    return (
        <div className="pm">
            {/* Banner */}
            <div className="pm__banner">
                <div className="pm__banner-bg" style={{ backgroundImage: `url('/assets/project/5.png')` }}></div>
                <div className="pm__banner-overlay"></div>
                <div className="pm__banner-content">
                    <h1>Project Management</h1>
                    <p>Drive efficiency, meet deadlines, and deliver excellence across all projects.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="pm__toolbar">
                <div className="pm__tabs">
                    <button className={`pm__tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}><BarChart3 size={16}/> Overview</button>
                    <button className={`pm__tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabChange('projects')}><FolderKanban size={16}/> Projects</button>
                    <button className={`pm__tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => handleTabChange('tasks')}><List size={16}/> Tasks</button>
                </div>

                <div className="pm__actions">
                    {activeTab === 'projects' && (
                        <div className="pm__view-toggle">
                            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={16}/></button>
                            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={16}/></button>
                        </div>
                    )}
                    {(activeTab === 'projects' || activeTab === 'tasks') && (
                        <>
                            <select className="pm__filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                {activeTab === 'tasks' && <option value="Not Started">Not Started</option>}
                                {activeTab === 'tasks' && <option value="Done">Done</option>}
                            </select>
                            <select className="pm__filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                <option value="all">All Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </>
                    )}
                    <div className="pm__search">
                        <Search size={15} />
                        <input placeholder={activeTab === 'tasks' ? 'Search tasks...' : 'Search projects...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="primary" icon={Plus} onClick={() => {
                        if (activeTab === 'tasks') {
                            setEditingTask(null);
                            setTaskForm({ title: '', project_id: projectList[0]?.id || '', priority: 'Medium', status: 'Not Started', deadline: '', assignee_id: '', assignee_name: '', description: '' });
                            setIsAddTaskModalOpen(true);
                        } else {
                            setEditMode(false);
                            setSelectedProject(null);
                            setProjectForm({ name: '', description: '', status: 'Planning', priority: 'Medium', dueDate: '', client_id: '', amount: 0 });
                            setIsAddProjectModalOpen(true);
                        }
                    }}>
                        {activeTab === 'tasks' ? 'Add Task' : 'New Project'}
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="pm__content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'tasks' && renderTasks()}
            </div>

            {/* Modals */}
            <Modal isOpen={isAddProjectModalOpen} onClose={() => setIsAddProjectModalOpen(false)} title={editMode ? "Edit Project" : "Create New Project"}>
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Project Name</label>
                        <input className="dw-form-input" placeholder="e.g. Q3 Marketing Redesign" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Description</label>
                        <textarea className="dw-form-input" placeholder="Project goals and scope..." rows={3} value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                    </div>
                    
                    <div className="dw-form-group">
                        <label className="dw-form-label">Link Client (Optional)</label>
                        <select className="dw-form-input" value={projectForm.client_id} onChange={e => setProjectForm({...projectForm, client_id: e.target.value})}>
                            <option value="">No Client (Internal Project)</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                            ))}
                        </select>
                    </div>

                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Status</label>
                            <select className="dw-form-input" value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                                <option value="Planning">Planning</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Priority</label>
                            <select className="dw-form-input" value={projectForm.priority} onChange={e => setProjectForm({...projectForm, priority: e.target.value})}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="dw-form-group" style={{marginTop: '16px'}}>
                        <label className="dw-form-label">Deadline</label>
                        <input type="date" className="dw-form-input" value={projectForm.dueDate} onChange={e => setProjectForm({...projectForm, dueDate: e.target.value})} />
                    </div>
                    
                    <div className="dw-form-group" style={{marginTop: '16px'}}>
                        <label className="dw-form-label">Project Budget / Amount ($)</label>
                        <input type="number" className="dw-form-input" value={projectForm.amount} onChange={e => setProjectForm({...projectForm, amount: e.target.value})} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button variant="ghost" onClick={() => setIsAddProjectModalOpen(false)} fullWidth>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateProject} fullWidth>{editMode ? 'Save Changes' : 'Create Project'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isAddTaskModalOpen} onClose={() => { setIsAddTaskModalOpen(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Task Title</label>
                        <input className="dw-form-input" placeholder="What needs to be done?" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Associated Project</label>
                        <select className="dw-form-input" value={taskForm.project_id} onChange={e => setTaskForm({...taskForm, project_id: e.target.value})}>
                            <option value="">Select a project</option>
                            {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Assign To</label>
                        <select className="dw-form-input" value={taskForm.assignee_id} onChange={e => setTaskForm({...taskForm, assignee_id: e.target.value})}>
                            <option value="">Unassigned</option>
                            {teamMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Status</label>
                            <select className="dw-form-input" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Done">Done</option>
                                <option value="Stuck">Stuck</option>
                            </select>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Priority</label>
                            <select className="dw-form-input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="dw-form-group" style={{marginTop:'16px'}}>
                        <label className="dw-form-label">Deadline</label>
                        <input type="date" className="dw-form-input" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Description (Optional)</label>
                        <textarea className="dw-form-input" rows={2} placeholder="Task details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button variant="ghost" onClick={() => { setIsAddTaskModalOpen(false); setEditingTask(null); }} fullWidth>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateTask} fullWidth>{editingTask ? 'Save Changes' : 'Add Task'}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isProjectDetailsModalOpen} onClose={() => setIsProjectDetailsModalOpen(false)} title="Project Details">
                {viewingProject && (
                    <div className="dw-form">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Project Name</label>
                            <div style={{fontSize: '16px', fontWeight: 'bold'}}>{viewingProject.name}</div>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Description</label>
                            <div style={{color: 'var(--text-secondary)'}}>{viewingProject.description || 'No description provided.'}</div>
                        </div>
                        <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Status</label>
                                <div>{renderTag(viewingProject.status)}</div>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Priority</label>
                                <div>{renderTag(viewingProject.priority)}</div>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Deadline</label>
                                <div style={{color: 'var(--text-secondary)'}}>{viewingProject.due_date ? new Date(viewingProject.due_date).toLocaleDateString() : 'No date'}</div>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Progress</label>
                                <div style={{color: 'var(--text-secondary)'}}>{viewingProject.progress || 0}%</div>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Tasks</label>
                                <div style={{color: 'var(--text-secondary)'}}>{viewingProject.tasks_done || 0} / {viewingProject.tasks_total || 0} Done</div>
                            </div>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Budget / Amount</label>
                                <div style={{color: 'var(--text-secondary)'}}>${viewingProject.amount || 0}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <Button variant="ghost" onClick={() => setIsProjectDetailsModalOpen(false)} fullWidth>Close</Button>
                            <Button variant="primary" onClick={() => { setIsProjectDetailsModalOpen(false); handleViewSprintBoard({stopPropagation:()=>{}}, viewingProject.id); }} fullWidth>Go to Sprint Board</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProjectManagement;
