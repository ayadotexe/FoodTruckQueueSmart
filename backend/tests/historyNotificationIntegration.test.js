
jest.mock('../services/history', () => ({
    EVENTS: {
        JOINED: 'JOINED',
        LEFT: 'LEFT',
        SERVED: 'SERVED'
    },
    getHistory: jest.fn(),
    record: jest.fn()
}));

jest.mock('../services/notification', () => ({
    TYPES: {
        JOINED: 'JOINED',
        NEAR_FRONT: 'NEAR_FRONT',
        SERVED: 'SERVED'
    },
    getNotifications: jest.fn(),
    markAsViewed: jest.fn(),
    notify: jest.fn()
}));

jest.mock('../services/queueService', () => ({
    createQueueService: jest.fn(() => ({
        joinQueue: jest.fn(),
        leaveQueue: jest.fn(),
        getStatus: jest.fn(),
        getQueue: jest.fn(),
        getSummary: jest.fn(),
        serveNext: jest.fn()
    }))
}));

const history = require('../services/history');
const notification = require('../services/notification');
const queueService = require('../services/queueService');
const controller = require('../controllers/queueController');

const queue = queueService.createQueueService.mock.results[0].value;

const USER_ID = '11111111-1111-4111-8111-111111111111';

function mockResponse() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('History and Queue Controller Integration', () => {

    test('records JOINED history when a user joins the queue', async () => {
        const result = {
            userId: USER_ID,
            entryId: 101,
            position: 1
        };

        queue.joinQueue.mockReturnValue(result);
        history.record.mockResolvedValue({});

        const req = {
            body: { name: 'Aya' }
        };

        const res = mockResponse();

        await controller.joinQueue(req, res);

        expect(history.record).toHaveBeenCalledWith(
            USER_ID,
            {
                entryId: 101,
                event: history.EVENTS.JOINED,
                position: 1
            }
        );

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(result);
    });

    test('records LEFT history when a user leaves the queue', async () => {
        const result = {
            userId: USER_ID,
            entryId: 102
        };

        queue.getStatus.mockReturnValue({
            position: 2
        });

        queue.leaveQueue.mockReturnValue(result);
        history.record.mockResolvedValue({});

        const req = {
            params: { userId: USER_ID }
        };

        const res = mockResponse();

        await controller.leaveQueue(req, res);

        expect(history.record).toHaveBeenCalledWith(
            USER_ID,
            {
                entryId: 102,
                event: history.EVENTS.LEFT,
                position: 2
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(result);
    });

    test('records SERVED history when a user is served', async () => {
        const result = {
            userId: USER_ID,
            entryId: 103
        };

        queue.serveNext.mockReturnValue(result);
        history.record.mockResolvedValue({});

        const req = {};
        const res = mockResponse();

        await controller.serveNext(req, res);

        expect(history.record).toHaveBeenCalledWith(
            USER_ID,
            {
                entryId: 103,
                event: history.EVENTS.SERVED,
                position: null
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(result);
    });

    test('does not record history when the database entry ID is missing', async () => {
        const result = {
            userId: USER_ID,
            position: 1
        };

        queue.joinQueue.mockReturnValue(result);

        const warnSpy = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => {});

        const req = {
            body: { name: 'Aya' }
        };

        const res = mockResponse();

        try {
            await controller.joinQueue(req, res);

            expect(history.record).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(result);
        } finally {
            warnSpy.mockRestore();
        }
    });
});


describe('Notification and Queue Controller Integration', () => {

    const onNotify =
        queueService.createQueueService.mock.calls[0][0].onNotify;

    test.each([
        ['JOINED', notification.TYPES.JOINED],
        ['NEAR_FRONT', notification.TYPES.NEAR_FRONT],
        ['SERVED', notification.TYPES.SERVED]
    ])('saves a %s notification', (eventType, expectedType) => {

        notification.notify.mockResolvedValue({});

        const event = {
            type: eventType,
            userId: USER_ID,
            message: 'Queue update',
            entryId: 105
        };

        onNotify(event);

        expect(notification.notify).toHaveBeenCalledWith(
            USER_ID,
            expectedType,
            'Queue update',
            { entryId: 105 }
        );
    });

    test('does not save unsupported notification types', () => {
        onNotify({
            type: 'UNKNOWN',
            userId: USER_ID,
            message: 'Unknown event',
            entryId: 106
        });

        expect(notification.notify).not.toHaveBeenCalled();
    });

    test('uses null when notification entryId is missing', () => {
        notification.notify.mockResolvedValue({});

        onNotify({
            type: 'JOINED',
            userId: USER_ID,
            message: 'Joined queue'
        });

        expect(notification.notify).toHaveBeenCalledWith(
            USER_ID,
            notification.TYPES.JOINED,
            'Joined queue',
            { entryId: null }
        );
    });

    test('handles notification saving failures without crashing', async () => {
        const error = new Error('Database insert failed');

        notification.notify.mockRejectedValue(error);

        const errorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        try {
            expect(() => {
                onNotify({
                    type: 'JOINED',
                    userId: USER_ID,
                    message: 'Joined queue',
                    entryId: 107
                });
            }).not.toThrow();

            await Promise.resolve();

            expect(errorSpy).toHaveBeenCalledWith(
                'Failed to save notification:',
                error
            );
        } finally {
            errorSpy.mockRestore();
        }
    });
});
