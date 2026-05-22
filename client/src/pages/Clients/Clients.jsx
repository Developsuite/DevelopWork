import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { addToast } from '../../store/slices/uiSlice';
import { clientsService } from '../../services/clientsService';
import { projectService } from '../../services/projectService';
import { isValidEmail, isEmpty } from '../../utils/validation';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    Users, Briefcase, DollarSign, Search, Plus, Filter,
    Mail, Phone, MapPin, Calendar, FileText, Trash2, Pencil,
    CheckCircle2, Clock, AlertCircle, Building2, ChevronRight,
    LayoutGrid, List, ArrowUpDown, FolderOpen
} from 'lucide-react';
import cl1 from '../../assets/client/1.png';
import cl2 from '../../assets/client/2.png';
import cl3 from '../../assets/client/3.png';
import cl4 from '../../assets/client/4.png';
import './Clients.css';

const Clients = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('grid');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const theme = useSelector((state) => state.ui.theme);

    const [clients, setClients] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const loadClients = useCallback(async () => {
        try {
            const data = await clientsService.getClients();
            const clientsWithProjects = await Promise.all(data.map(async (client) => {
                const projects = await projectService.getByClient(client.id);
                return { ...client, projects, payment: client.payment_status };
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

    const handleViewClient = (client) => { setSelectedClient(client); setIsDetailModalOpen(true); };

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
                await clientsService.updateClient(selectedClient.id, {
                    name: formData.name, company: formData.company, email: formData.email,
                    phone: formData.phone, address: formData.address, status: formData.status,
                    payment_status: formData.payment, notes: formData.notes
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

    const totalRevenue = clients.reduce((sum, c) => sum + c.projects.reduce((s, p) => s + p.amount, 0), 0);

    return (
        <div className="cl">
            {/* Banner */}
            <div className="cl__banner">
                <div className="cl__banner-bg" style={{ backgroundImage: `url(${theme === 'dark' ? '/assets/clients_banner_dark.png' : '/assets/clients_banner_light.png'})` }}></div>
                <div className="cl__banner-overlay"></div>
                <div className="cl__banner-content">
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
                {activeTab !== 'projects' ? (
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
                                                setFormData({
                                                    name: client.name, company: client.company, email: client.email,
                                                    phone: client.phone, address: client.address, status: client.status,
                                                    payment: client.payment_status, notes: client.notes || ''
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
                                            {renderTag(client.payment)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* === CLIENTS LIST VIEW === */}
                        {viewType === 'list' && filteredClients.length > 0 && (
                            <div className="cl__list-section">
                                <table className="cl__table">
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
                                                <td>
                                                    <div className="cl__table-user">
                                                        <Avatar name={client.name} size="sm" />
                                                        <div>
                                                            <span className="cl__table-name">{client.name}</span>
                                                            <span className="cl__table-email">{client.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{client.company}</td>
                                                <td>{renderTag(client.status)}</td>
                                                <td>{renderTag(client.payment)}</td>
                                                <td>{client.projects.length}</td>
                                                <td>{client.address}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button className="cl__icon-btn" onClick={e => {
                                                            e.stopPropagation();
                                                            setEditMode(true);
                                                            setSelectedClient(client);
                                                            setFormData({
                                                                name: client.name, company: client.company, email: client.email,
                                                                phone: client.phone, address: client.address, status: client.status,
                                                                payment: client.payment_status, notes: client.notes || ''
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
                                            <strong style={{fontSize: '14px', color: 'var(--text-primary)'}}>${project.amount ? project.amount.toLocaleString() : '0'}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PROJECTS LIST */}
                        {viewType === 'list' && filteredProjects.length > 0 && (
                            <div className="cl__list-section">
                                <table className="cl__table">
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
                                                <td><strong>{project.name}</strong></td>
                                                <td>
                                                    <div className="cl__table-user">
                                                        <Avatar name={project.clientName} size="sm" />
                                                        <div>
                                                            <span className="cl__table-name">{project.clientName}</span>
                                                            <span className="cl__table-email">{project.clientCompany}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{renderTag(project.status)}</td>
                                                <td>{project.due_date || '-'}</td>
                                                <td><strong>${project.amount ? project.amount.toLocaleString() : '0'}</strong></td>
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
                                            <small>Deadline: {p.due_date} · ${p.amount ? p.amount.toLocaleString() : '0'}</small>
                                        </div>
                                        {renderTag(p.status)}
                                    </div>
                                ))}
                                {selectedClient.projects.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active projects.</span>}
                            </div>
                        </div>
                        <div className="cl__detail-section">
                            <h4>Internal Notes</h4>
                            <div className="cl__detail-notes">{selectedClient.notes || 'No notes added.'}</div>
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
        </div>
    );
};

export default Clients;
