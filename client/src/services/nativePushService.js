import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

const TOKEN_KEY = 'dw-native-push-token';

const getProvider = () => Capacitor.getPlatform() === 'ios' ? 'apns' : 'fcm';

const persistToken = async (token, userId) => {
    const { error } = await supabase.rpc('register_push_device', {
        p_token: token,
        p_platform: Capacitor.getPlatform(),
        p_provider: getProvider(),
        p_app_version: null,
    });
    if (error) throw error;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, userId }));
};

export const nativePushService = {
    isAvailable() {
        return Capacitor.isNativePlatform();
    },

    async initialize(userId, { onNotification, onAction, onError } = {}) {
        if (!this.isAvailable() || !userId) return () => {};

        if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
                id: 'developwork_updates',
                name: 'DevelopWork updates',
                description: 'Tasks, meetings, approvals, and workspace updates',
                importance: 5,
                visibility: 1,
                vibration: true,
            });
        }

        const handles = await Promise.all([
            PushNotifications.addListener('registration', async ({ value }) => {
                try {
                    await persistToken(value, userId);
                } catch (error) {
                    console.error('[Push] Could not store device token:', error);
                    onError?.(error);
                }
            }),
            PushNotifications.addListener('registrationError', (error) => {
                console.error('[Push] Native registration failed:', error);
                onError?.(error);
            }),
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                onNotification?.(notification);
            }),
            PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
                onAction?.(notification);
            }),
        ]);

        const permission = await PushNotifications.checkPermissions();
        const result = permission.receive === 'prompt'
            ? await PushNotifications.requestPermissions()
            : permission;

        if (result.receive === 'granted') await PushNotifications.register();

        return () => handles.forEach((handle) => handle.remove());
    },

    async unregisterCurrentDevice() {
        if (!this.isAvailable()) return;

        try {
            const stored = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
            if (stored?.token) {
                await supabase.rpc('unregister_push_device', { p_token: stored.token });
            }
        } catch (error) {
            console.warn('[Push] Device token cleanup failed:', error);
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            try {
                await PushNotifications.unregister();
            } catch {
                // Not every native platform version exposes unregister support.
            }
        }
    },
};
