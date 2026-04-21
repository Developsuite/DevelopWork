import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import {
    Users,
    UserPlus,
    Calendar,
    Clock,
    TrendingUp,
    Award,
    Briefcase,
    DollarSign,
    FileText,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';
import './HR.css';

const HR = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const stats = [
        {
            label: 'Total Employees',
            value: 248,
            change: '+12',
            positive: true,
            icon: Users,
            iconBg: 'var(--primary-50)',
            iconColor: 'var(--primary-500)',
        },
        {
            label: 'New Hires',
            value: 8,
            change: '+3',
            positive: true,
            icon: UserPlus,
            iconBg: 'var(--success-light)',
            iconColor: 'var(--success)',
        },
        {
            label: 'On Leave',
            value: 15,
            change: '+2',
            positive: false,
            icon: Calendar,
            iconBg: 'var(--warning-light)',
            iconColor: 'var(--warning)',
        },
        {
            label: 'Open Positions',
            value: 6,
            change: '-1',
            positive: true,
            icon: Briefcase,
            iconBg: 'var(--info-light)',
            iconColor: 'var(--info)',
        },
    ];

    const employees = [
        {
            id: 1,
            name: 'Sarah Johnson',
            role: 'Senior Developer',
            department: 'Engineering',
            email: 'sarah.j@company.com',
            phone: '+1 234 567 8900',
            location: 'New York, USA',
            status: 'Active',
            avatar: 'SJ',
            joinDate: '2022-03-15',
        },
        {
            id: 2,
            name: 'Michael Chen',
            role: 'Product Manager',
            department: 'Product',
            email: 'michael.c@company.com',
            phone: '+1 234 567 8901',
            location: 'San Francisco, USA',
            status: 'Active',
            avatar: 'MC',
            joinDate: '2021-08-20',
        },
        {
            id: 3,
            name: 'Emily Rodriguez',
            role: 'UX Designer',
            department: 'Design',
            email: 'emily.r@company.com',
            phone: '+1 234 567 8902',
            location: 'Austin, USA',
            status: 'On Leave',
            avatar: 'ER',
            joinDate: '2023-01-10',
        },
        {
            id: 4,
            name: 'David Kim',
            role: 'Marketing Lead',
            department: 'Marketing',
            email: 'david.k@company.com',
            phone: '+1 234 567 8903',
            location: 'Seattle, USA',
            status: 'Active',
            avatar: 'DK',
            joinDate: '2020-11-05',
        },
        {
            id: 5,
            name: 'Lisa Anderson',
            role: 'HR Manager',
            department: 'HR',
            email: 'lisa.a@company.com',
            phone: '+1 234 567 8904',
            location: 'Boston, USA',
            status: 'Active',
            avatar: 'LA',
            joinDate: '2019-06-12',
        },
        {
            id: 6,
            name: 'James Wilson',
            role: 'Sales Director',
            department: 'Sales',
            email: 'james.w@company.com',
            phone: '+1 234 567 8905',
            location: 'Chicago, USA',
            status: 'Active',
            avatar: 'JW',
            joinDate: '2021-02-28',
        },
    ];

    const departments = ['all', 'Engineering', 'Product', 'Design', 'Marketing', 'HR', 'Sales'];

    const upcomingEvents = [
        { id: 1, title: 'Team Building Event', date: '2026-04-05', type: 'Event' },
        { id: 2, title: 'Performance Reviews', date: '2026-04-10', type: 'Review' },
        { id: 3, title: 'New Hire Orientation', date: '2026-04-15', type: 'Training' },
    ];

    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="hr-dashboard">
            {/* Header */}
            <div className="hr-dashboard__header">
                <div>
                    <h1 className="hr-dashboard__title">HR Dashboard</h1>
                    <p className="hr-dashboard__subtitle">Manage your team and workforce</p>
                </div>
                <Button variant="primary" icon={UserPlus}>
                    Add Employee
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="hr-dashboard__stats">
                {stats.map((stat) => (
                    <div key={stat.label} className="hr-dashboard__stat-card glass-card">
                        <div className="hr-dashboard__stat-header">
                            <div
                                className="hr-dashboard__stat-icon"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                <stat.icon size={20} />
                            </div>
                            <span className={`hr-dashboard__stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="hr-dashboard__stat-value">{stat.value}</div>
                        <div className="hr-dashboard__stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="hr-dashboard__content">
                {/* Employee List */}
                <div className="hr-dashboard__main">
                    <div className="hr-dashboard__section glass-card">
                        <div className="hr-dashboard__section-header">
                            <h2 className="hr-dashboard__section-title">Employee Directory</h2>
                            <div className="hr-dashboard__filters">
                                <div className="hr-dashboard__search">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="hr-dashboard__department-filter"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                >
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept === 'all' ? 'All Departments' : dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="hr-dashboard__employee-list">
                            {filteredEmployees.map((employee) => (
                                <div key={employee.id} className="hr-dashboard__employee-card">
                                    <div className="hr-dashboard__employee-main">
                                        <Avatar name={employee.avatar} size="md" />
                                        <div className="hr-dashboard__employee-info">
                                            <div className="hr-dashboard__employee-name">{employee.name}</div>
                                            <div className="hr-dashboard__employee-role">{employee.role}</div>
                                            <div className="hr-dashboard__employee-meta">
                                                <span>
                                                    <Mail size={12} />
                                                    {employee.email}
                                                </span>
                                                <span>
                                                    <Phone size={12} />
                                                    {employee.phone}
                                                </span>
                                                <span>
                                                    <MapPin size={12} />
                                                    {employee.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hr-dashboard__employee-details">
                                        <Badge variant="default">{employee.department}</Badge>
                                        <Badge
                                            variant="status"
                                            color={employee.status === 'Active' ? 'var(--success)' : 'var(--warning)'}
                                        >
                                            {employee.status}
                                        </Badge>
                                        <button className="hr-dashboard__employee-menu">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="hr-dashboard__sidebar">
                    {/* Upcoming Events */}
                    <div className="hr-dashboard__widget glass-card">
                        <h3 className="hr-dashboard__widget-title">
                            <Calendar size={16} />
                            Upcoming Events
                        </h3>
                        <div className="hr-dashboard__events">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="hr-dashboard__event">
                                    <div className="hr-dashboard__event-date">
                                        {new Date(event.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="hr-dashboard__event-info">
                                        <div className="hr-dashboard__event-title">{event.title}</div>
                                        <Badge variant="default">{event.type}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="hr-dashboard__widget glass-card">
                        <h3 className="hr-dashboard__widget-title">
                            <Award size={16} />
                            Quick Actions
                        </h3>
                        <div className="hr-dashboard__actions">
                            <Button variant="ghost" size="sm" icon={FileText} fullWidth>
                                Generate Report
                            </Button>
                            <Button variant="ghost" size="sm" icon={DollarSign} fullWidth>
                                Process Payroll
                            </Button>
                            <Button variant="ghost" size="sm" icon={Calendar} fullWidth>
                                Leave Requests
                            </Button>
                            <Button variant="ghost" size="sm" icon={TrendingUp} fullWidth>
                                Performance Review
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HR;
