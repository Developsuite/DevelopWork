import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../../store/slices/uiSlice';
import { DEPARTMENT_MODULES } from '../../../utils/constants';
import {
    PanelLeftClose,
    LayoutGrid,
    Users,
    DollarSign,
    FolderKanban,
    Handshake,
    Headphones,
    FileText,
    ChevronDown,
    Building2,
    Search,
    Settings,
    BarChart3,
    Calendar,
    Target,
    ClipboardList,
    UserCheck,
    CreditCard,
    FileBarChart,
    Phone,
    MessageCircle,
    BookOpen,
    Upload,
    Layout,
} from 'lucide-react';
import './Sidebar.css';

const moduleIconMap = {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
};

const moduleSubPages = {
    projects: [
        { label: 'Sprint Dashboard', path: '/board/board-1', icon: BarChart3 },
        { label: 'All Tasks', path: '/projects', icon: ClipboardList },
        { label: 'Timeline', path: '/projects', icon: Calendar },
        { label: 'Milestones', path: '/projects', icon: Target },
    ],
    hr: [
        { label: 'Overview', path: '/hr', icon: BarChart3 },
        { label: 'Employees', path: '/hr', icon: Users },
        { label: 'Recruitment', path: '/hr', icon: UserCheck },
        { label: 'Attendance', path: '/hr', icon: Calendar },
    ],
    finance: [
        { label: 'Overview', path: '/finance', icon: BarChart3 },
        { label: 'Invoices', path: '/finance', icon: CreditCard },
        { label: 'Reports', path: '/finance', icon: FileBarChart },
        { label: 'Budgets', path: '/finance', icon: DollarSign },
    ],
    leads: [
        { label: 'Pipeline', path: '/leads', icon: BarChart3 },
        { label: 'All Leads', path: '/leads', icon: Handshake },
        { label: 'Contacts', path: '/leads', icon: Phone },
    ],
    support: [
        { label: 'Tickets', path: '/support', icon: MessageCircle },
        { label: 'All Tickets', path: '/support', icon: Headphones },
        { label: 'Knowledge Base', path: '/support', icon: BookOpen },
    ],
    docs: [
        { label: 'All Documents', path: '/docs', icon: FileText },
        { label: 'Templates', path: '/docs', icon: Layout },
        { label: 'Uploads', path: '/docs', icon: Upload },
    ],
};

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
    const activeModules = useSelector((state) => state.access.activeModules);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const dropdownRef = useRef(null);

    const visibleModules = DEPARTMENT_MODULES.filter((mod) =>
        activeModules.includes(mod.key)
    );

    // Auto-detect selected module from current route
    useEffect(() => {
        const path = location.pathname;
        const matched = DEPARTMENT_MODULES.find(
            (mod) =>
                activeModules.includes(mod.key) &&
                (path === mod.route ||
                    path.startsWith('/board/') && mod.key === 'projects' ||
                    (moduleSubPages[mod.key] || []).some((sub) => path === sub.path))
        );
        if (matched) {
            setSelectedModule(matched.key);
        }
    }, [location.pathname, activeModules]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelectModule = (mod) => {
        setSelectedModule(mod.key);
        setDropdownOpen(false);
        navigate(mod.route);
    };

    const selectedModuleInfo = DEPARTMENT_MODULES.find((m) => m.key === selectedModule);
    const SelectedIcon = selectedModuleInfo ? (moduleIconMap[selectedModuleInfo.icon] || FileText) : null;
    const subPages = selectedModule ? (moduleSubPages[selectedModule] || []) : [];

    return (
        <>
            <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                {/* Header */}
                <div className="sidebar__header">
                    <button className="workspace-switcher" onClick={() => navigate('/modules')}>
                        <div className="workspace-switcher__icon">
                            <Building2 size={15} />
                        </div>
                        <div className="workspace-switcher__info">
                            <div className="workspace-switcher__name">DevelopWork</div>
                        </div>
                        <ChevronDown size={14} className="workspace-switcher__chevron" />
                    </button>
                    <button
                        className="sidebar__toggle"
                        onClick={() => dispatch(toggleSidebar())}
                        title="Toggle sidebar"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="sidebar__search">
                    <Search size={14} className="sidebar__search-icon" />
                    <input
                        type="text"
                        className="sidebar__search-input"
                        placeholder="Search..."
                    />
                </div>

                {/* Module Hub — single dropdown button */}
                <div className="sidebar__module-hub" ref={dropdownRef}>
                    <button
                        className={`sidebar__hub-btn ${dropdownOpen ? 'open' : ''}`}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <LayoutGrid size={16} />
                        <span>Module Hub</span>
                        <ChevronDown
                            size={14}
                            className={`sidebar__hub-chevron ${dropdownOpen ? 'open' : ''}`}
                        />
                    </button>

                    {/* Dropdown — all active modules */}
                    {dropdownOpen && (
                        <div className="sidebar__hub-dropdown">
                            {visibleModules.map((mod) => {
                                const Icon = moduleIconMap[mod.icon] || FileText;
                                const isSelected = selectedModule === mod.key;
                                return (
                                    <button
                                        key={mod.key}
                                        className={`sidebar__hub-option ${isSelected ? 'active' : ''}`}
                                        onClick={() => handleSelectModule(mod)}
                                    >
                                        <span
                                            className="sidebar__hub-dot"
                                            style={{ background: mod.color }}
                                        />
                                        <Icon size={15} />
                                        <span>{mod.label}</span>
                                    </button>
                                );
                            })}
                            <div className="sidebar__hub-divider" />
                            <button
                                className="sidebar__hub-option sidebar__hub-option--manage"
                                onClick={() => { setDropdownOpen(false); navigate('/modules'); }}
                            >
                                <Settings size={15} />
                                <span>Manage Modules</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Selected module label + sub-pages */}
                {selectedModuleInfo && (
                    <div className="sidebar__active-module">
                        <div className="sidebar__active-label">
                            <span
                                className="sidebar__active-dot"
                                style={{ background: selectedModuleInfo.color }}
                            />
                            {SelectedIcon && <SelectedIcon size={15} />}
                            <span>{selectedModuleInfo.label}</span>
                        </div>
                        <div className="sidebar__subpages">
                            {subPages.map((sub) => {
                                const SubIcon = sub.icon;
                                const isActive = location.pathname === sub.path;
                                return (
                                    <button
                                        key={sub.label}
                                        className={`sidebar__subpage-item ${isActive ? 'active' : ''}`}
                                        onClick={() => navigate(sub.path)}
                                    >
                                        <SubIcon size={14} />
                                        <span>{sub.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Footer */}
                <div className="sidebar__footer">
                    <button
                        className="sidebar__nav-item"
                        onClick={() => navigate('/modules')}
                    >
                        <Settings size={16} />
                        <span>Manage Modules</span>
                    </button>
                </div>
            </aside>

            <div
                className="sidebar-overlay"
                onClick={() => dispatch(toggleSidebar())}
            />
        </>
    );
};

export default Sidebar;
