import { supabase } from '../lib/supabase';

export const notificationService = {
    async getForUser(userId, limit = 30) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    async create(notification) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async markRead(id) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        if (error) throw error;
    },

    async markAllRead(userId) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('recipient_id', userId)
            .eq('read', false);
        if (error) throw error;
    },

    async deleteOne(id) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Subscribe to real-time new notifications for a user
    subscribeToUser(userId, onNew) {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`,
                },
                (payload) => onNew(payload.new)
            )
            .subscribe();
    },

    unsubscribe(channel) {
        if (channel) supabase.removeChannel(channel);
    },

    // Fetch all admin user IDs in the org to notify them on task completion
    async getAdminUserIds() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('role', 'admin');
        if (error) {
            console.warn('[notificationService] getAdminUserIds error:', error.message);
            return [];
        }
        return (data || []).map(p => p.id);
    },

    // Fire task-completed notifications: notify the employee + all admins
    async notifyTaskCompleted({ taskId, taskTitle, senderId, senderName }) {
        try {
            const adminIds = await this.getAdminUserIds();

            // Build recipient set: admins + the employee themselves (if not already admin)
            const recipientSet = new Set(adminIds);
            if (senderId) recipientSet.add(senderId);

            const rows = [...recipientSet].map(recipientId => ({
                recipient_id: recipientId,
                sender_id: senderId || null,
                sender_name: senderName || 'Someone',
                type: 'task_completed',
                title: 'Task Completed',
                message: `${senderName || 'An employee'} completed "${taskTitle}"`,
                task_id: taskId || null,
                task_title: taskTitle || null,
                read: false,
            }));

            if (rows.length === 0) return;

            const { error } = await supabase.from('notifications').insert(rows);
            if (error) console.warn('[notificationService] notifyTaskCompleted insert error:', error.message);
        } catch (err) {
            console.warn('[notificationService] notifyTaskCompleted failed:', err);
        }
    },
};
