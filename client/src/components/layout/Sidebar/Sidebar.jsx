import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../../store/slices/uiSlice';
import { setCreateModalOpen } from '../../../store/slices/projectSlice';
import { signOutUser } from '../../../store/slices/authSlice';
import { DEPARTMENT_MODULES } from '../../../utils/constants';
import { docsService } from '../../../services/docsService';
import {
    PanelLeftClose,
    LayoutGrid,
    Users,
    DollarSign,
    FolderKanban,
    Handshake,
    Headphones,
    FileText,
    Briefcase,
    ChevronDown,
    ChevronRight,
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
    Plus,
    Star,
    PenTool,
    Receipt,
    PieChart,
    LogOut,
    Folder,
} from 'lucide-react';
import Avatar from '../../common/Avatar/Avatar';
import './Sidebar.css';

const moduleIconMap = {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    Briefcase,
    FileText,
};

const moduleSubPages = {
    projects: [
        { label: 'Overview', path: '/projects?tab=overview', icon: BarChart3, id: 'proj-overview' },
        { label: 'All Projects', path: '/projects?tab=projects', icon: FolderKanban, id: 'proj-all' },
        { label: 'Tasks Directory', path: '/projects?tab=tasks', icon: ClipboardList, id: 'proj-tasks' },
        { label: 'Sprint Dashboard', path: '/board/board-1', icon: LayoutGrid, id: 'proj-sprint' },
    ],
    hr: [
        { label: 'Directory', path: '/hr?tab=directory', icon: Users },
        { label: 'Org Chart', path: '/hr?tab=org', icon: BarChart3 },

        { label: 'Payroll', path: '/hr?tab=payroll', icon: DollarSign },
        { label: 'Performance', path: '/hr?tab=performance', icon: Star },
    ],
    finance: [
        { label: 'Dashboard', path: '/finance?tab=dashboard', icon: BarChart3, id: 'fin-dashboard' },
        { label: 'Transactions', path: '/finance?tab=transactions', icon: Receipt, id: 'fin-transactions' },
        { label: 'Invoices', path: '/finance?tab=invoices', icon: FileText, id: 'fin-invoices' },
        { label: 'Expense Requests', path: '/finance?tab=expenses', icon: CreditCard, id: 'fin-expenses' },
    ],
    leads: [
        { label: 'Pipeline', path: '/leads?tab=pipeline', icon: BarChart3, id: 'leads-pipeline' },
        { label: 'All Leads', path: '/leads?tab=all', icon: Handshake, id: 'leads-all' },
        { label: 'Contacts', path: '/leads?tab=contacts', icon: Phone, id: 'leads-contacts' },
    ],
    clients: [
        { label: 'Client List', path: '/clients?tab=all', icon: Users, id: 'client-all' },
        { label: 'Active Projects', path: '/clients?tab=projects', icon: FolderKanban, id: 'client-projects' },
        { label: 'Billing Status', path: '/clients?tab=billing', icon: DollarSign, id: 'client-billing' },
    ],
    docs: [
        { 
            label: 'All Documents', 
            path: '/docs', 
            icon: FileText, 
            id: 'docs-all',
            expandable: true,
            children: []
        },
        { label: 'Templates', path: '/docs?tab=templates', icon: Layout, id: 'docs-templates' },
    ],
};

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
    const activeModules = useSelector((state) => state.access.activeModules);
    const { user } = useSelector((state) => state.auth);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [expandedItems, setExpandedItems] = useState(['docs-all']);
    const [dynamicSubPages, setDynamicSubPages] = useState(moduleSubPages);
    const dropdownRef = useRef(null);

    // Fetch dynamic content for specific modules
    useEffect(() => {
        if (selectedModule === 'docs') {
            const fetchDocFolders = async () => {
                try {
                    const [folderData, docData] = await Promise.all([
                        docsService.getFolders(),
                        docsService.getDocuments()
                    ]);
                    
                    const defaultFolders = ['Strategy', 'Technical', 'Design', 'HR', 'General'];
                    let dbFolders = [];
                    if (folderData && folderData.length > 0) {
                        dbFolders = folderData.map(f => f.name);
                    }
                    const allFolders = [...new Set([...defaultFolders, ...dbFolders])];
                    
                    const folderItems = allFolders.map((fName, index) => {
                        const docsInFolder = docData ? docData.filter(d => d.category === fName) : [];
                        
                        return {
                            label: fName,
                            path: `/docs?folder=${fName}`,
                            icon: Folder,
                            isFolder: true,
                            id: `docs-folder-${index}`,
                            children: docsInFolder.map(doc => ({
                                label: doc.title,
                                path: `/docs?doc=${doc.id}&folder=${fName}`,
                                icon: FileText,
                                id: `doc-${doc.id}`
                            }))
                        };
                    });

                    // Nest folders inside 'All Documents' as children
                    setDynamicSubPages(prev => ({
                        ...prev,
                        docs: [
                            {
                                ...moduleSubPages.docs[0],
                                children: folderItems
                            },
                            moduleSubPages.docs[1], // Templates
                        ]
                    }));
                } catch (err) {
                    console.error('Error fetching doc folders for sidebar:', err);
                }
            };
            fetchDocFolders();
            
            window.addEventListener('docsChanged', fetchDocFolders);
            return () => {
                window.removeEventListener('docsChanged', fetchDocFolders);
            };
        } else {
            setDynamicSubPages(moduleSubPages);
        }
    }, [selectedModule]);

    const visibleModules = DEPARTMENT_MODULES.filter((mod) =>
        activeModules.includes(mod.key) || (mod.key === 'clients' && activeModules.includes('support'))
    );

    // Auto-detect selected module from current route
    useEffect(() => {
        const path = location.pathname;
        const matched = DEPARTMENT_MODULES.find(
            (mod) =>
                (activeModules.includes(mod.key) || (mod.key === 'clients' && activeModules.includes('support'))) &&
                (path === mod.route ||
                    path.startsWith('/board/') && mod.key === 'projects' ||
                    (moduleSubPages[mod.key] || []).some((sub) => path === sub.path))
        );
        if (matched) {
            setSelectedModule(matched.key);
        } else {
            setSelectedModule(null);
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

    const toggleItem = (id, e) => {
        if (e) e.stopPropagation();
        setExpandedItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to log out?')) return;
        try {
            await dispatch(signOutUser()).unwrap();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const selectedModuleInfo = DEPARTMENT_MODULES.find((m) => m.key === selectedModule);
    const SelectedIcon = selectedModuleInfo ? (moduleIconMap[selectedModuleInfo.icon] || FileText) : null;
    const subPages = selectedModule ? (dynamicSubPages[selectedModule] || []) : [];

    const renderSubPageItem = (item, level = 0) => {
        const SubIcon = item.icon;
        const isExpanded = expandedItems.includes(item.id || item.label);
        const hasChildren = item.children && item.children.length > 0;
        
        // Improved active check
        let isActive = item.path ? location.pathname === item.path : false;
        
        // Check for exact path match first (with query if present in item.path)
        if (item.path && item.path.includes('?')) {
            const [path, query] = item.path.split('?');
            isActive = location.pathname === path && location.search.includes(query);
        }

        // Special cases for items that might be active on base path or specific params
        if (item.id) {
            // Docs
            if (item.id === 'docs-editor') isActive = location.search.includes('tab=editor');
            if (item.id === 'docs-templates') isActive = location.search.includes('tab=templates');
            if (item.id === 'docs-all') isActive = location.pathname === '/docs' && !location.search;
            
            // Finance Dashboard (default tab)
            if (item.id === 'fin-dashboard') isActive = location.pathname === '/finance' && (location.search.includes('tab=dashboard') || !location.search);
            
            // Leads/Clients defaults
            if (item.id === 'leads-pipeline' && location.pathname === '/leads' && !location.search) isActive = true;
            if (item.id === 'client-all' && location.pathname === '/clients' && !location.search) isActive = true;
            if (item.id === 'proj-all' && location.pathname === '/projects' && (location.search.includes('tab=projects') || !location.search)) isActive = true;
            if (item.id === 'proj-overview' && location.pathname === '/projects' && location.search.includes('tab=overview')) isActive = true;
            if (item.id === 'proj-tasks' && location.pathname === '/projects' && location.search.includes('tab=tasks')) isActive = true;
            if (item.id === 'proj-sprint' && location.pathname.startsWith('/board/')) isActive = true;
        }

        if (item.isFolder) {
            return (
                <div key={item.label} className="sidebar__tree-folder">
                    <button 
                        className={`sidebar__tree-folder-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                            toggleItem(item.id || item.label);
                            if (item.path) {
                                navigate(item.path);
                            }
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            {SubIcon && <SubIcon size={13} />}
                            <span>{item.label}</span>
                        </span>
                        {hasChildren && (isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
                        {!hasChildren && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>0</span>}
                    </button>
                    {isExpanded && hasChildren && (
                        <div className="sidebar__tree-children" style={{ paddingLeft: '12px', borderLeft: '1.5px solid rgba(0,0,0,0.08)', marginLeft: '8px' }}>
                            {item.children.map(child => renderSubPageItem(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={item.id || item.label} className={level > 1 ? "sidebar__tree-items" : "sidebar__subpage-wrapper"}>
                <button
                    className={`${level > 1 ? 'sidebar__tree-item' : 'sidebar__subpage-item'} ${isActive ? 'active' : ''} ${item.expandable ? 'expandable' : ''}`}
                    onClick={() => {
                        navigate(item.path);
                        if (item.expandable) toggleItem(item.id || item.label);
                    }}
                    style={level > 1 ? {} : { paddingLeft: level > 0 ? `${level * 16 + 18}px` : '18px' }}
                >
                    {SubIcon && <SubIcon size={14} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.expandable && (
                        isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    )}
                </button>
                {item.expandable && isExpanded && hasChildren && (
                    <div className="sidebar__tree">
                        {item.children.map(child => renderSubPageItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                {/* Header */}
                <div className="sidebar__header">
                    <button className="workspace-switcher" onClick={() => navigate('/modules')}>
                        <div className="workspace-switcher__icon">
                            <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                            {subPages.map((sub) => renderSubPageItem(sub))}
                        </div>
                    </div>
                )}

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Footer */}
                <div className="sidebar__footer">
                    <button
                        className="sidebar__nav-item"
                        onClick={() => navigate('/settings')}
                    >
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                    <button
                        className="sidebar__nav-item sidebar__nav-item--logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>

                    <div 
                        className="sidebar__user" 
                        onClick={() => navigate('/settings')}
                        style={{ 
                            marginTop: '12px',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                        }}
                        title="View Profile Settings"
                    >
                        <Avatar name={user?.name || 'Admin'} size="sm" />
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>Workspace Admin</div>
                        </div>
                    </div>
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
