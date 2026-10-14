// Supabase awaits auth listeners while holding its session lock. Defer callbacks
// to a new task so queries inside a listener can safely obtain that same lock.
export function subscribeToAuthStateChanges(auth, callback) {
    let active = true;
    const pendingTimers = new Set();

    const result = auth.onAuthStateChange((event, session) => {
        const timer = setTimeout(() => {
            pendingTimers.delete(timer);
            if (!active) return;

            Promise.resolve()
                .then(() => callback(event, session))
                .catch((error) => console.error('[Auth] State change handler failed:', error));
        }, 0);
        pendingTimers.add(timer);
    });

    return {
        ...result,
        data: {
            ...result.data,
            subscription: {
                ...result.data?.subscription,
                unsubscribe() {
                    active = false;
                    pendingTimers.forEach((timer) => clearTimeout(timer));
                    pendingTimers.clear();
                    return result.data?.subscription?.unsubscribe();
                },
            },
        },
    };
}
