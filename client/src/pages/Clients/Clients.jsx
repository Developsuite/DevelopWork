import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { addToast } from '../../store/slices/uiSlice';
import { clientsService } from '../../services/clientsService';
import { projectService } from '../../services/projectService';
import { meetingsService } from '../../services/meetingsService';
import { isValidEmail, isEmpty } from '../../utils/validation';
import { formatCurrency } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    Users, Briefcase, DollarSign, Search, Plus, Filter,
    Mail, Phone, MapPin, Calendar, FileText, Trash2, Pencil,
    CheckCircle2, Clock, AlertCircle, Building2, ChevronRight,
    LayoutGrid, List, ArrowUpDown, FolderOpen, Video, CreditCard, Check
} from 'lucide-react';
import cl1 from '../../assets/client/1.png';
import cl2 from '../../assets/client/2.png';
import cl3 from '../../assets/client/3.png';
import cl4 from '../../assets/client/4.png';
import './Clients.css';

// Parse client notes to extract manual payment metadata if present
const parseClientNotes = (notes) => {
    if (!notes) return { noteText: '', paidAmount: null, pendingAmount: null };
    try {
        const match = notes.match(/<!--PAYMENT_META:(.*?)-->/);
        if (match) {
            const meta = JSON.parse(match[1]);
            const cleanText = notes.replace(/<!--PAYMENT_META:.*?-->/g, '').trim();
            return {
                noteText: cleanText,
                paidAmount: typeof meta.paid_amount === 'number' ? meta.paid_amount : null,
                pendingAmount: typeof meta.pending_amount === 'number' ? meta.pending_amount : null,
            };
        }
        if (typeof notes === 'string' && notes.trim().startsWith('{') && notes.trim().endsWith('}')) {
            const parsed = JSON.parse(notes);
            return {
                noteText: parsed.note || parsed.user_notes || '',
                paidAmount: typeof parsed.paid_amount === 'number' ? parsed.paid_amount : null,
                pendingAmount: typeof parsed.pending_amount === 'number' ? parsed.pending_amount : null,
            };
        }
    } catch {}
    return { noteText: notes, paidAmount: null, pendingAmount: null };
};

const serializeClientNotes = (rawNote, paidAmount, pendingAmount) => {
    const { noteText } = parseClientNotes(rawNote);
    const meta = {
        paid_amount: Number(paidAmount) || 0,
        pending_amount: Number(pendingAmount) || 0,
        updated_at: new Date().toISOString()
    };
    if (!noteText) {
        return `<!--PAYMENT_META:${JSON.stringify(meta)}-->`;
    }
    return `${noteText}\n<!--PAYMENT_META:${JSON.stringify(meta)}-->`;
};

const getClientFinancials = (client) => {
    const clientTotal = (client.projects || []).reduce((s, p) => s + (p.amount || 0), 0);
    const { noteText, paidAmount, pendingAmount } = parseClientNotes(client.notes);

    let storedPaid = paidAmount;
    let storedPending = pendingAmount;

    if (storedPaid === null && typeof window !== 'undefined' && client.id) {
        try {
            const cached = localStorage.getItem(`dw_client_payment_${client.id}`);
            if (cached) {
                const c = JSON.parse(cached);
                storedPaid = c.paid_amount;
                storedPending = c.pending_amount;
            }
        } catch {}
    }

    const totalBudget = clientTotal;
    let paid = 0;
    let pending = 0;

    if (storedPaid !== null && storedPaid !== undefined) {
        paid = Math.max(0, Number(storedPaid));
        pending = storedPending !== null && storedPending !== undefined
            ? Math.max(0, Number(storedPending))
            : Math.max(0, totalBudget - paid);
    } else {
        if (client.payment_status === 'Paid') {
            paid = totalBudget;
            pending = 0;
        } else if (client.payment_status === 'Partial') {
            paid = Math.round(totalBudget * 0.5);
            pending = Math.max(0, totalBudget - paid);
        } else {
            paid = 0;
            pending = totalBudget;
        }
    }

    const pct = totalBudget > 0 ? Math.min(100, Math.round((paid / totalBudget) * 100)) : (paid > 0 ? 100 : 0);

    let paymentStatus = client.payment_status || 'Unpaid';
    if (totalBudget > 0) {
        if (paid >= totalBudget) paymentStatus = 'Paid';
        else if (paid <= 0) paymentStatus = 'Unpaid';
        else paymentStatus = 'Partial';
    }

    return {
        totalBudget,
        paid,
        pending,
        pct,
        paymentStatus,
        noteText
    };
};

const Clients = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('grid');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientMeetings, setClientMeetings] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const theme = useSelector((state) => state.ui.theme);
    const currency = useSelector((state) => state.ui.currency) || 'PKR';

    // Manual Payment Adjustment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentClient, setPaymentClient] = useState(null);
    const [paymentBudget, setPaymentBudget] = useState(0);
    const [paymentPaidAmount, setPaymentPaidAmount] = useState(0);
    const [paymentPendingAmount, setPaymentPendingAmount] = useState(0);
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    const [clients, setClients] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const loadClients = useCallback(async () => {
        try {
            const data = await clientsService.getClients();
            const clientsWithProjects = await Promise.all(data.map(async (client) => {
                const projects = await projectService.getByClient(client.id);
                const financials = getClientFinancials({ ...client, projects });
                return {
                    ...client,
                    projects,
                    financials,
                    payment: financials.paymentStatus
                };
            }));
            setClients(clientsWithProjects);
        } catch (err) { console.error('Error loading clients:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setDataLoading(true);
            await loadClients();
            setDataLoading(false);
        };
        loadAll();
    }, [loadClients]);

    const [formData, setFormData] = useState({
        name: '', company: '', email: '', phone: '', address: '', notes: '', status: 'Not Started', payment: 'Unpaid'
    });

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    const statusColors = {
        'In Progress': 'var(--info)',
        'Completed': 'var(--success)',
        'Pending': 'var(--warning)',
        'Not Started': '#7c8db5',
    };
    const paymentColors = {
        'Paid': 'var(--success)',
        'Unpaid': 'var(--danger)',
        'Partial': 'var(--warning)',
    };

    const tagClass = (val) => `cl__tag cl__tag--${val.toLowerCase().replace(/\s+/g, '-')}`;
    const renderTag = (val) => (
        <span className={tagClass(val)}>
            <span className="cl__tag-dot"></span>
            {val}
        </span>
    );

    const filteredClients = clients.filter(c => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesPayment = paymentFilter === 'all' || c.payment === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const allProjects = clients.flatMap(c => 
        (c.projects || []).map(p => ({
            ...p, 
            clientName: c.name, 
            clientCompany: c.company,
            client_data: c 
        }))
    );

    const filteredProjects = allProjects.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.status.toLowerCase().includes(q);
    });

    const handleViewClient = (client) => {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
        meetingsService.getMeetingsByClient(client.id || client.name).then(res => setClientMeetings(res || []));
    };

    const handleSaveClient = async () => {
        if (isEmpty(formData.name)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Client name is required.', type: 'warning' }));
            return;
        }
        if (formData.email && !isValidEmail(formData.email)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter a valid email address.', type: 'warning' }));
            return;
        }
        try {
            if (editMode && selectedClient) {
                const { paidAmount, pendingAmount } = parseClientNotes(selectedClient.notes);
                const updatedNotes = (paidAmount !== null || pendingAmount !== null)
                    ? serializeClientNotes(formData.notes, paidAmount, pendingAmount)
                    : formData.notes;

                await clientsService.updateClient(selectedClient.id, {
                    name: formData.name, company: formData.company, email: formData.email,
                    phone: formData.phone, address: formData.address, status: formData.status,
                    payment_status: formData.payment, notes: updatedNotes
                });
                dispatch(addToast({ title: 'Client Updated', message: 'Client details have been updated.', type: 'success' }));
            } else {
                await clientsService.createClient({
                    name: formData.name, company: formData.company, email: formData.email,
                    phone: formData.phone, address: formData.address, status: formData.status || 'Not Started',
                    payment_status: formData.payment || 'Unpaid', notes: formData.notes
                });
                dispatch(addToast({ title: 'Client Added', message: 'New client profile created.', type: 'success' }));
            }
            await loadClients();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsAddModalOpen(false);
    };

    const handleDeleteClient = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;
        
        try {
            await clientsService.deleteClient(id);
            await loadClients();
            dispatch(addToast({ title: 'Client Deleted', message: 'Client profile has been removed.', type: 'info' }));
        } catch (err) {
            console.error("Delete client error:", err);
            dispatch(addToast({ title: 'Error', message: err.message || 'Failed to delete client. It may be in use by other modules.', type: 'error' }));
        }
    };

    // Open Payment Adjustment Modal for a client
    const handleOpenPaymentModal = (client) => {
        const fin = client.financials || getClientFinancials(client);
        setPaymentClient(client);
        setPaymentBudget(fin.totalBudget);
        setPaymentPaidAmount(fin.paid);
        setPaymentPendingAmount(fin.pending);
        setPaymentNotes('');
        setIsPaymentModalOpen(true);
    };

    const handlePaidChange = (e) => {
        const val = e.target.value;
        setPaymentPaidAmount(val);
        if (val === '') {
            setPaymentPendingAmount(paymentBudget);
        } else {
            const p = parseFloat(val) || 0;
            const rem = Math.max(0, paymentBudget - p);
            setPaymentPendingAmount(rem);
        }
    };

    const handlePendingChange = (e) => {
        const val = e.target.value;
        setPaymentPendingAmount(val);
        if (val === '') {
            setPaymentPaidAmount(paymentBudget);
        } else {
            const rem = parseFloat(val) || 0;
            const p = Math.max(0, paymentBudget - rem);
            setPaymentPaidAmount(p);
        }
    };

    const applyPaymentPreset = (percentage) => {
        const targetBudget = Number(paymentBudget) || 0;
        const paid = Math.round((targetBudget * percentage) / 100);
        const pending = Math.max(0, targetBudget - paid);
        setPaymentPaidAmount(paid);
        setPaymentPendingAmount(pending);
    };

    const handleSavePayment = async () => {
        if (!paymentClient) return;
        setIsSavingPayment(true);
        try {
            const paidNum = Math.max(0, parseFloat(paymentPaidAmount) || 0);
            const pendingNum = Math.max(0, parseFloat(paymentPendingAmount) || 0);
            const total = paymentBudget > 0 ? paymentBudget : (paidNum + pendingNum);

            let status = 'Unpaid';
            if (total > 0) {
                if (paidNum >= total) status = 'Paid';
                else if (paidNum > 0) status = 'Partial';
                else status = 'Unpaid';
            } else {
                status = paidNum > 0 ? 'Paid' : 'Unpaid';
            }

            const { noteText } = parseClientNotes(paymentClient.notes);
            let combinedNotes = noteText;
            if (paymentNotes && paymentNotes.trim()) {
                const timestamp = new Date().toLocaleDateString();
                const noteEntry = `[${timestamp}] Payment Update: Paid ${formatCurrency(paidNum, currency)}, Pending ${formatCurrency(pendingNum, currency)} - ${paymentNotes.trim()}`;
                combinedNotes = combinedNotes ? `${combinedNotes}\n${noteEntry}` : noteEntry;
            }

            const updatedNotes = serializeClientNotes(combinedNotes, paidNum, pendingNum);

            await clientsService.updateClient(paymentClient.id, {
                payment_status: status,
                notes: updatedNotes
            });

            // Cache locally for instantaneous feedback
            try {
                localStorage.setItem(`dw_client_payment_${paymentClient.id}`, JSON.stringify({
                    paid_amount: paidNum,
                    pending_amount: pendingNum,
                    budget: total,
                    updated_at: new Date().toISOString()
                }));
            } catch {}

            dispatch(addToast({
                title: 'Payment Updated',
                message: `Payment updated for ${paymentClient.name}: ${formatCurrency(paidNum, currency)} Paid, ${formatCurrency(pendingNum, currency)} Remaining.`,
                type: 'success'
            }));

            setIsPaymentModalOpen(false);
            await loadClients();
        } catch (err) {
            console.error('Failed to update payment:', err);
            dispatch(addToast({
                title: 'Update Failed',
                message: err.message || 'Failed to update payment record.',
                type: 'error'
            }));
        } finally {
            setIsSavingPayment(false);
        }
    };

    const stats = [
        { label: 'Total Clients', value: clients.length, image: cl1 },
        { label: 'Active Projects', value: clients.reduce((sum, c) => sum + c.projects.length, 0), image: cl2 },
        { label: 'Pending Work', value: clients.filter(c => c.status === 'Pending').length, image: cl3 },
        { label: 'Completed', value: clients.filter(c => c.status === 'Completed').length, image: cl4 },
    ];

    const tabs = [
        { id: 'all', label: 'All Clients', icon: Users },
        { id: 'projects', label: 'Active Projects', icon: Briefcase },
        { id: 'billing', label: 'Outstanding', icon: DollarSign },
    ];

    const renderBilling = () => {
        const totalRevenue = clients.reduce((sum, c) => sum + (c.financials?.totalBudget ?? c.projects.reduce((s, p) => s + (p.amount || 0), 0)), 0);
        const totalPaid = clients.reduce((sum, c) => sum + (c.financials?.paid ?? 0), 0);
        const totalOutstanding = clients.reduce((sum, c) => sum + (c.financials?.pending ?? 0), 0);

        return (
            <div className="cl__billing-overview">
                <div className="cl__billing-summary-grid">
                    <div className="cl__billing-summary-card">
                        <h4>Total Revenue</h4>
                        <div className="amount">{formatCurrency(totalRevenue, currency)}</div>
                    </div>
                    <div className="cl__billing-summary-card paid">
                        <h4>Total Paid</h4>
                        <div className="amount">{formatCurrency(totalPaid, currency)}</div>
                    </div>
                    <div className="cl__billing-summary-card outstanding">
                        <h4>Outstanding Balance</h4>
                        <div className="amount">{formatCurrency(totalOutstanding, currency)}</div>
                    </div>
                </div>

                <div className="cl__billing-table-wrapper">
                    <table className="cl__billing-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Total Budget</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'40px'}}>No billing records found.</td></tr>}
                            {filteredClients.map(client => {
                                const fin = client.financials || getClientFinancials(client);
                                const clientTotal = fin.totalBudget;
                                if (clientTotal === 0 && fin.paymentStatus === 'Unpaid') return null;

                                return (
                                    <tr key={client.id}>
                                        <td className="cl__td-bill-client" data-label="Client">
                                            <div className="cl__table-user">
                                                <Avatar name={client.name} size="sm" />
                                                <div>
                                                    <span className="cl__table-name">{client.name}</span>
                                                    <span className="cl__table-email">{client.company}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="cl__td-bill-budget" data-label="Total Budget">
                                            <div className={`cl__billing-amount ${fin.paymentStatus === 'Paid' ? 'success' : 'pending'}`}>
                                                {formatCurrency(clientTotal, currency)}
                                            </div>
                                        </td>
                                        <td className="cl__td-bill-status" data-label="Status">{renderTag(fin.paymentStatus)}</td>
                                        <td className="cl__td-bill-progress" data-label="Progress">
                                            <div className="cl__billing-progress">
                                                <div className="cl__billing-progress-bar">
                                                    <div className="cl__billing-progress-fill paid" style={{width: `${fin.pct}%`}}></div>
                                                    <div className="cl__billing-progress-fill unpaid" style={{width: `${100 - fin.pct}%`}}></div>
                                                </div>
                                                <div className="cl__billing-progress-labels">
                                                    <span className="cl__billing-paid-text">{formatCurrency(fin.paid, currency)} Paid ({fin.pct}%)</span>
                                                    <span className="cl__billing-pending-text">{formatCurrency(fin.pending, currency)} Remaining</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="cl__td-bill-actions" data-label="Actions">
                                            <div className="cl__billing-actions">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenPaymentModal(client)}>
                                                    Update Payment
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="cl">
            {/* Clean Header */}
            <div className="page-header">
                <div className="page-header__info">
                    <h1>Client Management</h1>
                    <p>Manage client relations, project lifecycles, and financial health.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="cl__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="cl__stat-card">
                        <div className="cl__stat-info">
                            <div className="cl__stat-value">{stat.value}</div>
                            <div className="cl__stat-label">{stat.label}</div>
                        </div>
                        <div className="cl__stat-img">
                            <img src={stat.image} alt="" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="cl__toolbar">
                <div className="cl__tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`cl__tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <tab.icon size={16} /><span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="cl__toolbar-right">
                    <Button variant="primary" icon={Plus} onClick={() => {
                        setEditMode(false);
                        setFormData({ name: '', company: '', email: '', phone: '', address: '', notes: '', status: 'Not Started', payment: 'Unpaid' });
                        setIsAddModalOpen(true);
                    }}>Add Client</Button>
                </div>
            </div>

            {/* Filters + View Toggle */}
            <div className="cl__filters-bar">
                <div className="cl__filters-left">
                    <div className="cl__search">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select className="cl__filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Not Started">Not Started</option>
                    </select>
                    <select className="cl__filter-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
                        <option value="all">All Payments</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                    </select>
                </div>
                <div className="cl__view-toggle">
                    <button
                        className={viewType === 'grid' ? 'active' : ''}
                        onClick={() => setViewType('grid')}
                        title="Grid View"
                    ><LayoutGrid size={16} /></button>
                    <button
                        className={viewType === 'list' ? 'active' : ''}
                        onClick={() => setViewType('list')}
                        title="List View"
                    ><List size={16} /></button>
                </div>
            </div>

            {/* Content */}
            <div className="cl__content">
                {activeTab === 'billing' ? renderBilling() : activeTab === 'all' ? (
                    <>
                        {filteredClients.length === 0 && (
                            <div className="cl__empty">
                                <FolderOpen size={44} strokeWidth={1} />
                                <h3>No clients found</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}

                        {/* === CLIENTS GRID VIEW === */}
                        {viewType === 'grid' && filteredClients.length > 0 && (
                            <div className="cl__grid">
                                {filteredClients.map(client => (
                                    <div key={client.id} className="cl__card" onClick={() => handleViewClient(client)}>
                                        <div className="cl__card-actions">
                                            <button className="cl__icon-btn" onClick={e => { 
                                                e.stopPropagation(); 
                                                setEditMode(true);
                                                setSelectedClient(client);
                                                const { noteText } = parseClientNotes(client.notes);
                                                setFormData({
                                                    name: client.name, company: client.company, email: client.email,
                                                    phone: client.phone, address: client.address, status: client.status,
                                                    payment: client.payment_status, notes: noteText || ''
                                                });
                                                setIsAddModalOpen(true);
                                            }} title="Edit"><Pencil size={12} /></button>
                                            <button className="cl__icon-btn cl__icon-btn--danger" onClick={e => handleDeleteClient(e, client.id, client.name)} title="Delete"><Trash2 size={12} /></button>
                                        </div>

                                        <div className="cl__card-dot" style={{ background: statusColors[client.status] }} title={client.status} />
                                        <div className="cl__card-avatar">
                                            <Avatar name={client.name} size="lg" />
                                        </div>
                                        <h3 className="cl__card-name">{client.name}</h3>
                                        <p className="cl__card-company"><Building2 size={11} /> {client.company}</p>
                                        {renderTag(client.status)}
                                        <div className="cl__card-meta">
                                            <span><MapPin size={11} /> {client.address}</span>
                                        </div>
                                        <div className="cl__card-footer">
                                            <div className="cl__card-stat">
                                                <FolderOpen size={13} />
                                                <span>{client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}</span>
                                            </div>
                                            <div 
                                                className="cl__card-stat" 
                                                style={{ cursor: 'pointer', color: '#8B5CF6' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/meetings?tab=upcoming&client=${client.id}`);
                                                }}
                                                title="View Scheduled Meetings"
                                            >
                                                <Video size={13} />
                                                <span>Meetings</span>
                                            </div>
                                            {renderTag(client.payment)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* === CLIENTS LIST VIEW === */}
                        {viewType === 'list' && filteredClients.length > 0 && (
                            <div className="cl__list-section">
                                <table className="cl__table cl__table--clients">
                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th>Company</th>
                                            <th>Status</th>
                                            <th>Payment</th>
                                            <th>Projects</th>
                                            <th>Location</th>
                                            <th style={{ width: '80px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map(client => (
                                            <tr key={client.id} onClick={() => handleViewClient(client)} style={{ cursor: 'pointer' }}>
                                                <td className="cl__td-client" data-label="Client">
                                                    <div className="cl__table-user">
                                                        <Avatar name={client.name} size="sm" />
                                                        <div>
                                                            <span className="cl__table-name">{client.name}</span>
                                                            <span className="cl__table-email">{client.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="cl__td-company" data-label="Company">{client.company}</td>
                                                <td className="cl__td-status" data-label="Status">{renderTag(client.status)}</td>
                                                <td className="cl__td-payment" data-label="Payment">{renderTag(client.payment)}</td>
                                                <td className="cl__td-projects" data-label="Projects">{client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}</td>
                                                <td className="cl__td-location" data-label="Location">{client.address}</td>
                                                <td className="cl__td-actions" data-label="Actions">
                                                    <div className="cl__table-actions">
                                                        <button 
                                                            className="cl__icon-btn" 
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                navigate(`/meetings?tab=upcoming&client=${client.id}`);
                                                            }} 
                                                            title="View Meetings"
                                                        >
                                                            <Video size={14} style={{ color: '#8B5CF6' }} />
                                                        </button>
                                                        <button className="cl__icon-btn" onClick={e => {
                                                            e.stopPropagation();
                                                            setEditMode(true);
                                                            setSelectedClient(client);
                                                            const { noteText } = parseClientNotes(client.notes);
                                                            setFormData({
                                                                name: client.name, company: client.company, email: client.email,
                                                                phone: client.phone, address: client.address, status: client.status,
                                                                payment: client.payment_status, notes: noteText || ''
                                                            });
                                                            setIsAddModalOpen(true);
                                                        }}><Pencil size={14} /></button>
                                                        <button className="cl__icon-btn cl__icon-btn--danger" onClick={e => handleDeleteClient(e, client.id, client.name)}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* === PROJECTS VIEW === */}
                        {filteredProjects.length === 0 && (
                            <div className="cl__empty">
                                <Briefcase size={44} strokeWidth={1} />
                                <h3>No active projects found</h3>
                                <p>Try adjusting your search or add a project.</p>
                            </div>
                        )}

                        {/* PROJECTS GRID */}
                        {viewType === 'grid' && filteredProjects.length > 0 && (
                            <div className="cl__grid">
                                {filteredProjects.map(project => (
                                    <div key={project.id} className="cl__card" onClick={() => handleViewClient(project.client_data)} style={{alignItems: 'flex-start', textAlign: 'left'}}>
                                        <div className="cl__card-actions">
                                            <button className="cl__icon-btn" onClick={e => { e.stopPropagation(); handleViewClient(project.client_data); }} title="View Client"><ChevronRight size={12} /></button>
                                        </div>
                                        
                                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                                            <Avatar name={project.clientName} size="md" />
                                            <div>
                                                <h4 style={{fontSize: '13px', margin: 0, color: 'var(--text-secondary)'}}>{project.clientName}</h4>
                                                <p style={{fontSize: '11px', margin: 0, color: 'var(--text-muted)'}}><Building2 size={10} /> {project.clientCompany}</p>
                                            </div>
                                        </div>

                                        <h3 className="cl__card-name" style={{fontSize: '16px', marginBottom: '8px'}}>{project.name}</h3>
                                        <p className="cl__card-company" style={{marginBottom: '16px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{project.description || 'No description provided.'}</p>

                                        {renderTag(project.status)}

                                        <div className="cl__card-footer" style={{marginTop: 'auto', paddingTop: '16px'}}>
                                            <div className="cl__card-stat">
                                                <Calendar size={13} />
                                                <span>{project.due_date || 'No Deadline'}</span>
                                            </div>
                                            <strong style={{fontSize: '14px', color: 'var(--text-primary)'}}>{formatCurrency(project.amount || 0, currency)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PROJECTS LIST */}
                        {viewType === 'list' && filteredProjects.length > 0 && (
                            <div className="cl__list-section">
                                <table className="cl__table cl__table--projects">
                                    <thead>
                                        <tr>
                                            <th>Project Name</th>
                                            <th>Client</th>
                                            <th>Status</th>
                                            <th>Deadline</th>
                                            <th>Budget</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProjects.map(project => (
                                            <tr key={project.id} onClick={() => handleViewClient(project.client_data)} style={{ cursor: 'pointer' }}>
                                                <td className="cl__td-project-name" data-label="Project"><strong>{project.name}</strong></td>
                                                <td className="cl__td-project-client" data-label="Client">
                                                    <div className="cl__table-user">
                                                        <Avatar name={project.clientName} size="sm" />
                                                        <div>
                                                            <span className="cl__table-name">{project.clientName}</span>
                                                            <span className="cl__table-email">{project.clientCompany}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="cl__td-project-status" data-label="Status">{renderTag(project.status)}</td>
                                                <td className="cl__td-project-deadline" data-label="Deadline">{project.due_date || '-'}</td>
                                                <td className="cl__td-project-budget" data-label="Budget"><strong>{formatCurrency(project.amount || 0, currency)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Client Profile"
                footer={<Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>}
            >
                {selectedClient && (
                    <div className="cl__detail">
                        <div className="cl__detail-header">
                            <Avatar name={selectedClient.name} size="lg" />
                            <div>
                                <h3>{selectedClient.name}</h3>
                                <span className="cl__detail-company">{selectedClient.company}</span>
                            </div>
                        </div>
                        <div className="cl__detail-grid">
                            <div className="cl__detail-group"><label>Email</label><div>{selectedClient.email}</div></div>
                            <div className="cl__detail-group"><label>Phone</label><div>{selectedClient.phone}</div></div>
                            <div className="cl__detail-group"><label>Address</label><div>{selectedClient.address}</div></div>
                            <div className="cl__detail-group"><label>Status</label><div>{renderTag(selectedClient.status)}</div></div>
                        </div>
                        <div className="cl__detail-section">
                            <h4>Projects</h4>
                            <div className="cl__detail-projects">
                                {selectedClient.projects.map(p => (
                                    <div key={p.id} className="cl__detail-project">
                                        <div className="cl__detail-project-info">
                                            <span className="cl__detail-project-name">{p.name}</span>
                                            <small>Deadline: {p.due_date} · {formatCurrency(p.amount || 0, currency)}</small>
                                        </div>
                                        {renderTag(p.status)}
                                    </div>
                                ))}
                                {selectedClient.projects.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active projects.</span>}
                            </div>
                        </div>
                        <div className="cl__detail-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4>Meetings & Consultations</h4>
                                <button
                                    type="button"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(139, 92, 246, 0.12)',
                                        border: '1px solid rgba(139, 92, 246, 0.25)',
                                        color: '#8B5CF6',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        navigate(`/meetings?tab=upcoming&client=${selectedClient.id}&schedule=true`);
                                    }}
                                >
                                    <Video size={13} />
                                    <span>Schedule Call</span>
                                </button>
                            </div>

                            <div className="cl__detail-meetings" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {clientMeetings.length > 0 ? (
                                    clientMeetings.map(m => (
                                        <div
                                            key={m.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                setIsDetailModalOpen(false);
                                                navigate(`/meetings?tab=upcoming&client=${selectedClient.id}`);
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{m.title}</div>
                                                <small style={{ color: 'var(--text-muted)' }}>{m.date} at {m.time} · {m.platform}</small>
                                            </div>
                                            {renderTag(m.status)}
                                        </div>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No meetings scheduled yet with this client.</span>
                                )}
                            </div>
                        </div>

                        <div className="cl__detail-section">
                            <h4>Internal Notes</h4>
                            <div className="cl__detail-notes">{parseClientNotes(selectedClient.notes).noteText || 'No notes added.'}</div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit Client Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={editMode ? "Edit Client Profile" : "Onboard New Client"}
                footer={<><Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveClient}>{editMode ? 'Save Changes' : 'Add Client'}</Button></>}
            >
                <div className="dw-form">
                    <div className="cl__form-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Client Name</label>
                            <input className="dw-form-input" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Company Name</label>
                            <input className="dw-form-input" placeholder="e.g. Acme Inc" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                    </div>
                    <div className="cl__form-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Email</label>
                            <input className="dw-form-input" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Phone</label>
                            <input className="dw-form-input" placeholder="+1..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Address</label>
                        <input className="dw-form-input" placeholder="Office address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="cl__form-grid">
                        <div className="dw-form-group">
                            <label className="dw-form-label">Client Status</label>
                            <select className="dw-form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="Not Started">Not Started</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Payment Status</label>
                            <select className="dw-form-input" value={formData.payment} onChange={e => setFormData({ ...formData, payment: e.target.value })}>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partial">Partial</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Notes</label>
                        <textarea className="dw-form-input" style={{ minHeight: '80px' }} placeholder="Any specific requirements..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>

            {/* Update Client Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Update Client Payment"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} disabled={isSavingPayment}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSavePayment} loading={isSavingPayment}>
                            Save Payment
                        </Button>
                    </>
                }
            >
                {paymentClient && (
                    <div className="cl__pay-modal">
                        <div className="cl__pay-client-card">
                            <div className="cl__pay-client-info">
                                <Avatar name={paymentClient.name} size="md" />
                                <div>
                                    <h4 className="cl__pay-client-name">{paymentClient.name}</h4>
                                    <p className="cl__pay-client-company">{paymentClient.company || 'Client Profile'}</p>
                                </div>
                            </div>
                            <div className="cl__pay-budget-pill">
                                <div className="cl__pay-budget-label">Total Contract Budget</div>
                                <div className="cl__pay-budget-val">{formatCurrency(paymentBudget, currency)}</div>
                            </div>
                        </div>

                        {paymentBudget === 0 && (
                            <div className="dw-form-group">
                                <label className="dw-form-label">Total Contract Budget ({currency})</label>
                                <div className="cl__pay-input-field-wrap">
                                    <span className="cl__pay-currency-tag">{currency}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="cl__pay-number-input"
                                        placeholder="Set total client contract amount..."
                                        value={paymentBudget || ''}
                                        onChange={(e) => {
                                            const b = Math.max(0, parseFloat(e.target.value) || 0);
                                            setPaymentBudget(b);
                                            setPaymentPendingAmount(b);
                                            setPaymentPaidAmount(0);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="cl__pay-inputs-grid">
                            <div className="cl__pay-input-card">
                                <div className="cl__pay-input-header">
                                    <span className="cl__pay-input-label">Paid Amount</span>
                                    <CheckCircle2 size={16} className="cl__pay-header-icon paid" />
                                </div>
                                <div className="cl__pay-input-field-wrap">
                                    <span className="cl__pay-currency-tag">{currency}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={paymentBudget > 0 ? paymentBudget : undefined}
                                        className="cl__pay-number-input"
                                        value={paymentPaidAmount}
                                        onChange={handlePaidChange}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="cl__pay-input-hint">Collected from client</p>
                            </div>

                            <div className="cl__pay-input-card">
                                <div className="cl__pay-input-header">
                                    <span className="cl__pay-input-label">Remaining / Pending</span>
                                    <Clock size={16} className="cl__pay-header-icon pending" />
                                </div>
                                <div className="cl__pay-input-field-wrap">
                                    <span className="cl__pay-currency-tag">{currency}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={paymentBudget > 0 ? paymentBudget : undefined}
                                        className="cl__pay-number-input"
                                        value={paymentPendingAmount}
                                        onChange={handlePendingChange}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="cl__pay-input-hint">Pending amount to be paid</p>
                            </div>
                        </div>

                        {paymentBudget > 0 && (
                            <div className="cl__pay-presets">
                                <span className="cl__pay-preset-title">Quick Adjust:</span>
                                <button type="button" className="cl__pay-preset-btn" onClick={() => applyPaymentPreset(0)}>
                                    0% (Unpaid)
                                </button>
                                <button type="button" className="cl__pay-preset-btn" onClick={() => applyPaymentPreset(25)}>
                                    25% Advance
                                </button>
                                <button type="button" className="cl__pay-preset-btn" onClick={() => applyPaymentPreset(50)}>
                                    50% Half
                                </button>
                                <button type="button" className="cl__pay-preset-btn" onClick={() => applyPaymentPreset(75)}>
                                    75% Partial
                                </button>
                                <button type="button" className="cl__pay-preset-btn" onClick={() => applyPaymentPreset(100)}>
                                    100% (Paid)
                                </button>
                            </div>
                        )}

                        {(() => {
                            const p = Math.max(0, parseFloat(paymentPaidAmount) || 0);
                            const rem = Math.max(0, parseFloat(paymentPendingAmount) || 0);
                            const total = paymentBudget > 0 ? paymentBudget : (p + rem);
                            const pct = total > 0 ? Math.min(100, Math.round((p / total) * 100)) : (p > 0 ? 100 : 0);
                            let statusLabel = 'Unpaid';
                            let statusColor = 'var(--danger)';
                            if (pct >= 100) {
                                statusLabel = 'Fully Paid';
                                statusColor = 'var(--success)';
                            } else if (pct > 0) {
                                statusLabel = 'Partial Payment';
                                statusColor = 'var(--warning)';
                            }

                            return (
                                <div className="cl__pay-preview-box">
                                    <div className="cl__pay-preview-header">
                                        <span className="cl__pay-preview-title">Payment Breakdown Preview</span>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            background: `${statusColor}22`,
                                            color: statusColor
                                        }}>
                                            ● {statusLabel} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="cl__pay-preview-bar">
                                        <div style={{ width: `${pct}%`, background: 'var(--success)', transition: 'width 0.25s ease' }} />
                                        <div style={{ width: `${100 - pct}%`, background: 'var(--danger)', transition: 'width 0.25s ease' }} />
                                    </div>
                                    <div className="cl__pay-preview-stats">
                                        <span className="paid-stat">Paid: {formatCurrency(p, currency)} ({pct}%)</span>
                                        <span className="pending-stat">Remaining: {formatCurrency(rem, currency)} ({100 - pct}%)</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="dw-form-group">
                            <label className="dw-form-label">Payment Note / Remarks (Optional)</label>
                            <input
                                className="dw-form-input"
                                placeholder="e.g. Received partial advance via online transfer"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Clients;
