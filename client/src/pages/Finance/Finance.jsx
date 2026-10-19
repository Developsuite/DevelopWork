import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    Zap, Home, Briefcase, Filter, ShieldAlert, PiggyBank, Settings2, ChevronRight
} from 'lucide-react';
import { permissionsService } from '../../services/permissionsService';
import './Finance.css';

import img1 from '../../assets/finance/1.png';
import img2 from '../../assets/finance/2.png';
import img3 from '../../assets/finance/3.png';
import img4 from '../../assets/finance/4.png';

import InvoiceBuilder from './components/InvoiceBuilder/InvoiceBuilder';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const getCurrencyPrefix = (curr) => (curr === 'USD' ? '$' : 'Rs. ');

const NetCashFlowTooltip = ({ active, payload, label }) => {
    const currency = useSelector((state) => state.ui.currency) || 'PKR';
    const prefix = getCurrencyPrefix(currency);
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const isPositive = val >= 0;
        return (
            <div className="fin-chart-tooltip">
                <span className="fin-chart-tooltip__label">{label}</span>
                <div className="fin-chart-tooltip__row">
                    <span
                        className="fin-chart-tooltip__dot"
                        style={{ backgroundColor: isPositive ? '#10b981' : '#f43f5e' }}
                    />
                    <span className="fin-chart-tooltip__name">Net Profit:</span>
                    <span className={`fin-chart-tooltip__value ${isPositive ? 'positive' : 'negative'}`}>
                        {val < 0 ? `-${prefix}${Math.abs(val).toLocaleString()}` : `${prefix}${val.toLocaleString()}`}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const RevenueExpenseTooltip = ({ active, payload, label }) => {
    const currency = useSelector((state) => state.ui.currency) || 'PKR';
    const prefix = getCurrencyPrefix(currency);
    if (active && payload && payload.length) {
        return (
            <div className="fin-chart-tooltip">
                <span className="fin-chart-tooltip__label">{label}</span>
                {payload.map((item, idx) => (
                    <div key={idx} className="fin-chart-tooltip__row">
                        <span
                            className="fin-chart-tooltip__dot"
                            style={{ backgroundColor: item.color || (item.dataKey === 'revenue' ? '#6366f1' : '#f43f5e') }}
                        />
                        <span className="fin-chart-tooltip__name">{item.name}:</span>
                        <span className="fin-chart-tooltip__value">
                            {prefix}{Number(item.value).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ExpensePieTooltip = ({ active, payload }) => {
    const currency = useSelector((state) => state.ui.currency) || 'PKR';
    const prefix = getCurrencyPrefix(currency);
    if (active && payload && payload.length) {
        const item = payload[0];
        return (
            <div className="fin-chart-tooltip">
                <div className="fin-chart-tooltip__row">
                    <span
                        className="fin-chart-tooltip__dot"
                        style={{ backgroundColor: item.payload?.fill || '#6366f1' }}
                    />
                    <span className="fin-chart-tooltip__name">{item.name}:</span>
                    <span className="fin-chart-tooltip__value">
                        {prefix}{Number(item.value).toLocaleString()}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const Finance = () => {
    const { user } = useSelector((state) => state.auth);
    const theme = useSelector((state) => state.ui.theme);
    const currency = useSelector((state) => state.ui.currency) || 'PKR';
    const dispatch = useDispatch();

    const formatCurrency = useCallback((n) => {
        const prefix = getCurrencyPrefix(currency);
        return `${prefix}${new Intl.NumberFormat('en-US').format(n || 0)}`;
    }, [currency]);

    const allTabs = useMemo(() => [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, permission: 'finance.dashboard' },
        { id: 'transactions', label: 'Transactions', icon: Receipt, permission: 'finance.transactions' },
        { id: 'invoices', label: 'Invoices', icon: FileText, permission: 'finance.invoices' },
        { id: 'expenses', label: 'Expenses', icon: CreditCard, permission: 'finance.expenses' },
        { id: 'cashflow', label: 'Cash Flow', icon: PiggyBank, permission: 'finance.dashboard' },
    ], []);

    const tabs = useMemo(() => {
        if (!user || user.role === 'admin') return allTabs;
        const permitted = allTabs.filter(t => permissionsService.hasPermission(user, t.permission));
        return permitted.length > 0 ? permitted : allTabs;
    }, [user, allTabs]);

    const canViewDashboard = user?.role === 'admin' || permissionsService.hasPermission(user, 'finance.dashboard') || permissionsService.hasPermission(user, 'finance.*') || permissionsService.hasPermission(user, 'finance');
    const canManageTransactions = user?.role === 'admin' || permissionsService.hasPermission(user, 'finance.transactions') || permissionsService.hasPermission(user, 'finance.*') || permissionsService.hasPermission(user, 'finance');
    const canManageInvoices = user?.role === 'admin' || permissionsService.hasPermission(user, 'finance.invoices') || permissionsService.hasPermission(user, 'finance.*') || permissionsService.hasPermission(user, 'finance');
    const canManageExpenses = user?.role === 'admin' || permissionsService.hasPermission(user, 'finance.expenses') || permissionsService.hasPermission(user, 'finance.*') || permissionsService.hasPermission(user, 'finance');

    const [searchParams, setSearchParams] = useSearchParams();
    const initialUrlTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(() => {
        if (initialUrlTab) return initialUrlTab;
        if (user && user.role !== 'admin') {
            const permitted = allTabs.filter(t => permissionsService.hasPermission(user, t.permission));
            if (permitted.length > 0 && !permitted.some(t => t.id === 'dashboard')) {
                return permitted[0].id;
            }
        }
        return 'dashboard';
    });

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

    // Keep activeTab aligned with permitted tabs and URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (user && user.role !== 'admin' && tabs.length > 0) {
            const isPermitted = tabs.some(t => t.id === activeTab);
            if (!isPermitted) {
                const target = tabs[0].id;
                setActiveTab(target);
                setSearchParams({ tab: target }, { replace: true });
            }
        }
    }, [searchParams, user, tabs, activeTab, setSearchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateFilter, setDateFilter] = useState('this_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
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
        type: 'expense',
        date: ''
    });

    const [expenseFormData, setExpenseFormData] = useState({
        description: '',
        amount: '',
        category: 'Power',
        type: 'company', // 'company' or 'individual'
        requester: '',
        date: ''
    });

    const [editExpenseId, setEditExpenseId] = useState(null);
    const [expenseFilter, setExpenseFilter] = useState('all');

    // ── Cash Flow Reserve ──────────────────────────────────────────────
    const [cashFlowReserve, setCashFlowReserve] = useState(() => {
        try {
            const saved = localStorage.getItem('dw-cashflow-reserve-v3');
            return saved ? JSON.parse(saved) : { percent: 20, enabled: true, sourceMonth: 'previous' };
        } catch { return { percent: 20, enabled: true, sourceMonth: 'previous' }; }
    });
    // Per-month manual override: { '2026-10': 20000, '2026-09': 15000 }
    const [monthlyOverrides, setMonthlyOverrides] = useState(() => {
        try {
            const saved = localStorage.getItem('dw-cfr-overrides');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const [editingMonthKey, setEditingMonthKey] = useState(null);
    const [editingVal, setEditingVal] = useState('');
    const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
    const [cfDraft, setCfDraft] = useState(cashFlowReserve);

    const saveCashFlowReserve = (settings) => {
        setCashFlowReserve(settings);
        try { localStorage.setItem('dw-cashflow-reserve-v3', JSON.stringify(settings)); } catch {}
        setIsCashFlowModalOpen(false);
        dispatch(addToast({ title: 'Cash Flow Reserve Saved', message: 'Reserve settings updated.', type: 'success' }));
    };
    const saveMonthOverride = (key, val) => {
        const updated = { ...monthlyOverrides, [key]: Number(val) };
        setMonthlyOverrides(updated);
        try { localStorage.setItem('dw-cfr-overrides', JSON.stringify(updated)); } catch {}
        setEditingMonthKey(null);
    };
    const clearMonthOverride = (key) => {
        const updated = { ...monthlyOverrides };
        delete updated[key];
        setMonthlyOverrides(updated);
        try { localStorage.setItem('dw-cfr-overrides', JSON.stringify(updated)); } catch {}
    };
    // ──────────────────────────────────────────────────────────────────

    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const syncedTxIdsRef = useRef(new Set());

    const isWithinDateFilter = useCallback((dateString) => {
        if (!dateString) return true;
        if (dateFilter === 'all') return true;
        
        let itemDateStr = dateString;
        if (dateString.includes('T')) {
            itemDateStr = dateString.split('T')[0];
        }
        const itemDate = new Date(itemDateStr + 'T00:00:00');
        if (isNaN(itemDate.getTime())) return true;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (dateFilter === 'today') {
            return itemDateStr === todayStr;
        }

        if (dateFilter === 'this_week') {
            const day = now.getDay();
            const diffToMonday = day === 0 ? 6 : day - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - diffToMonday);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            return itemDate >= monday && itemDate <= sunday;
        }

        if (dateFilter === 'this_month') {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }

        if (dateFilter === 'last_month') {
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return itemDate.getMonth() === lastMonthDate.getMonth() && itemDate.getFullYear() === lastMonthDate.getFullYear();
        }

        if (dateFilter === 'this_year') {
            return itemDate.getFullYear() === now.getFullYear();
        }

        if (dateFilter === 'custom') {
            if (customStartDate && customEndDate) {
                const start = customStartDate <= customEndDate ? customStartDate : customEndDate;
                const end = customStartDate <= customEndDate ? customEndDate : customStartDate;
                return itemDateStr >= start && itemDateStr <= end;
            }
            if (customStartDate) {
                return itemDateStr >= customStartDate;
            }
            if (customEndDate) {
                return itemDateStr <= customEndDate;
            }
            return true;
        }

        return true;
    }, [dateFilter, customStartDate, customEndDate]);

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
                let itemsList = [];
                let advancePayment = 0;
                let balanceDue = inv.amount;
                let projectName = '';
                let issueDate = inv.created_at ? inv.created_at.split('T')[0] : '';
                let taxRate = 0;
                let notes = '';
                try {
                    const parsed = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
                    if (Array.isArray(parsed)) {
                        itemsList = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        itemsList = Array.isArray(parsed.items) ? parsed.items : [];
                        advancePayment = Number(parsed.advancePayment) || 0;
                        balanceDue = parsed.balanceDue !== undefined ? Number(parsed.balanceDue) : (inv.amount - advancePayment);
                        projectName = parsed.projectName || '';
                        if (parsed.issueDate) issueDate = parsed.issueDate;
                        taxRate = Number(parsed.taxRate) || 0;
                        notes = parsed.notes || '';
                    }
                } catch (e) {
                    console.error('Failed to parse invoice items', e);
                }
                
                return {
                    ...inv,
                    client: inv.client_name,
                    dueDate: inv.due_date,
                    date: issueDate || (inv.created_at ? inv.created_at.split('T')[0] : (inv.date ? inv.date.split('T')[0] : '')),
                    itemsList,
                    itemsCount: itemsList.length,
                    advancePayment,
                    balanceDue,
                    projectName,
                    issueDate,
                    taxRate,
                    notes
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

    // Auto-sync any existing expense transactions that have mismatched dates
    useEffect(() => {
        if (!transactions.length || !expenses.length) return;

        const syncMismatches = async () => {
            let hasChanges = false;
            for (const exp of expenses) {
                if (!exp.date) continue;
                const expDateStr = exp.date.split('T')[0];

                // Find matching transaction by reference or description
                const matchingTx = transactions.find(t =>
                    t.type === 'expense' &&
                    !syncedTxIdsRef.current.has(t.id) &&
                    (
                        t.reference === `EXP-${exp.id}` ||
                        t.reference === `EXP-AUTO-${exp.id}` ||
                        t.description === `Expense: ${exp.reason}` ||
                        (exp.reason && t.description && t.description.toLowerCase().trim() === `Expense: ${exp.reason}`.toLowerCase().trim())
                    )
                );

                if (matchingTx && matchingTx.date) {
                    const txDateStr = matchingTx.date.split('T')[0];
                    if (txDateStr !== expDateStr) {
                        try {
                            syncedTxIdsRef.current.add(matchingTx.id);
                            await financeService.updateTransaction(matchingTx.id, {
                                date: expDateStr,
                                created_at: new Date(expDateStr + 'T12:00:00Z').toISOString()
                            });
                            hasChanges = true;
                        } catch (err) {
                            console.error('Failed to sync transaction date:', err);
                        }
                    }
                }
            }

            if (hasChanges) {
                await loadTransactions();
            }
        };

        syncMismatches();
    }, [expenses, transactions, loadTransactions]);

    const chartData = useMemo(() => {
        const now = new Date();
        const parseTxDate = (t) => {
            if (!t.date) return null;
            const str = t.date.includes('T') ? t.date.split('T')[0] : t.date;
            const d = new Date(str + 'T00:00:00');
            return isNaN(d.getTime()) ? null : { dateObj: d, dateStr: str };
        };

        if (dateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            const buckets = [
                { key: '00', label: '12 AM', revenue: 0, expenses: 0 },
                { key: '04', label: '4 AM', revenue: 0, expenses: 0 },
                { key: '08', label: '8 AM', revenue: 0, expenses: 0 },
                { key: '12', label: '12 PM', revenue: 0, expenses: 0 },
                { key: '16', label: '4 PM', revenue: 0, expenses: 0 },
                { key: '20', label: '8 PM', revenue: 0, expenses: 0 },
            ];

            transactions.forEach(t => {
                const parsed = parseTxDate(t);
                if (!parsed || parsed.dateStr !== todayStr) return;
                
                let bucketIndex = 3;
                if (t.created_at || (t.date && t.date.includes('T'))) {
                    const fullDate = new Date(t.created_at || t.date);
                    if (!isNaN(fullDate.getTime())) {
                        const h = fullDate.getHours();
                        bucketIndex = Math.min(5, Math.floor(h / 4));
                    }
                }
                if (t.type === 'income') buckets[bucketIndex].revenue += t.amount;
                else buckets[bucketIndex].expenses += t.amount;
            });

            return buckets.map(b => ({
                month: b.label,
                revenue: b.revenue,
                expenses: b.expenses,
                netProfit: b.revenue - b.expenses
            }));
        }

        if (dateFilter === 'this_week') {
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - diffToMonday);
            monday.setHours(0, 0, 0, 0);

            const days = [];
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const dStr = d.toISOString().split('T')[0];
                days.push({
                    dateStr: dStr,
                    label: dayNames[i],
                    revenue: 0,
                    expenses: 0
                });
            }

            transactions.forEach(t => {
                const parsed = parseTxDate(t);
                if (!parsed) return;
                const match = days.find(d => d.dateStr === parsed.dateStr);
                if (match) {
                    if (t.type === 'income') match.revenue += t.amount;
                    else match.expenses += t.amount;
                }
            });

            return days.map(d => ({
                month: d.label,
                revenue: d.revenue,
                expenses: d.expenses,
                netProfit: d.revenue - d.expenses
            }));
        }

        if (dateFilter === 'this_month' || dateFilter === 'last_month') {
            const targetYear = dateFilter === 'this_month' ? now.getFullYear() : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
            const targetMonth = dateFilter === 'this_month' ? now.getMonth() : (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
            
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'short' });
            
            const intervals = [
                { start: 1, end: 5, label: `${monthName} 1-5`, revenue: 0, expenses: 0 },
                { start: 6, end: 10, label: `${monthName} 6-10`, revenue: 0, expenses: 0 },
                { start: 11, end: 15, label: `${monthName} 11-15`, revenue: 0, expenses: 0 },
                { start: 16, end: 20, label: `${monthName} 16-20`, revenue: 0, expenses: 0 },
                { start: 21, end: 25, label: `${monthName} 21-25`, revenue: 0, expenses: 0 },
                { start: 26, end: daysInMonth, label: `${monthName} 26-${daysInMonth}`, revenue: 0, expenses: 0 },
            ];

            transactions.forEach(t => {
                const parsed = parseTxDate(t);
                if (!parsed) return;
                if (parsed.dateObj.getFullYear() === targetYear && parsed.dateObj.getMonth() === targetMonth) {
                    const dayNum = parsed.dateObj.getDate();
                    const interval = intervals.find(inv => dayNum >= inv.start && dayNum <= inv.end);
                    if (interval) {
                        if (t.type === 'income') interval.revenue += t.amount;
                        else interval.expenses += t.amount;
                    }
                }
            });

            return intervals.map(inv => ({
                month: inv.label,
                revenue: inv.revenue,
                expenses: inv.expenses,
                netProfit: inv.revenue - inv.expenses
            }));
        }

        if (dateFilter === 'this_year') {
            const targetYear = now.getFullYear();
            const months = [];
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                months.push({
                    monthIndex: i,
                    label: monthNames[i],
                    revenue: 0,
                    expenses: 0
                });
            }

            transactions.forEach(t => {
                const parsed = parseTxDate(t);
                if (!parsed) return;
                if (parsed.dateObj.getFullYear() === targetYear) {
                    const mIdx = parsed.dateObj.getMonth();
                    if (months[mIdx]) {
                        if (t.type === 'income') months[mIdx].revenue += t.amount;
                        else months[mIdx].expenses += t.amount;
                    }
                }
            });

            return months.map(m => ({
                month: m.label,
                revenue: m.revenue,
                expenses: m.expenses,
                netProfit: m.revenue - m.expenses
            }));
        }

        if (dateFilter === 'custom' && (customStartDate || customEndDate)) {
            let start = customStartDate || customEndDate;
            let end = customEndDate || customStartDate;
            if (start > end) {
                const temp = start;
                start = end;
                end = temp;
            }

            const startDateObj = new Date(start + 'T00:00:00');
            const endDateObj = new Date(end + 'T00:00:00');
            const diffDays = Math.max(1, Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1);

            if (diffDays <= 14) {
                const days = [];
                for (let i = 0; i < diffDays; i++) {
                    const d = new Date(startDateObj);
                    d.setDate(startDateObj.getDate() + i);
                    const dStr = d.toISOString().split('T')[0];
                    const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    days.push({ dateStr: dStr, label, revenue: 0, expenses: 0 });
                }

                transactions.forEach(t => {
                    const parsed = parseTxDate(t);
                    if (!parsed) return;
                    const match = days.find(d => d.dateStr === parsed.dateStr);
                    if (match) {
                        if (t.type === 'income') match.revenue += t.amount;
                        else match.expenses += t.amount;
                    }
                });

                return days.map(d => ({
                    month: d.label,
                    revenue: d.revenue,
                    expenses: d.expenses,
                    netProfit: d.revenue - d.expenses
                }));
            } else if (diffDays <= 60) {
                const numBuckets = Math.min(8, Math.max(4, Math.ceil(diffDays / 7)));
                const bucketSize = Math.ceil(diffDays / numBuckets);
                const buckets = [];

                for (let i = 0; i < numBuckets; i++) {
                    const bStart = new Date(startDateObj);
                    bStart.setDate(startDateObj.getDate() + i * bucketSize);
                    const bEnd = new Date(startDateObj);
                    bEnd.setDate(startDateObj.getDate() + Math.min(diffDays - 1, (i + 1) * bucketSize - 1));
                    
                    const label = `${bStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${bEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
                    buckets.push({
                        startDate: bStart,
                        endDate: bEnd,
                        label,
                        revenue: 0,
                        expenses: 0
                    });
                }

                transactions.forEach(t => {
                    const parsed = parseTxDate(t);
                    if (!parsed) return;
                    if (parsed.dateStr >= start && parsed.dateStr <= end) {
                        const b = buckets.find(b => parsed.dateObj >= b.startDate && parsed.dateObj <= b.endDate);
                        if (b) {
                            if (t.type === 'income') b.revenue += t.amount;
                            else b.expenses += t.amount;
                        }
                    }
                });

                return buckets.map(b => ({
                    month: b.label,
                    revenue: b.revenue,
                    expenses: b.expenses,
                    netProfit: b.revenue - b.expenses
                }));
            } else {
                const months = [];
                const cur = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
                const last = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1);
                
                while (cur <= last) {
                    months.push({
                        year: cur.getFullYear(),
                        monthIndex: cur.getMonth(),
                        label: cur.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
                        revenue: 0,
                        expenses: 0
                    });
                    cur.setMonth(cur.getMonth() + 1);
                }

                transactions.forEach(t => {
                    const parsed = parseTxDate(t);
                    if (!parsed) return;
                    if (parsed.dateStr >= start && parsed.dateStr <= end) {
                        const m = months.find(m => m.year === parsed.dateObj.getFullYear() && m.monthIndex === parsed.dateObj.getMonth());
                        if (m) {
                            if (t.type === 'income') m.revenue += t.amount;
                            else m.expenses += t.amount;
                        }
                    }
                });

                return months.map(m => ({
                    month: m.label,
                    revenue: m.revenue,
                    expenses: m.expenses,
                    netProfit: m.revenue - m.expenses
                }));
            }
        }

        // Default 'all' or fallback: Last 6 months
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
            const parsed = parseTxDate(t);
            if (!parsed) return;
            const month = parsed.dateObj.toLocaleString('default', { month: 'short' });
            const year = parsed.dateObj.getFullYear();
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
    }, [transactions, dateFilter, customStartDate, customEndDate]);

    const categoryData = useMemo(() => {
        const cats = {};
        transactions
            .filter(t => t.type === 'expense' && isWithinDateFilter(t.date))
            .forEach(t => {
                const cat = t.category || 'General';
                cats[cat] = (cats[cat] || 0) + t.amount;
            });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [transactions, isWithinDateFilter]);

    const dashboardStats = useMemo(() => {
        const filteredTxForStats = transactions.filter(t => isWithinDateFilter(t.date));
        const totalRev = filteredTxForStats.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExp = filteredTxForStats.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const netProfit = totalRev - totalExp;
        
        // Calculate dynamic comparison metrics based on the chartData points
        let prevRev = 0;
        let prevExp = 0;
        let prevProfit = 0;

        if (chartData.length >= 2) {
            const currentPoint = chartData[chartData.length - 1];
            const prevPoint = chartData[chartData.length - 2];
            prevRev = prevPoint.revenue;
            prevExp = prevPoint.expenses;
            prevProfit = prevPoint.netProfit;
        }

        const getChange = (curr, prev) => {
            if (prev === 0 && curr === 0) return '0.0%';
            if (prev === 0) return curr > 0 ? '+100.0%' : '0.0%';
            const pct = ((curr - prev) / Math.abs(prev)) * 100;
            return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        };

        const revChange = getChange(totalRev, prevRev);
        const expChange = getChange(totalExp, prevExp);
        const profitChange = getChange(netProfit, prevProfit);

        // Calculate monthly burn rate accurately
        let monthlyBurn = totalExp;
        if (dateFilter === 'this_year') {
            const currentMonthIdx = new Date().getMonth() + 1;
            monthlyBurn = totalExp / currentMonthIdx;
        } else if (dateFilter === 'all') {
            monthlyBurn = totalExp / Math.max(1, chartData.length);
        } else if (dateFilter === 'this_week') {
            monthlyBurn = (totalExp / 7) * 30;
        } else if (dateFilter === 'today') {
            monthlyBurn = totalExp * 30;
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
            const s = new Date(customStartDate);
            const e = new Date(customEndDate);
            const days = Math.max(1, Math.round(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1);
            monthlyBurn = (totalExp / days) * 30;
        }

        const roundedBurn = Math.round(monthlyBurn);
        const burnChange = expChange;

        return [
            { label: 'Total Revenue', value: formatCurrency(totalRev), change: revChange, positive: revChange.startsWith('+'), image: img1 },
            { label: 'Total Expenses', value: formatCurrency(totalExp), change: expChange, positive: expChange.startsWith('-'), image: img2 }, // Expense increase is negative
            { label: 'Net Profit', value: formatCurrency(netProfit), change: profitChange, positive: profitChange.startsWith('+'), image: img3 },
            { label: 'Burn Rate', value: `${formatCurrency(roundedBurn)}/mo`, change: burnChange, positive: burnChange.startsWith('-'), image: img4 }, // Burn rate decrease is positive
        ];
    }, [transactions, chartData, isWithinDateFilter, dateFilter, customStartDate, customEndDate, formatCurrency]);

    // Cash Flow Reserve calculations for current month
    const cashFlowStats = useMemo(() => {
        const now = new Date();
        const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Current month transactions
        const thisMonthTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const monthExpenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const monthRevenue  = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

        // Source month for auto-calc (prev or current)
        const usePrev = cashFlowReserve.sourceMonth === 'previous';
        const srcDate = usePrev ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now;
        const srcTx = usePrev
            ? transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === srcDate.getMonth() && d.getFullYear() === srcDate.getFullYear();
            })
            : thisMonthTx;
        const srcRevenue   = srcTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const srcExpenses  = srcTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const srcNetProfit = Math.max(0, srcRevenue - srcExpenses);

        // Manual override takes priority; otherwise auto-calc from % of net profit
        const autoReserve = Math.round(srcNetProfit * (cashFlowReserve.percent / 100));
        const reserveAmount = cashFlowReserve.enabled
            ? (monthlyOverrides[curKey] !== undefined ? monthlyOverrides[curKey] : autoReserve)
            : 0;
        const isManual = monthlyOverrides[curKey] !== undefined;

        const usedFromReserve = Math.min(monthExpenses, reserveAmount);
        const remaining  = Math.max(0, reserveAmount - usedFromReserve);
        const overReserve = Math.max(0, monthExpenses - reserveAmount);
        const pctUsed = reserveAmount > 0 ? Math.min(100, Math.round((usedFromReserve / reserveAmount) * 100)) : 0;

        return { monthRevenue, monthExpenses, srcNetProfit, srcRevenue, srcExpenses, reserveAmount, autoReserve, isManual, usedFromReserve, remaining, overReserve, pctUsed, curKey };
    }, [transactions, cashFlowReserve, monthlyOverrides]);

    const cashFlowHistory = useMemo(() => {
        const now = new Date();
        const months = [];
        const usePrev = cashFlowReserve.sourceMonth === 'previous';
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthTx = transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            });
            const revenue  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const netProfit = Math.max(0, revenue - expenses);

            // Source net profit for auto-calc
            let srcNetProfit = netProfit;
            if (usePrev) {
                const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                const prevTx = transactions.filter(t => {
                    const td = new Date(t.date);
                    return td.getMonth() === prevD.getMonth() && td.getFullYear() === prevD.getFullYear();
                });
                const prevRev = prevTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const prevExp = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                srcNetProfit = Math.max(0, prevRev - prevExp);
            }

            const autoReserve = Math.round(srcNetProfit * (cashFlowReserve.percent / 100));
            const isManual = monthlyOverrides[monthKey] !== undefined;
            const reserve  = isManual ? monthlyOverrides[monthKey] : autoReserve;
            const used = Math.min(expenses, reserve);
            const over = Math.max(0, expenses - reserve);
            const pct  = reserve > 0 ? Math.round((used / reserve) * 100) : 0;
            months.push({
                key: monthKey,
                label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue, expenses, netProfit, reserve, autoReserve, isManual, used, over, pct,
            });
        }
        return months;
    }, [transactions, cashFlowReserve, monthlyOverrides]);

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
        
        const txDate = formData.date ? formData.date : new Date().toISOString().split('T')[0];
        const txData = {
            type: formData.type || 'expense',
            category: formData.category || 'General',
            description: formData.description,
            amount: parseInt(formData.amount) || 0,
            date: txDate,
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
        setFormData({ description: '', amount: '', category: 'General', type: 'expense', date: '' });
    };

    const handleEditTransaction = (e, t) => {
        e.stopPropagation();
        setEditId(t.id);
        setFormData({
            description: t.description,
            amount: t.amount,
            category: t.category,
            type: t.type,
            date: t.date ? t.date.split('T')[0] : ''
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
                // Also clean up any linked transaction
                const linkedTx = transactions.find(t => 
                    t.type === 'expense' && (t.reference === `EXP-${id}` || t.reference === `EXP-AUTO-${id}`)
                );
                if (linkedTx) {
                    try {
                        await financeService.deleteTransaction(linkedTx.id);
                    } catch (e) {
                        console.error('Failed to delete linked transaction', e);
                    }
                }
                await Promise.all([loadExpenses(), loadTransactions()]);
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
        
        const expenseDate = expenseFormData.date ? expenseFormData.date : new Date().toISOString().split('T')[0];
        const expData = {
            reason: expenseFormData.description,
            amount: parseInt(expenseFormData.amount),
            category: expenseFormData.category,
            type: expenseFormData.type,
            requester_name: expenseFormData.type === 'company' ? 'Company' : (expenseFormData.requester || user?.name || 'User'),
            date: expenseDate,
            created_at: expenseDate ? new Date(expenseDate + 'T12:00:00Z').toISOString() : undefined,
            status: editExpenseId ? undefined : (expenseFormData.type === 'company' ? 'Approved' : 'Pending')
        };

        let savedExpenseId = editExpenseId;
        try {
            if (editExpenseId) {
                await financeService.updateExpense(editExpenseId, expData);
                dispatch(addToast({ title: 'Expense Updated', message: 'The expense record has been updated.', type: 'success' }));
            } else {
                const created = await financeService.createExpense(expData);
                if (created && created.id) {
                    savedExpenseId = created.id;
                }
                dispatch(addToast({ title: 'Expense Added', message: 'New expense record created.', type: 'success' }));
            }
            await loadExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
            dispatch(addToast({ title: 'Error', message: 'Failed to save expense record.', type: 'error' }));
        }

        // If expense type is company and auto-approved, create or update matching transaction
        if (expenseFormData.type === 'company') {
            try {
                const existingTx = transactions.find(t =>
                    t.type === 'expense' &&
                    (
                        (savedExpenseId && (t.reference === `EXP-${savedExpenseId}` || t.reference === `EXP-AUTO-${savedExpenseId}`)) ||
                        t.description === `Expense: ${expenseFormData.description}`
                    )
                );

                if (existingTx) {
                    await financeService.updateTransaction(existingTx.id, {
                        category: expenseFormData.category || 'Operations',
                        description: `Expense: ${expenseFormData.description}`,
                        amount: parseInt(expenseFormData.amount) || 0,
                        date: expenseDate,
                        created_at: expenseDate ? new Date(expenseDate + 'T12:00:00Z').toISOString() : undefined,
                        reference: savedExpenseId ? `EXP-${savedExpenseId}` : existingTx.reference
                    });
                } else if (!editExpenseId) {
                    await financeService.createTransaction({
                        type: 'expense',
                        category: expenseFormData.category || 'Operations',
                        description: `Expense: ${expenseFormData.description}`,
                        amount: parseInt(expenseFormData.amount) || 0,
                        date: expenseDate,
                        created_at: expenseDate ? new Date(expenseDate + 'T12:00:00Z').toISOString() : undefined,
                        status: 'completed',
                        reference: savedExpenseId ? `EXP-${savedExpenseId}` : `EXP-AUTO-${Date.now().toString().slice(-6)}`
                    });
                }
                await loadTransactions();
            } catch (err) {
                console.error('Error syncing expense transaction:', err);
            }
        }
        
        setIsAddExpenseModalOpen(false);
        setEditExpenseId(null);
        setExpenseFormData({ description: '', amount: '', category: 'Power', type: 'company', requester: '', date: '' });
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
            requester: exp.requester,
            date: exp.date ? exp.date.split('T')[0] : ''
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
            // Create expense transaction for this approved expense with its actual date
            const expDate = exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0];
            await financeService.createTransaction({
                type: 'expense',
                category: exp.category || 'Operations',
                description: `Expense: ${exp.reason || exp.description} (${exp.requester})`,
                amount: exp.amount,
                date: expDate,
                created_at: expDate ? new Date(expDate + 'T12:00:00Z').toISOString() : undefined,
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
            <div className="page-header">
                <div className="page-header__info">
                    <h1>Finance Dashboard</h1>
                    <p>Manage your company finances and expenses securely</p>
                </div>
            </div>


            {/* Stats - visible only if user has dashboard permission */}
            {canViewDashboard && (
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
            )}

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
                    <div className="fin-date-filter-group">
                        <div className="fin-date-select-wrap">
                            <Calendar size={14} className="fin-date-select-icon" />
                            <select 
                                value={dateFilter} 
                                onChange={e => setDateFilter(e.target.value)} 
                                className="fin-date-select"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="this_year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {dateFilter === 'custom' && (
                            <div className="fin-date-range-pill">
                                <span className="fin-range-tag">From</span>
                                <input 
                                    type="date" 
                                    value={customStartDate} 
                                    onChange={e => setCustomStartDate(e.target.value)}
                                    className="fin-date-input"
                                    title="Start Date"
                                />
                                <span className="fin-range-tag">To</span>
                                <input 
                                    type="date" 
                                    value={customEndDate} 
                                    onChange={e => setCustomEndDate(e.target.value)}
                                    className="fin-date-input"
                                    title="End Date"
                                />
                                {(customStartDate || customEndDate) && (
                                    <button 
                                        type="button" 
                                        className="fin-date-clear-btn" 
                                        title="Reset custom dates"
                                        onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {(activeTab === 'dashboard' || activeTab === 'transactions') && canManageTransactions && (
                        <>
                            <Button variant="ghost" size="sm" icon={Upload} onClick={() => setIsImportModalOpen(true)}>Import</Button>
                            <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>Export</Button>
                            <Button variant="primary" size="sm" icon={Receipt} onClick={handleAddTransaction}>New Transaction</Button>
                        </>
                    )}
                    {activeTab === 'invoices' && canManageInvoices && (
                        <>
                            <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>Export</Button>
                            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsInvoiceBuilderOpen(true)}>Create Invoice</Button>
                        </>
                    )}
                    {activeTab === 'expenses' && canManageExpenses && (
                        <>
                            <Button variant="ghost" size="sm" icon={Download} onClick={handleExportCSV}>Export</Button>
                            <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditExpenseId(null); setExpenseFormData({ description: '', amount: '', category: 'Power', type: 'company', requester: '', date: '' }); setIsAddExpenseModalOpen(true); }}>New Expense</Button>
                        </>
                    )}
                </div>
            </div>

            {/* === DASHBOARD === */}
            {activeTab === 'dashboard' && canViewDashboard && (
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
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => currency === 'USD' ? `$${val/1000}k` : `Rs.${val/1000}k`} />
                                    <Tooltip content={<RevenueExpenseTooltip />} />
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
                            {categoryData.length === 0 ? (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: '100%', 
                                    color: 'var(--text-muted)',
                                    fontSize: '13px'
                                }}>
                                    <Receipt size={36} style={{ opacity: 0.35, marginBottom: '10px' }} />
                                    <span>No expense data for this period</span>
                                </div>
                            ) : (
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
                                        <Tooltip content={<ExpensePieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="fin-chart-card">
                        <h3>Net Cash Flow Trend</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => currency === 'USD' ? `$${val/1000}k` : `Rs.${val/1000}k`} />
                                    <Tooltip 
                                        content={<NetCashFlowTooltip />}
                                        cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}}
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
            {activeTab === 'dashboard' && !canViewDashboard && (
                <div className="empty-settings" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
                    <ShieldAlert size={44} style={{ color: 'var(--danger)', marginBottom: '16px', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the financial dashboard overview.</p>
                </div>
            )}

            {/* === TRANSACTIONS === */}
            {activeTab === 'transactions' && canManageTransactions && (
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
            {activeTab === 'transactions' && !canManageTransactions && (
                <div className="empty-settings" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
                    <ShieldAlert size={44} style={{ color: 'var(--danger)', marginBottom: '16px', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the transactions ledger.</p>
                </div>
            )}

            {/* === INVOICES === */}
            {activeTab === 'invoices' && canManageInvoices && (
                <div className="fin-invoices-wrap">
                    <div className="fin-invoices-header">
                        <h2>Invoices</h2>
                    </div>
                    <div className="fin-invoice-grid">
                        {filteredInvoices.map(inv => (
                            <button key={inv.id} className="fin-invoice-card clickable" onClick={() => handleViewInvoice(inv)}>
                                <div className="fin-invoice-card__header">
                                    <span className="fin-invoice-card__id">{inv.id}</span>
                                    {renderTag(inv.status)}
                                </div>
                                <div className="fin-invoice-card__client">{inv.client}</div>
                                {inv.projectName && (
                                    <div className="fin-invoice-card__project">
                                        <Briefcase size={11} />
                                        <span>{inv.projectName}</span>
                                    </div>
                                )}
                                <div className="fin-invoice-card__amount">{formatCurrency(inv.amount)}</div>
                                {inv.advancePayment > 0 && (
                                    <div className="fin-invoice-card__advance-info">
                                        <span className="fin-advance-pill">Adv: {formatCurrency(inv.advancePayment)}</span>
                                        <span className="fin-balance-pill">Due: {formatCurrency(inv.balanceDue)}</span>
                                    </div>
                                )}
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
                                            // Check if transaction already recorded to avoid duplicate
                                            const existingTx = transactions.find(t => t.reference === `INV-${inv.id}` || t.reference === inv.id);
                                            if (!existingTx) {
                                                await financeService.createTransaction({
                                                    type: 'income',
                                                    category: 'Sales',
                                                    description: `Invoice ${inv.id} - ${inv.client}${inv.projectName ? ` (${inv.projectName})` : ''}`,
                                                    amount: inv.amount,
                                                    date: inv.date || new Date().toISOString().split('T')[0],
                                                    status: 'completed',
                                                    reference: `INV-${inv.id}`
                                                });
                                            }
                                            await Promise.all([loadInvoices(), loadTransactions()]);
                                            dispatch(addToast({title:'Payment Recorded', message:`${inv.id} marked as paid.`, type:'success'}));
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
            {activeTab === 'invoices' && !canManageInvoices && (
                <div className="empty-settings" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
                    <ShieldAlert size={44} style={{ color: 'var(--danger)', marginBottom: '16px', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view invoices.</p>
                </div>
            )}

            {/* === EXPENSES === */}
            {activeTab === 'expenses' && canManageExpenses && (
                <div className="fin-ledger-section">
                    <div className="fin-ledger-header">
                        <div className="fin-ledger-summary">
                            <div className="fin-summary-main">
                                <span className="fin-summary-label">Executive Spending Summary</span>
                                <div className="fin-summary-amount-group">
                                    <span className="fin-summary-amount">{totalCompanyExpenses.toLocaleString()}</span>
                                    <span className="fin-summary-symbol">{currency === 'USD' ? 'USD' : 'PKR'}</span>
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
                                <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditExpenseId(null); setExpenseFormData({ description: '', amount: '', category: 'Power', type: 'company', requester: '', date: '' }); setIsAddExpenseModalOpen(true); }} style={{borderRadius:'100px', padding:'8px 16px', fontSize:'11px'}}>Record Expense</Button>
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
            {activeTab === 'expenses' && !canManageExpenses && (
                <div className="empty-settings" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
                    <ShieldAlert size={44} style={{ color: 'var(--danger)', marginBottom: '16px', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You do not have permission to access expense requests.</p>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Transaction"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveTransaction}>Add Transaction</Button>
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
                            <label className="dw-form-label">Amount ({currency === 'USD' ? '$' : 'PKR'})</label>
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
                    <div className="dw-form-group">
                        <label className="dw-form-label">
                            Date <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Optional - leave blank for today)</span>
                        </label>
                        <input
                            type="date"
                            className="dw-form-input"
                            value={formData.date || ''}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
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
                                {selectedInvoice.projectName && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '12px', color: 'var(--primary-color, #0055fe)', fontWeight: 600 }}>
                                        <Briefcase size={13} />
                                        <span>Project: {selectedInvoice.projectName}</span>
                                    </div>
                                )}
                            </div>
                            <div className="fin-info-block text-right">
                                <label>Invoice Number</label>
                                <strong>{selectedInvoice.id}</strong>
                                <label style={{ marginTop: '10px' }}>Issue Date</label>
                                <span>{selectedInvoice.issueDate || selectedInvoice.date ? new Date(selectedInvoice.issueDate || selectedInvoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                <label style={{ marginTop: '6px' }}>Due Date</label>
                                <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                        </div>

                        <div className="fin-invoice-items">
                            <div className="fin-item-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px' }}>
                                <span>Description</span>
                                <span style={{ textAlign: 'center' }}>Qty</span>
                                <span style={{ textAlign: 'right' }}>Rate</span>
                                <span style={{ textAlign: 'right' }}>Amount</span>
                            </div>
                            {selectedInvoice.itemsList && selectedInvoice.itemsList.length > 0 ? (
                                selectedInvoice.itemsList.map((item, idx) => (
                                    <div key={idx} className="fin-item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                                        <span>{item.description || 'Service item'}</span>
                                        <span style={{ textAlign: 'center' }}>{item.quantity || 1}</span>
                                        <span style={{ textAlign: 'right' }}>{formatCurrency(item.rate !== undefined ? item.rate : item.price || 0)}</span>
                                        <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency((item.quantity || 1) * (item.rate !== undefined ? item.rate : item.price || 0))}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="fin-item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                                    <span>Professional Services</span>
                                    <span style={{ textAlign: 'center' }}>1</span>
                                    <span style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.amount)}</span>
                                    <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(selectedInvoice.amount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="fin-invoice-summary">
                            <div className="fin-summary-row">
                                <span>Gross Total</span>
                                <span>{formatCurrency(selectedInvoice.amount)}</span>
                            </div>
                            {selectedInvoice.advancePayment > 0 && (
                                <div className="fin-summary-row" style={{ color: '#10b981', fontWeight: 600 }}>
                                    <span>Less: Advance Paid</span>
                                    <span>- {formatCurrency(selectedInvoice.advancePayment)}</span>
                                </div>
                            )}
                            <div className="fin-summary-row total" style={{ borderTop: '2px solid var(--border-color)', paddingTop: '10px' }}>
                                <span style={{ fontWeight: 700 }}>Balance Due</span>
                                <span style={{ fontWeight: 800, color: (selectedInvoice.balanceDue > 0 || (selectedInvoice.balanceDue === undefined && selectedInvoice.amount > 0)) ? 'var(--text-primary)' : '#10b981' }}>
                                    {formatCurrency(selectedInvoice.balanceDue !== undefined ? selectedInvoice.balanceDue : selectedInvoice.amount)}
                                </span>
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
                            <label className="dw-form-label">Amount ({currency === 'USD' ? '$' : 'PKR'})</label>
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
                        <label className="dw-form-label">
                            Expense Date <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Optional - leave blank for today)</span>
                        </label>
                        <input 
                            className="dw-form-input" 
                            type="date" 
                            value={expenseFormData.date || ''} 
                            onChange={e => setExpenseFormData({...expenseFormData, date: e.target.value})} 
                        />
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
                        const invoiceDate = newInvoice.date || new Date().toISOString().split('T')[0];
                        const dbInvoice = {
                            id: newInvoice.id,
                            client_name: newInvoice.client,
                            amount: newInvoice.amount,
                            due_date: newInvoice.dueDate,
                            status: newInvoice.status || 'Draft',
                            created_at: invoiceDate ? new Date(invoiceDate + 'T12:00:00Z').toISOString() : undefined,
                            items: JSON.stringify({
                                items: newInvoice.items,
                                advancePayment: newInvoice.advancePayment,
                                balanceDue: newInvoice.balanceDue,
                                projectId: newInvoice.projectId,
                                projectName: newInvoice.projectName,
                                issueDate: invoiceDate,
                                taxRate: newInvoice.taxRate,
                                notes: newInvoice.notes
                            })
                        };
                        await financeService.createInvoice(dbInvoice);

                        // Automatically record revenue transaction for this invoice on its specified date/month
                        await financeService.createTransaction({
                            type: 'income',
                            category: 'Sales',
                            description: `Invoice ${newInvoice.id} - ${newInvoice.client}${newInvoice.projectName ? ` (${newInvoice.projectName})` : ''}`,
                            amount: Number(newInvoice.amount) || 0,
                            date: invoiceDate,
                            status: 'completed',
                            reference: `INV-${newInvoice.id}`
                        });

                        await Promise.all([loadInvoices(), loadTransactions()]);
                        const monthName = new Date(invoiceDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        dispatch(addToast({ 
                            type: 'success', 
                            title: 'Invoice Created',
                            message: `Invoice ${newInvoice.id} created & revenue of ${formatCurrency(newInvoice.amount)} added to ${monthName} financial condition!` 
                        }));
                    } catch (err) {
                        console.error('Error creating invoice:', err);
                        dispatch(addToast({ type: 'error', message: 'Failed to create invoice' }));
                    }
                }}
            />

            {/* ── Cash Flow Reserve Tab ── */}
            {activeTab === 'cashflow' && (
                <div className="cfr-page">
                    {/* Header */}
                    <div className="cfr-page__header">
                        <div className="cfr-page__header-left">
                            <div className="cfr-page__hdr-icon"><PiggyBank size={22} /></div>
                            <div>
                                <h2 className="cfr-page__title">Monthly Cash Flow Reserve</h2>
                                <p className="cfr-page__desc">Hold a buffer of revenue each month to cover expenses before drawing from main funds</p>
                            </div>
                        </div>
                        <div className="cfr-page__header-right">
                            <label className="cfr-toggle-wrap">
                                <input
                                    type="checkbox"
                                    checked={cashFlowReserve.enabled}
                                    onChange={e => saveCashFlowReserve({ ...cashFlowReserve, enabled: e.target.checked })}
                                    className="cfr-toggle-input"
                                />
                                <span className="cfr-toggle-track" />
                                <span className="cfr-toggle-label">{cashFlowReserve.enabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                            {cashFlowReserve.enabled && (
                                <button
                                    className="cfr-set-month-btn"
                                    onClick={() => { setEditingMonthKey(cashFlowStats.curKey); setEditingVal(cashFlowStats.reserveAmount); }}
                                    title="Set a custom reserve for this month"
                                >
                                    <Pencil size={13} /> Set this month
                                </button>
                            )}
                            <Button variant="primary" size="sm" icon={Settings2} onClick={() => { setCfDraft(cashFlowReserve); setIsCashFlowModalOpen(true); }}>
                                Configure
                            </Button>
                        </div>
                    </div>

                    {!cashFlowReserve.enabled ? (
                        <div className="cfr-page__empty">
                            <div className="cfr-page__empty-icon"><PiggyBank size={44} /></div>
                            <h3 className="cfr-page__empty-title">Cash Flow Reserve is Disabled</h3>
                            <p className="cfr-page__empty-desc">Enable a monthly reserve to automatically hold a portion of revenue as a buffer. Expenses draw from this reserve first until the cap is reached, then pull from your main operating funds.</p>
                            <Button variant="primary" onClick={() => { setCfDraft({ ...cashFlowReserve, enabled: true }); setIsCashFlowModalOpen(true); }}>
                                Enable Reserve
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Stat cards */}
                            <div className="cfr-page__stats">
                                <div className="cfr-kpi-card">
                                    <div className="cfr-kpi-card__icon cfr-kpi-card__icon--blue"><DollarSign size={18} /></div>
                                    <div className="cfr-kpi-card__body">
                                        <div className="cfr-kpi-card__label">Reserve Budget</div>
                                        <div className="cfr-kpi-card__value">{formatCurrency(cashFlowStats.reserveAmount)}</div>
                                        <div className="cfr-kpi-card__sub">
                                            {cashFlowStats.isManual
                                                ? 'Manually set for this month'
                                                : `${cashFlowReserve.percent}% of ${cashFlowReserve.sourceMonth === 'previous' ? 'last' : 'this'} month's net profit`}
                                        </div>
                                    </div>
                                </div>
                                <div className="cfr-kpi-card">
                                    <div className="cfr-kpi-card__icon cfr-kpi-card__icon--amber"><TrendingDown size={18} /></div>
                                    <div className="cfr-kpi-card__body">
                                        <div className="cfr-kpi-card__label">Used This Month</div>
                                        <div className="cfr-kpi-card__value">{formatCurrency(cashFlowStats.usedFromReserve)}</div>
                                        <div className="cfr-kpi-card__sub">{cashFlowStats.pctUsed}% of reserve consumed</div>
                                    </div>
                                </div>
                                <div className="cfr-kpi-card">
                                    <div className="cfr-kpi-card__icon cfr-kpi-card__icon--green"><Wallet size={18} /></div>
                                    <div className="cfr-kpi-card__body">
                                        <div className="cfr-kpi-card__label">Remaining Reserve</div>
                                        <div className="cfr-kpi-card__value cfr-kpi-val--green">{formatCurrency(cashFlowStats.remaining)}</div>
                                        <div className="cfr-kpi-card__sub">Available to cover expenses</div>
                                    </div>
                                </div>
                                <div className="cfr-kpi-card">
                                    <div className={`cfr-kpi-card__icon ${cashFlowStats.overReserve > 0 ? 'cfr-kpi-card__icon--red' : 'cfr-kpi-card__icon--muted'}`}><ShieldAlert size={18} /></div>
                                    <div className="cfr-kpi-card__body">
                                        <div className="cfr-kpi-card__label">Over Cap (Main Funds)</div>
                                        <div className={`cfr-kpi-card__value ${cashFlowStats.overReserve > 0 ? 'cfr-kpi-val--red' : ''}`}>{formatCurrency(cashFlowStats.overReserve)}</div>
                                        <div className="cfr-kpi-card__sub">{cashFlowStats.overReserve > 0 ? 'Drawn from main operating funds' : 'Reserve is sufficient'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Body: donut + history */}
                            <div className="cfr-page__body">
                                {/* Left: donut */}
                                <div className="cfr-donut-card">
                                    <div className="cfr-donut-card__header">
                                        <h3 className="cfr-section-title">This Month's Usage</h3>
                                        <span className="cfr-section-month">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="cfr-donut-wrap">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Used', value: cashFlowStats.usedFromReserve || 0 },
                                                        { name: 'Remaining', value: Math.max(0, cashFlowStats.remaining) || (cashFlowStats.reserveAmount === 0 ? 1 : 0) },
                                                    ]}
                                                    cx="50%" cy="50%"
                                                    innerRadius={62} outerRadius={88}
                                                    paddingAngle={cashFlowStats.reserveAmount > 0 ? 3 : 0}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#2563EB" />
                                                    <Cell fill="var(--bg-hover)" />
                                                </Pie>
                                                <Tooltip content={<ExpensePieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="cfr-donut-center">
                                            <div className="cfr-donut-pct">{cashFlowStats.pctUsed}%</div>
                                            <div className="cfr-donut-sub">Used</div>
                                        </div>
                                    </div>
                                    <div className="cfr-donut-legend">
                                        <div className="cfr-legend-row cfr-legend-row--src">
                                            <span style={{fontSize:11,color:'var(--text-muted)'}}>
                                                {cashFlowStats.isManual
                                                    ? `Manual override · auto would be ${formatCurrency(cashFlowStats.autoReserve)}`
                                                    : `${cashFlowReserve.sourceMonth === 'previous' ? 'Last' : 'This'} month net profit · ${formatCurrency(cashFlowStats.srcNetProfit)}`}
                                            </span>
                                        </div>
                                        <div className="cfr-legend-row"><span className="cfr-legend-dot cfr-legend-dot--blue" />Used<span className="cfr-legend-val">{formatCurrency(cashFlowStats.usedFromReserve)}</span></div>
                                        <div className="cfr-legend-row"><span className="cfr-legend-dot cfr-legend-dot--muted" />Remaining<span className="cfr-legend-val">{formatCurrency(cashFlowStats.remaining)}</span></div>
                                        {cashFlowStats.overReserve > 0 && (
                                            <div className="cfr-legend-row cfr-legend-row--alert">
                                                <AlertCircle size={12} />
                                                Over cap: {formatCurrency(cashFlowStats.overReserve)}
                                            </div>
                                        )}
                                    </div>
                                    {cashFlowStats.overReserve > 0 && (
                                        <div className="cfr-alert-banner">
                                            <AlertCircle size={14} />
                                            Reserve cap exceeded. {formatCurrency(cashFlowStats.overReserve)} drawn from main operating funds.
                                        </div>
                                    )}
                                </div>

                                {/* Right: history table */}
                                <div className="cfr-history-card">
                                    <div className="cfr-history-card__header">
                                        <h3 className="cfr-section-title">6-Month Reserve History</h3>
                                    </div>
                                    <table className="cfr-hist-table">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Revenue</th>
                                                <th>Net Profit</th>
                                                <th>Reserve ({cashFlowReserve.sourceMonth === 'previous' ? 'prev month' : 'this month'})</th>
                                                <th>Expenses</th>
                                                <th>Used</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cashFlowHistory.map(row => (
                                                <tr key={row.key}>
                                                    <td className="cfr-hist-month">{row.label}</td>
                                                    <td>{formatCurrency(row.revenue)}</td>
                                                    <td className={row.netProfit > 0 ? 'cfr-hist-profit' : ''}>{formatCurrency(row.netProfit)}</td>
                                                    <td>
                                                        {editingMonthKey === row.key ? (
                                                            <div className="cfr-inline-edit">
                                                                <input
                                                                    type="number"
                                                                    className="cfr-inline-input"
                                                                    value={editingVal}
                                                                    min="0"
                                                                    autoFocus
                                                                    onChange={e => setEditingVal(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') saveMonthOverride(row.key, editingVal);
                                                                        if (e.key === 'Escape') setEditingMonthKey(null);
                                                                    }}
                                                                />
                                                                <button className="cfr-inline-save" onClick={() => saveMonthOverride(row.key, editingVal)}><Check size={12} /></button>
                                                                <button className="cfr-inline-cancel" onClick={() => setEditingMonthKey(null)}><X size={12} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="cfr-reserve-cell">
                                                                <span className={`cfr-hist-reserve ${row.isManual ? 'cfr-hist-reserve--manual' : ''}`}>
                                                                    {formatCurrency(row.reserve)}
                                                                    {row.isManual && <span className="cfr-manual-tag">manual</span>}
                                                                </span>
                                                                <div className="cfr-reserve-actions">
                                                                    <button className="cfr-edit-btn" title="Set custom amount" onClick={() => { setEditingMonthKey(row.key); setEditingVal(row.reserve); }}>
                                                                        <Pencil size={11} />
                                                                    </button>
                                                                    {row.isManual && (
                                                                        <button className="cfr-clear-btn" title="Reset to auto" onClick={() => clearMonthOverride(row.key)}>
                                                                            <X size={11} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{formatCurrency(row.expenses)}</td>
                                                    <td>{formatCurrency(row.used)}</td>
                                                    <td>
                                                        {row.over > 0
                                                            ? <span className="cfr-badge cfr-badge--red">Over cap</span>
                                                            : row.pct >= 80
                                                                ? <span className="cfr-badge cfr-badge--amber">High usage</span>
                                                                : row.reserve === 0
                                                                    ? <span className="cfr-badge cfr-badge--muted">No data</span>
                                                                    : <span className="cfr-badge cfr-badge--green">On track</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Settings info card */}
                            <div className="cfr-config-card">
                                <div className="cfr-config-card__left">
                                    <div className="cfr-config-card__icon"><Settings2 size={18} /></div>
                                    <div>
                                        <div className="cfr-config-card__title">Current Reserve Configuration</div>
                                        <div className="cfr-config-card__desc">
                                            {cashFlowReserve.percent}% of {cashFlowReserve.sourceMonth === 'previous' ? 'last' : 'this'} month's net profit · ~{formatCurrency(cashFlowStats.autoReserve)} auto this month
                                            {cashFlowStats.isManual && ` · overridden to ${formatCurrency(cashFlowStats.reserveAmount)}`}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" icon={Settings2} onClick={() => { setCfDraft(cashFlowReserve); setIsCashFlowModalOpen(true); }}>
                                    Edit Settings
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Cash Flow: Set Current Month Override Modal ── */}
            <Modal
                isOpen={editingMonthKey === cashFlowStats?.curKey && !isCashFlowModalOpen}
                onClose={() => setEditingMonthKey(null)}
                title={`Set Reserve for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setEditingMonthKey(null)}>Cancel</Button>
                        {monthlyOverrides[cashFlowStats?.curKey] !== undefined && (
                            <Button variant="ghost" onClick={() => { clearMonthOverride(cashFlowStats.curKey); setEditingMonthKey(null); }}>Reset to Auto ({formatCurrency(cashFlowStats.autoReserve)})</Button>
                        )}
                        <Button variant="primary" onClick={() => saveMonthOverride(cashFlowStats?.curKey, editingVal)}>Save</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Reserve Amount ({currency})</label>
                        <input
                            type="number"
                            className="dw-form-input"
                            min="0"
                            value={editingVal}
                            onChange={e => setEditingVal(e.target.value)}
                            placeholder="e.g. 20000"
                            autoFocus
                        />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                            Auto-calculated from last month's net profit: {formatCurrency(cashFlowStats?.autoReserve || 0)}. Setting a custom amount overrides only this month.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* ── Cash Flow Reserve Configure Modal ── */}
            <Modal
                isOpen={isCashFlowModalOpen}
                onClose={() => setIsCashFlowModalOpen(false)}
                title="Configure Monthly Cash Flow Reserve"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCashFlowModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={() => saveCashFlowReserve(cfDraft)}>Save Reserve Settings</Button>
                    </>
                }
            >
                <div className="dw-form">
                    <div className="dw-form-group">
                        <label className="dw-form-label">Enable Cash Flow Reserve</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                checked={cfDraft.enabled}
                                onChange={e => setCfDraft(p => ({ ...p, enabled: e.target.checked }))}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Hold a portion of monthly revenue as a reserve buffer
                            </span>
                        </div>
                    </div>

                    {cfDraft.enabled && (
                        <>
                            <div className="dw-form-group">
                                <label className="dw-form-label">Reserve Source</label>
                                <select
                                    className="dw-form-input"
                                    value={cfDraft.sourceMonth || 'previous'}
                                    onChange={e => setCfDraft(p => ({ ...p, sourceMonth: e.target.value }))}
                                >
                                    <option value="previous">Previous month's net profit</option>
                                    <option value="current">Current month's net profit</option>
                                </select>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                    {(cfDraft.sourceMonth || 'previous') === 'previous'
                                        ? 'Reserve budget is set from last month\'s net profit (revenue − expenses). Recommended for planning ahead.'
                                        : 'Reserve budget is calculated live from this month\'s net profit as it accrues.'}
                                </p>
                            </div>

                            <div className="dw-form-group">
                                <label className="dw-form-label">Default Reserve Percentage (%)</label>
                                <input
                                    type="number"
                                    className="dw-form-input"
                                    min="1" max="100"
                                    value={cfDraft.percent}
                                    onChange={e => setCfDraft(p => ({ ...p, percent: Math.min(100, Math.max(1, Number(e.target.value))) }))}
                                    placeholder="e.g. 20"
                                />
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                    {cfDraft.percent}% of {(cfDraft.sourceMonth || 'previous') === 'previous' ? 'last' : 'this'} month's net profit is reserved by default. You can override any specific month directly in the history table.
                                </p>
                            </div>

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border-default)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong><br />
                                The reserve is calculated from net profit (revenue − expenses), not gross revenue. This month's expenses draw from the reserve first. Once exhausted, remaining expenses come from your main operating funds — giving you a predictable monthly buffer.
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Finance;
