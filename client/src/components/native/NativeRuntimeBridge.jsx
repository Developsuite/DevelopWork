import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { fetchNotifications } from '../../store/slices/notificationsSlice';
import { nativePushService } from '../../services/nativePushService';

const safeRouteFrom = (value) => {
    if (!value || typeof value !== 'string') return null;
    try {
        const url = value.startsWith('http') ? new URL(value) : null;
        const route = url ? `${url.pathname}${url.search}` : value;
        return route.startsWith('/') && !route.startsWith('//') ? route : null;
    } catch {
        return null;
    }
};

const routeForNotification = (notification, role) => {
    const data = notification?.data || {};
    const explicitRoute = safeRouteFrom(data.action_url || data.path || data.route);
    if (explicitRoute) return explicitRoute;
    if (data.task_id) {
        if (role === 'manager') return '/manager/tasks?tab=all';
        if (role === 'employee') return '/employee/dashboard';
        return '/tasks?tab=all';
    }
    return null;
};

const NativeRuntimeBridge = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth.user?.id);
    const userRole = useSelector((state) => state.auth.user?.role);
    const theme = useSelector((state) => state.ui.theme);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return undefined;

        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#060709' : '#FFFFFF' }).catch(() => {});
        StatusBar.setStyle({ style: theme === 'dark' ? Style.Light : Style.Dark }).catch(() => {});
        SplashScreen.hide().catch(() => {});
        return undefined;
    }, [theme]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return undefined;

        let urlHandle;
        let stateHandle;
        let cancelled = false;

        const setup = async () => {
            urlHandle = await App.addListener('appUrlOpen', ({ url }) => {
                const route = safeRouteFrom(url);
                if (route) navigate(route);
            });
            stateHandle = await App.addListener('appStateChange', ({ isActive }) => {
                if (isActive && userId) dispatch(fetchNotifications(userId));
            });
            if (cancelled) {
                urlHandle.remove();
                stateHandle.remove();
            }
        };

        setup();
        return () => {
            cancelled = true;
            urlHandle?.remove();
            stateHandle?.remove();
        };
    }, [dispatch, navigate, userId]);

    useEffect(() => {
        if (!userId || !nativePushService.isAvailable()) return undefined;

        let cleanup = () => {};
        let cancelled = false;
        nativePushService.initialize(userId, {
            onNotification: () => dispatch(fetchNotifications(userId)),
            onAction: (notification) => {
                dispatch(fetchNotifications(userId));
                const route = routeForNotification(notification, userRole);
                if (route) navigate(route);
            },
        }).then((removeListeners) => {
            if (cancelled) removeListeners();
            else cleanup = removeListeners;
        }).catch((error) => console.error('[Push] Initialization failed:', error));

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [dispatch, navigate, userId, userRole]);

    return null;
};

export default NativeRuntimeBridge;
