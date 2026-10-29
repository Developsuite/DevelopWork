import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Plus, Trash2, Download, CheckCircle2, Loader2, Briefcase, DollarSign } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Button from '../../../../components/common/Button/Button';
import { clientsService } from '../../../../services/clientsService';
import { projectService } from '../../../../services/projectService';
import './InvoiceBuilder.css';
import { savePdfDoc } from '../../../../utils/nativeFiles';

const InvoiceBuilder = ({ isOpen, onClose, onSave }) => {
    const currency = useSelector(state => state.ui.currency) || 'PKR';
    const currSymbol = currency === 'USD' ? '$' : 'Rs. ';
    const previewRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProjectName, setSelectedProjectName] = useState('');
    
    // Form State
    const [template, setTemplate] = useState('modern'); // 'minimal' or 'modern'
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        companyName: 'DevelopSuite Inc.',
        companyTagline: 'Software Solutions',
        companyWebsite: 'www.developsuite.com',
        companyAddress: '123 Innovation Drive\nTech District\nSan Francisco, CA 94103',
        clientId: '',
        clientName: '',
        clientAddress: '',
        projectId: '',
        projectName: '',
        taxRate: 0,
        advancePayment: 0,
        notes: 'Thank you for your business. Please process payment within 14 days.',
    });

    const [items, setItems] = useState([
        { id: 1, description: 'Software Development & Consulting', quantity: 1, price: 4500 }
    ]);

    useEffect(() => {
        if (isOpen) {
            // Reset state to generate a new invoice number and clear form
            setInvoiceData(prev => ({
                ...prev,
                invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3, '0')}`,
                date: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                clientId: '',
                clientName: '',
                clientAddress: '',
                projectId: '',
                projectName: '',
                taxRate: 0,
                advancePayment: 0,
                notes: 'Thank you for your business. Please process payment within 14 days.',
            }));
            setSelectedProjectId('');
            setSelectedProjectName('');
            setItems([
                { id: 1, description: 'Software Development & Consulting', quantity: 1, price: 4500 }
            ]);

            const loadData = async () => {
                try {
                    const [cData, pData] = await Promise.all([
                        clientsService.getClients(),
                        projectService.getAll()
                    ]);
                    setClients(cData || []);
                    setProjects(pData || []);
                } catch (err) {
                    console.error('Error loading clients or projects for invoice builder:', err);
                }
            };
            loadData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Calculations: Subtotal, Tax, Gross Total, Advance Subtract, and Net Balance Due
    const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
    const taxAmount = subtotal * ((Number(invoiceData.taxRate) || 0) / 100);
    const grossTotal = subtotal + taxAmount;
    const advancePaid = Math.max(0, parseFloat(invoiceData.advancePayment) || 0);
    const balanceDue = Math.max(0, grossTotal - advancePaid);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        const client = clients.find(c => c.id === clientId);
        if (client) {
            const clientTitle = client.company || client.company_name || client.name;
            const fullAddress = [
                client.name && client.name !== clientTitle ? client.name : '',
                client.email || '',
                client.phone || '',
                client.address || client.location || ''
            ].filter(Boolean).join('\n');

            setInvoiceData(prev => ({ 
                ...prev, 
                clientId: client.id,
                clientName: clientTitle,
                clientAddress: fullAddress 
            }));

            // If selected project does not match client, clear it
            if (selectedProjectId) {
                const p = projects.find(proj => proj.id === selectedProjectId);
                if (p && p.client_id && p.client_id !== client.id) {
                    setSelectedProjectId('');
                    setSelectedProjectName('');
                }
            }
        } else {
            setInvoiceData(prev => ({ ...prev, clientId: '', clientName: e.target.value, clientAddress: '' }));
        }
    };

    const handleProjectChange = (e) => {
        const pId = e.target.value;
        setSelectedProjectId(pId);
        const proj = projects.find(p => p.id === pId);
        if (proj) {
            setSelectedProjectName(proj.name);
            setInvoiceData(prev => {
                const next = { ...prev, projectId: proj.id, projectName: proj.name };
                if (proj.client_id) {
                    const c = clients.find(client => client.id === proj.client_id);
                    if (c) {
                        next.clientId = c.id;
                        next.clientName = c.company || c.company_name || c.name;
                        next.clientAddress = [
                            c.name && c.name !== (c.company || c.name) ? c.name : '',
                            c.email || '',
                            c.phone || '',
                            c.address || ''
                        ].filter(Boolean).join('\n');
                    }
                }
                return next;
            });
        } else {
            setSelectedProjectName('');
            setInvoiceData(prev => ({ ...prev, projectId: '', projectName: '' }));
        }
    };

    const handleFillFromProject = () => {
        const proj = projects.find(p => p.id === selectedProjectId);
        if (!proj) return;
        const amount = Number(proj.amount) || 0;
        setItems([
            { id: Date.now(), description: `${proj.name} - Contract Deliverables`, quantity: 1, price: amount }
        ]);
    };

    // Filter projects relevant to the selected client, or show all
    const availableProjects = invoiceData.clientId 
        ? projects.filter(p => p.client_id === invoiceData.clientId)
        : projects;

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
        ));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveInvoice = () => {
        if (onSave) {
            onSave({
                id: invoiceData.invoiceNumber,
                client: invoiceData.clientName || 'Client',
                clientId: invoiceData.clientId || null,
                projectId: selectedProjectId || null,
                projectName: selectedProjectName || null,
                amount: grossTotal,
                advancePayment: advancePaid,
                balanceDue: balanceDue,
                date: invoiceData.date,
                dueDate: invoiceData.dueDate,
                status: advancePaid >= grossTotal ? 'Paid' : (advancePaid > 0 ? 'Sent' : 'Draft'),
                items: items,
                taxRate: invoiceData.taxRate,
                notes: invoiceData.notes,
            });
        }
        onClose();
    };

    const handleExportPDF = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            await savePdfDoc(pdf, `${invoiceData.invoiceNumber}.pdf`);

            // Also save to the invoices list
            handleSaveInvoice();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Render Templates
    const renderMinimalTemplate = () => (
        <div className="inv-template-minimal" ref={previewRef}>
            {/* Brand + Invoice Label */}
            <div className="inv-brand-row">
                <div className="inv-brand-logo">
                    <span className="inv-company-name">DevelopSuite</span>
                    <span className="inv-tagline">Software Solutions</span>
                </div>
                <div className="inv-label-block">
                    <h1 className="inv-title">Invoice</h1>
                    <div className="inv-number">{invoiceData.invoiceNumber}</div>
                </div>
            </div>

            {/* Meta Strip */}
            <div className="inv-meta-strip">
                <div className="inv-meta-item">
                    <span>Issue Date</span>
                    <span>{invoiceData.date}</span>
                </div>
                <div className="inv-meta-item">
                    <span>Due Date</span>
                    <span>{invoiceData.dueDate}</span>
                </div>
                {selectedProjectName && (
                    <div className="inv-meta-item">
                        <span>Project</span>
                        <span style={{ color: '#4f46e5', fontWeight: 700 }}>{selectedProjectName}</span>
                    </div>
                )}
                <div className="inv-meta-item">
                    <span>Balance Due</span>
                    <span>{currSymbol}{balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>

            {/* Addresses */}
            <div className="inv-address-block">
                <div className="inv-address">
                    <h4>From</h4>
                    <div className="inv-addr-name">{invoiceData.companyName}</div>
                    <p>{invoiceData.companyAddress}</p>
                </div>
                <div className="inv-address" style={{ textAlign: 'right' }}>
                    <h4 style={{ textAlign: 'right' }}>Billed To</h4>
                    <div className="inv-addr-name" style={{ textAlign: 'right' }}>{invoiceData.clientName || 'Client'}</div>
                    <p style={{ textAlign: 'right' }}>{invoiceData.clientAddress}</p>
                </div>
            </div>

            {/* Table */}
            <table className="inv-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th className="right">Qty</th>
                        <th className="right">Rate</th>
                        <th className="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.description}</td>
                            <td className="right">{item.quantity}</td>
                            <td className="right">{currSymbol}{(Number(item.price) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="right" style={{ fontWeight: 700 }}>{currSymbol}{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="inv-totals">
                <div className="inv-total-row">
                    <span>Subtotal</span>
                    <span>{currSymbol}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {taxAmount > 0 && (
                    <div className="inv-total-row">
                        <span>Tax ({invoiceData.taxRate}%)</span>
                        <span>{currSymbol}{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                )}
                <div className="inv-total-row">
                    <span>Invoice Total</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{currSymbol}{grossTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {advancePaid > 0 && (
                    <div className="inv-total-row advance" style={{ color: '#059669', fontWeight: 600 }}>
                        <span>Less: Advance Payment</span>
                        <span>- {currSymbol}{advancePaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                )}
                <div className="inv-total-row grand">
                    <span>Balance Due</span>
                    <span>{currSymbol}{balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
                <div className="inv-notes">
                    <h4>Notes</h4>
                    <p>{invoiceData.notes}</p>
                </div>
            )}

            <div className="inv-footer">
                {invoiceData.companyName} · {invoiceData.companyTagline} · {invoiceData.companyWebsite}
            </div>
        </div>
    );

    const renderModernTemplate = () => (
        <div className="inv-template-modern" ref={previewRef}>
            {/* Gradient accent */}
            <div className="inv-brand-strip"></div>
            
            {/* Dark Header */}
            <div className="inv-header-bg">
                <div className="inv-header">
                    <div className="inv-logo-area">
                        <h1>{invoiceData.companyName}</h1>
                        <span className="inv-tagline">{invoiceData.companyTagline}</span>
                    </div>
                    <div className="inv-header-badge">
                        <span className="inv-badge-label">Invoice</span>
                        <span className="inv-badge-number">{invoiceData.invoiceNumber}</span>
                    </div>
                </div>
            </div>

            {/* Meta Row */}
            <div className="inv-meta-row">
                <div className="inv-meta-cell">
                    <span>Issue Date</span>
                    <span>{invoiceData.date}</span>
                </div>
                <div className="inv-meta-cell">
                    <span>Due Date</span>
                    <span>{invoiceData.dueDate}</span>
                </div>
                {selectedProjectName && (
                    <div className="inv-meta-cell">
                        <span>Linked Project</span>
                        <span style={{ color: '#6366f1' }}>{selectedProjectName}</span>
                    </div>
                )}
                <div className="inv-meta-cell highlight">
                    <span>Balance Due</span>
                    <span>{currSymbol}{balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>

            {/* Body */}
            <div className="inv-body">
                {/* Addresses */}
                <div className="inv-address-block">
                    <div className="inv-address">
                        <h4>Billed To</h4>
                        <div className="inv-addr-name">{invoiceData.clientName || 'Client'}</div>
                        <p>{invoiceData.clientAddress}</p>
                    </div>
                    <div className="inv-address">
                        <h4>From</h4>
                        <div className="inv-addr-name">{invoiceData.companyName}</div>
                        <p>{invoiceData.companyAddress}</p>
                    </div>
                </div>

                {/* Table */}
                <table className="inv-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th className="right">Qty</th>
                            <th className="right">Rate</th>
                            <th className="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td style={{ fontWeight: 700 }}>{item.description}</td>
                                <td className="right">{item.quantity}</td>
                                <td className="right">{currSymbol}{(Number(item.price) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="right" style={{ fontWeight: 700 }}>{currSymbol}{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="inv-footer-flex">
                    <div className="inv-totals">
                        <div className="inv-total-row">
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{currSymbol}{subtotal.toFixed(2)}</span>
                        </div>
                        {taxAmount > 0 && (
                            <div className="inv-total-row">
                                <span>Tax ({invoiceData.taxRate}%)</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{currSymbol}{taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="inv-total-row">
                            <span>Gross Total</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{currSymbol}{grossTotal.toFixed(2)}</span>
                        </div>
                        {advancePaid > 0 && (
                            <div className="inv-total-row advance" style={{ color: '#059669', fontWeight: 600 }}>
                                <span>Less: Advance Payment</span>
                                <span>- {currSymbol}{advancePaid.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="inv-total-row grand">
                            <span>Balance Due</span>
                            <span>{currSymbol}{balanceDue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoiceData.notes && (
                    <div className="inv-notes">
                        <h4>Notes / Payment Terms</h4>
                        <p>{invoiceData.notes}</p>
                    </div>
                )}
            </div>

            <div className="inv-footer">
                {invoiceData.companyName} · {invoiceData.companyWebsite}
            </div>
        </div>
    );

    return (
        <div className="invoice-builder-modal">
            <div className="invoice-builder-content">
                
                {/* Header */}
                <div className="invoice-builder-header">
                    <h2>Invoice Builder</h2>
                    <div className="invoice-builder-header-actions">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="ghost" onClick={handleSaveInvoice}>Save Invoice</Button>
                        <Button 
                            variant="primary" 
                            icon={isExporting ? Loader2 : Download} 
                            onClick={handleExportPDF}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Generating PDF...' : 'Save & Export PDF'}
                        </Button>
                    </div>
                </div>

                {/* Body Split View */}
                <div className="invoice-builder-body">
                    
                    {/* Form Controls */}
                    <div className="invoice-builder-form">
                        
                        <div className="form-section">
                            <h3>Template</h3>
                            <div className="template-grid">
                                <div className={`template-card ${template === 'minimal' ? 'active' : ''}`} onClick={() => setTemplate('minimal')}>
                                    Minimal
                                </div>
                                <div className={`template-card ${template === 'modern' ? 'active' : ''}`} onClick={() => setTemplate('modern')}>
                                    Modern
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Invoice Details</h3>
                            <div className="form-group">
                                <label>Invoice Number</label>
                                <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleInputChange} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label>Invoice Date</label>
                                    <input type="date" name="date" value={invoiceData.date} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" name="dueDate" value={invoiceData.dueDate} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Company Information</h3>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input type="text" name="companyName" value={invoiceData.companyName} onChange={handleInputChange} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label>Tagline</label>
                                    <input type="text" name="companyTagline" value={invoiceData.companyTagline} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Website</label>
                                    <input type="text" name="companyWebsite" value={invoiceData.companyWebsite} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Company Address</label>
                                <textarea 
                                    name="companyAddress" 
                                    value={invoiceData.companyAddress} 
                                    onChange={handleInputChange} 
                                    style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Client & Project Information</h3>
                            <div className="form-group">
                                <label>Billed To (Select Client or Type Name)</label>
                                <select 
                                    className="dw-form-input"
                                    value={invoiceData.clientId || ''}
                                    onChange={handleClientChange}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name || c.company || c.name}</option>
                                    ))}
                                </select>
                                <input type="text" name="clientName" value={invoiceData.clientName} onChange={handleInputChange} placeholder="Or enter a custom client name..." />
                            </div>

                            <div className="form-group">
                                <label>Link Current Project (Optional)</label>
                                <select
                                    className="dw-form-input"
                                    value={selectedProjectId}
                                    onChange={handleProjectChange}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <option value="">-- No Linked Project (Or Select Below) --</option>
                                    {availableProjects.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.amount ? `(${currSymbol}${Number(p.amount).toLocaleString()})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedProjectId && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                        <span>Linked: <strong>{selectedProjectName}</strong></span>
                                        <button 
                                            type="button" 
                                            onClick={handleFillFromProject}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer', fontSize: '11px' }}
                                        >
                                            + Auto-fill Line Item
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Client Address / Details</label>
                                <textarea 
                                    name="clientAddress" 
                                    value={invoiceData.clientAddress} 
                                    onChange={handleInputChange} 
                                    style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Line Items</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {items.map((item) => (
                                    <div key={item.id} className="item-row">
                                        <input type="text" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                                        <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                                        <input type="number" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} />
                                        <button className="fin-action-btn delete" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button className="add-item-btn" onClick={addItem}>
                                    <Plus size={16} /> Add Line Item
                                </button>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Totals, Advance & Terms</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label>Tax Rate (%)</label>
                                    <input type="number" min="0" step="0.5" name="taxRate" value={invoiceData.taxRate} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Advance Payment ({currency})</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="any"
                                        name="advancePayment" 
                                        value={invoiceData.advancePayment} 
                                        onChange={handleInputChange} 
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Quick Advance Chips */}
                            {grossTotal > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '2px 0 8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Advance:</span>
                                    <button type="button" className="inv-preset-chip" onClick={() => setInvoiceData(prev => ({ ...prev, advancePayment: 0 }))}>0%</button>
                                    <button type="button" className="inv-preset-chip" onClick={() => setInvoiceData(prev => ({ ...prev, advancePayment: Math.round(grossTotal * 0.25) }))}>25%</button>
                                    <button type="button" className="inv-preset-chip" onClick={() => setInvoiceData(prev => ({ ...prev, advancePayment: Math.round(grossTotal * 0.5) }))}>50%</button>
                                    <button type="button" className="inv-preset-chip" onClick={() => setInvoiceData(prev => ({ ...prev, advancePayment: Math.round(grossTotal * 0.75) }))}>75%</button>
                                    <button type="button" className="inv-preset-chip" onClick={() => setInvoiceData(prev => ({ ...prev, advancePayment: Math.round(grossTotal) }))}>100%</button>
                                </div>
                            )}

                            {/* Live Calculations Card */}
                            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', margin: '6px 0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Gross Invoice Total:</span>
                                    <strong>{currSymbol}{grossTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                                </div>
                                {advancePaid > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                                        <span>Advance Subtracted:</span>
                                        <span>- {currSymbol}{advancePaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '13px', fontWeight: 700 }}>
                                    <span>Balance Due:</span>
                                    <span style={{ color: balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        {currSymbol}{balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes / Terms</label>
                                <textarea 
                                    name="notes" 
                                    value={invoiceData.notes} 
                                    onChange={handleInputChange} 
                                    style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Live Preview Container */}
                    <div className="invoice-builder-preview">
                        <div className="invoice-preview-wrapper">
                            {isExporting && (
                                <div className="invoice-loading-overlay">
                                    <Loader2 size={32} className="animate-spin" />
                                    <span>Rendering PDF...</span>
                                </div>
                            )}
                            {template === 'minimal' ? renderMinimalTemplate() : renderModernTemplate()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InvoiceBuilder;
