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
const controller = require('../controllers/queueController');

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

describe('History and Notification Controller', () => {

    test('gets history for the requested user', async () => {
        const records = [
            { history_id: 1, event: 'JOINED' }
        ];

        history.getHistory.mockResolvedValue(records);

        const req = {
            params: { userId: USER_ID }
        };

        const res = mockResponse();

        await controller.getHistory(req, res);

        expect(history.getHistory).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(records);
    });

    test('gets notifications for the requested user', async () => {
        const records = [
            { notification_id: 1, user_id: USER_ID, type: 'JOINED' }
        ];

        notification.getNotifications.mockResolvedValue(records);

        const req = {
            params: { userId: USER_ID }
        };

        const res = mockResponse();

        await controller.getNotifications(req, res);

        expect(notification.getNotifications)
            .toHaveBeenCalledWith(USER_ID);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(records);
    });

    test('marks a notification as viewed', async () => {
        const result = {
            message: 'Notification marked as viewed.'
        };

        notification.markAsViewed.mockResolvedValue(result);

        const req = {
            params: {
                userId: USER_ID,
                notificationId: '5'
            }
        };

        const res = mockResponse();

        await controller.markNotificationAsViewed(req, res);

        expect(notification.markAsViewed)
            .toHaveBeenCalledWith(5, USER_ID);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(result);
    });
});