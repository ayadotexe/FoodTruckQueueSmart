const request = require('supertest');
const express = require('express');
const cartController = require('../controllers/CartController');
const db = require('../config/db');

// Mock the MySQL database connection so we don't hit AWS during tests
// modified by aya
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

// Set up a fake Express server just for testing these routes
const app = express();
app.use(express.json());
app.get('/api/cart/:userId', cartController.getCart);
app.post('/api/cart/:userId', cartController.addToCart);
app.put('/api/cart/:userId/item/:cartItemId', cartController.updateCartItem);
app.delete('/api/cart/:userId/item/:cartItemId', cartController.removeCartItem);
app.delete('/api/cart/:userId', cartController.clearCart);

describe('Cart API Endpoints', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Reset the fake database before each test
  });

  it('GET /api/cart/:userId should return the users cart', async () => {
    const mockCartData = [
      { cart_item_id: 1, quantity: 2, name: 'Carne Asada Tacos', price: 5.00 }
    ];
    db.query.mockResolvedValue([mockCartData]);

    const response = await request(app).get('/api/cart/test-user-123');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockCartData);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT c.cart_item_id'),
      ['test-user-123']
    );
  });

  it('POST /api/cart/:userId should add a new item', async () => {
    db.query
      .mockResolvedValueOnce([[]]) // existing.length == 0
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const response = await request(app)
      .post('/api/cart/test-user-123')
      .send({ menu_item_id: 5, quantity: 1 });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Cart updated');
  });

  it('POST /api/cart/:userId should update quantity if item already exists', async () => {
    db.query
      .mockResolvedValueOnce([[{ cart_item_id: 1, quantity: 1 }]]) // existing.length > 0
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // The UPDATE query

    const response = await request(app)
      .post('/api/cart/test-user-123')
      .send({ menu_item_id: 5, quantity: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Cart updated');
  });

  it('PUT /api/cart/:userId/item/:cartItemId should update quantity', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const response = await request(app)
      .put('/api/cart/test-user-123/item/1')
      .send({ quantity: 5 });

    expect(response.statusCode).toBe(200);
  });

  it('DELETE /api/cart/:userId/item/:cartItemId should remove a specific item', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const response = await request(app).delete('/api/cart/test-user-123/item/1');

    expect(response.statusCode).toBe(200);
  });

  it('DELETE /api/cart/:userId should clear the entire cart', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const response = await request(app).delete('/api/cart/test-user-123');

    expect(response.statusCode).toBe(200);
  });

  it('Should handle database errors gracefully (500)', async () => {
    db.query.mockRejectedValueOnce(new Error('Database failed'));
    const response = await request(app).get('/api/cart/test-user-123');

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Failed to fetch cart');
  });
});

describe('Error Handling & Catch Blocks (100% Coverage)', () => {
  beforeEach(() => {
    db.query.mockRejectedValue(new Error('Forced DB Error'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/cart/:userId handles DB crash', async () => {
    const res = await request(app).post('/api/cart/123').send({ menu_item_id: 1 });
    expect(res.statusCode).toBe(500);
  });

  test('PUT /api/cart/:userId/item/:cartItemId handles DB crash', async () => {
    const res = await request(app).put('/api/cart/123/item/1').send({ quantity: 2 });
    expect(res.statusCode).toBe(500);
  });

  test('DELETE /api/cart/:userId/item/:cartItemId handles DB crash', async () => {
    const res = await request(app).delete('/api/cart/123/item/1');
    expect(res.statusCode).toBe(500);
  });

  test('DELETE /api/cart/:userId handles DB crash', async () => {
    const res = await request(app).delete('/api/cart/123');
    expect(res.statusCode).toBe(500);
  });
});