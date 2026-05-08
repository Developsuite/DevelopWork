import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProject, setCreateModalOpen } from '../../../store/slices/projectSlice';
import { mockMembers } from '../../../utils/mockData';
import Modal from '../../common/Modal/Modal';
import Button from '../../common/Button/Button';
import Avatar from '../../common/Avatar/Avatar';

const CreateProjectModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state) => state.project.isCreateModalOpen);
    const [selectedMembers, setSelectedMembers] = useState(['Abbas Khan']);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleClose = () => {
        dispatch(setCreateModalOpen(false));
    };

    const toggleMember = (name) => {
        if (selectedMembers.includes(name)) {
            setSelectedMembers(selectedMembers.filter(m => m !== name));
        } else {
            setSelectedMembers([...selectedMembers, name]);
        }
    };

    const handleSave = () => {
        if (!formData.name) return;

        const newProj = {
            id: Date.now(),
            name: formData.name,
            description: formData.description || 'New project description...',
            status: 'Planning',
            priority: formData.priority,
            progress: 0,
            dueDate: formData.dueDate,
            members: selectedMembers,
            tasksTotal: 0,
            tasksDone: 0,
        };
        
        dispatch(addProject(newProj));
        handleClose();
        setSelectedMembers(['Abbas Khan']);
        setFormData({
            name: '',
            description: '',
            priority: 'Medium',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Project"
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!formData.name}>Create Project</Button>
                </>
            }
        >
            <div className="dw-form">
                <div className="dw-form-group">
                    <label className="dw-form-label">Project Name</label>
                    <input
                        type="text"
                        className="dw-form-input"
                        placeholder="e.g. Website Redesign"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                    />
                </div>
                <div className="dw-form-group">
                    <label className="dw-form-label">Description</label>
                    <textarea
                        className="dw-form-input dw-form-textarea"
                        placeholder="What is this project about?"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="dw-form-group">
                    <label className="dw-form-label">Assign Members</label>
                    <div className="dw-form-member-list">
                        {mockMembers.map(member => (
                            <button 
                                key={member._id}
                                className={`dw-form-member-chip ${selectedMembers.includes(member.name) ? 'active' : ''}`}
                                onClick={() => toggleMember(member.name)}
                            >
                                <Avatar name={member.name} size="xs" />
                                <span>{member.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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
            </div>
        </Modal>
    );
};

export default CreateProjectModal;
