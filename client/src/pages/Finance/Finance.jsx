import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { addToast } from '../../store/slices/uiSlice';
import { financeService } from '../../services/financeService';
import { isEmpty, isPositiveNumber } from '../../utils/validation';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt, FileText,
    Download, Upload, Calendar, Search, MoreVertical, ArrowUpRight, ArrowDownRight,
    BarChart3, AlertCircle, Plus, Check, X, Clock, Trash2, Pencil,
    Zap, Home, Briefcase, Filter
} from 'lucide-react';
import './Finance.css';

import img1 from '../../assets/finance/1.png';
import img2 from '../../assets/finance/2.png';
import img3 from '../../assets/finance/3.png';
import img4 from '../../assets/finance/4.png';
import bannerLight from '../../assets/finance/banner_light.png';
import bannerDark from '../../assets/finance/banner_dark.png';
import InvoiceBuilder from './components/InvoiceBuilder/InvoiceBuilder';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const formatCurrency = (n) => `Rs. ${new Intl.NumberFormat('en-US').format(n)}`;

const Finance = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');

    const renderTag = (val) => {
        if (!val) return null;
        const slug = val.toLowerCase().replace(/\s+/g, '-');
        return (
            <span className={`fin__tag fin__tag--${slug}`}>
                <span className="fin__tag-dot"></span>
                {val}
            </span>
        );
    };


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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [csvData, setCsvData] = useState('');
    const [editId, setEditId] = useState(null);
    const [deleteConfig, setDeleteConfig] = useState({ id: null, type: '', title: '' });
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Software',
        type: 'expense'
    });

    const [expenseFormData, setExpenseFormData] = useState({
        description: '',
        amount: '',
        category: 'Power',
        type: 'company', // 'company' or 'individual'
        requester: ''
    });

    const [editExpenseId, setEditExpenseId] = useState(null);
    const [expenseFilter, setExpenseFilter] = useState('all');

    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    const isWithinDateFilter = useCallback((dateString) => {
        if (!dateString) return true;
        if (dateFilter === 'all') return true;
        const date = new Date(dateString);
        const today = new Date();
        
        if (dateFilter === 'this_month') {
            return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }
        if (dateFilter === 'last_month') {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
        }
        if (dateFilter === 'this_year') {
            return date.getFullYear() === today.getFullYear();
        }
        return true;
    }, [dateFilter]);

    const loadTransactions = useCallback(async () => {
        try {
            const data = await financeService.getTransactions();
            setTransactions(data);
        } catch (err) { console.error('Error loading transactions:', err); }
    }, []);

    const loadInvoices = useCallback(async () => {
        try {
            const data = await financeService.getInvoices();
            setInvoices(data.map(inv => {
                let itemsCount = 0;
                try {
                    const parsedItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
                    itemsCount = Array.isArray(parsedItems) ? parsedItems.length : 0;
                } catch (e) {
                    console.error('Failed to parse invoice items', e);
                }
                
                return {
                    ...inv,
                    client: inv.client_name,
                    dueDate: inv.due_date,
                    itemsCount // Add a new safe count property
                };
            }));
        } catch (err) { console.error('Error loading invoices:', err); }
    }, []);

    const loadExpenses = useCallback(async () => {
        try {
            const data = await financeService.getExpenses();
            setExpenses(data.map(exp => ({
                ...exp,
                requester: exp.requester_name || (exp.type === 'company' ? 'Company' : 'Unknown'),
                reason: exp.reason || '',
            })));
        } catch (err) { console.error('Error loading expenses:', err); }
    }, []);

    useEffect(() => {
        const loadAll = async () => {
            setDataLoading(true);
            await Promise.all([loadTransactions(), loadInvoices(), loadExpenses()]);
            setDataLoading(false);
        };
        loadAll();
    }, [loadTransactions, loadInvoices, loadExpenses]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'expenses', label: 'Expenses', icon: CreditCard },
    ];

    const chartData = useMemo(() => {
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                revenue: 0,
                expenses: 0
            });
        }

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const month = tDate.toLocaleString('default', { month: 'short' });
            const year = tDate.getFullYear();
            const monthData = last6Months.find(m => m.month === month && m.year === year);
            if (monthData) {
                if (t.type === 'income') monthData.revenue += t.amount;
                else monthData.expenses += t.amount;
            }
        });

        return last6Months.map(m => ({
            ...m,
            netProfit: m.revenue - m.expenses
        }));
    }, [transactions]);

    const categoryData = useMemo(() => {
        const cats = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            cats[t.category] = (cats[t.category] || 0) + t.amount;
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    const dashboardStats = useMemo(() => {
        const filteredTxForStats = transactions.filter(t => isWithinDateFilter(t.date));
        const totalRev = filteredTxForStats.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExp = filteredTxForStats.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const netProfit = totalRev - totalExp;
        
        const last3Months = chartData.slice(-3);
        const avgBurn = last3Months.reduce((acc, m) => acc + m.expenses, 0) / 3;

        // Calculate dynamic changes based on the last 2 months
        const currMonth = chartData[5];
        const prevMonth = chartData[4];

        const getChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? '+100.0%' : '0.0%';
            const pct = ((curr - prev) / Math.abs(prev)) * 100;
            return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        };

        const revChange = getChange(currMonth.revenue, prevMonth.revenue);
        const expChange = getChange(currMonth.expenses, prevMonth.expenses);
        const profitChange = getChange(currMonth.netProfit, prevMonth.netProfit);
        const burnChange = getChange(currMonth.expenses, prevMonth.expenses); // Using current vs prev expenses for burn rate change

        return [
            { label: 'Total Revenue', value: formatCurrency(totalRev), change: revChange, positive: revChange.startsWith('+'), image: img1 },
            { label: 'Total Expenses', value: formatCurrency(totalExp), change: expChange, positive: expChange.startsWith('-'), image: img2 }, // Expense increase is negative
            { label: 'Net Profit', value: formatCurrency(netProfit), change: profitChange, positive: profitChange.startsWith('+'), image: img3 },
            { label: 'Burn Rate', value: formatCurrency(avgBurn) + '/mo', change: burnChange, positive: burnChange.startsWith('-'), image: img4 }, // Burn rate decrease is positive
        ];
    }, [transactions, chartData, isWithinDateFilter]);

    const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

    const handleAddTransaction = () => {
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        if (isEmpty(formData.description)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Description is required.', type: 'warning' }));
            return;
        }
        if (!isPositiveNumber(formData.amount)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Amount must be a positive number.', type: 'warning' }));
            return;
        }
        
        const txData = {
            type: formData.type || 'expense',
            category: formData.category || 'General',
            description: formData.description,
            amount: parseInt(formData.amount) || 0,
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            reference: editId ? undefined : `TXN-${Date.now().toString().slice(-6)}`
        };

        try {
            if (editId) {
                await financeService.updateTransaction(editId, txData);
                dispatch(addToast({ title: 'Transaction Updated', message: 'The transaction has been updated successfully.', type: 'success' }));
            } else {
                await financeService.createTransaction(txData);
                dispatch(addToast({ title: 'Transaction Added', message: 'The transaction has been recorded.', type: 'success' }));
            }
            await loadTransactions();
        } catch (err) {
            console.error('Error saving transaction:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to save transaction.', type: 'error' }));
        }

        setIsModalOpen(false);
        setEditId(null);
        setFormData({ description: '', amount: '', category: 'General', type: 'expense' });
    };

    const handleEditTransaction = (e, t) => {
        e.stopPropagation();
        setEditId(t.id);
        setFormData({
            description: t.description,
            amount: t.amount,
            category: t.category,
            type: t.type
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (e, id, type, title) => {
        e.stopPropagation();
        setDeleteConfig({ id, type, title });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        const { id, type, title } = deleteConfig;
        try {
            if (type === 'transaction') {
                await financeService.deleteTransaction(id);
                await loadTransactions();
            } else if (type === 'invoice') {
                await financeService.deleteInvoice(id);
                await loadInvoices();
            } else if (type === 'expense') {
                await financeService.deleteExpense(id);
                await loadExpenses();
            }
            dispatch(addToast({ title: 'Deleted', message: `${title} has been deleted.`, type: 'info' }));
        } catch (err) {
            console.error('Delete error:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to delete item.', type: 'error' }));
        }
        setIsDeleteModalOpen(false);
    };

    const handleExportCSV = () => {
        let dataToExport = [];
        let headers = [];
        if (activeTab === 'transactions' || activeTab === 'dashboard') {
            headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Reference'];
            dataToExport = transactions.map(t => [t.id, t.date, t.type, t.category, `"${t.description}"`, t.amount, t.status, t.reference]);
        } else if (activeTab === 'invoices') {
            headers = ['ID', 'Client', 'Amount', 'DueDate', 'Status', 'Items'];
            dataToExport = invoices.map(i => [i.id, `"${i.client}"`, i.amount, i.dueDate, i.status, i.items]);
        } else {
            dispatch(addToast({ title: 'Not Supported', message: 'Export is only supported for Transactions and Invoices.', type: 'warning' }));
            return;
        }

        const csvContent = [headers.join(','), ...dataToExport.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${activeTab}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        dispatch(addToast({ title: 'Export Successful', message: 'CSV file has been downloaded.', type: 'success' }));
    };

    const handleImportCSV = () => {
        if (!csvData.trim()) return;
        const lines = csvData.trim().split('\n');
        const newItems = lines.map((line, index) => {
            const [desc, amt, cat, typ] = line.split(',').map(s => s.replace(/"/g, '').trim());
            return {
                id: Date.now() + index,
                type: typ?.toLowerCase() === 'income' ? 'income' : 'expense',
                category: cat || 'General',
                description: desc || 'Imported Transaction',
                amount: parseInt(amt) || 0,
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                reference: `IMP-${Date.now().toString().slice(-6)}`
            };
        });
        setTransactions(prev => [...prev, ...newItems]);
        setIsImportModalOpen(false);
        setCsvData('');
        dispatch(addToast({ title: 'Import Successful', message: `Imported ${newItems.length} transactions.`, type: 'success' }));
    };


    const handleSaveExpense = async () => {
        if (isEmpty(expenseFormData.description)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Description is required.', type: 'warning' }));
            return;
        }
        if (!isPositiveNumber(expenseFormData.amount)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Amount must be a positive number.', type: 'warning' }));
            return;
        }
        
        const expData = {
            reason: expenseFormData.description,
            amount: parseInt(expenseFormData.amount),
            category: expenseFormData.category,
            type: expenseFormData.type,
            requester_name: expenseFormData.type === 'company' ? 'Company' : (expenseFormData.requester || user?.name || 'User'),
            date: new Date().toISOString().split('T')[0],
            status: editExpenseId ? undefined : (expenseFormData.type === 'company' ? 'Approved' : 'Pending')
        };

        try {
            if (editExpenseId) {
                await financeService.updateExpense(editExpenseId, expData);
                dispatch(addToast({ title: 'Expense Updated', message: 'The expense record has been updated.', type: 'success' }));
            } else {
                await financeService.createExpense(expData);
                dispatch(addToast({ title: 'Expense Added', message: 'New expense record created.', type: 'success' }));
            }
            await loadExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to save expense record.', type: 'error' }));
        }
        
        setIsAddExpenseModalOpen(false);
        setEditExpenseId(null);
        setExpenseFormData({ description: '', amount: '', category: 'Power', type: 'company', requester: '' });

        // If expense type is company and auto-approved, also create a transaction
        if (!editExpenseId && expenseFormData.type === 'company') {
            try {
                await financeService.createTransaction({
                    type: 'expense',
                    category: expenseFormData.category || 'Operations',
                    description: `Expense: ${expenseFormData.description}`,
                    amount: parseInt(expenseFormData.amount) || 0,
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed',
                    reference: `EXP-AUTO-${Date.now().toString().slice(-6)}`
                });
                await loadTransactions();
            } catch (err) {
                console.error('Error creating expense transaction:', err);
            }
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Expense Management Report', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["ID", "Description", "Category", "Stakeholder", "Amount", "Status", "Date"];
        const tableRows = [];

        filteredExpenses.forEach(exp => {
            const expData = [
                `EXP-${exp.id}`,
                exp.reason,
                exp.category,
                exp.requester,
                formatCurrency(exp.amount),
                exp.status,
                new Date(exp.date).toLocaleDateString()
            ];
            tableRows.push(expData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`expense_report_${new Date().toISOString().slice(0,10)}.pdf`);
        dispatch(addToast({title:'Export Successful', message:'Expense report downloaded as PDF', type:'success'}));
    };

    const handleEditExpense = (e, exp) => {
        e.stopPropagation();
        setEditExpenseId(exp.id);
        setExpenseFormData({
            description: exp.reason || exp.description,
            amount: exp.amount.toString(),
            category: exp.category,
            type: exp.type,
            requester: exp.requester
        });
        setIsAddExpenseModalOpen(true);
    };

    const handleViewTransaction = (t) => {
        setSelectedTransaction(t);
        setIsDetailModalOpen(true);
    };

    const handleApproveExpense = async (e, exp) => {
        e.stopPropagation();
        try {
            await financeService.updateExpense(exp.id, { status: 'Approved' });
            // Create expense transaction for this approved expense
            await financeService.createTransaction({
                type: 'expense',
                category: exp.category || 'Operations',
                description: `Expense: ${exp.reason || exp.description} (${exp.requester})`,
                amount: exp.amount,
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                reference: `EXP-${exp.id}`
            });
            await Promise.all([loadExpenses(), loadTransactions()]);
            dispatch(addToast({ title: 'Expense Approved', message: `Request from ${exp.requester} has been approved. ${formatCurrency(exp.amount)} recorded as expense.`, type: 'success' }));
        } catch (err) {
            console.error('Error approving expense:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to approve expense.', type: 'error' }));
        }
    };

    const handleRejectExpense = async (e, exp) => {
        e.stopPropagation();
        try {
            await financeService.updateExpense(exp.id, { status: 'Rejected' });
            await loadExpenses();
            dispatch(addToast({ title: 'Expense Rejected', message: `Request from ${exp.requester} has been rejected.`, type: 'info' }));
        } catch (err) {
            console.error('Error rejecting expense:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to reject expense.', type: 'error' }));
        }
    };

    const handleDownloadInvoicePDF = async () => {
        if (!selectedInvoice) return;
        
        const invoiceElement = document.querySelector('.fin-invoice-detail');
        if (!invoiceElement) {
            dispatch(addToast({ title: 'Error', message: 'Invoice view not found.', type: 'error' }));
            return;
        }

        dispatch(addToast({ title: 'Generating PDF', message: `Please wait, preparing ${selectedInvoice.id}...`, type: 'info' }));
        
        try {
            const canvas = await html2canvas(invoiceElement, {
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
            pdf.save(`${selectedInvoice.id}_Invoice.pdf`);

            dispatch(addToast({ title: 'Download Complete', message: `Invoice ${selectedInvoice.id} has been saved.`, type: 'success' }));
        } catch (error) {
            console.error('Error generating PDF:', error);
            dispatch(addToast({ title: 'Error', message: 'Failed to generate PDF.', type: 'error' }));
        }
    };

    const handleDownloadReceipt = () => {
        if (!selectedExpense) return;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('Expense Receipt', 20, 20);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(20, 25, 190, 25);
        
        // Meta
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Receipt ID: EXP-${selectedExpense.id}`, 20, 40);
        doc.text(`Date: ${new Date(selectedExpense.date).toLocaleDateString()}`, 130, 40);
        
        // Details
        doc.setFontSize(12);
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(`Requester: ${selectedExpense.requester}`, 20, 60);
        doc.text(`Category: ${selectedExpense.category}`, 20, 70);
        doc.text(`Status: ${selectedExpense.status}`, 20, 80);
        
        // Amount
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`Amount: ${formatCurrency(selectedExpense.amount)}`, 20, 105);
        
        // Reason
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Justification:', 20, 125);
        
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(selectedExpense.reason || 'No justification provided.', 170);
        doc.text(splitText, 20, 135);

        // Footer
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('DevelopSuite - Automated Finance System', 20, 280);

        doc.save(`receipt_EXP-${selectedExpense.id}.pdf`);
        dispatch(addToast({ title: 'Download Started', message: 'Receipt downloaded successfully.', type: 'success' }));
    };

    const handleViewInvoice = (inv) => {
        setSelectedInvoice(inv);
        setIsInvoiceModalOpen(true);
    };

    const handleViewExpense = (exp) => {
        setSelectedExpense(exp);
        setIsExpenseModalOpen(true);
    };

    // Config and Handlers

    const categories = ['all', 'Sales', 'Services', 'Payroll', 'Operations', 'Marketing'];
    const filteredTransactions = transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
        const matchDate = isWithinDateFilter(t.date);
        return matchSearch && matchCat && matchDate;
    });

    const theme = useSelector((state) => state.ui.theme);
    const bannerImg = theme === 'dark' ? bannerDark : bannerLight;

    const invoiceStatusColor = { Paid: 'var(--success)', Sent: 'var(--info)', Overdue: 'var(--danger)', Draft: 'var(--text-muted)' };

    const categoryIcons = {
        'Power': Zap,
        'Rent': Home,
        'Software': Briefcase,
        'Travel': CreditCard,
        'Equipment': Receipt,
        'Utilities': Wallet,
        'default': Receipt
    };

    const totalCompanyExpenses = expenses
        .filter(e => e.type === 'company' && e.status === 'Approved' && isWithinDateFilter(e.date))
        .reduce((sum, e) => sum + e.amount, 0);

    const filteredExpenses = expenses.filter(e => {
        const matchDate = isWithinDateFilter(e.date);
        if (!matchDate) return false;
        if (expenseFilter === 'all') return true;
        return e.type === expenseFilter;
    });

    const filteredInvoices = invoices.filter(inv => isWithinDateFilter(inv.date));

    return (
        <div className="finance-dashboard">
            <div className="finance-dashboard__banner">
                <div className="finance-dashboard__banner-bg" style={{ backgroundImage: `url(${bannerImg})` }}></div>
                <div className="finance-dashboard__banner-overlay"></div>
                <div className="finance-dashboard__banner-content">
                    <h1>Finance Dashboard</h1>
                    <p>Manage your company finances and expenses securely</p>
                </div>
            </div>


            {/* Stats */}
            <div className="finance-dashboard__stats">
                {dashboardStats.map(stat => (
                    <div key={stat.label} className="finance-dashboard__stat-card">
                        <div className="finance-dashboard__stat-content">
                            <div className="finance-dashboard__stat-label">{stat.label}</div>
                            <div className="finance-dashboard__stat-value">{stat.value}</div>
                            <span className={`finance-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{stat.change}
                            </span>
                        </div>
                        <div className="finance-dashboard__stat-image">
                            <img src={stat.image} alt={stat.label} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Row */}
            <div className="fin-controls-row">
                <div className="fin-tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} className={`fin-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>
                            <tab.icon size={16} /><span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="fin-actions">
                    <select 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                        className="dw-form-input" 
                        style={{ width: '140px', padding: '8px 12px', fontSize: '14px', height: 'auto', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <option value="all">All Time</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_year">This Year</option>
                    </select>
                    <Button variant="ghost" icon={Upload} onClick={() => setIsImportModalOpen(true)}>Import</Button>
                    <Button variant="ghost" icon={Download} onClick={handleExportCSV}>Export</Button>
                    <Button variant="primary" icon={Receipt} onClick={handleAddTransaction}>New Transaction</Button>
                </div>
            </div>

            {/* === DASHBOARD === */}
            {activeTab === 'dashboard' && (
                <div className="fin-dashboard-grid">
                    <div className="fin-chart-card" style={{ gridColumn: 'span 2' }}>
                        <h3>Revenue vs Expenses Overview</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }} 
                                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                    />
                                    <Legend verticalAlign="top" height={36} align="right" iconType="circle" />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                    <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="fin-chart-card">
                        <h3>Expense Breakdown</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="fin-chart-card">
                        <h3>Net Cash Flow Trend</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }} 
                                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                        cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                    />
                                    <Bar dataKey="netProfit" name="Net Profit" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.netProfit >= 0 ? '#10b981' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* === TRANSACTIONS === */}
            {activeTab === 'transactions' && (
                <div className="fin-section">
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
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.id} onClick={() => handleViewTransaction(t)} style={{ cursor: 'pointer' }}>
                                    <td>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                    <td><strong>{t.description}</strong><br /><span className="fin-ref">{t.reference}</span></td>
                                    <td>{renderTag(t.category)}</td>
                                    <td className={t.type === 'income' ? 'positive' : 'negative'}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</td>
                                    <td>{t.type === 'income' ? <ArrowDownRight size={14} color="var(--success)" /> : <ArrowUpRight size={14} color="var(--danger)" />} {t.type}</td>
                                    <td>{renderTag(t.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="fin-action-btn" onClick={(e) => handleEditTransaction(e, t)}><Pencil size={14} /></button>
                                            <button className="fin-action-btn delete" onClick={(e) => handleDeleteClick(e, t.id, 'transaction', 'Transaction')}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === INVOICES === */}
            {activeTab === 'invoices' && (
                <div className="fin-section">
                    <div className="fin-section__header">
                        <h2>Invoices</h2>
                        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsInvoiceBuilderOpen(true)}>Create Invoice</Button>
                    </div>
                    <div className="fin-invoice-grid">
                        {filteredInvoices.map(inv => (
                            <button key={inv.id} className="fin-invoice-card clickable" onClick={() => handleViewInvoice(inv)}>
                                <div className="fin-invoice-card__header">
                                    <span className="fin-invoice-card__id">{inv.id}</span>
                                    {renderTag(inv.status)}
                                </div>
                                <div className="fin-invoice-card__client">{inv.client}</div>
                                <div className="fin-invoice-card__amount">{formatCurrency(inv.amount)}</div>
                                <div className="fin-invoice-card__meta">
                                    <span><Calendar size={12} /> Due: {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    <span><FileText size={12} /> {inv.itemsCount} items</span>
                                </div>
                                <div className="fin-invoice-card__actions">
                                    {inv.status === 'Draft' && <Button variant="primary" size="sm" onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        try {
                                            await financeService.updateInvoice(inv.id, { status: 'Sent' });
                                            await loadInvoices();
                                            dispatch(addToast({title:'Invoice Sent', message:`${inv.id} sent to client.`, type:'success'}));
                                        } catch (err) { dispatch(addToast({title:'Error', message:'Failed to send invoice.', type:'error'})); }
                                    }}>Send</Button>}
                                    {inv.status === 'Sent' && <Button variant="primary" size="sm" onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        try {
                                            await financeService.updateInvoice(inv.id, { status: 'Paid' });
                                            // Create income transaction for this paid invoice
                                            await financeService.createTransaction({
                                                type: 'income',
                                                category: 'Sales',
                                                description: `Invoice ${inv.id} - ${inv.client}`,
                                                amount: inv.amount,
                                                date: new Date().toISOString().split('T')[0],
                                                status: 'completed',
                                                reference: `INV-${inv.id}`
                                            });
                                            await Promise.all([loadInvoices(), loadTransactions()]);
                                            dispatch(addToast({title:'Payment Recorded', message:`${inv.id} marked as paid. Revenue of ${formatCurrency(inv.amount)} recorded.`, type:'success'}));
                                        } catch (err) { dispatch(addToast({title:'Error', message:'Failed to mark as paid.', type:'error'})); }
                                    }}>Mark Paid</Button>}
                                    {inv.status === 'Overdue' && <Button variant="primary" size="sm" onClick={(e) => { 
                                        e.stopPropagation(); 
                                        dispatch(addToast({title:'Reminder Sent', message:`Reminder sent for ${inv.id}.`, type:'info'}));
                                    }}>Send Reminder</Button>}
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, inv.id, 'invoice', 'Invoice'); }}><Trash2 size={14}/></Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewInvoice(inv); }}>View</Button>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}


             {/* === EXPENSES === */}
            {activeTab === 'expenses' && (
                <div className="fin-ledger-section">
                    <div className="fin-ledger-header">
                        <div className="fin-ledger-summary">
                            <div className="fin-summary-main">
                                <span className="fin-summary-label">Executive Spending Summary</span>
                                <div className="fin-summary-amount-group">
                                    <span className="fin-summary-amount">{totalCompanyExpenses.toLocaleString()}</span>
                                    <span className="fin-summary-symbol">PKR</span>
                                </div>
                            </div>
                            <div className="fin-summary-details">
                                <div className="detail-item"><span className="label">Company</span><strong>{formatCurrency(expenses.filter(e => e.type === 'company').reduce((a,b)=>a+b.amount, 0))}</strong></div>
                                <div className="detail-item"><span className="label">Individual</span><strong>{formatCurrency(expenses.filter(e => e.type === 'individual').reduce((a,b)=>a+b.amount, 0))}</strong></div>
                            </div>
                        </div>

                        <div className="fin-ledger-controls">
                            <div className="fin-minimal-tabs">
                                {['all', 'company', 'individual'].map(f => (
                                    <button key={f} className={expenseFilter === f ? 'active' : ''} onClick={() => setExpenseFilter(f)}>{f}</button>
                                ))}
                            </div>
                            <div style={{display:'flex', gap:'8px'}}>
                                <Button variant="ghost" size="sm" icon={Download} onClick={handleExportPDF} style={{fontSize:'11px'}}>Export PDF</Button>
                                <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditExpenseId(null); setExpenseFormData({ description: '', amount: '', category: 'Power', type: 'company', requester: '' }); setIsAddExpenseModalOpen(true); }} style={{borderRadius:'100px', padding:'8px 16px', fontSize:'11px'}}>Record Expense</Button>
                            </div>
                        </div>
                    </div>

                    <div className="fin-ledger-list">
                        <div className="fin-ledger-list-header">
                            <span className="col-icon"></span>
                            <span className="col-desc">Description</span>
                            <span className="col-cat">Category</span>
                            <span className="col-stake">Stakeholder</span>
                            <span className="col-amount">Amount</span>
                            <span className="col-status">Status</span>
                            <span className="col-actions"></span>
                        </div>
                        {filteredExpenses.map(exp => {
                            const Icon = categoryIcons[exp.category] || categoryIcons.default;
                            return (
                                <div key={exp.id} className={`fin-ledger-row ${exp.status.toLowerCase()}`} onClick={() => handleViewExpense(exp)}>
                                    <div className="fin-ledger-accent" />
                                    <div className="fin-ledger-icon">
                                        <Icon size={16} />
                                    </div>
                                    <div className="fin-ledger-content col-desc">
                                        <div className="title">{exp.reason}</div>
                                        <div className="meta">{new Date(exp.date).toLocaleDateString()} · Ref: EXP-{exp.id}</div>
                                    </div>
                                    <div className="fin-ledger-col col-cat">
                                        {renderTag(exp.category)}
                                    </div>
                                    <div className="fin-ledger-col col-stake">
                                        <div className="stakeholder-info">
                                            <strong>{exp.requester}</strong>
                                            <span>{exp.type}</span>
                                        </div>
                                    </div>
                                    <div className="fin-ledger-col col-amount">
                                        <span className="amount-val">{formatCurrency(exp.amount)}</span>
                                    </div>
                                    <div className="fin-ledger-col col-status">
                                        {renderTag(exp.status)}
                                    </div>
                                    <div className="fin-ledger-col col-actions" onClick={e => e.stopPropagation()}>
                                        <div className="action-group">
                                            {exp.status === 'Pending' && (
                                                <>
                                                    <button className="icon-btn approve" onClick={(e) => handleApproveExpense(e, exp)}><Check size={14}/></button>
                                                    <button className="icon-btn reject" onClick={(e) => handleRejectExpense(e, exp)}><X size={14}/></button>
                                                </>
                                            )}
                                            <button className="icon-btn" onClick={(e) => handleEditExpense(e, exp)}><Pencil size={14}/></button>
                                            <button className="icon-btn delete" onClick={(e) => handleDeleteClick(e, exp.id, 'expense', 'Expense')}><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                                <div>{renderTag(selectedTransaction.status)}</div>
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
                        <Button variant="ghost" icon={Download} onClick={handleDownloadInvoicePDF}>Download PDF</Button>
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
                            {renderTag(selectedInvoice.status)}
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
                            {renderTag(selectedExpense.status)}
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
                                <Button variant="ghost" size="sm" onClick={handleDownloadReceipt}>Download</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={`Delete ${deleteConfig.title}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={confirmDelete} style={{background:'var(--danger)', borderColor:'var(--danger)'}}>Delete</Button>
                    </>
                }
            >
                <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>
                    Are you sure you want to delete this {deleteConfig.title}? This action cannot be undone.
                </div>
            </Modal>

            {/* Import CSV Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Transactions via CSV"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleImportCSV} disabled={!csvData.trim()}>Import Data</Button>
                    </>
                }
            >
                <div className="dw-form" style={{ paddingBottom: '10px' }}>
                    <div className="dw-form-group">
                        <label className="dw-form-label">Paste CSV Data</label>
                        <textarea 
                            className="dw-form-input" 
                            style={{ minHeight: '150px', fontFamily: 'monospace', fontSize: '12px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            placeholder="Description, Amount, Category, Type&#10;Office Supplies, 150, Operations, expense&#10;Consulting Fee, 5000, Services, income"
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>Format: Description, Amount, Category, Type</span>
                    </div>
                </div>
            </Modal>

            {/* Add/Edit Expense Modal */}
            <Modal
                isOpen={isAddExpenseModalOpen}
                onClose={() => { setIsAddExpenseModalOpen(false); setEditExpenseId(null); }}
                title={editExpenseId ? 'Edit Expense Record' : 'New Expense Record'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => { setIsAddExpenseModalOpen(false); setEditExpenseId(null); }}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveExpense}>{editExpenseId ? 'Update Expense' : 'Save Expense'}</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Expense Type</label>
                        <div className="fin-type-toggle">
                            <button 
                                className={expenseFormData.type === 'company' ? 'active' : ''} 
                                onClick={() => setExpenseFormData({...expenseFormData, type: 'company', requester: 'Company'})}
                            >Company</button>
                            <button 
                                className={expenseFormData.type === 'individual' ? 'active' : ''} 
                                onClick={() => setExpenseFormData({...expenseFormData, type: 'individual', requester: ''})}
                            >Individual</button>
                        </div>
                    </div>
                    
                    {expenseFormData.type === 'individual' && (
                        <div className="dw-form-group">
                            <label className="dw-form-label">Requester Name</label>
                            <input 
                                className="dw-form-input" 
                                placeholder="e.g. John Doe" 
                                value={expenseFormData.requester} 
                                onChange={e => setExpenseFormData({...expenseFormData, requester: e.target.value})} 
                            />
                        </div>
                    )}

                    <div className="dw-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Category</label>
                            <select 
                                className="dw-form-input" 
                                value={expenseFormData.category} 
                                onChange={e => setExpenseFormData({...expenseFormData, category: e.target.value})}
                            >
                                <option>Power</option>
                                <option>Rent</option>
                                <option>Software</option>
                                <option>Travel</option>
                                <option>Equipment</option>
                                <option>Utilities</option>
                                <option>Meals</option>
                            </select>
                        </div>
                        <div className="dw-form-group">
                            <label className="dw-form-label">Amount ($)</label>
                            <input 
                                className="dw-form-input" 
                                type="number" 
                                placeholder="e.g. 150" 
                                value={expenseFormData.amount} 
                                onChange={e => setExpenseFormData({...expenseFormData, amount: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="dw-form-group">
                        <label className="dw-form-label">Description / Reason</label>
                        <textarea 
                            className="dw-form-input" 
                            placeholder="Describe the purpose of this expense" 
                            style={{minHeight: '80px'}}
                            value={expenseFormData.description} 
                            onChange={e => setExpenseFormData({...expenseFormData, description: e.target.value})} 
                        />
                    </div>
                </div>
            </Modal>

            <InvoiceBuilder 
                isOpen={isInvoiceBuilderOpen} 
                onClose={() => setIsInvoiceBuilderOpen(false)} 
                onSave={async (newInvoice) => {
                    try {
                        const dbInvoice = {
                            id: newInvoice.id,
                            client_name: newInvoice.client,
                            amount: newInvoice.amount,
                            due_date: newInvoice.dueDate,
                            status: 'Draft',
                            items: JSON.stringify(newInvoice.items)
                        };
                        await financeService.createInvoice(dbInvoice);
                        await loadInvoices();
                        dispatch(addToast({ type: 'success', message: `Invoice ${newInvoice.id} created successfully` }));
                    } catch (err) {
                        console.error('Error creating invoice:', err);
                        dispatch(addToast({ type: 'error', message: 'Failed to create invoice' }));
                    }
                }}
            />
        </div>
    );
};

export default Finance;
