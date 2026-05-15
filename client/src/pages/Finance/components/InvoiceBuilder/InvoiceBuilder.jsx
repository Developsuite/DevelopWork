import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Download, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Button from '../../../../components/common/Button/Button';
import { clientsService } from '../../../../services/clientsService';
import './InvoiceBuilder.css';

const InvoiceBuilder = ({ isOpen, onClose, onSave }) => {
    const previewRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [clients, setClients] = useState([]);
    
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
        clientName: '',
        clientAddress: '',
        taxRate: 8.5,
        notes: 'Thank you for your business. Please process payment within 14 days.',
    });

    useEffect(() => {
        if (isOpen) {
            const loadClients = async () => {
                try {
                    const data = await clientsService.getClients();
                    setClients(data || []);
                } catch (err) {
                    console.error('Error loading clients:', err);
                }
            };
            loadClients();
        }
    }, [isOpen]);

    const [items, setItems] = useState([
        { id: 1, description: 'Website Redesign', quantity: 1, price: 4500 },
        { id: 2, description: 'Monthly Retainer - May', quantity: 1, price: 1200 }
    ]);

    if (!isOpen) return null;

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + taxAmount;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientChange = (e) => {
        const clientId = e.target.value;
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setInvoiceData(prev => ({ 
                ...prev, 
                clientName: client.company_name || client.name,
                clientAddress: `${client.email || ''}\n${client.phone || ''}\n${client.industry || ''}` 
            }));
        } else {
            setInvoiceData(prev => ({ ...prev, clientName: e.target.value, clientAddress: '' }));
        }
    };

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
                client: invoiceData.clientName,
                amount: total,
                date: invoiceData.date,
                dueDate: invoiceData.dueDate,
                status: 'pending',
                items: items,
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
            pdf.save(`${invoiceData.invoiceNumber}.pdf`);

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
                <div className="inv-meta-item">
                    <span>Amount Due</span>
                    <span>Rs. {total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                    <div className="inv-addr-name" style={{ textAlign: 'right' }}>{invoiceData.clientName}</div>
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
                            <td className="right">Rs. {item.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="right" style={{ fontWeight: 700 }}>Rs. {(item.quantity * item.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="inv-totals">
                <div className="inv-total-row">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="inv-total-row">
                    <span>Tax ({invoiceData.taxRate}%)</span>
                    <span>Rs. {taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="inv-total-row grand">
                    <span>Total</span>
                    <span>Rs. {total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                <div className="inv-meta-cell highlight">
                    <span>Amount Due</span>
                    <span>Rs. {total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>

            {/* Body */}
            <div className="inv-body">
                {/* Addresses */}
                <div className="inv-address-block">
                    <div className="inv-address">
                        <h4>Billed To</h4>
                        <div className="inv-addr-name">{invoiceData.clientName}</div>
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
                                <td className="right">Rs. {item.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="right" style={{ fontWeight: 700 }}>Rs. {(item.quantity * item.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="inv-footer-flex">
                    <div className="inv-totals">
                        <div className="inv-total-row">
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="inv-total-row">
                            <span>Tax ({invoiceData.taxRate}%)</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>Rs. {taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="inv-total-row grand">
                            <span>Total Due</span>
                            <span>Rs. {total.toFixed(2)}</span>
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
                                    <label>Date</label>
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
                            <h3>Client Information</h3>
                            <div className="form-group">
                                <label>Billed To (Select Client or Type Name)</label>
                                <select 
                                    className="dw-form-input"
                                    onChange={handleClientChange}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                                    ))}
                                </select>
                                <input type="text" name="clientName" value={invoiceData.clientName} onChange={handleInputChange} placeholder="Or enter a custom name..." />
                            </div>
                            <div className="form-group">
                                <label>Client Address / Details</label>
                                <textarea 
                                    name="clientAddress" 
                                    value={invoiceData.clientAddress} 
                                    onChange={handleInputChange} 
                                    style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Line Items</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {items.map((item, idx) => (
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
                            <h3>Totals & Notes</h3>
                            <div className="form-group">
                                <label>Tax Rate (%)</label>
                                <input type="number" name="taxRate" value={invoiceData.taxRate} onChange={handleInputChange} />
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
