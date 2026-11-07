
jest.mock('../config/db', () => ({
    execute: jest.fn()
}));

const db = require('../config/db');
const notification = require('../services/notification');

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
    jest.clearAllMocks();
});

// Simulates MySQL inserting and retrieving a notification.
function mockSave(id, userId, type, message, entryId = null) {
    const row = {
        id,
        userId,
        type,
        message,
        entryId,
        createdAt: new Date(),
        status: 'sent'
    };

    db.execute
        .mockResolvedValueOnce([{ insertId: id }, []])
        .mockResolvedValueOnce([[row], []]);
}

describe('Notification Service', () => {

    test('notifyJoined saves a JOINED notification', async () => {
        mockSave(1, USER_A, 'JOINED',
            'Aya, you joined the queue at taco-1. Your position: 4.');

        const result = await notification.notifyJoined(
            USER_A, 'Aya', 'taco-1', 4
        );

        expect(result).toMatchObject({
            id: 1,
            userId: USER_A,
            type: 'JOINED',
            status: 'sent'
        });

        expect(result.message).toContain('Aya');
        expect(db.execute).toHaveBeenCalledTimes(2);
    });

    test('saves a notification with an entry ID', async () => {
        mockSave(2, USER_A, 'SERVED', 'Order ready', 15);

        const result = await notification.notify(
            USER_A, 'SERVED', 'Order ready', { entryId: 15 }
        );

        expect(result.entryId).toBe(15);
        expect(db.execute.mock.calls[0][1]).toEqual([
            USER_A, 15, 'SERVED', 'Order ready'
        ]);
    });

    test('checkNearTurn notifies only the first two users', async () => {
        const queue = [
            { userId: USER_A, name: 'Aya', entryId: 1, nearNotified: false },
            { userId: USER_B, name: 'Bob', entryId: 2, nearNotified: false },
            { userId: '33333333-3333-4333-8333-333333333333',
              name: 'Sam', entryId: 3, nearNotified: false }
        ];

        mockSave(3, USER_A, 'NEAR_FRONT', "Aya, you're next at t1! Head to the truck.", 1);
        mockSave(4, USER_B, 'NEAR_FRONT', "Bob, you're almost up at t1 (position 2).", 2);

        const sent = await notification.checkNearTurn('t1', queue);

        expect(sent).toHaveLength(2);
        expect(queue[0].nearNotified).toBe(true);
        expect(queue[1].nearNotified).toBe(true);
        expect(queue[2].nearNotified).toBe(false);
    });

    test('does not notify the same user twice', async () => {
        const queue = [
            { userId: USER_A, name: 'Aya', nearNotified: true }
        ];

        const sent = await notification.checkNearTurn('t1', queue);

        expect(sent).toHaveLength(0);
        expect(db.execute).not.toHaveBeenCalled();
    });

    test('does not mark nearNotified if database insert fails', async () => {
        const queue = [
            { userId: USER_A, name: 'Aya', nearNotified: false }
        ];

        db.execute.mockRejectedValueOnce(
            new Error('Database connection failed')
        );

        await expect(
            notification.checkNearTurn('t1', queue)
        ).rejects.toThrow('Database connection failed');

        expect(queue[0].nearNotified).toBe(false);
    });

    test('notifyServed saves a SERVED notification', async () => {
        mockSave(5, USER_A, 'SERVED', 'Aya, your order is ready at t1!');

        const result = await notification.notifyServed(
            USER_A, 'Aya', 't1'
        );

        expect(result.type).toBe('SERVED');
    });

    test('retrieves only the requested user notifications', async () => {
        db.execute.mockResolvedValueOnce([[
            { id: 1, userId: USER_A, type: 'JOINED' }
        ], []]);

        const result = await notification.getNotifications(USER_A);

        expect(result).toHaveLength(1);
        expect(db.execute.mock.calls[0][1]).toEqual([USER_A]);
    });

    test('marks a notification as viewed', async () => {
        db.execute.mockResolvedValueOnce([
            { affectedRows: 1 }, []
        ]);

        const result = await notification.markAsViewed(1, USER_A);

        expect(result.message).toBe('Notification marked as viewed.');

        expect(db.execute.mock.calls[0][1]).toEqual([
            1, USER_A
        ]);
    });

    test('does not allow another user to mark a notification viewed', async () => {
        db.execute.mockResolvedValueOnce([
            { affectedRows: 0 }, []
        ]);

        await expect(
            notification.markAsViewed(1, USER_B)
        ).rejects.toThrow('Notification not found for this user.');
    });

    test('rejects invalid notification types', async () => {
        await expect(
            notification.notify(USER_A, 'INVALID', 'Test')
        ).rejects.toThrow('Invalid notification type.');

        expect(db.execute).not.toHaveBeenCalled();
    });

    test('rejects invalid user IDs', async () => {
        await expect(
            notification.notify('u1', 'JOINED', 'Test')
        ).rejects.toThrow('valid 36-character ID');

        expect(db.execute).not.toHaveBeenCalled();
    });

    test('rejects invalid entry IDs', async () => {
        await expect(
            notification.notify(
                USER_A, 'JOINED', 'Test', { entryId: -1 }
            )
        ).rejects.toThrow('positive integer');

        expect(db.execute).not.toHaveBeenCalled();
    });

    test('handles database errors', async () => {
        db.execute.mockRejectedValueOnce(
            new Error('Database error')
        );

        await expect(
            notification.notify(USER_A, 'JOINED', 'Test')
        ).rejects.toThrow('Database error');
    });

});
