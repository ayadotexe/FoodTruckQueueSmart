const controller = require('../controllers/queueController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
const call = (handler, { params = {}, body = {} } = {}) => {
  const res = mockRes();
  handler({ params, body }, res);
  return res;
};
const statusOf = (res) => (res.status.mock.calls.length ? res.status.mock.calls[0][0] : 200);
const bodyOf = (res) => res.json.mock.calls[0][0];
const join = (truckId, body) => call(controller.joinQueue, { params: { truckId }, body });

beforeEach(() => controller.resetAll());

describe('validation rules', () => {
  test('valid body has no errors', () => {
    expect(controller.validateJoin({ name: 'Aya', email: 'a@b.com', orderNote: 'hi', userId: 'u_1' })).toEqual([]);
  });
  test.each([null, 'text', 5, []])('rejects non-object body %p', (body) => {
    expect(controller.validateJoin(body)[0].field).toBe('body');
  });
  test('name is required and must not be blank', () => {
    expect(controller.validateJoin({})[0]).toEqual({ field: 'name', message: 'name is required' });
    expect(controller.validateJoin({ name: '   ' })).toHaveLength(1);
  });
  test('rejects wrong field types', () => {
    const fields = controller.validateJoin({ name: 1, email: 2, orderNote: {}, userId: [] }).map((e) => e.field);
    expect(fields.sort()).toEqual(['email', 'name', 'orderNote', 'userId']);
  });
  test('enforces length limits', () => {
    const fields = controller.validateJoin({
      name: 'a'.repeat(51), email: `${'a'.repeat(100)}@x.com`, orderNote: 'n'.repeat(101), userId: 'u'.repeat(51),
    }).map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'orderNote', 'userId']));
  });
  test('rejects bad email and userId format', () => {
    const fields = controller.validateJoin({ name: 'Aya', email: 'nope', userId: 'bad id!' }).map((e) => e.field);
    expect(fields.sort()).toEqual(['email', 'userId']);
  });
  test('validateId checks required, format and length', () => {
    expect(controller.validateId('truck-1', 'truckId', 30)).toEqual([]);
    expect(controller.validateId(undefined, 'truckId', 30)).toHaveLength(1);
    expect(controller.validateId('a b/c', 'userId', 50)).toHaveLength(1);
    expect(controller.validateId('t'.repeat(31), 'truckId', 30)).toHaveLength(1);
  });
});

describe('joinQueue', () => {
  test('201, returns position and notifications', () => {
    const res = join('taco-1', { name: 'Aya', userId: 'aya' });
    expect(statusOf(res)).toBe(201);
    expect(bodyOf(res).entry.position).toBe(1);
    expect(bodyOf(res).notifications.map((n) => n.type)).toEqual(['JOINED', 'NEAR_TURN']);
  });
  test('generates a userId when none is sent', () => {
    expect(bodyOf(join('t1', { name: 'Aya' })).entry.userId).toEqual(expect.any(String));
  });
  test('400 with field details for invalid body', () => {
    const res = join('t1', {});
    expect(statusOf(res)).toBe(400);
    expect(bodyOf(res).details[0].field).toBe('name');
  });
  test('400 for invalid truckId', () => {
    expect(statusOf(join('bad$id', { name: 'Aya' }))).toBe(400);
  });
  test('409 when the same user joins twice', () => {
    join('t1', { name: 'Aya', userId: 'aya' });
    expect(statusOf(join('t1', { name: 'Aya', userId: 'aya' }))).toBe(409);
  });
  test('third person is not "close" yet', () => {
    ['a', 'b'].forEach((id) => join('t1', { name: id, userId: id }));
    const res = join('t1', { name: 'c', userId: 'c' });
    expect(bodyOf(res).notifications.map((n) => n.type)).toEqual(['JOINED']);
  });
});

describe('serveNext / leaveQueue', () => {
  test('serveNext serves the first person and alerts the person moving up', () => {
    ['a', 'b', 'c'].forEach((id) => join('t1', { name: id, userId: id }));
    const res = call(controller.serveNext, { params: { truckId: 't1' } });
    expect(bodyOf(res).served.userId).toBe('a');
    const notes = bodyOf(call(controller.getNotifications, { params: { userId: 'c' } })).notifications;
    expect(notes.map((n) => n.type)).toEqual(['JOINED', 'NEAR_TURN']);
    const hist = bodyOf(call(controller.getHistory, { params: { userId: 'a' } })).history;
    expect(hist.map((h) => h.event)).toEqual(['JOINED', 'SERVED']);
  });
  test('serveNext 404 on empty queue, 400 on bad id', () => {
    expect(statusOf(call(controller.serveNext, { params: { truckId: 't1' } }))).toBe(404);
    expect(statusOf(call(controller.serveNext, { params: { truckId: 'bad$' } }))).toBe(400);
  });
  test('leaveQueue removes the user and records LEFT', () => {
    join('t1', { name: 'Aya', userId: 'aya' });
    const res = call(controller.leaveQueue, { params: { truckId: 't1', userId: 'aya' } });
    expect(bodyOf(res).removed.userId).toBe('aya');
    const hist = bodyOf(call(controller.getHistory, { params: { userId: 'aya' } })).history;
    expect(hist.map((h) => h.event)).toEqual(['JOINED', 'LEFT']);
  });
  test('leaveQueue 404 for unknown user, 400 for bad ids', () => {
    expect(statusOf(call(controller.leaveQueue, { params: { truckId: 't1', userId: 'ghost' } }))).toBe(404);
    expect(statusOf(call(controller.leaveQueue, { params: { truckId: 'bad$', userId: 'x' } }))).toBe(400);
  });
});

describe('getQueue / getPosition / getNotifications / getHistory', () => {
  test('getQueue lists entries with positions', () => {
    join('t1', { name: 'Aya', userId: 'a' });
    join('t1', { name: 'Bob', userId: 'b' });
    const body = bodyOf(call(controller.getQueue, { params: { truckId: 't1' } }));
    expect(body.length).toBe(2);
    expect(body.entries[1].position).toBe(2);
  });
  test('getQueue 400 on bad truckId', () => {
    expect(statusOf(call(controller.getQueue, { params: { truckId: 'bad$' } }))).toBe(400);
  });
  test('getPosition returns people ahead; 404 / 400 cases', () => {
    join('t1', { name: 'Aya', userId: 'a' });
    join('t1', { name: 'Bob', userId: 'b' });
    expect(bodyOf(call(controller.getPosition, { params: { truckId: 't1', userId: 'b' } }))).toMatchObject({ position: 2, peopleAhead: 1 });
    expect(statusOf(call(controller.getPosition, { params: { truckId: 't1', userId: 'zzz' } }))).toBe(404);
    expect(statusOf(call(controller.getPosition, { params: { truckId: 'bad$', userId: 'a' } }))).toBe(400);
  });
  test('notifications and history: empty for unknown user, 400 for bad id', () => {
    expect(bodyOf(call(controller.getNotifications, { params: { userId: 'nobody' } })).notifications).toEqual([]);
    expect(bodyOf(call(controller.getHistory, { params: { userId: 'nobody' } })).history).toEqual([]);
    expect(statusOf(call(controller.getNotifications, { params: { userId: 'bad$' } }))).toBe(400);
    expect(statusOf(call(controller.getHistory, { params: { userId: 'bad$' } }))).toBe(400);
  });
});