import { supabase } from '../lib/supabase';

// ========================
// PROJECTS
// ========================

export const projectService = {
    async getAll() {
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_members(user_id, role)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_members(user_id, role, profiles(name, avatar_url))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getByClient(clientId) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(project) {
        const { data, error } = await supabase
            .from('projects')
            .insert(project)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    },

    // ========================
    // TASKS
    // ========================

    async getAllTasks() {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, projects!inner(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(t => ({ ...t, project_name: t.projects?.name || 'Unknown' }));
    },

    async getTasks(projectId, sprintId = null) {
        let query = supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true });
        if (sprintId) query = query.eq('sprint_id', sprintId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getTasksByAssignee(userId, userName) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, projects!inner(name)')
            .or(`assignee_id.eq.${userId},assignee_name.ilike.${userName}`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(t => ({ ...t, project_name: t.projects?.name || 'Unknown' }));
    },

    async createTask(task) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateTask(id, updates) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteTask(id) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    },

    async batchUpdateTasks(updates) {
        // updates = [{id, ...fields}, ...]
        const promises = updates.map(({ id, ...fields }) =>
            supabase.from('tasks').update(fields).eq('id', id)
        );
        const results = await Promise.all(promises);
        const failed = results.filter(r => r.error);
        if (failed.length) throw new Error(`${failed.length} task updates failed`);
    },

    // ========================
    // SPRINTS
    // ========================

    async getSprints(projectId) {
        const { data, error } = await supabase
            .from('sprints')
            .select('*')
            .eq('project_id', projectId)
            .order('start_date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createSprint(sprint) {
        const { data, error } = await supabase
            .from('sprints')
            .insert(sprint)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateSprint(id, updates) {
        const { data, error } = await supabase
            .from('sprints')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ========================
    // BOARDS
    // ========================

    async getBoard(boardId) {
        const { data, error } = await supabase
            .from('boards')
            .select(`
                *,
                board_columns(*, id, name, type, width, position, options),
                board_groups(*, id, name, color, position, collapsed)
            `)
            .eq('id', boardId)
            .single();
        if (error) throw error;
        return data;
    },

    async getBoardItems(boardId) {
        const { data, error } = await supabase
            .from('board_items')
            .select('*')
            .eq('board_id', boardId)
            .order('position', { ascending: true });
        if (error) throw error;
        return data;
    },

    async updateBoardItem(id, updates) {
        const { data, error } = await supabase
            .from('board_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ========================
    // COMMENTS
    // ========================

    async getComments(taskId) {
        const { data, error } = await supabase
            .from('task_comments')
            .select('*, profiles:user_id(name, avatar_url)')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async addComment(comment) {
        const { data, error } = await supabase
            .from('task_comments')
            .insert(comment)
            .select('*, profiles:user_id(name, avatar_url)')
            .single();
        if (error) throw error;
        return data;
    },

    // ========================
    // LABELS
    // ========================

    async getLabels(projectId) {
        const { data, error } = await supabase
            .from('labels')
            .select('*')
            .eq('project_id', projectId)
            .order('name');
        if (error) throw error;
        return data;
    },

    // ========================
    // MEMBERS
    // ========================

    async getMembers(projectId) {
        const { data, error } = await supabase
            .from('project_members')
            .select('*, profiles:user_id(id, name, email, avatar_url, department)')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },

    async addMember(projectId, userId, role = 'member') {
        const { data, error } = await supabase
            .from('project_members')
            .insert({ project_id: projectId, user_id: userId, role })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async removeMember(projectId, userId) {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId);
        if (error) throw error;
    },
};
