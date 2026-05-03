import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    toggleModule,
    addAccess,
    removeAccess,
    addInvite,
    removeInvite,
    addManager,
    closeCredentialsModal,
    setAccessManagerOpen,
    setInviteModalOpen,
    setSelectedModuleForAccess,
} from '../../store/slices/accessSlice';
import { DEPARTMENT_MODULES } from '../../utils/constants';
import { mockMembers } from '../../utils/mockData';
import Button from '../../components/common/Button/Button';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
    Shield,
    Settings,
    ArrowRight,
    Check,
    X,
    Mail,
    UserPlus,
    Search,
    ToggleLeft,
    ToggleRight,
    Crown,
    Clock,
    Trash2,
    Send,
    ChevronDown,
    LayoutGrid,
    Zap,
    Copy,
    CheckCircle2,
    Key,
} from 'lucide-react';
import './ModuleHub.css';

const iconMap = {
    FolderKanban,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
};

const ModuleHub = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {
        activeModules,
        accessList,
        pendingInvites,
        accessManagerOpen,
        inviteModalOpen,
        selectedModuleForAccess,
        credentialsModal,
    } = useSelector((state) => state.access);

    const [copied, setCopied] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteModule, setInviteModule] = useState('');
    const [selectedManager, setSelectedManager] = useState('');
    const [showManagerDropdown, setShowManagerDropdown] = useState(false);

    const filteredModules = DEPARTMENT_MODULES.filter(
        (mod) =>
            mod.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mod.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getModuleAccess = (moduleKey) => {
        return accessList.filter((a) => a.moduleKey === moduleKey);
    };

    const getModuleInvites = (moduleKey) => {
        return pendingInvites.filter((i) => i.moduleKey === moduleKey);
    };

    const handleModuleClick = (mod) => {
        if (activeModules.includes(mod.key)) {
            navigate(mod.route);
        }
    };

    const handleToggleModule = (e, moduleKey) => {
        e.stopPropagation();
        dispatch(toggleModule(moduleKey));
    };

    const handleOpenAccessManager = (e, moduleKey) => {
        e.stopPropagation();
        dispatch(setSelectedModuleForAccess(moduleKey));
        dispatch(setAccessManagerOpen(true));
    };

    const handleAssignManager = () => {
        if (!selectedManager || !selectedModuleForAccess) return;
        const member = mockMembers.find((m) => m._id === selectedManager);
        if (!member) return;

        // Check if already assigned
        const existing = accessList.find(
            (a) => a.userId === member._id && a.moduleKey === selectedModuleForAccess
        );
        if (existing) return;

        // Add access entry
        dispatch(
            addAccess({
                moduleKey: selectedModuleForAccess,
                userId: member._id,
                userName: member.name,
                userEmail: member.email,
                role: 'manager',
            })
        );

        // Create manager profile with credentials
        dispatch(
            addManager({
                userId: member._id,
                name: member.name,
                email: member.email,
                moduleKey: selectedModuleForAccess,
            })
        );

        setSelectedManager('');
        setShowManagerDropdown(false);
    };

    const handleCopyCredentials = () => {
        if (!credentialsModal.manager) return;
        const text = `Module: ${DEPARTMENT_MODULES.find(m => m.key === credentialsModal.manager.assignedModule)?.label}\nEmail: ${credentialsModal.manager.email}\nPassword: ${credentialsModal.manager.password}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvite = () => {
        if (!inviteEmail || !inviteModule) return;
        dispatch(
            addInvite({
                moduleKey: inviteModule,
                email: inviteEmail,
            })
        );
        setInviteEmail('');
        setInviteModule('');
        dispatch(setInviteModalOpen(false));
    };

    const selectedModuleInfo = DEPARTMENT_MODULES.find(
        (m) => m.key === selectedModuleForAccess
    );

    return (
        <div className="module-hub">
            {/* Hero Header */}
            <div className="module-hub__hero">
                <div className="module-hub__hero-content">
                    <div className="module-hub__hero-badge glass-badge">
                        <Zap size={14} />
                        Command Center
                    </div>
                    <h1 className="module-hub__title">
                        Your <span>Modules</span>
                    </h1>
                    <p className="module-hub__subtitle">
                        Activate departments, assign managers, and control access to your
                        workspace modules.
                    </p>
                </div>
                <div className="module-hub__hero-actions">
                    <div className="module-hub__search glass-input-wrap">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="primary"
                        icon={UserPlus}
                        onClick={() => dispatch(setInviteModalOpen(true))}
                    >
                        Invite Manager
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="module-hub__stats-bar">
                <div className="module-hub__stat-item glass-card">
                    <LayoutGrid size={18} />
                    <div>
                        <div className="module-hub__stat-value">{activeModules.length}</div>
                        <div className="module-hub__stat-label">Active Modules</div>
                    </div>
                </div>
                <div className="module-hub__stat-item glass-card">
                    <Users size={18} />
                    <div>
                        <div className="module-hub__stat-value">{accessList.length}</div>
                        <div className="module-hub__stat-label">Assigned Managers</div>
                    </div>
                </div>
                <div className="module-hub__stat-item glass-card">
                    <Mail size={18} />
                    <div>
                        <div className="module-hub__stat-value">{pendingInvites.length}</div>
                        <div className="module-hub__stat-label">Pending Invites</div>
                    </div>
                </div>
                <div className="module-hub__stat-item glass-card">
                    <Shield size={18} />
                    <div>
                        <div className="module-hub__stat-value">RBAC</div>
                        <div className="module-hub__stat-label">Access Control</div>
                    </div>
                </div>
            </div>

            {/* Module Cards Grid */}
            <div className="module-hub__grid">
                {filteredModules.map((mod, index) => {
                    const Icon = iconMap[mod.icon] || FileText;
                    const isActive = activeModules.includes(mod.key);
                    const moduleAccess = getModuleAccess(mod.key);
                    const moduleInvites = getModuleInvites(mod.key);

                    return (
                        <div
                            key={mod.key}
                            className={`module-hub__card glass-card ${isActive ? 'active' : 'inactive'}`}
                            onClick={() => handleModuleClick(mod)}
                            style={{
                                '--module-color': mod.color,
                                '--module-gradient': mod.gradient,
                                animationDelay: `${index * 0.08}s`,
                            }}
                        >
                            {/* Card Header */}
                            <div className="module-hub__card-header">
                                <div
                                    className="module-hub__card-icon"
                                    style={{ background: mod.gradient }}
                                >
                                    <Icon size={24} color="#fff" />
                                </div>
                                <div className="module-hub__card-actions">
                                    <button
                                        className="module-hub__access-btn"
                                        onClick={(e) => handleOpenAccessManager(e, mod.key)}
                                        title="Manage Access"
                                    >
                                        <Shield size={16} />
                                    </button>
                                    <button
                                        className={`module-hub__toggle ${isActive ? 'on' : 'off'}`}
                                        onClick={(e) => handleToggleModule(e, mod.key)}
                                        title={isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {isActive ? (
                                            <ToggleRight size={24} />
                                        ) : (
                                            <ToggleLeft size={24} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="module-hub__card-body">
                                <h3 className="module-hub__card-title">{mod.label}</h3>
                                <p className="module-hub__card-desc">{mod.description}</p>
                            </div>

                            {/* Card Footer */}
                            <div className="module-hub__card-footer">
                                <div className="module-hub__card-managers">
                                    {moduleAccess.length > 0 ? (
                                        <>
                                            <div className="module-hub__avatar-stack">
                                                {moduleAccess.slice(0, 3).map((access) => (
                                                    <Avatar
                                                        key={access.id}
                                                        name={access.userName}
                                                        size="xs"
                                                    />
                                                ))}
                                                {moduleAccess.length > 3 && (
                                                    <span className="module-hub__avatar-more">
                                                        +{moduleAccess.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="module-hub__manager-count">
                                                {moduleAccess.length} manager{moduleAccess.length !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="module-hub__no-manager">No managers assigned</span>
                                    )}
                                    {moduleInvites.length > 0 && (
                                        <Badge variant="status" color="var(--warning)">
                                            {moduleInvites.length} pending
                                        </Badge>
                                    )}
                                </div>
                                {isActive && (
                                    <button className="module-hub__open-btn">
                                        Open <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Inactive overlay */}
                            {!isActive && (
                                <div className="module-hub__inactive-overlay">
                                    <span>Module Disabled</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Access Manager Modal */}
            {accessManagerOpen && selectedModuleInfo && (
                <div
                    className="module-hub__overlay glass-overlay"
                    onClick={() => dispatch(setAccessManagerOpen(false))}
                >
                    <div
                        className="module-hub__access-modal glass-elevated"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="module-hub__modal-header">
                            <div className="module-hub__modal-title-group">
                                <div
                                    className="module-hub__modal-icon"
                                    style={{ background: selectedModuleInfo.gradient }}
                                >
                                    {(() => {
                                        const ModIcon = iconMap[selectedModuleInfo.icon] || FileText;
                                        return <ModIcon size={20} color="#fff" />;
                                    })()}
                                </div>
                                <div>
                                    <h2 className="module-hub__modal-title">
                                        Access Manager
                                    </h2>
                                    <p className="module-hub__modal-subtitle">
                                        {selectedModuleInfo.label}
                                    </p>
                                </div>
                            </div>
                            <button
                                className="module-hub__modal-close"
                                onClick={() => dispatch(setAccessManagerOpen(false))}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Assign Manager */}
                        <div className="module-hub__assign-section">
                            <h3 className="module-hub__assign-title">
                                <UserPlus size={16} />
                                Assign a Manager
                            </h3>
                            <div className="module-hub__assign-row">
                                <div className="module-hub__select-wrap">
                                    <button
                                        className="module-hub__select-btn"
                                        onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                                    >
                                        {selectedManager
                                            ? mockMembers.find((m) => m._id === selectedManager)?.name
                                            : 'Select a team member'}
                                        <ChevronDown size={14} />
                                    </button>
                                    {showManagerDropdown && (
                                        <div className="module-hub__select-dropdown glass-dropdown">
                                            {mockMembers
                                                .filter(
                                                    (m) =>
                                                        !accessList.find(
                                                            (a) =>
                                                                a.userId === m._id &&
                                                                a.moduleKey === selectedModuleForAccess
                                                        )
                                                )
                                                .map((member) => (
                                                    <button
                                                        key={member._id}
                                                        className="module-hub__select-option"
                                                        onClick={() => {
                                                            setSelectedManager(member._id);
                                                            setShowManagerDropdown(false);
                                                        }}
                                                    >
                                                        <Avatar name={member.name} size="xs" />
                                                        <div>
                                                            <div className="module-hub__option-name">
                                                                {member.name}
                                                            </div>
                                                            <div className="module-hub__option-email">
                                                                {member.email}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                <Button variant="primary" icon={UserPlus} onClick={handleAssignManager}>
                                    Assign
                                </Button>
                            </div>
                        </div>

                        {/* Current Access List */}
                        <div className="module-hub__access-list-section">
                            <h3 className="module-hub__assign-title">
                                <Crown size={16} />
                                Assigned Managers
                            </h3>
                            <div className="module-hub__access-list">
                                {getModuleAccess(selectedModuleForAccess).length === 0 ? (
                                    <div className="module-hub__empty-state">
                                        <Users size={24} />
                                        <p>No managers assigned yet</p>
                                    </div>
                                ) : (
                                    getModuleAccess(selectedModuleForAccess).map((access) => (
                                        <div key={access.id} className="module-hub__access-item">
                                            <Avatar name={access.userName} size="sm" />
                                            <div className="module-hub__access-info">
                                                <div className="module-hub__access-name">
                                                    {access.userName}
                                                </div>
                                                <div className="module-hub__access-email">
                                                    {access.userEmail}
                                                </div>
                                            </div>
                                            <Badge variant="status" color="var(--success)">
                                                {access.role}
                                            </Badge>
                                            <div className="module-hub__access-date">
                                                <Clock size={12} />
                                                {new Date(access.assignedAt).toLocaleDateString(
                                                    'en-US',
                                                    { month: 'short', day: 'numeric' }
                                                )}
                                            </div>
                                            <button
                                                className="module-hub__access-remove"
                                                onClick={() => dispatch(removeAccess(access.id))}
                                                title="Remove access"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Pending Invites */}
                        {getModuleInvites(selectedModuleForAccess).length > 0 && (
                            <div className="module-hub__access-list-section">
                                <h3 className="module-hub__assign-title">
                                    <Mail size={16} />
                                    Pending Invitations
                                </h3>
                                <div className="module-hub__access-list">
                                    {getModuleInvites(selectedModuleForAccess).map((invite) => (
                                        <div key={invite.id} className="module-hub__access-item pending">
                                            <div className="module-hub__invite-avatar">
                                                <Mail size={16} />
                                            </div>
                                            <div className="module-hub__access-info">
                                                <div className="module-hub__access-name">
                                                    {invite.email}
                                                </div>
                                                <div className="module-hub__access-email">
                                                    Invitation sent
                                                </div>
                                            </div>
                                            <Badge variant="status" color="var(--warning)">
                                                pending
                                            </Badge>
                                            <button
                                                className="module-hub__access-remove"
                                                onClick={() => dispatch(removeInvite(invite.id))}
                                                title="Cancel invite"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Send Invite from Modal */}
                        <div className="module-hub__invite-inline">
                            <h3 className="module-hub__assign-title">
                                <Send size={16} />
                                Invite via Email
                            </h3>
                            <div className="module-hub__assign-row">
                                <input
                                    type="email"
                                    className="module-hub__invite-input glass-input"
                                    placeholder="Enter email address..."
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <Button
                                    variant="primary"
                                    icon={Send}
                                    onClick={() => {
                                        if (inviteEmail) {
                                            dispatch(
                                                addInvite({
                                                    moduleKey: selectedModuleForAccess,
                                                    email: inviteEmail,
                                                })
                                            );
                                            setInviteEmail('');
                                        }
                                    }}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal (global) */}
            {inviteModalOpen && (
                <div
                    className="module-hub__overlay glass-overlay"
                    onClick={() => dispatch(setInviteModalOpen(false))}
                >
                    <div
                        className="module-hub__invite-modal glass-elevated"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="module-hub__modal-header">
                            <div className="module-hub__modal-title-group">
                                <div
                                    className="module-hub__modal-icon"
                                    style={{ background: 'linear-gradient(135deg, #0055FE, #3B82F6)' }}
                                >
                                    <UserPlus size={20} color="#fff" />
                                </div>
                                <div>
                                    <h2 className="module-hub__modal-title">
                                        Invite Manager
                                    </h2>
                                    <p className="module-hub__modal-subtitle">
                                        Send an email invitation to a new manager
                                    </p>
                                </div>
                            </div>
                            <button
                                className="module-hub__modal-close"
                                onClick={() => dispatch(setInviteModalOpen(false))}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="module-hub__invite-form">
                            <div className="module-hub__form-group">
                                <label className="module-hub__form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="module-hub__invite-input glass-input"
                                    placeholder="manager@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="module-hub__form-group">
                                <label className="module-hub__form-label">Assign to Module</label>
                                <select
                                    className="module-hub__invite-select glass-input"
                                    value={inviteModule}
                                    onChange={(e) => setInviteModule(e.target.value)}
                                >
                                    <option value="">Select a module...</option>
                                    {DEPARTMENT_MODULES.map((mod) => (
                                        <option key={mod.key} value={mod.key}>
                                            {mod.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="module-hub__invite-actions">
                                <Button
                                    variant="ghost"
                                    onClick={() => dispatch(setInviteModalOpen(false))}
                                >
                                    Cancel
                                </Button>
                                <Button variant="primary" icon={Send} onClick={handleSendInvite}>
                                    Send Invitation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Credentials Modal */}
            {credentialsModal.open && credentialsModal.manager && (
                <div
                    className="module-hub__overlay glass-overlay"
                    onClick={() => dispatch(closeCredentialsModal())}
                >
                    <div
                        className="module-hub__creds-modal glass-elevated"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="module-hub__creds-header">
                            <div className="module-hub__creds-icon">
                                <CheckCircle2 size={28} color="var(--success)" />
                            </div>
                            <h2 className="module-hub__creds-title">Manager Assigned!</h2>
                            <p className="module-hub__creds-subtitle">
                                Share these credentials with the new manager
                            </p>
                        </div>
                        <div className="module-hub__creds-card">
                            <div className="module-hub__creds-row">
                                <span className="module-hub__creds-label">Module</span>
                                <span className="module-hub__creds-value">
                                    {DEPARTMENT_MODULES.find(m => m.key === credentialsModal.manager.assignedModule)?.label}
                                </span>
                            </div>
                            <div className="module-hub__creds-divider" />
                            <div className="module-hub__creds-row">
                                <span className="module-hub__creds-label">Email</span>
                                <span className="module-hub__creds-value">{credentialsModal.manager.email}</span>
                            </div>
                            <div className="module-hub__creds-row">
                                <span className="module-hub__creds-label">
                                    <Key size={12} /> Password
                                </span>
                                <span className="module-hub__creds-value module-hub__creds-password">
                                    {credentialsModal.manager.password}
                                </span>
                            </div>
                        </div>
                        <div className="module-hub__creds-actions">
                            <button
                                className="module-hub__creds-copy"
                                onClick={handleCopyCredentials}
                            >
                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy Credentials'}
                            </button>
                            <button
                                className="module-hub__creds-done"
                                onClick={() => dispatch(closeCredentialsModal())}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleHub;
