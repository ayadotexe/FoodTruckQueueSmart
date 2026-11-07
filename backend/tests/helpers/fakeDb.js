/**
 * A tiny in-memory stand-in for the MySQL pool, used only in Jest tests.
 * It understands just the queries queueService.js runs and keeps rows in arrays,
 * so tests never touch the real database.
 *
 * Fake menu: 1 = Taco (5 min), 2 = Coke (3 min), 3 = Old Special (inactive).
 * Options: queueStatus, noQueue, knownUsers (a Set; unknown users hit the FK error).
 * db.failOn = /regex/ makes any matching query throw (to test rollbacks).
 */
function createFakeDb({ queueStatus = "open", noQueue = false, knownUsers = null } = {}) {
  const state = {
    queues: noQueue ? [] : [{ queue_id: 1, status: queueStatus }],
    menu: [
      { menu_item_id: 1, name: "Taco", price: "4.00", expected_duration_minutes: 5, is_active: 1 },
      { menu_item_id: 2, name: "Coke", price: "2.50", expected_duration_minutes: 3, is_active: 1 },
      { menu_item_id: 3, name: "Old Special", price: "9.00", expected_duration_minutes: 8, is_active: 0 },
    ],
    orders: [],
    orderItems: [],
    entries: [],
    notifications: [],
  };
  let nextOrderId = 1;
  let nextEntryId = 1;

  const db = { state, failOn: null, released: 0 };

  const orderOf = (entry) => state.orders.find((o) => o.order_id === entry.order_id);
  const itemRows = (orderIds) =>
    state.orderItems
      .filter((it) => orderIds.includes(it.order_id))
      .map((it) => ({
        orderId: it.order_id,
        name: it.item_name,
        quantity: it.quantity,
        prepMinutes: it.prep_minutes,
      }));

  function run(sql, params = []) {
    if (db.failOn && db.failOn.test(sql)) throw new Error("fake db failure");
    const q = sql.replace(/\s+/g, " ").trim();

    if (q.includes("FROM Queue ORDER BY queue_id")) {
      return [state.queues.slice(0, 1)];
    }

    if (q.includes("qe.status IN ('served', 'canceled')")) {
      const rows = state.entries
        .filter((e) => orderOf(e).user_id === params[0] && ["served", "canceled"].includes(e.status))
        .map((e) => ({
          id: e.entry_id,
          orderId: e.order_id,
          userId: orderOf(e).user_id,
          notes: orderOf(e).notes,
          priority: e.priority,
          joinedAt: e.joined_at,
          status: e.status,
          finishedAt: e.finished_at,
        }))
        .sort((a, b) => b.finishedAt - a.finishedAt || b.id - a.id);
      return [rows];
    }

    if (q.includes("qe.status = 'waiting'")) {
      const rows = state.entries
        .filter((e) => e.queue_id === params[0] && e.status === "waiting")
        .map((e) => ({
          id: e.entry_id,
          priority: e.priority,
          joinedAt: e.joined_at,
          nearNotified: e.near_notified,
          orderId: e.order_id,
          userId: orderOf(e).user_id,
          notes: orderOf(e).notes,
        }))
        .sort((a, b) => (b.priority === "high") - (a.priority === "high") || a.id - b.id);
      return [rows];
    }

    if (q.includes("FROM OrderItem WHERE order_id IN")) {
      return [itemRows(params[0])];
    }

    if (q.includes("FROM MenuItem")) {
      return [state.menu.filter((m) => params[0].includes(m.menu_item_id) && m.is_active === 1)];
    }

    if (q.startsWith("INSERT INTO CustomerOrder")) {
      const [userId, notes] = params;
      if (knownUsers && !knownUsers.has(userId)) {
        throw Object.assign(new Error("foreign key fails"), { code: "ER_NO_REFERENCED_ROW_2" });
      }
      const order = { order_id: nextOrderId++, user_id: userId, notes };
      state.orders.push(order);
      return [{ insertId: order.order_id }];
    }

    if (q.startsWith("INSERT INTO OrderItem")) {
      params[0].forEach(([order_id, menu_item_id, item_name, quantity, unit_price, prep_minutes]) =>
        state.orderItems.push({ order_id, menu_item_id, item_name, quantity, unit_price, prep_minutes })
      );
      return [{ affectedRows: params[0].length }];
    }

    if (q.startsWith("INSERT INTO QueueEntry")) {
      const [queueId, orderId, priority] = params;
      const entry = {
        entry_id: nextEntryId++,
        queue_id: queueId,
        order_id: orderId,
        priority,
        status: "waiting",
        joined_at: new Date(),
        finished_at: null,
        near_notified: 0,
      };
      state.entries.push(entry);
      return [{ insertId: entry.entry_id }];
    }

    if (q.startsWith("INSERT INTO Notification")) {
      const [user_id, entry_id, type, message] = params;
      state.notifications.push({ user_id, entry_id, type, message });
      return [{ affectedRows: 1 }];
    }

    if (q.startsWith("UPDATE QueueEntry SET near_notified = 1")) {
      state.entries.find((e) => e.entry_id === params[0]).near_notified = 1;
      return [{ affectedRows: 1 }];
    }

    if (q.startsWith("UPDATE QueueEntry SET status = 'canceled'") ||
        q.startsWith("UPDATE QueueEntry SET status = 'served'")) {
      const entry = state.entries.find((e) => e.entry_id === params[0]);
      entry.status = q.includes("'canceled'") ? "canceled" : "served";
      entry.finished_at = new Date();
      return [{ affectedRows: 1 }];
    }

    throw new Error(`FakeDb: unsupported query: ${q}`);
  }

  db.query = async (sql, params) => run(sql, params);

  db.getConnection = async () => {
    let snapshot = null;
    return {
      query: db.query,
      async beginTransaction() {
        snapshot = {
          orders: state.orders.length,
          orderItems: state.orderItems.length,
          entries: state.entries.length,
        };
      },
      async commit() {},
      async rollback() {
        if (!snapshot) return;
        state.orders.length = snapshot.orders;
        state.orderItems.length = snapshot.orderItems;
        state.entries.length = snapshot.entries;
      },
      release() {
        db.released += 1;
      },
    };
  };

  return db;
}

module.exports = { createFakeDb };