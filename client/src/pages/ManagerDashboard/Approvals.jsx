import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Calendar,
    DollarSign,
    Inbox,
    Filter
} from 'lucide-react';
import './Approvals.css';

// Mock approvals data
const MOCK_APPROVALS = [
    {
        id: 'req-1',
        type: 'leave',
        requester: 'Ali Hassan',
        role: 'Finance Employee',
        date: 'Nov 22 - Nov 24, 2026',
        details: 'Annual Leave (3 days)',
        submittedAt: '2 hours ago',
        status: 'pending',
        module: 'finance'
    },
    {
        id: 'req-2',
        type: 'expense',
        requester: 'Fatima Noor',
        role: 'Engineering Lead',
        date: 'Oct 15, 2026',
        details: 'Software Subscription - $120.00',
        submittedAt: '5 hours ago',
        status: 'pending',
        module: 'projects'
    },
    {
        id: 'req-3',
        type: 'document',
        requester: 'Usman Ali',
        role: 'Frontend Developer',
        date: 'Version 2.1',
        details: 'API Architecture Guidelines Review',
        submittedAt: '1 day ago',
        status: 'pending',
        module: 'projects'
    },
    {
        id: 'req-4',
        type: 'leave',
        requester: 'Usman Ali',
        role: 'Frontend Developer',
        date: 'Dec 1 - Dec 5, 2026',
        details: 'Sick Leave (5 days)',
        submittedAt: '2 days ago',
        status: 'approved',
        module: 'projects'
    }
];

const Approvals = () => {
    const { moduleKey } = useParams();
    const { user } = useSelector((state) => state.auth);
    
    // Filter approvals for this manager's module
    const [approvals, setApprovals] = useState(MOCK_APPROVALS.filter(a => a.module === moduleKey));
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

    const pendingCount = approvals.filter(a => a.status === 'pending').length;

    const filteredApprovals = approvals.filter(a => {
        if (filter === 'all') return true;
        return a.status === filter;
    });

    const handleAction = (id, action) => {
        setApprovals(prev => prev.map(app => 
            app.id === id ? { ...app, status: action } : app
        ));
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'leave': return <Calendar size={18} />;
            case 'expense': return <DollarSign size={18} />;
            case 'document': return <FileText size={18} />;
            default: return <Inbox size={18} />;
        }
    };

    return (
        <div className="approvals">
            <div className="approvals__header">
                <div>
                    <h1 className="approvals__title">Approvals Inbox</h1>
                    <p className="approvals__subtitle">Review and manage requests from your team members.</p>
                </div>
                <div className="approvals__stats">
                    <div className="approvals__stat-box">
                        <span className="approvals__stat-value">{pendingCount}</span>
                        <span className="approvals__stat-label">Pending</span>
                    </div>
                </div>
            </div>

            <div className="approvals__controls glass-card">
                <div className="approvals__filters">
                    <Filter size={16} className="text-muted" />
                    <button 
                        className={`approvals__filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending Actions
                    </button>
                    <button 
                        className={`approvals__filter-btn ${filter === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilter('approved')}
                    >
                        Approved
                    </button>
                    <button 
                        className={`approvals__filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected
                    </button>
                    <button 
                        className={`approvals__filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Requests
                    </button>
                </div>
            </div>

            <div className="approvals__list">
                {filteredApprovals.length === 0 ? (
                    <div className="approvals__empty glass-card">
                        <Inbox size={48} className="text-muted" />
                        <h2>No {filter} requests</h2>
                        <p>You're all caught up! There are no {filter !== 'all' ? filter : ''} items requiring your attention.</p>
                    </div>
                ) : (
                    filteredApprovals.map((req) => (
                        <div key={req.id} className={`approval-card glass-card status-${req.status}`}>
                            <div className="approval-card__icon" data-type={req.type}>
                                {getIconForType(req.type)}
                            </div>
                            
                            <div className="approval-card__content">
                                <div className="approval-card__requester">
                                    <Avatar name={req.requester} size="sm" />
                                    <div>
                                        <div className="approval-card__name">{req.requester}</div>
                                        <div className="approval-card__role">{req.role}</div>
                                    </div>
                                </div>
                                
                                <div className="approval-card__details">
                                    <div className="approval-card__detail-row">
                                        <span className="label">Request:</span>
                                        <span className="value">{req.details}</span>
                                    </div>
                                    <div className="approval-card__detail-row">
                                        <span className="label">Date/Item:</span>
                                        <span className="value">{req.date}</span>
                                    </div>
                                </div>
                                
                                <div className="approval-card__meta">
                                    <Clock size={14} />
                                    <span>Submitted {req.submittedAt}</span>
                                </div>
                            </div>

                            <div className="approval-card__actions">
                                {req.status === 'pending' ? (
                                    <>
                                        <button 
                                            className="approval-btn reject"
                                            onClick={() => handleAction(req.id, 'rejected')}
                                        >
                                            <XCircle size={18} />
                                            Decline
                                        </button>
                                        <button 
                                            className="approval-btn approve"
                                            onClick={() => handleAction(req.id, 'approved')}
                                        >
                                            <CheckCircle2 size={18} />
                                            Approve
                                        </button>
                                    </>
                                ) : (
                                    <div className={`approval-badge ${req.status}`}>
                                        {req.status === 'approved' ? (
                                            <><CheckCircle2 size={16} /> Approved</>
                                        ) : (
                                            <><XCircle size={16} /> Rejected</>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Approvals;
