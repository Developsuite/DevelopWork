import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
    addTeamToModule,
    removeTeamFromModule,
    addTeamMember,
    removeTeamMember,
} from '../../store/slices/accessSlice';
import Avatar from '../../components/common/Avatar/Avatar';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import {
    UsersRound,
    Plus,
    Trash2,
    UserPlus,
    X,
    Search,
    Shield,
    Clock
} from 'lucide-react';
import './TeamManager.css';

const TeamManager = () => {
    const dispatch = useDispatch();
    const { moduleKey } = useParams();
    const { user } = useSelector((state) => state.auth);
    const { managers, employees } = useSelector((state) => state.access);

    const managerData = managers.find(
        (m) => m.email === user?.email && m.assignedModule === moduleKey
    );

    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    
    // Team Member adding state
    const [activeTeamId, setActiveTeamId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddTeam = () => {
        if (!newTeamName.trim() || !managerData) return;
        dispatch(addTeamToModule({
            managerId: managerData.id,
            teamName: newTeamName.trim(),
        }));
        setNewTeamName('');
        setShowAddTeam(false);
    };

    const handleRemoveTeam = (teamId) => {
        if (!managerData) return;
        dispatch(removeTeamFromModule({
            managerId: managerData.id,
            teamId,
        }));
    };

    const handleAddMember = (teamId, employee) => {
        if (!managerData) return;
        dispatch(addTeamMember({
            managerId: managerData.id,
            teamId,
            member: {
                userId: employee.userId,
                name: employee.name,
                email: employee.email,
                role: 'Member',
            },
        }));
        // Reset search state
        setSearchQuery('');
        setActiveTeamId(null);
    };

    const handleRemoveMember = (teamId, memberId) => {
        if (!managerData) return;
        dispatch(removeTeamMember({
            managerId: managerData.id,
            teamId,
            memberId,
        }));
    };

    // Find available employees to add
    const availableEmployees = useMemo(() => {
        if (!activeTeamId) return [];
        
        // Filter out employees already in this team
        const team = managerData?.teams?.find(t => t.id === activeTeamId);
        const existingEmails = team?.members.map(m => m.email) || [];

        return employees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  emp.email.toLowerCase().includes(searchQuery.toLowerCase());
            const notInTeam = !existingEmails.includes(emp.email);
            // Optionally, we could filter by department here, but for now we let managers pick anyone
            return matchesSearch && notInTeam;
        });
    }, [employees, searchQuery, activeTeamId, managerData]);

    if (!managerData) return <div className="team-manager__empty">No manager data found.</div>;

    return (
        <div className="team-manager">
            <div className="team-manager__header">
                <div>
                    <h1 className="team-manager__title">Team Management</h1>
                    <p className="team-manager__subtitle">Build and manage your teams, add members, and assign roles.</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowAddTeam(true)}>
                    Create New Team
                </Button>
            </div>

            {showAddTeam && (
                <div className="team-manager__add-form glass-card">
                    <input
                        type="text"
                        className="glass-input"
                        placeholder="Enter team name (e.g. Frontend Team)"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                        autoFocus
                    />
                    <Button variant="primary" onClick={handleAddTeam}>Create Team</Button>
                    <Button variant="ghost" onClick={() => { setShowAddTeam(false); setNewTeamName(''); }}>Cancel</Button>
                </div>
            )}

            <div className="team-manager__grid">
                {(!managerData.teams || managerData.teams.length === 0) ? (
                    <div className="team-manager__empty-state glass-card">
                        <UsersRound size={48} className="text-muted" />
                        <h2>No Teams Yet</h2>
                        <p>Create your first team to start adding members and assigning tasks.</p>
                        <Button variant="primary" icon={Plus} onClick={() => setShowAddTeam(true)}>
                            Create Team
                        </Button>
                    </div>
                ) : (
                    managerData.teams.map((team) => (
                        <div key={team.id} className="team-card glass-card">
                            <div className="team-card__header">
                                <div className="team-card__info">
                                    <h3 className="team-card__name">{team.name}</h3>
                                    <Badge variant="default">{team.members.length} members</Badge>
                                </div>
                                <div className="team-card__actions">
                                    <button 
                                        className="team-card__btn-icon delete"
                                        onClick={() => handleRemoveTeam(team.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Add Member Search Section */}
                            <div className="team-card__add-section">
                                {activeTeamId === team.id ? (
                                    <div className="team-card__search-box">
                                        <div className="team-card__search-input-wrapper">
                                            <Search size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search employees by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={() => { setActiveTeamId(null); setSearchQuery(''); }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                        
                                        {/* Search Results Dropdown */}
                                        {searchQuery && (
                                            <div className="team-card__search-results">
                                                {availableEmployees.length > 0 ? (
                                                    availableEmployees.map(emp => (
                                                        <div key={emp.id} className="team-card__search-result-item">
                                                            <div className="team-card__search-result-info">
                                                                <Avatar name={emp.name} size="xs" />
                                                                <div>
                                                                    <div className="search-name">{emp.name}</div>
                                                                    <div className="search-email">{emp.email}</div>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="primary" onClick={() => handleAddMember(team.id, emp)}>
                                                                Add
                                                            </Button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="team-card__search-empty">No employees found.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Button 
                                        variant="ghost" 
                                        icon={UserPlus} 
                                        className="team-card__add-btn"
                                        onClick={() => setActiveTeamId(team.id)}
                                    >
                                        Add Member
                                    </Button>
                                )}
                            </div>

                            {/* Member List */}
                            <div className="team-card__members">
                                {team.members.map((member) => (
                                    <div key={member.id} className="team-card__member-row">
                                        <div className="team-card__member-identity">
                                            <Avatar name={member.name} size="sm" />
                                            <div className="team-card__member-text">
                                                <div className="team-card__member-name">{member.name}</div>
                                                <div className="team-card__member-email">{member.email}</div>
                                            </div>
                                        </div>
                                        <div className="team-card__member-meta">
                                            <Badge variant="default">{member.role}</Badge>
                                            <button
                                                className="team-card__btn-remove"
                                                onClick={() => handleRemoveMember(team.id, member.id)}
                                                title="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {team.members.length === 0 && !activeTeamId && (
                                    <div className="team-card__no-members">
                                        No members in this team.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamManager;
