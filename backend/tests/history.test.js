jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

const db = require('../config/db');
const history = require('../services/history');

const USER_ID = '12345678-1234-1234-1234-123456789012';
const OTHER_USER_ID = '87654321-4321-4321-4321-210987654321';

beforeEach(() => {
  jest.clearAllMocks();
});

test('records a JOINED event and returns the saved record', async () => {
  const savedRecord = {
    history_id: 1,
    entry_id: 10,
    event: 'JOINED',
    position: 3,
    created_at: '2026-11-06 10:00:00'
  };

  db.execute
    .mockResolvedValueOnce([{ affectedRows: 1, insertId: 1 }])
    .mockResolvedValueOnce([[savedRecord]]);

  const result = await history.record(USER_ID, {
    entryId: 10,
    event: history.EVENTS.JOINED,
    position: 3
  });

  expect(result).toEqual(savedRecord);
  expect(db.execute).toHaveBeenCalledTimes(2);
  expect(db.execute.mock.calls[0][1]).toEqual([
    'JOINED',
    3,
    10,
    USER_ID
  ]);
});

test('allows a null position', async () => {
  db.execute
    .mockResolvedValueOnce([{ affectedRows: 1, insertId: 2 }])
    .mockResolvedValueOnce([[
      { history_id: 2, entry_id: 10, event: 'SERVED', position: null }
    ]]);

  const result = await history.record(USER_ID, {
    entryId: 10,
    event: history.EVENTS.SERVED
  });

  expect(result.position).toBeNull();
});

test('rejects an invalid user ID', async () => {
  await expect(
    history.record('u1', {
      entryId: 10,
      event: history.EVENTS.JOINED
    })
  ).rejects.toThrow('A valid user ID is required.');

  expect(db.execute).not.toHaveBeenCalled();
});

test('rejects an invalid entry ID', async () => {
  await expect(
    history.record(USER_ID, {
      entryId: 0,
      event: history.EVENTS.JOINED
    })
  ).rejects.toThrow('A valid queue entry ID is required.');
});

test('rejects an invalid event', async () => {
  await expect(
    history.record(USER_ID, {
      entryId: 10,
      event: 'INVALID'
    })
  ).rejects.toThrow('Invalid history event.');
});

test('rejects an invalid position', async () => {
  await expect(
    history.record(USER_ID, {
      entryId: 10,
      event: history.EVENTS.JOINED,
      position: -1
    })
  ).rejects.toThrow('Position must be a non-negative integer or null.');
});

test('rejects a queue entry that does not belong to the user', async () => {
  db.execute.mockResolvedValueOnce([{ affectedRows: 0, insertId: 0 }]);

  await expect(
    history.record(USER_ID, {
      entryId: 10,
      event: history.EVENTS.JOINED
    })
  ).rejects.toThrow('Queue entry not found for this user.');

  expect(db.execute).toHaveBeenCalledTimes(1);
});

test('retrieves history for the requested user', async () => {
  const records = [
    { history_id: 2, event: 'SERVED' },
    { history_id: 1, event: 'JOINED' }
  ];

  db.execute.mockResolvedValueOnce([records]);

  const result = await history.getHistory(USER_ID);

  expect(result).toEqual(records);
  expect(db.execute).toHaveBeenCalledWith(
    expect.stringContaining('WHERE co.user_id = ?'),
    [USER_ID]
  );
});

test('does not retrieve history with an invalid user ID', async () => {
  await expect(history.getHistory('u1'))
    .rejects.toThrow('A valid user ID is required.');

  expect(db.execute).not.toHaveBeenCalled();
});

test('handles database errors when recording history', async () => {
  db.execute.mockRejectedValueOnce(new Error('Database error'));

  await expect(
    history.record(USER_ID, {
      entryId: 10,
      event: history.EVENTS.JOINED
    })
  ).rejects.toThrow('Database error');
});

test('handles database errors when retrieving history', async () => {
  db.execute.mockRejectedValueOnce(new Error('Database error'));

  await expect(history.getHistory(USER_ID))
    .rejects.toThrow('Database error');
});

test('handles a missing record after insertion', async () => {
  db.execute
    .mockResolvedValueOnce([{ affectedRows: 1, insertId: 3 }])
    .mockResolvedValueOnce([[]]);

  await expect(
    history.record(USER_ID, {
      entryId: 10,
      event: history.EVENTS.JOINED
    })
  ).rejects.toThrow('Could not retrieve the saved history record.');
});