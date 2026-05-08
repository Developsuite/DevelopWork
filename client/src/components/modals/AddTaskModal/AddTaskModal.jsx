import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, addToast } from '../../../store/slices/uiSlice';
import { mockMembers } from '../../../utils/mockData';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import Avatar from '../../common/Avatar/Avatar';

const AddTaskModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state) => state.ui.modals.addTask);
    const projectList = useSelector((state) => state.project.projects);
    
    const [formData, setFormData] = useState({
        title: '',
        projectId: projectList[0]?.id || '',
        assignee: 'Abbas Khan',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'Medium'
    });

    const handleClose = () => {
        dispatch(closeModal('addTask'));
    };

    const handleSave = () => {
        if (!formData.title || !formData.projectId) return;

        // In a real app, we would dispatch an addItem or addTask action
        dispatch(addToast({
            title: 'Task Created',
            message: `"${formData.title}" has been added to the project.`,
            type: 'success'
        }));
        
        handleClose();
        setFormData({
            title: '',
            projectId: projectList[0]?.id || '',
            assignee: 'Abbas Khan',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'Medium'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Task"
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!formData.title}>Create Task</Button>
                </>
            }
        >
            <div className="dw-form">
                <div className="dw-form-group">
                    <label className="dw-form-label">Task Title</label>
                    <input
                        type="text"
                        className="dw-form-input"
                        placeholder="What needs to be done?"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="dw-form-group">
                    <label className="dw-form-label">Project</label>
                    <select
                        className="dw-form-input"
                        value={formData.projectId}
                        onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    >
                        {projectList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Assignee</label>
                        <select
                            className="dw-form-input"
                            value={formData.assignee}
                            onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                        >
                            {mockMembers.map(m => (
                                <option key={m._id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Priority</label>
                        <select
                            className="dw-form-input"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                </div>

                <div className="dw-form-group">
                    <label className="dw-form-label">Due Date</label>
                    <input
                        type="date"
                        className="dw-form-input"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AddTaskModal;
