const history = require('../services/history');

beforeEach(() => history.reset());

test('records entries in order', () => {
  history.record('u1', { truckId: 't1', event: history.EVENTS.JOINED, position: 3 });
  history.record('u1', { truckId: 't1', event: history.EVENTS.SERVED });
  expect(history.getHistory('u1').map((e) => e.event)).toEqual(['JOINED', 'SERVED']);
  expect(history.getHistory('u1')[0]).toMatchObject({ truckId: 't1', position: 3 });
});

test('returns a copy so callers cannot change stored history', () => {
  history.record('u1', { truckId: 't1', event: history.EVENTS.LEFT });
  history.getHistory('u1').pop();
  expect(history.getHistory('u1')).toHaveLength(1);
});

test('unknown user has empty history', () => {
  expect(history.getHistory('nobody')).toEqual([]);
});

test('reset clears everything', () => {
  history.record('u1', { truckId: 't1', event: history.EVENTS.JOINED });
  history.reset();
  expect(history.getHistory('u1')).toEqual([]);
});


test('keeps history separate for different users', () => {
  history.record('u1', {
    truckId: 't1',
    event: history.EVENTS.JOINED,
  });

  history.record('u2', {
    truckId: 't1',
    event: history.EVENTS.LEFT,
  });

  expect(history.getHistory('u1')).toHaveLength(1);
  expect(history.getHistory('u1')[0].event).toBe('JOINED');

  expect(history.getHistory('u2')).toHaveLength(1);
  expect(history.getHistory('u2')[0].event).toBe('LEFT');
});

test('records a timestamp for each event', () => {
  const entry = history.record('u1', {
    truckId: 't1',
    event: history.EVENTS.JOINED,
  });

  expect(entry.at).toEqual(expect.any(String));
  expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
});
