const notification = require('../services/notification');

beforeEach(() => notification.reset());

const makeQueue = (...ids) => ids.map((id) => ({ userId: id, name: id, nearNotified: false }));

test('notifyJoined stores a JOINED notification with position', () => {
  const n = notification.notifyJoined('u1', 'Aya', 'taco-1', 4);
  expect(n).toMatchObject({ type: 'JOINED', userId: 'u1', truckId: 'taco-1', position: 4 });
  expect(n.message).toContain('Aya');
  expect(notification.getNotifications('u1')).toHaveLength(1);
});

test('checkNearTurn notifies only the first NEAR_THRESHOLD people', () => {
  const queue = makeQueue('a', 'b', 'c');
  const sent = notification.checkNearTurn('t1', queue);
  expect(sent).toHaveLength(notification.NEAR_THRESHOLD);
  expect(notification.getNotifications('c')).toEqual([]);
});

test('position 1 gets "next" wording, position 2 gets "almost up" wording', () => {
  notification.checkNearTurn('t1', makeQueue('a', 'b'));
  expect(notification.getNotifications('a')[0].message).toMatch(/you're next/);
  expect(notification.getNotifications('b')[0].message).toMatch(/almost up/);
});

test('each user is only notified once', () => {
  const queue = makeQueue('a', 'b');
  notification.checkNearTurn('t1', queue);
  expect(notification.checkNearTurn('t1', queue)).toEqual([]);
  expect(notification.getNotifications('a')).toHaveLength(1);
});

test('someone moving up into range gets notified later', () => {
  const queue = makeQueue('a', 'b', 'c');
  notification.checkNearTurn('t1', queue);
  queue.shift();
  notification.checkNearTurn('t1', queue);
  expect(notification.getNotifications('c').map((n) => n.type)).toEqual(['NEAR_TURN']);
});

test('notifyServed stores a SERVED notification', () => {
  const n = notification.notifyServed('u1', 'Aya', 't1');
  expect(n.type).toBe('SERVED');
});

test('unknown user has no notifications', () => {
  expect(notification.getNotifications('nobody')).toEqual([]);
});


test('generates unique notification IDs', () => {
  const first = notification.notifyJoined('u1', 'Aya', 't1', 1);
  const second = notification.notifyServed('u1', 'Aya', 't1');

  expect(first.id).not.toBe(second.id);
});

test('keeps notifications separate for different users', () => {
  notification.notifyJoined('u1', 'Aya', 't1', 1);
  notification.notifyJoined('u2', 'Bob', 't1', 2);

  expect(notification.getNotifications('u1')).toHaveLength(1);
  expect(notification.getNotifications('u2')).toHaveLength(1);
  expect(notification.getNotifications('u1')[0].userId).toBe('u1');
  expect(notification.getNotifications('u2')[0].userId).toBe('u2');
});
