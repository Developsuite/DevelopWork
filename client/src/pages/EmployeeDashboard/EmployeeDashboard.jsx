import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar, CheckCircle, Clock, CreditCard, Headphones, CalendarDays, Zap, Loader2, RefreshCw } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { addToast } from '../../store/slices/uiSlice';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const loadTasks = async () => {
        if (!user) return;
        setLoadingTasks(true);
        try {
            const data = await projectService.getTasksByAssignee(user.id, user.name);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load employee tasks:', error);
            dispatch(addToast({ title: 'Error', message: 'Failed to load your tasks', type: 'error' }));
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [user]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            await projectService.updateTask(taskId, { status: newStatus });
            dispatch(addToast({ title: 'Status Updated', message: `Task marked as ${newStatus}`, type: 'success' }));
        } catch (error) {
            console.error('Failed to update task status:', error);
            dispatch(addToast({ title: 'Error', message: 'Failed to update task', type: 'error' }));
            loadTasks(); // Revert on error
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'done': return 'var(--success)';
            case 'in progress': return 'var(--primary-500)';
            case 'in review': return 'var(--warning)';
            case 'stuck': return 'var(--danger)';
            default: return 'var(--text-secondary)';
        }
    };

    const activeTasks = tasks.filter(t => t.status !== 'Done');
    const recentTasks = activeTasks.slice(0, 5);

    return (
        <div className="employee-dashboard">
            {/* Welcome Banner */}
            <div className="employee-dashboard__welcome glass-card">
                <div className="employee-dashboard__welcome-left">
                    <div className="employee-dashboard__welcome-text">
                        <h1>Welcome back, {user?.name?.split(' ')[0] || 'Team Member'}!</h1>
                        <p>Here's what's happening with your projects today.</p>
                    </div>
                    <div className="employee-dashboard__stats-row">
                        <div className="employee-dashboard__stat-pill">
                            <Clock size={14} color="var(--primary-500)" />
                            <span>{activeTasks.length} Active Tasks</span>
                        </div>
                        <div className="employee-dashboard__stat-pill success">
                            <CheckCircle size={14} color="var(--success)" />
                            <span>{tasks.filter(t => t.status === 'Done').length} Completed Tasks</span>
                        </div>
                    </div>
                </div>
                <div className="employee-dashboard__date">
                    <CalendarDays size={20} />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="employee-dashboard__grid">
                {/* My Tasks Widget */}
                <div className="employee-dashboard__widget glass-card">
                    <div className="employee-dashboard__widget-header">
                        <div className="employee-dashboard__widget-title">
                            <CheckCircle size={18} color="var(--primary-500)" />
                            <h3>My Active Tasks</h3>
                            <span className="employee-dashboard__task-count">{activeTasks.length} pending</span>
                        </div>
                        <button className="employee-dashboard__btn-text" onClick={loadTasks}>
                            <RefreshCw size={14} className={loadingTasks ? 'spinning' : ''} />
                            Refresh
                        </button>
                    </div>
                    
                    <div className="employee-dashboard__task-list">
                        {loadingTasks ? (
                            <div className="employee-dashboard__empty">
                                <Loader2 size={24} className="spinning" />
                                <p>Loading your tasks...</p>
                            </div>
                        ) : recentTasks.length > 0 ? (
                            recentTasks.map(task => (
                                <div key={task.id} className="employee-dashboard__task-item">
                                    <div className="employee-dashboard__task-info">
                                        <h4>{task.title || 'Untitled Task'}</h4>
                                        <span>Project: {task.project_name || 'Unknown Project'}</span>
                                    </div>
                                    
                                    <select 
                                        className="employee-dashboard__status-select"
                                        value={task.status || 'Not Started'}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        style={{ borderColor: getStatusColor(task.status), color: getStatusColor(task.status) }}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Done">Done</option>
                                        <option value="Stuck">Stuck</option>
                                    </select>
                                </div>
                            ))
                        ) : (
                            <div className="employee-dashboard__empty">
                                <CheckCircle size={24} color="var(--success)" />
                                <p>Great job! You have no active tasks right now.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default EmployeeDashboard;
