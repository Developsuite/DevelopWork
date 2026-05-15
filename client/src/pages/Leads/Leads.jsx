import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { addToast } from '../../store/slices/uiSlice';
import { leadsService } from '../../services/leadsService';
import { clientsService } from '../../services/clientsService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Avatar from '../../components/common/Avatar/Avatar';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import {
    Users, Target, Clock, Award, TrendingUp, Search, Plus, Filter,
    Mail, Phone, MapPin, Building2, MoreVertical, LayoutGrid, List,
    ChevronRight, Star, FileText, Send, BarChart3, Trash2, Pencil,
    ArrowRight, CheckCircle2, AlertCircle, Briefcase, UserCircle2,
    Calendar, DollarSign, GripVertical, Download, Upload, FileJson
} from 'lucide-react';
import './Leads.css';

const Leads = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeSection, setActiveSection] = useState(searchParams.get('view') || 'pipeline');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const theme = useSelector((state) => state.ui.theme);

    // Initial Data
    const [leads, setLeads] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    const loadLeads = useCallback(async () => {
        try {
            const data = await leadsService.getLeads();
            setLeads(data.map(l => ({
                ...l,
                contact: l.contact_person,
                lastContact: l.last_contact,
            })));
        } catch (err) { console.error('Error loading leads:', err); }
    }, []);

    const loadContacts = useCallback(async () => {
        try {
            const data = await leadsService.getContacts();
            setContacts(data);
        } catch (err) { console.error('Error loading contacts:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setDataLoading(true);
            await Promise.all([loadLeads(), loadContacts()]);
            setDataLoading(false);
        };
        loadAll();
    }, [loadLeads, loadContacts]);

    const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'];

    const [leadFormData, setLeadFormData] = useState({
        name: '', contact: '', email: '', phone: '', company: '', stage: 'New', value: '', priority: 'Medium', location: ''
    });

    const [contactFormData, setContactFormData] = useState({
        name: '', role: '', company: '', email: '', phone: ''
    });

    useEffect(() => {
        const view = searchParams.get('view');
        if (view && view !== activeSection) setActiveSection(view);
    }, [searchParams]);

    const handleViewChange = (view) => {
        setActiveSection(view);
        setSearchParams({ view });
    };

    const renderTag = (val) => {
        if (!val) return null;
        const slug = val.toLowerCase().replace(/\s+/g, '-');
        return (
            <span className={`ld__tag ld__tag--${slug}`}>
                <span className="ld__tag-dot"></span>
                {val}
            </span>
        );
    };

    const handleAddLead = async () => {
        try {
            if (editMode) {
                await leadsService.updateLead(selectedLead.id, {
                    name: leadFormData.name, contact_person: leadFormData.contact, email: leadFormData.email,
                    phone: leadFormData.phone, company: leadFormData.company, stage: leadFormData.stage,
                    value: parseInt(leadFormData.value) || 0, priority: leadFormData.priority, location: leadFormData.location,
                });
                dispatch(addToast({ title: 'Lead Updated', message: 'Lead information has been updated.', type: 'success' }));
            } else {
                await leadsService.createLead({
                    name: leadFormData.name, contact_person: leadFormData.contact, email: leadFormData.email,
                    phone: leadFormData.phone, company: leadFormData.company, stage: leadFormData.stage || 'New',
                    value: parseInt(leadFormData.value) || 0, priority: leadFormData.priority || 'Medium', location: leadFormData.location,
                    last_contact: 'Just now',
                });
                dispatch(addToast({ title: 'Lead Added', message: 'New lead has been created.', type: 'success' }));
            }
            await loadLeads();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsAddLeadModalOpen(false);
        setEditMode(false);
    };

    const handleEditLead = (e, lead) => {
        e.stopPropagation();
        setSelectedLead(lead);
        setLeadFormData(lead);
        setEditMode(true);
        setIsAddLeadModalOpen(true);
    };

    const handleDeleteLead = async (e, id) => {
        e.stopPropagation();
        try {
            await leadsService.deleteLead(id);
            await loadLeads();
            dispatch(addToast({ title: 'Lead Deleted', message: 'Lead has been removed from the system.', type: 'info' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
    };

    const handleAddContact = async () => {
        try {
            await leadsService.createContact(contactFormData);
            await loadContacts();
            dispatch(addToast({ title: 'Contact Added', message: 'New contact directory entry created.', type: 'success' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
        setIsAddContactModalOpen(false);
        setContactFormData({ name: '', role: '', company: '', email: '', phone: '' });
    };

    const handleDeleteContact = async (e, id) => {
        e.stopPropagation();
        try {
            await leadsService.deleteContact(id);
            await loadContacts();
            dispatch(addToast({ title: 'Contact Deleted', message: 'Contact has been removed.', type: 'info' }));
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: err.message, type: 'error' }));
        }
    };

    const handleConvertToClient = async () => {
        try {
            await clientsService.createClient({
                name: selectedLead.company || selectedLead.name,
                company: selectedLead.company || '',
                email: selectedLead.email || '',
                phone: selectedLead.phone || '',
                address: selectedLead.location || '',
                status: 'Not Started',
                payment_status: 'Unpaid'
            });
            dispatch(addToast({ title: 'Converted to Client', message: `${selectedLead.name} successfully converted to a Client!`, type: 'success' }));
            setIsDetailModalOpen(false);
            
            // Optionally, delete the lead after conversion:
            await leadsService.deleteLead(selectedLead.id);
            await loadLeads();
        } catch (err) {
            dispatch(addToast({ title: 'Error', message: 'Failed to convert lead to client.', type: 'error' }));
        }
    };

    const handleExportLeads = () => {
        const headers = ['Name', 'Company', 'Contact', 'Email', 'Phone', 'Stage', 'Value', 'Priority', 'Location'];
        const csvRows = [headers.join(',')];
        
        leads.forEach(l => {
            const row = [l.name, l.company, l.contact, l.email, l.phone, l.stage, l.value, l.priority, l.location];
            csvRows.push(row.map(v => `"${v}"`).join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        dispatch(addToast({ title: 'Export Successful', message: 'Leads data exported to CSV.', type: 'success' }));
    };

    const downloadTemplate = () => {
        const headers = ['Name', 'Company', 'Contact', 'Email', 'Phone', 'Stage', 'Value', 'Priority', 'Location'];
        const exampleRow = ['Example Corp', 'Example Inc', 'John Doe', 'john@example.com', '+1 555-0000', 'New', '50000', 'High', 'New York'];
        const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads_import_template.csv');
        link.click();
        dispatch(addToast({ title: 'Template Downloaded', message: 'Please follow the format for importing.', type: 'info' }));
    };

    const handleImportLeads = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const rows = text.split('\n').slice(1); // Skip header
            const newLeads = rows.filter(row => row.trim()).map(row => {
                const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                return {
                    id: Date.now() + Math.random(),
                    name: cols[0],
                    company: cols[1],
                    contact: cols[2],
                    email: cols[3],
                    phone: cols[4],
                    stage: cols[5] || 'New',
                    value: parseInt(cols[6]) || 0,
                    priority: cols[7] || 'Medium',
                    location: cols[8] || 'Unknown',
                    lastContact: 'Imported'
                };
            });

            if (newLeads.length > 0) {
                setLeads([...newLeads, ...leads]);
                dispatch(addToast({ title: 'Import Successful', message: `${newLeads.length} leads imported successfully.`, type: 'success' }));
            }
        };
        reader.readAsText(file);
    };

    const updateLeadStage = async (leadId, newStage) => {
        // Optimistic UI Update for buttery smooth drag-and-drop
        const previousLeads = [...leads];
        setLeads(leads.map(l => l.id.toString() === leadId.toString() ? { ...l, stage: newStage } : l));

        try {
            await leadsService.updateLead(leadId, { stage: newStage });
            dispatch(addToast({ title: 'Stage Updated', message: `Lead moved to ${newStage}`, type: 'success' }));
        } catch (err) {
            // Revert state if backend update fails
            setLeads(previousLeads);
            dispatch(addToast({ title: 'Error', message: 'Failed to move lead.', type: 'error' }));
            console.error(err);
        }
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        updateLeadStage(draggableId, destination.droppableId);
    };

    // --- PIPELINE VIEW ---
    const renderPipeline = () => (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="ld__pipeline">
                {stages.map(stage => (
                    <Droppable key={stage} droppableId={stage}>
                        {(provided, snapshot) => (
                            <div 
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`ld__pipeline-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                            >
                                <div className="ld__pipeline-header">
                                    <h3>{stage}</h3>
                                    <span className="ld__pipeline-count">{leads.filter(l => l.stage === stage).length}</span>
                                </div>
                                <div className="ld__pipeline-cards">
                                    {leads.filter(l => l.stage === stage).map((lead, index) => (
                                        <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`ld__lead-card ${snapshot.isDragging ? 'dragging' : ''}`} 
                                                    onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}
                                                >
                                                    <div className="ld__lead-card-header">
                                                        <span className="ld__lead-card-company">{lead.company}</span>
                                                        {renderTag(lead.priority)}
                                                    </div>
                                                    <h4 className="ld__lead-card-name">{lead.name}</h4>
                                                    <div className="ld__lead-card-meta">
                                                        <span><DollarSign size={12} /> {lead.value.toLocaleString()}</span>
                                                        <span><Clock size={12} /> {lead.lastContact}</span>
                                                    </div>
                                                    <div className="ld__lead-card-footer">
                                                        <Avatar name={lead.contact} size="xs" />
                                                        <div className="ld__lead-card-actions">
                                                            <button onClick={(e) => handleEditLead(e, lead)}><Pencil size={12}/></button>
                                                            <div className="ld__drag-indicator">
                                                                <GripVertical size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );

    // --- ALL LEADS VIEW ---
    const renderLeadsList = () => (
        <div className="ld__table-container">
            <table className="ld__table">
                <thead>
                    <tr>
                        <th>Lead / Company</th>
                        <th>Stage</th>
                        <th>Value</th>
                        <th>Contact</th>
                        <th>Priority</th>
                        <th>Last Active</th>
                        <th style={{width: '80px'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map(lead => (
                        <tr key={lead.id} onClick={() => { setSelectedLead(lead); setIsDetailModalOpen(true); }}>
                            <td>
                                <div className="ld__table-lead">
                                    <strong>{lead.name}</strong>
                                    <span>{lead.company} · {lead.location}</span>
                                </div>
                            </td>
                            <td>{renderTag(lead.stage)}</td>
                            <td><strong className="ld__table-value">${lead.value.toLocaleString()}</strong></td>
                            <td>
                                <div className="ld__table-contact">
                                    <span>{lead.contact}</span>
                                    <small>{lead.email}</small>
                                </div>
                            </td>
                            <td>{renderTag(lead.priority)}</td>
                            <td><span className="ld__table-time">{lead.lastContact}</span></td>
                            <td>
                                <div className="ld__table-actions">
                                    <button className="ld__icon-btn" onClick={(e) => handleEditLead(e, lead)}><Pencil size={14}/></button>
                                    <button className="ld__icon-btn ld__icon-btn--danger" onClick={(e) => handleDeleteLead(e, lead.id)}><Trash2 size={14}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // --- CONTACTS VIEW ---
    const renderContacts = () => (
        <div className="ld__contacts-grid">
            {contacts.map(contact => (
                <div key={contact.id} className="ld__contact-card">
                    <div className="ld__contact-card-header">
                        <Avatar name={contact.name} size="md" />
                        <div className="ld__contact-info">
                            <h4>{contact.name}</h4>
                            <span>{contact.role} @ {contact.company}</span>
                        </div>
                    </div>
                    <div className="ld__contact-details">
                        <div className="ld__contact-detail"><Mail size={14}/> {contact.email}</div>
                        <div className="ld__contact-detail"><Phone size={14}/> {contact.phone}</div>
                    </div>
                    <div className="ld__contact-footer">
                        <div style={{display: 'flex', gap: '10px'}}>
                            <Button variant="ghost" size="sm" icon={Send}>Message</Button>
                            <Button variant="ghost" size="sm" icon={Phone}>Call</Button>
                        </div>
                        <button className="ld__icon-btn ld__icon-btn--danger" onClick={(e) => handleDeleteContact(e, contact.id)} style={{border: 'none'}}><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
            <div className="ld__add-contact-card" onClick={() => setIsAddContactModalOpen(true)}>
                <Plus size={24} />
                <span>Add New Contact</span>
            </div>
        </div>
    );

    const wonLeadsCount = leads.filter(l => l.stage === 'Closed').length;
    const conversionRate = leads.length > 0 ? ((wonLeadsCount / leads.length) * 100).toFixed(1) + '%' : '0.0%';

    const stats = [
        { label: 'Total Value', value: `$${leads.reduce((a,b) => a+b.value, 0).toLocaleString()}`, img: '/assets/leads/icons/1.png', color: 'var(--primary-500)' },
        { label: 'Active Leads', value: leads.length, img: '/assets/leads/icons/2.png', color: 'var(--info)' },
        { label: 'Won Leads', value: wonLeadsCount, img: '/assets/leads/icons/3.png', color: 'var(--success)' },
        { label: 'Conversion', value: conversionRate, img: '/assets/leads/icons/4.png', color: 'var(--warning)' },
    ];

    return (
        <div className="ld">
            {/* Banner */}
            <div className="ld__banner">
                <div className="ld__banner-bg" style={{ backgroundImage: `url('/assets/leads_banner.png')` }}></div>
                <div className="ld__banner-overlay"></div>
                <div className="ld__banner-content">
                    <h1>Leads & Pipeline</h1>
                    <p>Track opportunities, manage relationships, and close deals faster.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="ld__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="ld__stat-card">
                        <div className="ld__stat-info">
                            <span className="ld__stat-value">{stat.value}</span>
                            <span className="ld__stat-label">{stat.label}</span>
                        </div>
                        <div className="ld__stat-img">
                            <img src={stat.img} alt={stat.label} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="ld__toolbar">
                <div className="ld__views">
                    <button className={`ld__view-btn ${activeSection === 'pipeline' ? 'active' : ''}`} onClick={() => handleViewChange('pipeline')}><LayoutGrid size={16}/> Pipeline</button>
                    <button className={`ld__view-btn ${activeSection === 'leads' ? 'active' : ''}`} onClick={() => handleViewChange('leads')}><List size={16}/> All Leads</button>
                    <button className={`ld__view-btn ${activeSection === 'contacts' ? 'active' : ''}`} onClick={() => handleViewChange('contacts')}><UserCircle2 size={16}/> Contacts</button>
                </div>
                <div className="ld__actions">
                    <div className="ld__search">
                        <Search size={15} />
                        <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="ld__tool-group">
                        <Button variant="ghost" icon={FileJson} onClick={downloadTemplate} title="Download Template">Template</Button>
                        <Button variant="ghost" icon={Download} onClick={handleExportLeads}>Export</Button>
                        <div className="ld__import-wrapper">
                            <Button variant="ghost" icon={Upload}>Import</Button>
                            <input type="file" accept=".csv" onChange={handleImportLeads} />
                        </div>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={() => { setEditMode(false); setLeadFormData({ name: '', contact: '', email: '', phone: '', company: '', stage: 'New', value: '', priority: 'Medium', location: '' }); setIsAddLeadModalOpen(true); }}>Add Lead</Button>
                </div>
            </div>

            {/* Content */}
            <div className="ld__content">
                {activeSection === 'pipeline' && renderPipeline()}
                {activeSection === 'leads' && renderLeadsList()}
                {activeSection === 'contacts' && renderContacts()}
            </div>

            {/* Add/Edit Lead Modal */}
            <Modal
                isOpen={isAddLeadModalOpen}
                onClose={() => setIsAddLeadModalOpen(false)}
                title={editMode ? 'Edit Lead' : 'Add New Lead'}
                footer={<><Button variant="ghost" onClick={() => setIsAddLeadModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddLead}>{editMode ? 'Save Changes' : 'Create Lead'}</Button></>}
            >
                <div className="dw-form">
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group"><label className="dw-form-label">Opportunity Name</label><input className="dw-form-input" value={leadFormData.name} onChange={e => setLeadFormData({...leadFormData, name: e.target.value})} /></div>
                        <div className="dw-form-group"><label className="dw-form-label">Company</label><input className="dw-form-input" value={leadFormData.company} onChange={e => setLeadFormData({...leadFormData, company: e.target.value})} /></div>
                    </div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group"><label className="dw-form-label">Primary Contact</label><input className="dw-form-input" value={leadFormData.contact} onChange={e => setLeadFormData({...leadFormData, contact: e.target.value})} /></div>
                        <div className="dw-form-group"><label className="dw-form-label">Email</label><input className="dw-form-input" value={leadFormData.email} onChange={e => setLeadFormData({...leadFormData, email: e.target.value})} /></div>
                    </div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group"><label className="dw-form-label">Est. Value ($)</label><input type="number" className="dw-form-input" value={leadFormData.value} onChange={e => setLeadFormData({...leadFormData, value: parseInt(e.target.value)})} /></div>
                        <div className="dw-form-group"><label className="dw-form-label">Stage</label>
                            <select className="dw-form-input" value={leadFormData.stage} onChange={e => setLeadFormData({...leadFormData, stage: e.target.value})}>
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Lead Profile"
                footer={<Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>}
            >
                {selectedLead && (
                    <div className="ld__detail">
                        <div className="ld__detail-header">
                            <Avatar name={selectedLead.name} size="lg" />
                            <div>
                                <h3>{selectedLead.name}</h3>
                                <span>{selectedLead.company}</span>
                            </div>
                            <div style={{marginLeft:'auto'}}>{renderTag(selectedLead.stage)}</div>
                        </div>
                        <div className="ld__detail-grid">
                            <div className="ld__detail-item"><label>Contact</label><div>{selectedLead.contact}</div></div>
                            <div className="ld__detail-item"><label>Email</label><div>{selectedLead.email}</div></div>
                            <div className="ld__detail-item"><label>Phone</label><div>{selectedLead.phone}</div></div>
                            <div className="ld__detail-item"><label>Value</label><div className="highlight">${selectedLead.value.toLocaleString()}</div></div>
                        </div>
                        <div className="ld__detail-actions">
                            <Button variant="ghost" icon={Mail} fullWidth>Send Email</Button>
                            <Button variant="ghost" icon={Calendar} fullWidth>Schedule Meeting</Button>
                            {selectedLead.stage === 'Closed' && (
                                <Button variant="primary" icon={Briefcase} fullWidth onClick={handleConvertToClient} style={{backgroundColor: 'var(--success)'}}>
                                    Convert to Client
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Contact Modal */}
            <Modal
                isOpen={isAddContactModalOpen}
                onClose={() => setIsAddContactModalOpen(false)}
                title="Add New Contact"
                footer={<><Button variant="ghost" onClick={() => setIsAddContactModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddContact}>Save Contact</Button></>}
            >
                <div className="dw-form">
                    <div className="dw-form-group"><label className="dw-form-label">Full Name</label><input className="dw-form-input" value={contactFormData.name} onChange={e => setContactFormData({...contactFormData, name: e.target.value})} /></div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group"><label className="dw-form-label">Role</label><input className="dw-form-input" value={contactFormData.role} onChange={e => setContactFormData({...contactFormData, role: e.target.value})} /></div>
                        <div className="dw-form-group"><label className="dw-form-label">Company</label><input className="dw-form-input" value={contactFormData.company} onChange={e => setContactFormData({...contactFormData, company: e.target.value})} /></div>
                    </div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group"><label className="dw-form-label">Email</label><input className="dw-form-input" value={contactFormData.email} onChange={e => setContactFormData({...contactFormData, email: e.target.value})} /></div>
                        <div className="dw-form-group"><label className="dw-form-label">Phone</label><input className="dw-form-input" value={contactFormData.phone} onChange={e => setContactFormData({...contactFormData, phone: e.target.value})} /></div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Leads;
