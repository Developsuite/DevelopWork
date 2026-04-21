import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { openItemDrawer, closeItemDrawer } from '../../store/slices/uiSlice';
import {
    mockBoards,
    mockGroups,
    mockItems as initialMockItems,
    mockMembers,
    mockUpdates,
} from '../../utils/mockData';
import { BOARD_TYPES } from '../../utils/constants';
import { formatDate, formatRelativeTime, getInitials } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar/Avatar';
import { StatusBadge, PriorityBadge, TagBadge } from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';
import {
    LayoutDashboard,
    Users,
    DollarSign,
    Handshake,
    Headphones,
    Table2,
    Columns3,
    GanttChart,
    Calendar,
    ChevronDown,
    Plus,
    X,
    Clock,
    Filter,
    Download,
    UserPlus,
    GripVertical,
    LayoutList,
} from 'lucide-react';
import './Board.css';

const boardTypeIcons = {
    project: LayoutDashboard,
    hr: Users,
    finance: DollarSign,
    crm: Handshake,
    support: Headphones,
};

const Board = () => {
    const { boardId } = useParams();
    const dispatch = useDispatch();
    const { itemDrawerOpen, activeItemId } = useSelector((state) => state.ui);
    const [activeView, setActiveView] = useState('table');
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [drawerTab, setDrawerTab] = useState('overview');

    // Local items state for drag-and-drop
    const [items, setItems] = useState(initialMockItems);

    // Find board data
    const board = mockBoards.find((b) => b._id === boardId) || mockBoards[0];
    const groups = mockGroups.filter((g) => g.boardId === board._id);
    const boardItems = items.filter((i) => i.boardId === board._id);

    const typeInfo = BOARD_TYPES[board.type];
    const TypeIcon = boardTypeIcons[board.type] || LayoutDashboard;

    const toggleGroup = (groupId) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const getMemberName = (userId) => {
        const member = mockMembers.find((m) => m._id === userId);
        return member ? member.name : 'Unassigned';
    };

    // Active item for drawer
    const activeItem = activeItemId ? boardItems.find((i) => i._id === activeItemId) : null;
    const activeItemUpdates = activeItemId
        ? mockUpdates.filter((u) => u.itemId === activeItemId)
        : [];

    // Kanban: group items by status
    const statusColumn = board.columns.find((c) => c.type === 'status');
    const kanbanColumns = useMemo(() => {
        if (!statusColumn || !statusColumn.options) return [];
        return statusColumn.options.map((option) => ({
            ...option,
            items: boardItems.filter((item) => item.fields[statusColumn._id] === option.label),
        }));
    }, [boardItems, statusColumn]);

    // Drag and Drop handler
    const handleDragEnd = useCallback((result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside a valid area
        if (!destination) return;

        // Dropped in same position
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Find the item and update its status
        setItems((prevItems) => {
            const newItems = [...prevItems];
            const itemIndex = newItems.findIndex((i) => i._id === draggableId);
            if (itemIndex === -1) return prevItems;

            const [item] = newItems.splice(itemIndex, 1);
            const newStatusLabel = destination.droppableId;

            item.fields = {
                ...item.fields,
                [statusColumn._id]: newStatusLabel,
            };

            const targetGroup = mockGroups.find(g =>
                g.boardId === board._id &&
                (g.name.toLowerCase() === newStatusLabel.toLowerCase() ||
                    (newStatusLabel === 'Not Started' && g.name === 'To Do'))
            );
            if (targetGroup) {
                item.groupId = targetGroup._id;
            }

            const destItems = newItems.filter(i => i.fields[statusColumn._id] === newStatusLabel);
            if (destItems.length > 0 && destination.index < destItems.length) {
                const targetItem = destItems[destination.index];
                const targetGlobalIndex = newItems.indexOf(targetItem);
                newItems.splice(targetGlobalIndex, 0, item);
            } else {
                newItems.push(item);
            }

            return newItems;
        });
    }, [statusColumn]);

    const views = [
        { key: 'table', label: 'Table', icon: Table2 },
        { key: 'kanban', label: 'Kanban', icon: Columns3 },
        { key: 'list', label: 'List', icon: LayoutList },
        { key: 'timeline', label: 'Timeline', icon: GanttChart },
        { key: 'calendar', label: 'Calendar', icon: Calendar },
    ];

    return (
        <div className="board-page">
            {/* Board Header */}
            <div className="board-header">
                <div className="board-header__left">
                    <div className="board-header__icon" style={{ background: typeInfo.color }}>
                        <TypeIcon size={20} />
                    </div>
                    <div>
                        <h1 className="board-header__title">{board.name}</h1>
                        <span
                            className="board-header__type-badge"
                            style={{ background: typeInfo.color }}
                        >
                            {typeInfo.label}
                        </span>
                    </div>
                </div>
                <div className="board-header__right">
                    {/* View Switcher */}
                    <div className="view-switcher">
                        {views.map((view) => (
                            <button
                                key={view.key}
                                className={`view-switcher__btn ${activeView === view.key ? 'active' : ''}`}
                                onClick={() => setActiveView(view.key)}
                            >
                                <view.icon size={15} />
                                {view.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" icon={Filter}>Filter</Button>
                    <Button variant="primary" size="sm" icon={Plus}>New Item</Button>
                </div>
            </div>

            {/* Table View */}
            {activeView === 'table' && (
                <div className="table-view">
                    {groups.map((group) => {
                        const groupItems = boardItems.filter((i) => i.groupId === group._id);
                        const isCollapsed = collapsedGroups[group._id];

                        return (
                            <div key={group._id} className="table-group">
                                {/* Group Header */}
                                <div
                                    className="table-group__header"
                                    onClick={() => toggleGroup(group._id)}
                                >
                                    <ChevronDown
                                        size={16}
                                        className={`table-group__chevron ${isCollapsed ? 'collapsed' : ''}`}
                                    />
                                    <div
                                        className="table-group__color-bar"
                                        style={{ background: group.color }}
                                    />
                                    <span className="table-group__name">{group.name}</span>
                                    <span className="table-group__count">{groupItems.length}</span>
                                </div>

                                {/* Table */}
                                {!isCollapsed && (
                                    <>
                                        <table className="table-view__table">
                                            <thead className="table-view__thead">
                                                <tr>
                                                    {board.columns.map((col) => (
                                                        <th key={col._id} style={{ width: col.width }}>
                                                            {col.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupItems.map((item) => (
                                                    <tr
                                                        key={item._id}
                                                        className="table-view__row"
                                                        onClick={() => dispatch(openItemDrawer(item._id))}
                                                    >
                                                        {board.columns.map((col) => {
                                                            const value = item.fields[col._id];
                                                            return (
                                                                <td key={col._id}>
                                                                    {col.type === 'text' && (
                                                                        <span className="table-view__cell--name">{value}</span>
                                                                    )}
                                                                    {col.type === 'status' && (
                                                                        <span className="table-view__cell--status">
                                                                            <StatusBadge
                                                                                status={value}
                                                                                color={
                                                                                    col.options?.find((o) => o.label === value)?.color ||
                                                                                    '#6C7A96'
                                                                                }
                                                                            />
                                                                        </span>
                                                                    )}
                                                                    {col.type === 'person' && (
                                                                        <span className="table-view__person">
                                                                            <Avatar name={getMemberName(value)} size="sm" />
                                                                            {getMemberName(value)}
                                                                        </span>
                                                                    )}
                                                                    {col.type === 'date' && (
                                                                        <span className="table-view__cell--date">
                                                                            {formatDate(value)}
                                                                        </span>
                                                                    )}
                                                                    {col.type === 'priority' && (
                                                                        <PriorityBadge priority={value} />
                                                                    )}
                                                                    {col.type === 'tags' && (
                                                                        <span className="table-view__cell--tags">
                                                                            {value?.map((tag) => (
                                                                                <TagBadge key={tag} tag={tag} />
                                                                            ))}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="table-view__add-row">
                                            <button className="table-view__add-btn">
                                                <Plus size={14} /> Add item
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Kanban View — Drag & Drop */}
            {activeView === 'kanban' && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="kanban-view">
                        {kanbanColumns.map((column) => (
                            <div key={column.label} className="kanban-column">
                                <div
                                    className="kanban-column__header"
                                    style={{ borderTop: `3px solid ${column.color}` }}
                                >
                                    <div className="kanban-column__header-left">
                                        <div className="kanban-column__dot" style={{ background: column.color }} />
                                        <span className="kanban-column__title">{column.label}</span>
                                        <span className="kanban-column__count">{column.items.length}</span>
                                    </div>
                                    <button className="kanban-column__header-btn">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <Droppable droppableId={column.label}>
                                    {(provided, snapshot) => (
                                        <div
                                            className={`kanban-column__body ${snapshot.isDraggingOver ? 'kanban-column__body--drag-over' : ''}`}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {column.items.map((item, index) => {
                                                const nameCol = board.columns.find((c) => c.type === 'text');
                                                const dateCol = board.columns.find((c) => c.type === 'date');
                                                const priorityCol = board.columns.find((c) => c.type === 'priority');
                                                const personCol = board.columns.find((c) => c.type === 'person');
                                                const tagsCol = board.columns.find((c) => c.type === 'tags');

                                                return (
                                                    <Draggable
                                                        key={item._id}
                                                        draggableId={item._id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                className={`kanban-card ${snapshot.isDragging ? 'kanban-card--dragging' : ''}`}
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                onClick={() => dispatch(openItemDrawer(item._id))}
                                                            >
                                                                <div className="kanban-card__drag-handle" {...provided.dragHandleProps}>
                                                                    <GripVertical size={14} />
                                                                </div>
                                                                <div className="kanban-card__content">
                                                                    <div className="kanban-card__name">
                                                                        {nameCol ? item.fields[nameCol._id] : 'Untitled'}
                                                                    </div>
                                                                    {tagsCol && item.fields[tagsCol._id] && (
                                                                        <div className="kanban-card__tags">
                                                                            {item.fields[tagsCol._id]?.map((tag) => (
                                                                                <TagBadge key={tag} tag={tag} />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <div className="kanban-card__meta">
                                                                        <div className="kanban-card__meta-left">
                                                                            {personCol && (
                                                                                <Avatar
                                                                                    name={getMemberName(item.fields[personCol._id])}
                                                                                    size="sm"
                                                                                />
                                                                            )}
                                                                            {priorityCol && (
                                                                                <PriorityBadge priority={item.fields[priorityCol._id]} />
                                                                            )}
                                                                        </div>
                                                                        {dateCol && item.fields[dateCol._id] && (
                                                                            <span className="kanban-card__date">
                                                                                <Clock size={11} />
                                                                                {formatDate(item.fields[dateCol._id])}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                            <button className="kanban-column__add">
                                                <Plus size={14} /> Add item
                                            </button>
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}

            {/* List View */}
            {activeView === 'list' && (
                <div className="list-view">
                    <div className="list-view__container">
                        {boardItems.map((item) => {
                            const nameCol = board.columns.find((c) => c.type === 'text');
                            const statusCol = board.columns.find((c) => c.type === 'status');
                            const personCol = board.columns.find((c) => c.type === 'person');
                            const dateCol = board.columns.find((c) => c.type === 'date');
                            const priorityCol = board.columns.find((c) => c.type === 'priority');
                            const groupInfo = groups.find(g => g._id === item.groupId);

                            return (
                                <div key={item._id} className="list-view__item" onClick={() => dispatch(openItemDrawer(item._id))}>
                                    <div className="list-view__item-left">
                                        <div className="list-view__item-drag"><GripVertical size={14} /></div>
                                        <div className="list-view__item-color" style={{ background: groupInfo?.color || '#ccc' }} />
                                        <span className="list-view__item-title">{nameCol ? item.fields[nameCol._id] : 'Untitled'}</span>
                                    </div>
                                    <div className="list-view__item-right">
                                        {personCol && (
                                            <div className="list-view__item-person">
                                                <Avatar name={getMemberName(item.fields[personCol._id])} size="sm" />
                                            </div>
                                        )}
                                        {dateCol && item.fields[dateCol._id] && (
                                            <div className="list-view__item-date">
                                                <Clock size={12} />
                                                <span>{formatDate(item.fields[dateCol._id])}</span>
                                            </div>
                                        )}
                                        {priorityCol && (
                                            <div className="list-view__item-priority">
                                                <PriorityBadge priority={item.fields[priorityCol._id]} />
                                            </div>
                                        )}
                                        {statusCol && (
                                            <div className="list-view__item-status">
                                                <StatusBadge
                                                    status={item.fields[statusCol._id]}
                                                    color={statusCol.options?.find((o) => o.label === item.fields[statusCol._id])?.color}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeView === 'timeline' && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <GanttChart size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--font-md)', fontWeight: 500 }}>Timeline View</p>
                    <p style={{ fontSize: 'var(--font-sm)' }}>Coming soon — visualize project schedules</p>
                </div>
            )}

            {activeView === 'calendar' && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 'var(--font-md)', fontWeight: 500 }}>Calendar View</p>
                    <p style={{ fontSize: 'var(--font-sm)' }}>Coming soon — see tasks on a calendar</p>
                </div>
            )}

            {/* Item Drawer */}
            {itemDrawerOpen && activeItem && (
                <>
                    <div
                        className="item-drawer-overlay"
                        onClick={() => dispatch(closeItemDrawer())}
                    />
                    <div className="item-drawer glass-elevated">
                        <div className="item-drawer__header">
                            <h2 className="item-drawer__title">
                                {board.columns.find((c) => c.type === 'text')
                                    ? activeItem.fields[board.columns.find((c) => c.type === 'text')._id]
                                    : 'Item Details'}
                            </h2>
                            <button
                                className="item-drawer__close"
                                onClick={() => dispatch(closeItemDrawer())}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="item-drawer__tabs">
                            {['overview', 'updates', 'files', 'activity'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`item-drawer__tab ${drawerTab === tab ? 'active' : ''}`}
                                    onClick={() => setDrawerTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="item-drawer__body">
                            {drawerTab === 'overview' && (
                                <div className="item-drawer__fields">
                                    {board.columns.map((col) => {
                                        const value = activeItem.fields[col._id];
                                        return (
                                            <div key={col._id} className="item-drawer__field">
                                                <span className="item-drawer__field-label">{col.name}</span>
                                                <div className="item-drawer__field-value">
                                                    {col.type === 'text' && value}
                                                    {col.type === 'status' && (
                                                        <StatusBadge
                                                            status={value}
                                                            color={col.options?.find((o) => o.label === value)?.color}
                                                        />
                                                    )}
                                                    {col.type === 'person' && (
                                                        <span className="table-view__person">
                                                            <Avatar name={getMemberName(value)} size="sm" />
                                                            {getMemberName(value)}
                                                        </span>
                                                    )}
                                                    {col.type === 'date' && formatDate(value)}
                                                    {col.type === 'priority' && <PriorityBadge priority={value} />}
                                                    {col.type === 'tags' && (
                                                        <span className="table-view__cell--tags">
                                                            {value?.map((tag) => <TagBadge key={tag} tag={tag} />)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {drawerTab === 'updates' && (
                                <div className="item-drawer__updates">
                                    {activeItemUpdates.map((update) => (
                                        <div key={update._id} className="item-drawer__update">
                                            <Avatar name={getMemberName(update.userId)} size="sm" />
                                            <div className="item-drawer__update-content">
                                                <div className="item-drawer__update-header">
                                                    <span className="item-drawer__update-name">
                                                        {getMemberName(update.userId)}
                                                    </span>
                                                    <span className="item-drawer__update-time">
                                                        {formatRelativeTime(update.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="item-drawer__update-text">{update.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="item-drawer__comment-input">
                                        <Avatar name={getMemberName('user-1')} size="sm" />
                                        <textarea placeholder="Write an update..." />
                                    </div>
                                </div>
                            )}

                            {drawerTab === 'files' && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    <Download size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                    <p>No files attached yet</p>
                                </div>
                            )}

                            {drawerTab === 'activity' && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    <Clock size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                    <p>Activity log will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Board;
