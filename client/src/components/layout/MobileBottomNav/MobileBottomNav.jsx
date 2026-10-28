import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const MobileBottomNav = ({ items = [], homeItem, settingsItem, onMore, accentColor }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const innerRef = useRef(null);
    const itemRefs = useRef({});
    const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false });

    const shortcuts = items.filter(Boolean).slice(0, 2);

    // Build the ordered list of rendered buttons so the indicator can locate the active one.
    const slots = [];
    shortcuts.forEach((item, i) => slots.push({ key: `shortcut-${i}`, item, position: `shortcut-${i}` }));
    if (homeItem) slots.push({ key: 'home', item: homeItem, position: 'home' });
    if (settingsItem) slots.push({ key: 'settings', item: settingsItem, position: 'settings' });
    slots.push({ key: 'more', item: { label: 'More', onClick: onMore, icon: MoreHorizontal }, position: 'more' });

    const activeKey = (() => {
        // The home item has its own visual treatment (floating circle) so we skip the
        // sliding pill when it is the active one — the circle itself is the indicator.
        for (const s of slots) {
            if (s.position === 'home') continue;
            if (s.item?.path && isItemActive(s.item, location)) return s.key;
        }
        return null;
    })();

    useLayoutEffect(() => {
        const measure = () => {
            if (!activeKey) {
                setIndicator((prev) => ({ ...prev, visible: false }));
                return;
            }
            const container = innerRef.current;
            const el = itemRefs.current[activeKey];
            if (!container || !el) return;
            const cRect = container.getBoundingClientRect();
            const eRect = el.getBoundingClientRect();
            setIndicator({
                x: eRect.left - cRect.left,
                w: eRect.width,
                visible: true,
            });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [activeKey, location.pathname, location.search]);

    const renderItem = (slot) => {
        const { item, position, key } = slot;
        const Icon = item.icon;
        const active = key === activeKey;
        const isHome = position === 'home';
        const isMore = position === 'more';

        return (
            <button
                ref={(el) => { if (el) itemRefs.current[key] = el; else delete itemRefs.current[key]; }}
                key={key}
                type="button"
                className={`mobile-bottom-nav__item ${isHome ? 'mobile-bottom-nav__item--home' : ''} ${active ? 'active' : ''}`}
                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
            >
                <span className="mobile-bottom-nav__icon-wrap">
                    <Icon size={isHome ? 25 : 21} strokeWidth={active || isHome ? 2.35 : 1.9} />
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

    return (
        <nav
            className="mobile-bottom-nav"
            aria-label="Mobile navigation"
            style={accentColor ? { '--mobile-nav-accent': accentColor } : undefined}
        >
            <div className="mobile-bottom-nav__inner" ref={innerRef}>
                <span
                    className="mobile-bottom-nav__pill"
                    aria-hidden="true"
                    style={{
                        transform: `translateX(${indicator.x}px)`,
                        width: `${indicator.w}px`,
                        opacity: indicator.visible ? 1 : 0,
                    }}
                />
                {slots.map(renderItem)}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
