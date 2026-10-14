import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToAuthStateChanges } from './authStateSubscription.js';

test('subscribeToAuthStateChanges defers callback execution to prevent lock deadlocks', async () => {
    let called = false;
    let syncOrder = [];

    const mockAuth = {
        onAuthStateChange(cb) {
            cb('SIGNED_IN', { user: { id: 'test-1' } });
            return {
                data: {
                    subscription: {
                        unsubscribe: () => { called = true; },
                    },
                },
            };
        },
    };

    const sub = subscribeToAuthStateChanges(mockAuth, (event, session) => {
        syncOrder.push('callback');
        assert.equal(event, 'SIGNED_IN');
        assert.equal(session.user.id, 'test-1');
    });

    syncOrder.push('after-subscribe');

    // Callback should not have run synchronously
    assert.deepEqual(syncOrder, ['after-subscribe']);

    // Wait for the next macrotask
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.deepEqual(syncOrder, ['after-subscribe', 'callback']);
    sub.data.subscription.unsubscribe();
    assert.equal(called, true);
});

test('unsubscribe prevents pending deferred callbacks from firing', async () => {
    let callbackFired = false;

    const mockAuth = {
        onAuthStateChange(cb) {
            cb('TOKEN_REFRESHED', { user: { id: 'test-2' } });
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {},
                    },
                },
            };
        },
    };

    const sub = subscribeToAuthStateChanges(mockAuth, () => {
        callbackFired = true;
    });

    // Unsubscribe immediately before macrotask runs
    sub.data.subscription.unsubscribe();

    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(callbackFired, false);
});
