import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import { addToast } from '../../store/slices/uiSlice';
import {
    Users, UserPlus, Calendar, Clock, TrendingUp, Award, Briefcase, DollarSign,
    FileText, Search, MoreVertical, Mail, Phone, MapPin, Star, Check, X, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';
import './HR.css';

const HR = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'directory');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [payrollMonth, setPayrollMonth] = useState('March 2026');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: 'Engineering'
    });

    const tabs = [
        { id: 'directory', label: 'Directory', icon: Users },
        { id: 'org', label: 'Org Chart', icon: TrendingUp },
        { id: 'attendance', label: 'Attendance & Leave', icon: Calendar },
        { id: 'recruitment', label: 'Recruitment', icon: UserPlus },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'performance', label: 'Performance', icon: Award },
    ];

    const [employees, setEmployees] = useState([
        { id: 1, name: 'Abbas Khan', role: 'Product Lead', department: 'Engineering', email: 'abbas@developwork.com', phone: '+92 300 1234567', location: 'Islamabad', type: 'Full-time', status: 'Active', joinDate: '2024-01-15', skills: ['React', 'Node.js', 'MongoDB'], manager: 'CEO', salary: 95000, bonus: 5000, deductions: 12000 },
        { id: 2, name: 'Sarah Ahmed', role: 'UI/UX Designer', department: 'Design', email: 'sarah@developwork.com', phone: '+92 300 2345678', location: 'Lahore', type: 'Full-time', status: 'Active', joinDate: '2024-03-10', skills: ['Figma', 'Design Systems', 'CSS'], manager: 'Abbas Khan', salary: 78000, bonus: 3000, deductions: 9800 },
        { id: 3, name: 'Ali Hassan', role: 'Backend Developer', department: 'Engineering', email: 'ali@developwork.com', phone: '+92 300 3456789', location: 'Karachi', type: 'Full-time', status: 'Active', joinDate: '2024-06-01', skills: ['Python', 'Django', 'PostgreSQL'], manager: 'Abbas Khan', salary: 82000, bonus: 4000, deductions: 10500 },
        { id: 4, name: 'Fatima Noor', role: 'QA Engineer', department: 'Engineering', email: 'fatima@developwork.com', phone: '+92 300 4567890', location: 'Islamabad', type: 'Part-time', status: 'On Leave', joinDate: '2024-09-15', skills: ['Selenium', 'Jest', 'Cypress'], manager: 'Abbas Khan', salary: 45000, bonus: 0, deductions: 5600 },
        { id: 5, name: 'Omar Raza', role: 'Operations Manager', department: 'Operations', email: 'omar@developwork.com', phone: '+92 300 5678901', location: 'Rawalpindi', type: 'Full-time', status: 'Active', joinDate: '2024-02-20', skills: ['Project Mgmt', 'Agile', 'Scrum'], manager: 'CEO', salary: 88000, bonus: 4500, deductions: 11200 },
    ]);

    const [leaveRequests, setLeaveRequests] = useState([
        { id: 1, employee: 'Fatima Noor', type: 'Annual', from: '2026-04-20', to: '2026-04-25', reason: 'Family vacation', status: 'Pending' },
        { id: 2, employee: 'Ali Hassan', type: 'Sick', from: '2026-04-18', to: '2026-04-18', reason: 'Medical appointment', status: 'Approved' },
        { id: 3, employee: 'Omar Raza', type: 'Annual', from: '2026-05-01', to: '2026-05-05', reason: 'Personal travel', status: 'Pending' },
    ]);

    const handleAddEmployee = () => {
        setIsModalOpen(true);
    };

    const handleSaveEmployee = () => {
        if (!formData.name) return;
        
        const newEmp = {
            id: Date.now(),
            name: formData.name,
            role: formData.role || 'New Employee',
            department: formData.department,
            email: `${formData.name.toLowerCase().replace(' ', '.')}@developwork.com`,
            phone: '+92 300 0000000',
            location: 'Islamabad',
            type: 'Full-time',
            status: 'Active',
            joinDate: new Date().toISOString().split('T')[0],
            skills: ['New'],
            manager: 'CEO',
            salary: 50000,
            bonus: 0,
            deductions: 0
        };
        setEmployees(prev => [...prev, newEmp]);
        setIsModalOpen(false);
        setFormData({ name: '', role: '', department: 'Engineering' });
        
        dispatch(addToast({
            title: 'Employee Added',
            message: `${formData.name} has been successfully added to the directory.`,
            type: 'success'
        }));
    };

    const handleApproveLeave = (id, employee) => {
        setLeaveRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: 'Approved' } : req
        ));
        dispatch(addToast({
            title: 'Leave Approved',
            message: `Leave request for ${employee} has been approved.`,
            type: 'success'
        }));
    };

    const handleRejectLeave = (id, employee) => {
        setLeaveRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: 'Rejected' } : req
        ));
        dispatch(addToast({
            title: 'Leave Rejected',
            message: `Leave request for ${employee} has been rejected.`,
            type: 'info'
        }));
    };

    const handleViewEmployee = (emp) => {
        // Find full employee data if it's just a name object
        const fullEmp = employees.find(e => e.name === emp.name) || emp;
        setSelectedEmployee(fullEmp);
        setIsProfileModalOpen(true);
    };

    const handleViewCandidate = (candidate) => {
        setSelectedEmployee({
            ...candidate,
            department: 'Hiring',
            status: 'Candidate',
            joinDate: 'N/A'
        });
        setIsProfileModalOpen(true);
    };

    const candidates = [
        { id: 1, name: 'Zain Malik', role: 'Frontend Developer', source: 'LinkedIn', date: '2026-04-10', stage: 'Interview', interviewer: 'Abbas Khan' },
        { id: 2, name: 'Ayesha Tariq', role: 'Product Designer', source: 'Referral', date: '2026-04-12', stage: 'Screening', interviewer: 'Sarah Ahmed' },
        { id: 3, name: 'Hassan Ali', role: 'DevOps Engineer', source: 'Indeed', date: '2026-04-08', stage: 'Offer', interviewer: 'Ali Hassan' },
        { id: 4, name: 'Maryam Shah', role: 'Data Analyst', source: 'LinkedIn', date: '2026-04-15', stage: 'Applied', interviewer: null },
        { id: 5, name: 'Usman Ghani', role: 'Backend Developer', source: 'Website', date: '2026-04-05', stage: 'Hired', interviewer: 'Abbas Khan' },
    ];

    const recruitmentStages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    const stageColors = { Applied: '#579BFC', Screening: '#FDAB3D', Interview: '#A25DDC', Offer: '#00C875', Hired: '#00C875' };

    const performanceReviews = [
        { id: 1, name: 'Abbas Khan', rating: 5, goals: [{ text: 'Ship v2.0', progress: 85 }, { text: 'Mentor juniors', progress: 70 }], feedback: 'Exceptional leader. Consistently delivers ahead of schedule.' },
        { id: 2, name: 'Sarah Ahmed', rating: 4, goals: [{ text: 'Design system v3', progress: 90 }, { text: 'User research', progress: 60 }], feedback: 'Great design skills. Can improve on stakeholder communication.' },
        { id: 3, name: 'Ali Hassan', rating: 4, goals: [{ text: 'API migration', progress: 45 }, { text: 'Code review process', progress: 80 }], feedback: 'Strong technical skills. Should focus on documentation.' },
    ];

    const departments = ['all', 'Engineering', 'Design', 'Operations', 'Marketing', 'HR'];
    const typeColors = { 'Full-time': 'var(--success)', 'Part-time': 'var(--info)', 'Contract': 'var(--warning)', 'Remote': '#8B5CF6' };
    const statusColors = { Active: 'var(--success)', 'On Leave': 'var(--warning)', Terminated: 'var(--danger)' };

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = selectedDepartment === 'all' || e.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    const stats = [
        { label: 'Total Employees', value: employees.length, icon: Users, iconBg: 'var(--primary-50)', iconColor: 'var(--primary-500)' },
        { label: 'On Leave', value: employees.filter(e => e.status === 'On Leave').length, icon: Calendar, iconBg: 'var(--warning-light)', iconColor: 'var(--warning)' },
        { label: 'Open Positions', value: candidates.filter(c => c.stage !== 'Hired').length, icon: Briefcase, iconBg: 'var(--info-light)', iconColor: 'var(--info)' },
        { label: 'Avg Rating', value: '4.3★', icon: Star, iconBg: 'var(--success-light)', iconColor: 'var(--success)' },
    ];

    return (
        <div className="hr-dashboard">
            <div className="hr-dashboard__header">
                <div>
                    <h1 className="hr-dashboard__title">Human Resources</h1>
                    <p className="hr-dashboard__subtitle">Manage your workforce, recruitment, and payroll</p>
                </div>
                <Button variant="primary" icon={UserPlus} onClick={handleAddEmployee}>Add Employee</Button>
            </div>

            {/* Stats */}
            <div className="hr-dashboard__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="hr-stat-card glass-card">
                        <div className="hr-stat-card__icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                            <stat.icon size={20} />
                        </div>
                        <div className="hr-stat-card__value">{stat.value}</div>
                        <div className="hr-stat-card__label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Sub-tab Navigation */}
            <div className="hr-tabs">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        type="button"
                        className={`hr-tab ${activeTab === tab.id ? 'active' : ''}`} 
                        onClick={() => handleTabChange(tab.id)}
                    >
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* === ORG CHART === */}
            {activeTab === 'org' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Organization Hierarchy</h2>
                        <Button variant="ghost" size="sm" icon={FileText} onClick={() => dispatch(addToast({ title: 'Exporting Chart', message: 'Generating organization hierarchy report...', type: 'info' }))}>Export PDF</Button>
                    </div>
                    <div className="hr-org-chart">
                        <div className="hr-org-node hr-org-node--root">
                            <div className="hr-org-card" onClick={() => handleViewEmployee({ name: 'CEO' })}>
                                <Avatar name="CEO" size="md" />
                                <div><strong>CEO Office</strong><span>Management</span></div>
                            </div>
                            <div className="hr-org-children">
                                <div className="hr-org-node">
                                    <div className="hr-org-card active" onClick={() => handleViewEmployee({ name: 'Abbas Khan' })}>
                                        <Avatar name="Abbas Khan" size="md" />
                                        <div><strong>Abbas Khan</strong><span>Product Lead</span></div>
                                    </div>
                                    <div className="hr-org-children">
                                        <div className="hr-org-node"><div className="hr-org-card" onClick={() => handleViewEmployee({ name: 'Sarah Ahmed' })}><Avatar name="Sarah Ahmed" size="sm" /><div><strong>Sarah Ahmed</strong><span>Design</span></div></div></div>
                                        <div className="hr-org-node"><div className="hr-org-card" onClick={() => handleViewEmployee({ name: 'Ali Hassan' })}><Avatar name="Ali Hassan" size="sm" /><div><strong>Ali Hassan</strong><span>Backend</span></div></div></div>
                                        <div className="hr-org-node"><div className="hr-org-card" onClick={() => handleViewEmployee({ name: 'Fatima Noor' })}><Avatar name="Fatima Noor" size="sm" /><div><strong>Fatima Noor</strong><span>QA</span></div></div></div>
                                    </div>
                                </div>
                                <div className="hr-org-node">
                                    <div className="hr-org-card" onClick={() => handleViewEmployee({ name: 'Omar Raza' })}>
                                        <Avatar name="Omar Raza" size="md" />
                                        <div><strong>Omar Raza</strong><span>Operations</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === DIRECTORY === */}
            {activeTab === 'directory' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Employee Directory</h2>
                        <div className="hr-filters">
                            <div className="hr-search"><Search size={16} /><input type="text" placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                            <select className="hr-dept-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                                {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="hr-employee-grid">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className="hr-employee-card" onClick={() => handleViewEmployee(emp)} style={{ cursor: 'pointer' }}>
                                <div className="hr-employee-card__top">
                                    <Avatar name={emp.name} size="lg" />
                                    <div className="hr-employee-card__badges">
                                        <Badge variant="status" color={typeColors[emp.type]}>{emp.type}</Badge>
                                        <Badge variant="status" color={statusColors[emp.status]}>{emp.status}</Badge>
                                    </div>
                                </div>
                                <h3 className="hr-employee-card__name">{emp.name}</h3>
                                <p className="hr-employee-card__role">{emp.role} · {emp.department}</p>
                                <div className="hr-employee-card__contact">
                                    <span><Mail size={12} />{emp.email}</span>
                                    <span><Phone size={12} />{emp.phone}</span>
                                    <span><MapPin size={12} />{emp.location}</span>
                                </div>
                                <div className="hr-employee-card__skills">
                                    {emp.skills.map(s => <span key={s} className="hr-skill-tag">{s}</span>)}
                                </div>
                                <div className="hr-employee-card__footer">
                                    <span className="hr-employee-card__manager"><Users size={12} /> {emp.manager}</span>
                                    <span className="hr-employee-card__date"><Calendar size={12} /> Joined {new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === ATTENDANCE & LEAVE === */}
            {activeTab === 'attendance' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Leave Requests</h2>
                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => dispatch(addToast({ title: 'New Request', message: 'Opening leave application form...', type: 'info' }))}>Apply Leave</Button>
                    </div>
                    <div className="hr-leave-balance">
                        <div className="hr-leave-balance__item"><span>Annual</span><div className="hr-leave-bar"><div className="hr-leave-bar__fill" style={{ width: '53%', background: 'var(--primary-500)' }} /><span>8/15 used</span></div></div>
                        <div className="hr-leave-balance__item"><span>Sick</span><div className="hr-leave-bar"><div className="hr-leave-bar__fill" style={{ width: '20%', background: 'var(--warning)' }} /><span>2/10 used</span></div></div>
                        <div className="hr-leave-balance__item"><span>Unpaid</span><div className="hr-leave-bar"><div className="hr-leave-bar__fill" style={{ width: '0%', background: 'var(--danger)' }} /><span>0/5 used</span></div></div>
                    </div>
                    <div className="hr-leave-list">
                        {leaveRequests.map(req => (
                            <div key={req.id} className="hr-leave-item">
                                <Avatar name={req.employee} size="sm" />
                                <div className="hr-leave-item__info">
                                    <strong>{req.employee}</strong>
                                    <span>{req.type} Leave · {req.from} — {req.to}</span>
                                    <span className="hr-leave-item__reason">{req.reason}</span>
                                </div>
                                <div className="hr-leave-item__actions">
                                    {req.status === 'Pending' ? (
                                        <>
                                            <button className="hr-approve-btn" onClick={() => handleApproveLeave(req.id, req.employee)}><Check size={14} /> Approve</button>
                                            <button className="hr-reject-btn" onClick={() => handleRejectLeave(req.id, req.employee)}><X size={14} /> Reject</button>
                                        </>
                                    ) : (
                                        <Badge variant="status" color={req.status === 'Approved' ? 'var(--success)' : 'var(--danger)'}>{req.status}</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === RECRUITMENT === */}
            {activeTab === 'recruitment' && (
                <div className="hr-section">
                    <div className="hr-section__header">
                        <h2>Recruitment Pipeline</h2>
                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => dispatch(addToast({ title: 'New Job', message: 'Opening job posting creation form...', type: 'info' }))}>Post Job</Button>
                    </div>
                    <div className="hr-recruitment-kanban">
                        {recruitmentStages.map(stage => (
                            <div key={stage} className="hr-kanban-col">
                                <div className="hr-kanban-col__header">
                                    <span className="hr-kanban-col__dot" style={{ background: stageColors[stage] }} />
                                    <span className="hr-kanban-col__title">{stage}</span>
                                    <span className="hr-kanban-col__count">{candidates.filter(c => c.stage === stage).length}</span>
                                </div>
                                <div className="hr-kanban-col__body">
                                    {candidates.filter(c => c.stage === stage).map(c => (
                                        <button 
                                            key={c.id} 
                                            type="button"
                                            className="hr-candidate-card glass-card" 
                                            onClick={() => handleViewCandidate(c)}
                                        >
                                            <div className="hr-candidate-card__name">{c.name}</div>
                                            <div className="hr-candidate-card__role">{c.role}</div>
                                            <div className="hr-candidate-card__meta">
                                                <span>{c.source}</span>
                                                <span>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            {c.interviewer && (
                                                <div 
                                                    className="hr-candidate-card__interviewer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewEmployee({ name: c.interviewer });
                                                    }}
                                                >
                                                    <Avatar name={c.interviewer} size="xs" />
                                                    <span>{c.interviewer}</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === PAYROLL === */}
            {activeTab === 'payroll' && (
                <div className="hr-section glass-card">
                    <div className="hr-section__header">
                        <h2>Payroll — {payrollMonth}</h2>
                        <div className="hr-payroll-actions">
                            <select className="hr-month-select" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}>
                                {['January 2026', 'February 2026', 'March 2026', 'April 2026'].map(m => <option key={m}>{m}</option>)}
                            </select>
                            <Button variant="primary" size="sm" icon={DollarSign} onClick={() => dispatch(addToast({ title: 'Processing Payroll', message: `Finalizing payments for ${payrollMonth}...`, type: 'success' }))}>Run Payroll</Button>
                        </div>
                    </div>
                    <table className="hr-payroll-table">
                        <thead>
                            <tr><th>Employee</th><th>Base Salary</th><th>Bonuses</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td><div className="hr-payroll-employee"><Avatar name={emp.name} size="sm" /><span>{emp.name}</span></div></td>
                                    <td>${emp.salary.toLocaleString()}</td>
                                    <td className="positive">+${emp.bonus.toLocaleString()}</td>
                                    <td className="negative">-${emp.deductions.toLocaleString()}</td>
                                    <td className="hr-payroll-net">${(emp.salary + emp.bonus - emp.deductions).toLocaleString()}</td>
                                    <td><Badge variant="status" color={emp.bonus > 0 ? 'var(--success)' : 'var(--warning)'}>{emp.bonus > 0 ? 'Paid' : 'Pending'}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === PERFORMANCE === */}
            {activeTab === 'performance' && (
                <div className="hr-section">
                    <div className="hr-section__header">
                        <h2>Performance Reviews</h2>
                        <Button variant="ghost" size="sm" icon={TrendingUp} onClick={() => dispatch(addToast({ title: 'Performance Stats', message: 'Generating company-wide performance report...', type: 'info' }))}>Full Report</Button>
                    </div>
                    <div className="hr-performance-grid">
                        {performanceReviews.map(review => (
                            <div key={review.id} className="hr-performance-card glass-card" onClick={() => handleViewEmployee(review)} style={{ cursor: 'pointer' }}>
                                <div className="hr-performance-card__header">
                                    <Avatar name={review.name} size="lg" />
                                    <div><h3>{review.name}</h3>
                                        <div className="hr-rating">
                                            {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= review.rating ? '#FDAB3D' : 'none'} color={s <= review.rating ? '#FDAB3D' : 'var(--text-muted)'} />)}
                                            <span>{review.rating}/5</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hr-performance-card__goals">
                                    <h4>Goals</h4>
                                    {review.goals.map((g, i) => (
                                        <div key={i} className="hr-goal">
                                            <div className="hr-goal__header"><span>{g.text}</span><span>{g.progress}%</span></div>
                                            <div className="hr-goal__bar"><div className="hr-goal__fill" style={{ width: `${g.progress}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hr-performance-card__feedback">
                                    <h4>Manager Feedback</h4>
                                    <p>{review.feedback}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Employee"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveEmployee} disabled={!formData.name}>Add Employee</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Full Name</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Role</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Frontend Developer"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Department</label>
                        <select
                            className="dw-form-input"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        >
                            <option>Engineering</option>
                            <option>Design</option>
                            <option>Operations</option>
                            <option>Marketing</option>
                            <option>HR</option>
                        </select>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                title="Employee Profile"
                footer={<Button variant="primary" onClick={() => setIsProfileModalOpen(false)}>Close</Button>}
            >
                {selectedEmployee && (
                    <div className="hr-profile-detail">
                        <div className="hr-profile-detail__header">
                            <Avatar name={selectedEmployee.name} size="xl" />
                            <div className="hr-profile-detail__id">ID: #{selectedEmployee.id || '---'}</div>
                        </div>
                        <div className="hr-profile-detail__body">
                            <div className="hr-profile-info-group">
                                <label>Full Name</label>
                                <div>{selectedEmployee.name}</div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Role</label>
                                    <div>{selectedEmployee.role}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Department</label>
                                    <div>{selectedEmployee.department}</div>
                                </div>
                            </div>
                            <div className="hr-profile-info-grid">
                                <div className="hr-profile-info-group">
                                    <label>Email</label>
                                    <div>{selectedEmployee.email || 'N/A'}</div>
                                </div>
                                <div className="hr-profile-info-group">
                                    <label>Phone</label>
                                    <div>{selectedEmployee.phone || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="hr-profile-info-group">
                                <label>Location</label>
                                <div>{selectedEmployee.location || 'N/A'}</div>
                            </div>
                            {selectedEmployee.skills && (
                                <div className="hr-profile-info-group">
                                    <label>Skills</label>
                                    <div className="hr-employee-card__skills" style={{ marginTop: '8px' }}>
                                        {selectedEmployee.skills.map(s => <span key={s} className="hr-skill-tag">{s}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HR;

