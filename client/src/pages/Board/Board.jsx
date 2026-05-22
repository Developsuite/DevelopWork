import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { openItemDrawer, closeItemDrawer, addToast } from '../../store/slices/uiSlice';
import { projectService } from '../../services/projectService';
import { isEmpty } from '../../utils/validation';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    LayoutDashboard, Users, DollarSign, Handshake, Headphones,
    Table2, Columns3, GanttChart, Calendar, ChevronDown, Plus,
    X, Clock, Filter, Download, UserPlus, GripVertical, LayoutList,
    Upload, FileText, Settings, Activity, Trash2, Pencil, ChevronRight,
    Target, Timer, BarChart3, List, LayoutGrid, Search, Send, ArrowRight
} from 'lucide-react';
import './Board.css';

// Status columns for Kanban view
const STATUS_COLUMNS = [
    { label: 'Not Started', color: '#6C7A96' },
    { label: 'In Progress', color: '#FDAB3D' },
    { label: 'In Review', color: '#A25DDC' },
    { label: 'Done', color: '#00C875' },
    { label: 'Stuck', color: '#E2445C' },
];

const Board = () => {
    const { boardId } = useParams();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);
    const { itemDrawerOpen, activeItemId } = useSelector((state) => state.ui);

    const [activeView, setActiveView] = useState('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Real data state
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [sprint, setSprint] = useState(null);

    // Task form state
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '', status: 'Not Started', priority: 'Medium',
        deadline: '', assignee_name: '', description: ''
    });

    // Load project data
    const loadData = useCallback(async () => {
        if (!projectId) { setLoading(false); return; }
        try {
            const [proj, projectTasks, sprints] = await Promise.all([
                projectService.getById(projectId),
                projectService.getTasks(projectId),
                projectService.getSprints(projectId)
            ]);
            setProject(proj);
            setTasks(projectTasks);
            if (sprints.length > 0) setSprint(sprints.find(s => s.status === 'Active') || sprints[0]);
        } catch (err) {
            console.error('Failed to load sprint board:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to load project data.', type: 'error' }));
        } finally {
            setLoading(false);
        }
    }, [projectId, dispatch]);

    useEffect(() => { loadData(); }, [loadData]);

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        if (!searchQuery) return tasks;
        const q = searchQuery.toLowerCase();
        return tasks.filter(t =>
            t.title?.toLowerCase().includes(q) ||
            t.assignee_name?.toLowerCase().includes(q) ||
            t.priority?.toLowerCase().includes(q)
        );
    }, [tasks, searchQuery]);

    // Kanban columns
    const kanbanColumns = useMemo(() => {
        return STATUS_COLUMNS.map(col => ({
            ...col,
            items: filteredTasks.filter(t => t.status === col.label)
        }));
    }, [filteredTasks]);

    // Active task for drawer
    const activeTask = activeItemId ? tasks.find(t => t.id === activeItemId) : null;

    const renderTag = (val) => {
        if (!val) return null;
        const slug = val.toLowerCase().replace(/\s+/g, '-');
        return (
            <span className={`brd__tag brd__tag--${slug}`}>
                <span className="brd__tag-dot"></span>
                {val}
            </span>
        );
    };

    // --- CRUD Handlers ---
    const handleCreateTask = async () => {
        if (isEmpty(taskForm.title)) {
            dispatch(addToast({ title: 'Validation', message: 'Task title is required.', type: 'warning' }));
            return;
        }
        try {
            const payload = {
                title: taskForm.title,
                project_id: projectId,
                status: taskForm.status,
                priority: taskForm.priority,
                deadline: taskForm.deadline || null,
                assignee_name: taskForm.assignee_name || null,
                description: taskForm.description || null,
            };
            if (editingTask) {
                await projectService.updateTask(editingTask.id, payload);
                dispatch(addToast({ title: 'Updated', message: 'Task updated.', type: 'success' }));
            } else {
                await projectService.createTask(payload);
                dispatch(addToast({ title: 'Created', message: 'Task created.', type: 'success' }));
            }
            setIsTaskModalOpen(false);
            setEditingTask(null);
            setTaskForm({ title: '', status: 'Not Started', priority: 'Medium', deadline: '', assignee_name: '', description: '' });
            await loadData();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to save task.', type: 'error' }));
        }
    };

    const openNewTaskModal = (status) => {
        setEditingTask(null);
        setTaskForm({ title: '', status: status || 'Not Started', priority: 'Medium', deadline: '', assignee_name: '', description: '' });
        setIsTaskModalOpen(true);
    };

    const openEditTaskModal = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title,
            status: task.status || 'Not Started',
            priority: task.priority || 'Medium',
            deadline: task.deadline || '',
            assignee_name: task.assignee_name || '',
            description: task.description || ''
        });
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await projectService.deleteTask(taskId);
            dispatch(closeItemDrawer());
            await loadData();
            dispatch(addToast({ title: 'Deleted', message: 'Task removed.', type: 'info' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: 'Failed to delete task.', type: 'error' }));
        }
    };

    // Drag-and-drop: update task status in DB
    const handleDragEnd = useCallback(async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId;
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

        try {
            await projectService.updateTask(draggableId, { status: newStatus });
            dispatch(addToast({ title: 'Moved', message: `Task moved to ${newStatus}`, type: 'success' }));
        } catch (err) {
            // Revert on failure
            await loadData();
            dispatch(addToast({ title: 'Error', message: 'Failed to move task.', type: 'error' }));
        }
    }, [dispatch, loadData]);

    const views = [
        { key: 'kanban', label: 'Kanban', icon: Columns3 },
        { key: 'table', label: 'Table', icon: Table2 },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="brd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Timer size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Loading Sprint Board...</p>
                </div>
            </div>
        );
    }

    // No project found
    if (!project) {
        return (
            <div className="brd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Target size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                    <h3 style={{ marginBottom: '8px' }}>No Project Selected</h3>
                    <p style={{ marginBottom: '20px' }}>Go to Project Management and click Sprint Board on a project.</p>
                    <Button variant="primary" onClick={() => navigate('/projects')}>Go to Projects</Button>
                </div>
            </div>
        );
    }

    const projectName = project.name;
    const sprintName = sprint?.name || 'Sprint Board';

    return (
        <div className="brd">
            {/* Banner */}
            <div className="brd__banner">
                <div className="brd__banner-bg" style={{ backgroundImage: `url('/assets/project/5.png')` }}></div>
                <div className="brd__banner-overlay"></div>
                <div className="brd__banner-content">
                    <div className="brd__banner-path">
                        <span onClick={() => navigate('/projects')}>Projects</span>
                        <ChevronRight size={14} />
                        <span>{projectName}</span>
                        {sprint && <><ChevronRight size={14} /><span>{sprintName}</span></>}
                    </div>
                    <h1>{projectName}</h1>
                    <p>{sprint ? `${sprintName} • ${sprint.status}` : 'Sprint Dashboard'} • {tasks.length} Tasks</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="brd__toolbar">
                <div className="brd__tabs">
                    {views.map((view) => (
                        <button
                            key={view.key}
                            className={`brd__tab ${activeView === view.key ? 'active' : ''}`}
                            onClick={() => setActiveView(view.key)}
                        >
                            <view.icon size={16} />
                            {view.label}
                        </button>
                    ))}
                </div>

                <div className="brd__actions">
                    <div className="brd__search">
                        <Search size={15} />
                        <input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="primary" icon={Plus} onClick={() => openNewTaskModal()}>New Task</Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="brd__content">
                {activeView === 'kanban' && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="brd__kanban">
                            {kanbanColumns.map((column) => (
                                <div key={column.label} className="brd__column">
                                    <div className="brd__column-header" style={{ borderTop: `3px solid ${column.color}` }}>
                                        <div className="brd__column-title">
                                            <div className="brd__column-dot" style={{ background: column.color }} />
                                            <span>{column.label}</span>
                                            <span className="brd__column-count">{column.items.length}</span>
                                        </div>
                                        <button className="brd__column-add" onClick={() => openNewTaskModal(column.label)}><Plus size={16}/></button>
                                    </div>
                                    <Droppable droppableId={column.label}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`brd__column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                            >
                                                {column.items.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`brd__card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                                onClick={() => dispatch(openItemDrawer(task.id))}
                                                            >
                                                                <div className="brd__card-header">
                                                                    <span className="brd__card-name">{task.title}</span>
                                                                    {renderTag(task.priority)}
                                                                </div>
                                                                <div className="brd__card-footer">
                                                                    <div className="brd__card-meta">
                                                                        <Avatar name={task.assignee_name || 'Unassigned'} size="xs" />
                                                                        <span className="brd__card-date">
                                                                            <Clock size={12}/>
                                                                            {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="brd__card-grip"><GripVertical size={14}/></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                )}

                {activeView === 'table' && (
                    <div className="brd__table-container">
                        <table className="brd__table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Assignee</th>
                                    <th>Deadline</th>
                                    <th style={{width:'100px'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 && (
                                    <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:'40px'}}>No tasks yet. Create one to get started!</td></tr>
                                )}
                                {filteredTasks.map(task => (
                                    <tr key={task.id} onClick={() => dispatch(openItemDrawer(task.id))}>
                                        <td><strong>{task.title}</strong></td>
                                        <td>{renderTag(task.status)}</td>
                                        <td>{renderTag(task.priority)}</td>
                                        <td>
                                            <div className="brd__cell-person">
                                                <Avatar name={task.assignee_name || 'Unassigned'} size="xs"/>
                                                <span>{task.assignee_name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td><span className="brd__cell-date">{task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}</span></td>
                                        <td>
                                            <div className="brd__table-actions">
                                                <button className="brd__icon-btn" onClick={(e) => { e.stopPropagation(); openEditTaskModal(task); }}><Pencil size={14}/></button>
                                                <button className="brd__icon-btn danger" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Task Detail Drawer */}
            {itemDrawerOpen && activeTask && (
                <>
                    <div className="brd__drawer-overlay" onClick={() => dispatch(closeItemDrawer())} />
                    <div className="brd__drawer">
                        <div className="brd__drawer-header">
                            <h2>Task Details</h2>
                            <button onClick={() => dispatch(closeItemDrawer())}><X size={20}/></button>
                        </div>
                        <div className="brd__drawer-content">
                            <div className="brd__drawer-title">
                                <h3>{activeTask.title}</h3>
                                {renderTag(activeTask.status)}
                            </div>

                            <div className="brd__drawer-grid">
                                <div className="brd__drawer-item">
                                    <label>Priority</label>
                                    <div>{renderTag(activeTask.priority)}</div>
                                </div>
                                <div className="brd__drawer-item">
                                    <label>Assignee</label>
                                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <Avatar name={activeTask.assignee_name || 'Unassigned'} size="xs"/>
                                        {activeTask.assignee_name || 'Unassigned'}
                                    </div>
                                </div>
                                <div className="brd__drawer-item">
                                    <label>Deadline</label>
                                    <div>{activeTask.deadline ? new Date(activeTask.deadline).toLocaleDateString() : 'No deadline'}</div>
                                </div>
                                <div className="brd__drawer-item">
                                    <label>Created</label>
                                    <div>{new Date(activeTask.created_at).toLocaleDateString()}</div>
                                </div>
                                {activeTask.description && (
                                    <div className="brd__drawer-item" style={{gridColumn:'1/-1'}}>
                                        <label>Description</label>
                                        <div>{activeTask.description}</div>
                                    </div>
                                )}
                            </div>

                            <div className="brd__drawer-actions">
                                <Button variant="primary" icon={Pencil} fullWidth onClick={() => { dispatch(closeItemDrawer()); openEditTaskModal(activeTask); }}>Edit Task</Button>
                                <Button variant="ghost" icon={Trash2} fullWidth onClick={() => handleDeleteTask(activeTask.id)}>Delete Task</Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Create/Edit Task Modal */}
            <Modal isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} title={editingTask ? 'Edit Task' : 'Create New Task'}>
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Task Title</label>
                        <input className="dw-form-input" placeholder="What needs to be done?" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Assignee Name</label>
                        <input className="dw-form-input" placeholder="e.g. Abbas Khan" value={taskForm.assignee_name} onChange={e => setTaskForm({...taskForm, assignee_name: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    <div className="dw-form-group">
                        <label className="dw-form-label">Deadline</label>
                        <input type="date" className="dw-form-input" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Description (Optional)</label>
                        <textarea className="dw-form-input" rows={2} placeholder="Task details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button variant="ghost" onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }} fullWidth>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateTask} fullWidth>{editingTask ? 'Save Changes' : 'Create Task'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Board;
