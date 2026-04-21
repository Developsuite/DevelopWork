import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    Receipt,
    FileText,
    Download,
    Upload,
    Calendar,
    Filter,
    Search,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    BarChart3,
    AlertCircle,
} from 'lucide-react';
import './Finance.css';

const Finance = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const stats = [
        {
            label: 'Total Revenue',
            value: '$2,847,392',
            change: '+12.5%',
            positive: true,
            icon: DollarSign,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'Total Expenses',
            value: '$1,234,567',
            change: '+8.2%',
            positive: false,
            icon: CreditCard,
            iconBg: 'var(--danger-light)',
            iconColor: 'var(--danger)',
        },
        {
            label: 'Net Profit',
            value: '$1,612,825',
            change: '+15.3%',
            positive: true,
            icon: TrendingUp,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'Cash Flow',
            value: '$892,450',
            change: '+5.7%',
            positive: true,
            icon: Wallet,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
    ];

    const transactions = [
        {
            id: 1,
            type: 'income',
            category: 'Sales',
            description: 'Product Sales - Q1',
            amount: 125000,
            date: '2026-03-25',
            status: 'completed',
            reference: 'INV-2024-001',
        },
        {
            id: 2,
            type: 'expense',
            category: 'Payroll',
            description: 'Employee Salaries - March',
            amount: 85000,
            date: '2026-03-24',
            status: 'completed',
            reference: 'PAY-2024-003',
        },
        {
            id: 3,
            type: 'income',
            category: 'Services',
            description: 'Consulting Services',
            amount: 45000,
            date: '2026-03-23',
            status: 'completed',
            reference: 'INV-2024-002',
        },
        {
            id: 4,
            type: 'expense',
            category: 'Operations',
            description: 'Office Rent - March',
            amount: 12000,
            date: '2026-03-22',
            status: 'completed',
            reference: 'EXP-2024-045',
        },
        {
            id: 5,
            type: 'expense',
            category: 'Marketing',
            description: 'Digital Advertising Campaign',
            amount: 8500,
            date: '2026-03-21',
            status: 'pending',
            reference: 'EXP-2024-046',
        },
        {
            id: 6,
            type: 'income',
            category: 'Sales',
            description: 'Enterprise License',
            amount: 95000,
            date: '2026-03-20',
            status: 'completed',
            reference: 'INV-2024-003',
        },
    ];

    const budgets = [
        { category: 'Payroll', allocated: 100000, spent: 85000, percentage: 85 },
        { category: 'Marketing', allocated: 50000, spent: 38500, percentage: 77 },
        { category: 'Operations', allocated: 30000, spent: 24000, percentage: 80 },
        { category: 'R&D', allocated: 75000, spent: 52000, percentage: 69 },
        { category: 'IT Infrastructure', allocated: 40000, spent: 31000, percentage: 78 },
    ];

    const upcomingPayments = [
        { id: 1, title: 'Vendor Payment - Tech Solutions', amount: 15000, dueDate: '2026-04-02', priority: 'high' },
        { id: 2, title: 'Insurance Premium', amount: 8500, dueDate: '2026-04-05', priority: 'medium' },
        { id: 3, title: 'Software Licenses', amount: 12000, dueDate: '2026-04-10', priority: 'medium' },
        { id: 4, title: 'Tax Payment', amount: 45000, dueDate: '2026-04-15', priority: 'high' },
    ];

    const categories = ['all', 'Sales', 'Services', 'Payroll', 'Operations', 'Marketing', 'R&D'];

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || txn.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="finance-dashboard">
            {/* Header */}
            <div className="finance-dashboard__header">
                <div>
                    <h1 className="finance-dashboard__title">Finance Dashboard</h1>
                    <p className="finance-dashboard__subtitle">Manage your company finances and budgets</p>
                </div>
                <div className="finance-dashboard__header-actions">
                    <Button variant="ghost" icon={Download}>
                        Export
                    </Button>
                    <Button variant="primary" icon={Receipt}>
                        New Transaction
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="finance-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="finance-dashboard__stat-card glass-card">
                        <div className="finance-dashboard__stat-header">
                            <div
                                className="finance-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`finance-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {stat.change}
                            </span>
                        </div>
                        <div className="finance-dashboard__stat-value">{stat.value}</div>
                        <div className="finance-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="finance-dashboard__content">
                {/* Main Content */}
                <div className="finance-dashboard__main">
                    {/* Transactions */}
                    <div className="finance-dashboard__section glass-card">
                        <div className="finance-dashboard__section-header">
                            <h2 className="finance-dashboard__section-title">Recent Transactions</h2>
                            <div className="finance-dashboard__filters">
                                <div className="finance-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="finance-dashboard__category-filter"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="finance-dashboard__transactions">
                            {filteredTransactions.map((transaction) => (
                                <div key={transaction.id} className="finance-dashboard__transaction">
                                    <div className="finance-dashboard__transaction-icon"
                                        style={{
                                            background: transaction.type === 'income' ? 'var(--success-light)' : 'var(--danger-light)',
                                            color: transaction.type === 'income' ? 'var(--success)' : 'var(--danger)',
                                        }}
                                    >
                                        {transaction.type === 'income' ? (
                                            <ArrowDownRight size={18} />
                                        ) : (
                                            <ArrowUpRight size={18} />
                                        )}
                                    </div>
                                    <div className="finance-dashboard__transaction-info">
                                        <div className="finance-dashboard__transaction-description">
                                            {transaction.description}
                                        </div>
                                        <div className="finance-dashboard__transaction-meta">
                                            <span>{transaction.reference}</span>
                                            <span>•</span>
                                            <span>{new Date(transaction.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}</span>
                                        </div>
                                    </div>
                                    <div className="finance-dashboard__transaction-details">
                                        <Badge variant="default">{transaction.category}</Badge>
                                        <div className={`finance-dashboard__transaction-amount ${transaction.type}`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                        <Badge
                                            variant="status"
                                            color={transaction.status === 'completed' ? 'var(--success)' : 'var(--warning)'}
                                        >
                                            {transaction.status}
                                        </Badge>
                                        <button className="finance-dashboard__transaction-menu">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Budget Overview */}
                    <div className="finance-dashboard__section glass-card">
                        <div className="finance-dashboard__section-header">
                            <h2 className="finance-dashboard__section-title">
                                <PieChart size={20} />
                                Budget Overview
                            </h2>
                            <Button variant="ghost" size="sm">
                                View Details
                            </Button>
                        </div>

                        <div className="finance-dashboard__budgets">
                            {budgets.map((budget) => (
                                <div key={budget.category} className="finance-dashboard__budget-item">
                                    <div className="finance-dashboard__budget-header">
                                        <span className="finance-dashboard__budget-category">{budget.category}</span>
                                        <span className="finance-dashboard__budget-amounts">
                                            {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                                        </span>
                                    </div>
                                    <div className="finance-dashboard__budget-bar">
                                        <div
                                            className="finance-dashboard__budget-progress"
                                            style={{
                                                width: `${budget.percentage}%`,
                                                background: budget.percentage > 90 ? 'var(--danger)' :
                                                    budget.percentage > 75 ? 'var(--warning)' : 'var(--success)',
                                            }}
                                        />
                                    </div>
                                    <div className="finance-dashboard__budget-percentage">
                                        {budget.percentage}% utilized
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="finance-dashboard__sidebar">
                    {/* Upcoming Payments */}
                    <div className="finance-dashboard__widget glass-card">
                        <h3 className="finance-dashboard__widget-title">
                            <AlertCircle size={16} />
                            Upcoming Payments
                        </h3>
                        <div className="finance-dashboard__payments">
                            {upcomingPayments.map((payment) => (
                                <div key={payment.id} className="finance-dashboard__payment">
                                    <div className="finance-dashboard__payment-info">
                                        <div className="finance-dashboard__payment-title">{payment.title}</div>
                                        <div className="finance-dashboard__payment-amount">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        <div className="finance-dashboard__payment-meta">
                                            <Calendar size={12} />
                                            Due: {new Date(payment.dueDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <Badge
                                        variant="status"
                                        color={payment.priority === 'high' ? 'var(--danger)' : 'var(--warning)'}
                                    >
                                        {payment.priority}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="finance-dashboard__widget glass-card">
                        <h3 className="finance-dashboard__widget-title">
                            <BarChart3 size={16} />
                            Quick Actions
                        </h3>
                        <div className="finance-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={FileText} fullWidth>
                                Generate Report
                            </Button>
                            <Button variant="ghost" size="sm" icon={Receipt} fullWidth>
                                Create Invoice
                            </Button>
                            <Button variant="ghost" size="sm" icon={Upload} fullWidth>
                                Import Data
                            </Button>
                            <Button variant="ghost" size="sm" icon={PieChart} fullWidth>
                                Budget Planning
                            </Button>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="finance-dashboard__widget glass-card">
                        <h3 className="finance-dashboard__widget-title">
                            <Wallet size={16} />
                            This Month
                        </h3>
                        <div className="finance-dashboard__summary">
                            <div className="finance-dashboard__summary-item">
                                <span className="finance-dashboard__summary-label">Income</span>
                                <span className="finance-dashboard__summary-value positive">
                                    +{formatCurrency(265000)}
                                </span>
                            </div>
                            <div className="finance-dashboard__summary-item">
                                <span className="finance-dashboard__summary-label">Expenses</span>
                                <span className="finance-dashboard__summary-value negative">
                                    -{formatCurrency(105500)}
                                </span>
                            </div>
                            <div className="finance-dashboard__summary-divider" />
                            <div className="finance-dashboard__summary-item">
                                <span className="finance-dashboard__summary-label">Net</span>
                                <span className="finance-dashboard__summary-value total">
                                    {formatCurrency(159500)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Finance;
