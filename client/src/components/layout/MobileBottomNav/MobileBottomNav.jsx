import { useLocation, useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import './MobileBottomNav.css';

const isItemActive = (item, location) => {
    if (typeof item.isActive === 'function') return item.isActive(location);

    const [itemPath, itemQuery = ''] = (item.path || '').split('?');
    if (!itemPath) return false;
    if (itemQuery) {
        return location.pathname === itemPath && location.search === `?${itemQuery}`;
    }
    return item.end ? location.pathname === itemPath : location.pathname.startsWith(itemPath);
};

const MobileBottomNav = ({ items = [], homeItem, settingsItem, onMore, notifItem, accentColor }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const innerRef = useRef(null);
    const itemRefs = useRef({});
    // The floating circle indicator follows whichever item is active.
    const [circle, setCircle] = useState({ cx: 0, visible: false });

    const shortcuts = items.filter(Boolean).slice(0, 2);

    const slots = [];
    shortcuts.forEach((item, i) => slots.push({ key: `shortcut-${i}`, item, position: `shortcut-${i}` }));
    if (homeItem) slots.push({ key: 'home', item: homeItem, position: 'home' });
    if (settingsItem) slots.push({ key: 'settings', item: settingsItem, position: 'settings' });
    // If a notification item is provided use it as the 5th slot, otherwise fall back to More
    const lastItem = notifItem
        ? { key: 'notif', item: notifItem, position: 'notif' }
        : { key: 'more', item: { label: 'More', onClick: onMore, icon: MoreHorizontal }, position: 'more' };
    slots.push(lastItem);

    // The active item is any item (including Home) whose path matches the route.
    const activeKey = (() => {
        for (const s of slots) {
            if (s.item?.path && isItemActive(s.item, location)) return s.key;
        }
        return homeItem ? 'home' : null; // default the circle to Home
    })();

    useLayoutEffect(() => {
        const measure = () => {
            const container = innerRef.current;
            const el = activeKey ? itemRefs.current[activeKey] : null;
            if (!container || !el) {
                setCircle((c) => ({ ...c, visible: false }));
                return;
            }
            const cRect = container.getBoundingClientRect();
            const eRect = el.getBoundingClientRect();
            setCircle({ cx: eRect.left - cRect.left + eRect.width / 2, visible: true });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [activeKey, location.pathname, location.search, items.length]);

    const renderItem = (slot) => {
        const { item, position, key } = slot;
        const Icon = item.icon;
        const active = key === activeKey;
        const isMore = position === 'more';

        return (
            <button
                ref={(el) => { if (el) itemRefs.current[key] = el; else delete itemRefs.current[key]; }}
                key={key}
                type="button"
                className={`mobile-bottom-nav__item ${active ? 'active' : ''}`}
                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
            >
                {/* The active icon is shown inside the floating circle instead, so hide
                    this one (keeps the slot's height/label in place). */}
                <span className={`mobile-bottom-nav__icon-wrap ${active ? 'is-tucked' : ''}`}>
                    <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                    {!isMore && item.badge > 0 && (
                        <span className="mobile-bottom-nav__badge">
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    )}
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
            </button>
        );
    };

    const activeSlot = slots.find((s) => s.key === activeKey);
    const ActiveIcon = activeSlot?.item?.icon;

    return (
        <nav
            className="mobile-bottom-nav"
            aria-label="Mobile navigation"
            style={accentColor ? { '--mobile-nav-accent': accentColor } : undefined}
        >
            <div className="mobile-bottom-nav__inner" ref={innerRef}>
                {/* Floating circle indicator — slides to the active item and carries its
                    icon, perfectly centred, so it moves smoothly from one button to another. */}
                <span
                    className="mobile-bottom-nav__circle"
                    aria-hidden="true"
                    style={{
                        transform: `translateX(calc(${circle.cx}px - 50%))`,
                        opacity: circle.visible ? 1 : 0,
                    }}
                >
                    {ActiveIcon && <ActiveIcon size={23} strokeWidth={2.4} color="#fff" />}
                </span>
                {slots.map(renderItem)}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
