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
    Upload,
    FileText,
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

    const handleAddItem = (groupId, status) => {
        const newItem = {
            _id: `item-${Date.now()}`,
            boardId: board._id,
            groupId: groupId || groups[0]?._id,
            fields: {
                [board.columns.find(c => c.type === 'text')?._id]: 'New Item',
                [board.columns.find(c => c.type === 'status')?._id]: status || 'To Do',
                [board.columns.find(c => c.type === 'priority')?._id]: 'medium',
                [board.columns.find(c => c.type === 'person')?._id]: 'user-1',
                [board.columns.find(c => c.type === 'date')?._id]: new Date().toISOString(),
            },
        };
        setItems(prev => [...prev, newItem]);
        dispatch(openItemDrawer(newItem._id)); // Open drawer for editing the new item
    };

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
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => handleAddItem()}>New Item</Button>
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
                                            <button className="table-view__add-btn" onClick={() => handleAddItem(group._id)}>
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
                                    <button className="kanban-column__header-btn" onClick={() => handleAddItem(null, column.label)}>
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
                                            <button className="kanban-column__add" onClick={() => handleAddItem(null, column.label)}>
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

            {activeView === 'timeline' && (() => {
                const dateCol = board.columns.find(c => c.type === 'date');
                const nameCol = board.columns.find(c => c.type === 'text');
                const personCol = board.columns.find(c => c.type === 'person');
                const priorityCol = board.columns.find(c => c.type === 'priority');
                const timelineItems = boardItems.filter(i => dateCol && i.fields[dateCol._id]);
                const dates = timelineItems.map(i => new Date(i.fields[dateCol._id]).getTime());
                const minDate = dates.length ? new Date(Math.min(...dates) - 7 * 86400000) : new Date();
                const maxDate = dates.length ? new Date(Math.max(...dates) + 7 * 86400000) : new Date();
                const totalDays = Math.ceil((maxDate - minDate) / 86400000) || 14;
                const weeks = [];
                for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 7)) {
                    weeks.push(new Date(d));
                }
                return (
                    <div className="timeline-view">
                        <div className="timeline-header">
                            {weeks.map((w, i) => (
                                <div key={i} className="timeline-week" style={{ width: `${(7 / totalDays) * 100}%` }}>
                                    {w.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            ))}
                        </div>
                        <div className="timeline-body">
                            {timelineItems.map(item => {
                                const itemDate = new Date(item.fields[dateCol._id]);
                                const startDay = Math.floor((itemDate.getTime() - 5 * 86400000 - minDate.getTime()) / 86400000);
                                const left = Math.max(0, (startDay / totalDays) * 100);
                                const width = Math.min((5 / totalDays) * 100, 100 - left);
                                const priority = priorityCol ? item.fields[priorityCol._id] : 'medium';
                                const barColor = priority === 'critical' ? '#E2445C' : priority === 'high' ? '#FDAB3D' : priority === 'medium' ? '#579BFC' : '#00C875';
                                return (
                                    <div key={item._id} className="timeline-row" onClick={() => dispatch(openItemDrawer(item._id))}>
                                        <div className="timeline-row__label">
                                            {personCol && <Avatar name={getMemberName(item.fields[personCol._id])} size="sm" />}
                                            <span>{nameCol ? item.fields[nameCol._id] : 'Task'}</span>
                                        </div>
                                        <div className="timeline-row__bar-area">
                                            <div className="timeline-row__bar" style={{ left: `${left}%`, width: `${width}%`, background: barColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {activeView === 'calendar' && (() => {
                const dateCol = board.columns.find(c => c.type === 'date');
                const nameCol = board.columns.find(c => c.type === 'text');
                const [calMonth, setCalMonth] = useState(new Date().getMonth());
                const [calYear, setCalYear] = useState(new Date().getFullYear());
                const firstDay = new Date(calYear, calMonth, 1).getDay();
                const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                const calDays = [];
                for (let i = 0; i < firstDay; i++) calDays.push(null);
                for (let d = 1; d <= daysInMonth; d++) calDays.push(d);
                const calItems = dateCol ? boardItems.filter(i => {
                    const dt = new Date(i.fields[dateCol._id]);
                    return dt.getMonth() === calMonth && dt.getFullYear() === calYear;
                }) : [];
                const getItemsForDay = (day) => calItems.filter(i => new Date(i.fields[dateCol._id]).getDate() === day);
                const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
                const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };
                return (
                    <div className="calendar-view">
                        <div className="calendar-nav">
                            <button onClick={prevMonth} className="calendar-nav__btn">&lt;</button>
                            <span className="calendar-nav__title">{new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={nextMonth} className="calendar-nav__btn">&gt;</button>
                        </div>
                        <div className="calendar-grid">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="calendar-grid__day-header">{d}</div>
                            ))}
                            {calDays.map((day, idx) => (
                                <div key={idx} className={`calendar-grid__cell ${day ? '' : 'empty'}`}>
                                    {day && <span className="calendar-grid__date">{day}</span>}
                                    {day && getItemsForDay(day).map(item => (
                                        <div key={item._id} className="calendar-grid__item" onClick={() => dispatch(openItemDrawer(item._id))}>
                                            {nameCol ? item.fields[nameCol._id] : 'Task'}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

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

                                    <div className="item-drawer__divider" />

                                    <div className="item-drawer__field">
                                        <span className="item-drawer__field-label">Time Tracking</span>
                                        <div className="item-drawer__timer glass-card">
                                            <div className="timer-display">
                                                <Clock size={14} />
                                                <span>02:45:12</span>
                                                <span className="timer-total">/ 08:00h</span>
                                            </div>
                                            <div className="timer-actions">
                                                <button className="timer-btn timer-btn--start"><Check size={12} /> Start</button>
                                                <button className="timer-btn timer-btn--log"><Clock size={12} /> Log</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="item-drawer__field">
                                        <div className="item-drawer__subtasks-header">
                                            <span className="item-drawer__field-label">Subtasks</span>
                                            <span className="subtask-progress">3/5 (60%)</span>
                                        </div>
                                        <div className="subtask-progress-bar">
                                            <div className="subtask-progress-fill" style={{ width: '60%' }} />
                                        </div>
                                        <div className="subtask-list">
                                            {[
                                                { id: 1, text: 'Initial research and wireframes', done: true },
                                                { id: 2, text: 'Component architecture design', done: true },
                                                { id: 3, text: 'State management implementation', done: true },
                                                { id: 4, text: 'Unit tests and documentation', done: false },
                                                { id: 5, text: 'User acceptance testing', done: false },
                                            ].map(st => (
                                                <div key={st.id} className="subtask-item">
                                                    <input type="checkbox" checked={st.done} readOnly />
                                                    <span className={st.done ? 'done' : ''}>{st.text}</span>
                                                </div>
                                            ))}
                                            <button className="add-subtask-btn"><Plus size={12} /> Add subtask</button>
                                        </div>
                                    </div>
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
                                <div className="item-drawer__files">
                                    <div className="item-drawer__file-upload">
                                        <Upload size={24} />
                                        <p>Drop files here or click to upload</p>
                                        <span>PNG, JPG, PDF up to 10MB</span>
                                    </div>
                                    <div className="item-drawer__file-list">
                                        {[
                                            { name: 'design-spec.pdf', size: '2.4 MB', type: 'pdf' },
                                            { name: 'screenshot.png', size: '856 KB', type: 'image' },
                                        ].map((f, i) => (
                                            <div key={i} className="item-drawer__file-item">
                                                <FileText size={16} />
                                                <div className="item-drawer__file-info">
                                                    <span className="item-drawer__file-name">{f.name}</span>
                                                    <span className="item-drawer__file-size">{f.size}</span>
                                                </div>
                                                <button className="item-drawer__file-dl"><Download size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {drawerTab === 'activity' && (
                                <div className="item-drawer__activity">
                                    {[
                                        { user: 'user-2', action: 'changed status', from: 'Not Started', to: 'In Progress', time: '2 hours ago' },
                                        { user: 'user-1', action: 'changed priority', from: 'medium', to: 'high', time: '5 hours ago' },
                                        { user: 'user-3', action: 'added comment', from: null, to: null, time: '1 day ago' },
                                        { user: 'user-1', action: 'created this item', from: null, to: null, time: '3 days ago' },
                                    ].map((log, i) => (
                                        <div key={i} className="item-drawer__activity-item">
                                            <Avatar name={getMemberName(log.user)} size="xs" />
                                            <div className="item-drawer__activity-info">
                                                <span><strong>{getMemberName(log.user)}</strong> {log.action}
                                                    {log.from && <> from <em>{log.from}</em> to <em>{log.to}</em></>}
                                                </span>
                                                <span className="item-drawer__activity-time">{log.time}</span>
                                            </div>
                                        </div>
                                    ))}
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
