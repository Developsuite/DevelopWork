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
        // Never return the internal 'General Operations' container as a user-facing project
        return (data || []).filter(p => p.name !== 'General Operations');
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_members(user_id, role, profiles!project_members_user_id_fkey(name, avatar_url))')
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
        return (data || []).filter(p => p.name !== 'General Operations');
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
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*, projects(name)')
                .order('created_at', { ascending: false });
            if (error) {
                console.warn('[projectService] getAllTasks fallback query:', error.message);
                const { data: fallbackData } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('created_at', { ascending: false });
                return (fallbackData || []).map(t => {
                    const isOp = !t.project_id || t.project_name === 'General Operations' || t.project_name === 'General Operational';
                    return {
                        ...t,
                        task_type: isOp ? 'operational' : 'project',
                        is_operational: isOp,
                        project_name: isOp ? null : (t.project_name || 'Project Deliverable')
                    };
                });
            }
            return (data || []).map(t => {
                const rawName = t.projects?.name;
                const isOp = !t.project_id || !rawName || rawName === 'General Operations' || rawName === 'General Operational';
                return {
                    ...t,
                    task_type: isOp ? 'operational' : 'project',
                    is_operational: isOp,
                    project_name: isOp ? null : rawName
                };
            });
        } catch (err) {
            console.error('[projectService] getAllTasks error:', err);
            return [];
        }
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

    async getOrCreateDefaultProject() {
        try {
            // First check if hidden system project "General Operations" already exists
            const { data: existing, error: findError } = await supabase
                .from('projects')
                .select('id, name')
                .eq('name', 'General Operations')
                .limit(1);

            if (!findError && existing && existing.length > 0) {
                return existing[0];
            }

            // Create default project "General Operations"
            const { data: created, error: createError } = await supabase
                .from('projects')
                .insert({
                    name: 'General Operations',
                    description: 'Default operational workspace for general tasks, department deliverables, and organizational assignments.',
                    status: 'In Progress',
                    priority: 'Medium',
                    color: '#579BFC'
                })
                .select('id, name')
                .single();

            if (!createError && created) {
                return created;
            }
        } catch (e) {
            console.warn('[projectService] getOrCreateDefaultProject error:', e);
        }
        return null;
    },

    async getTasksByAssignee(userId, userName, userEmail) {
        try {
            const tasksMap = new Map();

            // 1. Fetch by assignee_id (clean, exact match)
            if (userId) {
                try {
                    const { data: idTasks, error: idError } = await supabase
                        .from('tasks')
                        .select('*, projects(name)')
                        .eq('assignee_id', userId)
                        .order('created_at', { ascending: false });

                    if (!idError && idTasks) {
                        idTasks.forEach(t => tasksMap.set(t.id, t));
                    }
                } catch (e) {
                    console.warn('[projectService] getTasksByAssignee by assignee_id warning:', e);
                }
            }

            // 2. Fetch by assignee_name (case-insensitive substring match)
            if (userName && typeof userName === 'string' && userName.trim()) {
                try {
                    const cleanName = userName.trim();
                    const { data: nameTasks, error: nameError } = await supabase
                        .from('tasks')
                        .select('*, projects(name)')
                        .ilike('assignee_name', `%${cleanName}%`)
                        .order('created_at', { ascending: false });

                    if (!nameError && nameTasks) {
                        nameTasks.forEach(t => tasksMap.set(t.id, t));
                    }
                } catch (e) {
                    console.warn('[projectService] getTasksByAssignee by assignee_name warning:', e);
                }
            }

            // 3. Fetch by assignee_name matching userEmail if available
            if (userEmail && typeof userEmail === 'string' && userEmail.trim()) {
                try {
                    const cleanEmail = userEmail.trim();
                    const { data: emailTasks, error: emailError } = await supabase
                        .from('tasks')
                        .select('*, projects(name)')
                        .ilike('assignee_name', `%${cleanEmail}%`)
                        .order('created_at', { ascending: false });

                    if (!emailError && emailTasks) {
                        emailTasks.forEach(t => tasksMap.set(t.id, t));
                    }
                } catch (e) {
                    console.warn('[projectService] getTasksByAssignee by userEmail warning:', e);
                }
            }

            // 4. Fallback: If foreign key join returned empty or had an issue, fetch without join
            if (tasksMap.size === 0 && userId) {
                try {
                    const { data: fallbackTasks } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('assignee_id', userId)
                        .order('created_at', { ascending: false });

                    if (fallbackTasks) {
                        fallbackTasks.forEach(t => tasksMap.set(t.id, t));
                    }
                } catch (e) {
                    console.warn('[projectService] getTasksByAssignee fallback warning:', e);
                }
            }

            const taskList = Array.from(tasksMap.values());
            return taskList.map(t => {
                const rawName = t.projects?.name;
                const isOp = !t.project_id || !rawName || rawName === 'General Operations' || rawName === 'General Operational';
                return {
                    ...t,
                    task_type: isOp ? 'operational' : 'project',
                    is_operational: isOp,
                    project_name: isOp ? null : rawName
                };
            }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } catch (err) {
            console.error('[projectService] getTasksByAssignee failed:', err);
            return [];
        }
    },

    async createTask(task) {
        let payload = { ...task };

        // Clean empty project_id
        if (payload.project_id === '' || payload.project_id === undefined) {
            delete payload.project_id;
        }

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert(payload)
                .select()
                .single();

            if (error) {
                // If violated project_id not-null constraint (or if column not nullable yet)
                const isNotNullConstraint = 
                    error.code === '23502' ||
                    error.message?.includes('project_id') ||
                    error.message?.includes('not-null constraint');

                if (isNotNullConstraint) {
                    console.info('[projectService] Resolving default project for operational task...');
                    const defaultProj = await this.getOrCreateDefaultProject();
                    if (defaultProj?.id) {
                        payload.project_id = defaultProj.id;
                        const retry = await supabase
                            .from('tasks')
                            .insert(payload)
                            .select()
                            .single();
                        if (retry.error) throw retry.error;
                        window.dispatchEvent(new CustomEvent('dwTasksUpdated', { detail: retry.data }));
                        return retry.data;
                    }
                }
                throw error;
            }

            window.dispatchEvent(new CustomEvent('dwTasksUpdated', { detail: data }));
            return data;
        } catch (err) {
            // Check if error caught from throw is not-null constraint
            const isNotNullConstraint = 
                err.code === '23502' ||
                err.message?.includes('project_id') ||
                err.message?.includes('not-null constraint');

            if (isNotNullConstraint) {
                const defaultProj = await this.getOrCreateDefaultProject();
                if (defaultProj?.id) {
                    payload.project_id = defaultProj.id;
                    const { data: retryData, error: retryErr } = await supabase
                        .from('tasks')
                        .insert(payload)
                        .select()
                        .single();
                    if (retryErr) throw retryErr;
                    window.dispatchEvent(new CustomEvent('dwTasksUpdated', { detail: retryData }));
                    return retryData;
                }
            }
            throw err;
        }
    },

    async updateTask(id, updates) {
        let payload = { ...updates };
        if (payload.project_id === '' || payload.project_id === undefined) {
            delete payload.project_id;
        }

        const { data, error } = await supabase
            .from('tasks')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            const isNotNullConstraint = 
                error.code === '23502' ||
                error.message?.includes('project_id') ||
                error.message?.includes('not-null constraint');

            if (isNotNullConstraint) {
                const defaultProj = await this.getOrCreateDefaultProject();
                if (defaultProj?.id) {
                    payload.project_id = defaultProj.id;
                    const retry = await supabase
                        .from('tasks')
                        .update(payload)
                        .eq('id', id)
                        .select()
                        .single();
                    if (retry.error) throw retry.error;
                    window.dispatchEvent(new CustomEvent('dwTasksUpdated', { detail: retry.data }));
                    return retry.data;
                }
            }
            throw error;
        }

        window.dispatchEvent(new CustomEvent('dwTasksUpdated', { detail: data }));
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
            .select('*, profiles:profiles!task_comments_user_id_fkey(name, avatar_url)')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    async addComment(comment) {
        const { data, error } = await supabase
            .from('task_comments')
            .insert(comment)
            .select('*, profiles:profiles!task_comments_user_id_fkey(name, avatar_url)')
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
            .select('*, profiles:profiles!project_members_user_id_fkey(id, name, email, avatar_url, department)')
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
