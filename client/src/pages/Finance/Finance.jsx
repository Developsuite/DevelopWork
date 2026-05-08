import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt, FileText,
    Download, Upload, Calendar, Search, MoreVertical, ArrowUpRight, ArrowDownRight,
    PieChart, BarChart3, AlertCircle, Plus, Check, X, Clock,
} from 'lucide-react';
import './Finance.css';

const Finance = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Software'
    });

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'budgets', label: 'Budgets', icon: PieChart },
        { id: 'expenses', label: 'Expense Requests', icon: CreditCard },
    ];

    const stats = [
        { label: 'Total Revenue', value: '$2,847,392', change: '+12.5%', positive: true, icon: DollarSign, iconBg: 'var(--success-light)', iconColor: 'var(--success)' },
        { label: 'Total Expenses', value: '$1,234,567', change: '+8.2%', positive: false, icon: CreditCard, iconBg: 'var(--danger-light)', iconColor: 'var(--danger)' },
        { label: 'Net Profit', value: '$1,612,825', change: '+15.3%', positive: true, icon: TrendingUp, iconBg: 'var(--primary-50)', iconColor: 'var(--primary-500)' },
        { label: 'Burn Rate', value: '$103K/mo', change: '-2.1%', positive: true, icon: Wallet, iconBg: 'var(--info-light)', iconColor: 'var(--info)' },
    ];

    const [transactions, setTransactions] = useState([
        { id: 1, type: 'income', category: 'Sales', description: 'Product Sales - Q1', amount: 125000, date: '2026-03-25', status: 'completed', reference: 'INV-2024-001' },
        { id: 2, type: 'expense', category: 'Payroll', description: 'Employee Salaries - March', amount: 85000, date: '2026-03-24', status: 'completed', reference: 'PAY-2024-003' },
        { id: 3, type: 'income', category: 'Services', description: 'Consulting Services', amount: 45000, date: '2026-03-23', status: 'completed', reference: 'INV-2024-002' },
        { id: 4, type: 'expense', category: 'Operations', description: 'Office Rent - March', amount: 12000, date: '2026-03-22', status: 'completed', reference: 'EXP-2024-045' },
        { id: 5, type: 'expense', category: 'Marketing', description: 'Digital Advertising Campaign', amount: 8500, date: '2026-03-21', status: 'pending', reference: 'EXP-2024-046' },
        { id: 6, type: 'income', category: 'Sales', description: 'Enterprise License', amount: 95000, date: '2026-03-20', status: 'completed', reference: 'INV-2024-003' },
    ]);

    const handleAddTransaction = () => {
        setIsModalOpen(true);
    };

    const handleSaveTransaction = () => {
        if (!formData.description) return;
        
        const newTrans = {
            id: Date.now(),
            type: formData.type || 'expense',
            category: formData.category || 'General',
            description: formData.description,
            amount: parseInt(formData.amount) || 0,
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            reference: `TXN-${Date.now().toString().slice(-6)}`
        };
        setTransactions(prev => [...prev, newTrans]);
        setIsModalOpen(false);
        setFormData({ description: '', amount: '', category: 'General', type: 'expense' });
    };
    
    const handleViewTransaction = (t) => {
        setSelectedTransaction(t);
        setIsDetailModalOpen(true);
    };

    const handleViewInvoice = (inv) => {
        setSelectedInvoice(inv);
        setIsInvoiceModalOpen(true);
    };

    const handleViewBudget = (b) => {
        setSelectedBudget(b);
        setIsBudgetModalOpen(true);
    };

    const handleViewExpense = (exp) => {
        setSelectedExpense(exp);
        setIsExpenseModalOpen(true);
    };

    const invoices = [
        { id: 'INV-001', client: 'TechVision Corp', amount: 45000, dueDate: '2026-04-15', status: 'Paid', items: 3 },
        { id: 'INV-002', client: 'Global Solutions', amount: 28000, dueDate: '2026-04-20', status: 'Sent', items: 2 },
        { id: 'INV-003', client: 'StartupFlow Inc', amount: 15000, dueDate: '2026-04-10', status: 'Overdue', items: 1 },
        { id: 'INV-004', client: 'Enterprise Hub', amount: 62000, dueDate: '2026-05-01', status: 'Draft', items: 5 },
    ];

    const budgets = [
        { department: 'Engineering', allocated: 200000, spent: 156000 },
        { department: 'Marketing', allocated: 80000, spent: 68000 },
        { department: 'Operations', allocated: 50000, spent: 42000 },
        { department: 'HR', allocated: 30000, spent: 18000 },
        { department: 'R&D', allocated: 120000, spent: 98000 },
    ];

    const expenseRequests = [
        { id: 1, requester: 'Sarah Ahmed', category: 'Software', amount: 2500, date: '2026-04-12', reason: 'Figma Enterprise license', status: 'Pending' },
        { id: 2, requester: 'Ali Hassan', category: 'Travel', amount: 1200, date: '2026-04-10', reason: 'Conference travel', status: 'Approved' },
        { id: 3, requester: 'Omar Raza', category: 'Equipment', amount: 3800, date: '2026-04-08', reason: 'New monitors for team', status: 'Pending' },
    ];

    // CSS bar chart data
    const monthlyRevenue = [
        { month: 'Oct', revenue: 180, expense: 120 }, { month: 'Nov', revenue: 220, expense: 140 },
        { month: 'Dec', revenue: 195, expense: 130 }, { month: 'Jan', revenue: 260, expense: 155 },
        { month: 'Feb', revenue: 240, expense: 145 }, { month: 'Mar', revenue: 285, expense: 165 },
    ];

    const categories = ['all', 'Sales', 'Services', 'Payroll', 'Operations', 'Marketing'];
    const filteredTransactions = transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
    const invoiceStatusColor = { Paid: 'var(--success)', Sent: 'var(--info)', Overdue: 'var(--danger)', Draft: 'var(--text-muted)' };

    return (
        <div className="finance-dashboard">
            <div className="finance-dashboard__header">
                <div><h1 className="finance-dashboard__title">Finance Dashboard</h1><p className="finance-dashboard__subtitle">Manage your company finances and budgets</p></div>
                <div className="finance-dashboard__header-actions">
                    <Button variant="ghost" icon={Download}>Export</Button>
                    <Button variant="primary" icon={Receipt} onClick={handleAddTransaction}>New Transaction</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="finance-dashboard__stats">
                {stats.map(stat => (
                    <div key={stat.label} className="finance-dashboard__stat-card glass-card">
                        <div className="finance-dashboard__stat-header">
                            <div className="finance-dashboard__stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}><stat.icon size={20} /></div>
                            <span className={`finance-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{stat.change}
                            </span>
                        </div>
                        <div className="finance-dashboard__stat-value">{stat.value}</div>
                        <div className="finance-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="fin-tabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`fin-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={16} /><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* === DASHBOARD === */}
            {activeTab === 'dashboard' && (
                <div className="fin-dashboard-grid">
                    <div className="fin-chart-card glass-card">
                        <h3>Revenue vs Expenses</h3>
                        <div className="fin-bar-chart">
                            {monthlyRevenue.map(m => (
                                <div key={m.month} className="fin-bar-group">
                                    <div className="fin-bar-pair">
                                        <div className="fin-bar revenue" style={{ height: `${m.revenue / 3}%` }} />
                                        <div className="fin-bar expense" style={{ height: `${m.expense / 3}%` }} />
                                    </div>
                                    <span>{m.month}</span>
                                </div>
                            ))}
                        </div>
                        <div className="fin-chart-legend"><span className="fin-legend-revenue">● Revenue</span><span className="fin-legend-expense">● Expenses</span></div>
                    </div>
                    <div className="fin-chart-card glass-card">
                        <h3>Budget Utilization</h3>
                        <div className="fin-donut-container">
                            <svg viewBox="0 0 120 120" className="fin-donut">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary-500)" strokeWidth="12" strokeDasharray="235 314" strokeLinecap="round" transform="rotate(-90 60 60)" />
                            </svg>
                            <div className="fin-donut-label"><span className="fin-donut-value">75%</span><span>Utilized</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* === TRANSACTIONS === */}
            {activeTab === 'transactions' && (
                <div className="fin-section glass-card">
                    <div className="fin-section__header">
                        <h2>All Transactions</h2>
                        <div className="fin-filters">
                            <div className="fin-search"><Search size={16} /><input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                            </select>
                        </div>
                    </div>
                    <table className="fin-table">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead>
                        <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.id} onClick={() => handleViewTransaction(t)} style={{ cursor: 'pointer' }}>
                                    <td>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                    <td><strong>{t.description}</strong><br /><span className="fin-ref">{t.reference}</span></td>
                                    <td><Badge variant="default">{t.category}</Badge></td>
                                    <td className={t.type === 'income' ? 'positive' : 'negative'}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</td>
                                    <td>{t.type === 'income' ? <ArrowDownRight size={14} color="var(--success)" /> : <ArrowUpRight size={14} color="var(--danger)" />} {t.type}</td>
                                    <td><Badge variant="status" color={t.status === 'completed' ? 'var(--success)' : 'var(--warning)'}>{t.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             {/* === INVOICES === */}
            {activeTab === 'invoices' && (
                <div className="fin-section">
                    <div className="fin-invoice-grid">
                        {invoices.map(inv => (
                            <button key={inv.id} className="fin-invoice-card glass-card clickable" onClick={() => handleViewInvoice(inv)}>
                                <div className="fin-invoice-card__header">
                                    <span className="fin-invoice-card__id">{inv.id}</span>
                                    <Badge variant="status" color={invoiceStatusColor[inv.status]}>{inv.status}</Badge>
                                </div>
                                <div className="fin-invoice-card__client">{inv.client}</div>
                                <div className="fin-invoice-card__amount">{formatCurrency(inv.amount)}</div>
                                <div className="fin-invoice-card__meta">
                                    <span><Calendar size={12} /> Due: {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    <span><FileText size={12} /> {inv.items} items</span>
                                </div>
                                <div className="fin-invoice-card__actions">
                                    {inv.status === 'Draft' && <Button variant="primary" size="sm">Send</Button>}
                                    {inv.status === 'Sent' && <Button variant="primary" size="sm">Mark Paid</Button>}
                                    {inv.status === 'Overdue' && <Button variant="primary" size="sm">Send Reminder</Button>}
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewInvoice(inv); }}>View</Button>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

             {/* === BUDGETS === */}
            {activeTab === 'budgets' && (
                <div className="fin-section glass-card">
                    <div className="fin-section__header"><h2>Department Budgets</h2><Button variant="primary" size="sm" icon={Plus}>Add Budget</Button></div>
                    <div className="fin-budget-list">
                        {budgets.map(b => {
                            const pct = Math.round((b.spent / b.allocated) * 100);
                            return (
                                <button key={b.department} className="fin-budget-item clickable" onClick={() => handleViewBudget(b)}>
                                    <div className="fin-budget-item__header">
                                        <span className="fin-budget-item__dept">{b.department}</span>
                                        <span className="fin-budget-item__amounts">{formatCurrency(b.spent)} / {formatCurrency(b.allocated)}</span>
                                    </div>
                                    <div className="fin-budget-item__bar">
                                        <div className="fin-budget-item__fill" style={{ width: `${pct}%`, background: pct > 90 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)' }} />
                                    </div>
                                    <div className="fin-budget-item__footer">
                                        <span>{pct}% utilized</span>
                                        <span>Remaining: {formatCurrency(b.allocated - b.spent)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

             {/* === EXPENSE REQUESTS === */}
            {activeTab === 'expenses' && (
                <div className="fin-section glass-card">
                    <div className="fin-section__header"><h2>Expense Requests</h2><Button variant="primary" size="sm" icon={Plus}>New Request</Button></div>
                    <div className="fin-expense-list">
                        {expenseRequests.map(exp => (
                            <div key={exp.id} className="fin-expense-item clickable" onClick={() => handleViewExpense(exp)}>
                                <div className="fin-expense-item__info">
                                    <strong>{exp.requester}</strong>
                                    <span>{exp.category} · {formatCurrency(exp.amount)}</span>
                                    <span className="fin-expense-item__reason">{exp.reason}</span>
                                    <span className="fin-expense-item__date"><Clock size={12} /> {new Date(exp.date).toLocaleDateString()}</span>
                                </div>
                                <div className="fin-expense-item__actions">
                                    {exp.status === 'Pending' ? (
                                        <>
                                            <button className="fin-approve" onClick={(e) => { e.stopPropagation(); alert('Request Approved'); }}><Check size={14} /> Approve</button>
                                            <button className="fin-reject" onClick={(e) => { e.stopPropagation(); alert('Request Rejected'); }}><X size={14} /> Reject</button>
                                        </>
                                    ) : (
                                        <Badge variant="status" color="var(--success)">{exp.status}</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Transaction"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveTransaction} disabled={!formData.description}>Add Transaction</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Description</label>
                        <input
                            type="text"
                            className="dw-form-input"
                            placeholder="e.g. Monthly Rent"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Amount ($)</label>
                            <input
                                type="number"
                                className="dw-form-input"
                                placeholder="e.g. 1500"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Type</label>
                            <select
                                className="dw-form-input"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    </div>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Category</label>
                        <select
                            className="dw-form-input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option>General</option>
                            <option>Software</option>
                            <option>Operations</option>
                            <option>Marketing</option>
                            <option>Payroll</option>
                            <option>Sales</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Transaction Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Transaction Details"
                footer={<Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>}
            >
                {selectedTransaction && (
                    <div className="fin-detail-view">
                        <div className="fin-detail-header">
                            <div className={`fin-detail-icon ${selectedTransaction.type}`}>
                                {selectedTransaction.type === 'income' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                            </div>
                            <div className="fin-detail-amount">
                                <span className="label">Amount</span>
                                <span className={`value ${selectedTransaction.type}`}>
                                    {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="fin-detail-grid">
                            <div className="fin-detail-item">
                                <label>Reference</label>
                                <div>{selectedTransaction.reference}</div>
                            </div>
                            <div className="fin-detail-item">
                                <label>Status</label>
                                <div><Badge variant="status" color={selectedTransaction.status === 'completed' ? 'var(--success)' : 'var(--warning)'}>{selectedTransaction.status}</Badge></div>
                            </div>
                            <div className="fin-detail-item">
                                <label>Date</label>
                                <div>{new Date(selectedTransaction.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div className="fin-detail-item">
                                <label>Category</label>
                                <div>{selectedTransaction.category}</div>
                            </div>
                        </div>

                        <div className="fin-detail-item full">
                            <label>Description</label>
                            <div className="fin-detail-description">{selectedTransaction.description}</div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Invoice Detail Modal */}
            <Modal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                title="Invoice Preview"
                footer={
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="ghost" icon={Download}>Download PDF</Button>
                        <Button variant="primary" onClick={() => setIsInvoiceModalOpen(false)}>Close</Button>
                    </div>
                }
            >
                {selectedInvoice && (
                    <div className="fin-invoice-detail">
                        <div className="fin-invoice-detail__header">
                            <div className="fin-invoice-detail__brand">
                                <div className="fin-brand-logo"><Receipt size={24} /></div>
                                <div className="fin-brand-info">
                                    <strong>DevelopWork Inc.</strong>
                                    <span>Finance Department</span>
                                </div>
                            </div>
                            <Badge variant="status" color={invoiceStatusColor[selectedInvoice.status]}>{selectedInvoice.status}</Badge>
                        </div>

                        <div className="fin-invoice-info-grid">
                            <div className="fin-info-block">
                                <label>Bill To</label>
                                <strong>{selectedInvoice.client}</strong>
                                <span>Accounting Team</span>
                            </div>
                            <div className="fin-info-block text-right">
                                <label>Invoice Number</label>
                                <strong>{selectedInvoice.id}</strong>
                                <label style={{ marginTop: '12px' }}>Due Date</label>
                                <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                        </div>

                        <div className="fin-invoice-items">
                            <div className="fin-item-header">
                                <span>Description</span>
                                <span>Amount</span>
                            </div>
                            <div className="fin-item-row">
                                <span>Professional Services - Consulting</span>
                                <span>{formatCurrency(selectedInvoice.amount)}</span>
                            </div>
                        </div>

                        <div className="fin-invoice-summary">
                            <div className="fin-summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(selectedInvoice.amount)}</span>
                            </div>
                            <div className="fin-summary-row">
                                <span>Tax (0%)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="fin-summary-row total">
                                <span>Total Amount</span>
                                <span>{formatCurrency(selectedInvoice.amount)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Budget Detail Modal */}
            <Modal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                title="Budget Analysis"
                footer={<Button variant="primary" onClick={() => setIsBudgetModalOpen(false)}>Close</Button>}
            >
                {selectedBudget && (
                    <div className="fin-budget-detail">
                        <div className="fin-budget-detail__header">
                            <div className="fin-budget-status">
                                <div className="pct-circle">
                                    {Math.round((selectedBudget.spent / selectedBudget.allocated) * 100)}%
                                </div>
                                <div className="status-info">
                                    <strong>{selectedBudget.department}</strong>
                                    <span>Budget Utilization</span>
                                </div>
                            </div>
                            <Badge variant="status" color={
                                (selectedBudget.spent / selectedBudget.allocated) > 0.9 ? 'var(--danger)' : 
                                (selectedBudget.spent / selectedBudget.allocated) > 0.8 ? 'var(--warning)' : 'var(--success)'
                            }>
                                {(selectedBudget.spent / selectedBudget.allocated) > 0.9 ? 'Critical' : 
                                 (selectedBudget.spent / selectedBudget.allocated) > 0.8 ? 'Warning' : 'Healthy'}
                            </Badge>
                        </div>

                        <div className="fin-budget-metrics">
                            <div className="fin-metric-card">
                                <label>Allocated</label>
                                <div className="value">{formatCurrency(selectedBudget.allocated)}</div>
                            </div>
                            <div className="fin-metric-card">
                                <label>Spent</label>
                                <div className="value spent">{formatCurrency(selectedBudget.spent)}</div>
                            </div>
                            <div className="fin-metric-card">
                                <label>Remaining</label>
                                <div className="value remaining">{formatCurrency(selectedBudget.allocated - selectedBudget.spent)}</div>
                            </div>
                        </div>

                        <div className="fin-budget-progress-section">
                            <label>Utilization Progress</label>
                            <div className="large-progress-bar">
                                <div 
                                    className="fill" 
                                    style={{ 
                                        width: `${(selectedBudget.spent / selectedBudget.allocated) * 100}%`,
                                        background: (selectedBudget.spent / selectedBudget.allocated) > 0.9 ? 'var(--danger)' : 
                                                   (selectedBudget.spent / selectedBudget.allocated) > 0.8 ? 'var(--warning)' : 'var(--success)'
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="fin-budget-categories">
                            <label>Top Spending Categories</label>
                            <div className="cat-item"><span>Software Licenses</span><strong>45%</strong></div>
                            <div className="cat-item"><span>Employee Training</span><strong>30%</strong></div>
                            <div className="cat-item"><span>Hardware Upgrades</span><strong>25%</strong></div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Expense Detail Modal */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Expense Request Review"
                footer={
                    selectedExpense?.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button variant="ghost" icon={X} onClick={() => setIsExpenseModalOpen(false)}>Reject Request</Button>
                            <Button variant="primary" icon={Check} onClick={() => setIsExpenseModalOpen(false)}>Approve Request</Button>
                        </div>
                    ) : (
                        <Button variant="primary" onClick={() => setIsExpenseModalOpen(false)}>Close</Button>
                    )
                }
            >
                {selectedExpense && (
                    <div className="fin-expense-detail">
                        <div className="fin-expense-detail__header">
                            <div className="fin-requester-info">
                                <div className="avatar-placeholder">{selectedExpense.requester.split(' ').map(n => n[0]).join('')}</div>
                                <div className="info">
                                    <strong>{selectedExpense.requester}</strong>
                                    <span>Requested on {new Date(selectedExpense.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Badge variant="status" color={selectedExpense.status === 'Pending' ? 'var(--warning)' : 'var(--success)'}>
                                {selectedExpense.status}
                            </Badge>
                        </div>

                        <div className="fin-expense-main-info">
                            <div className="info-group">
                                <label>Category</label>
                                <div className="value">{selectedExpense.category}</div>
                            </div>
                            <div className="info-group">
                                <label>Total Amount</label>
                                <div className="value highlight">{formatCurrency(selectedExpense.amount)}</div>
                            </div>
                        </div>

                        <div className="fin-expense-justification">
                            <label>Reason / Justification</label>
                            <div className="reason-box">
                                <AlertCircle size={16} />
                                <span>{selectedExpense.reason}</span>
                            </div>
                        </div>

                        <div className="fin-expense-attachments">
                            <label>Attachments</label>
                            <div className="attachment-placeholder">
                                <FileText size={20} />
                                <span>receipt_scan.pdf</span>
                                <Button variant="ghost" size="sm">Download</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Finance;
