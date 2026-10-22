// backend/tests/menu.test.js
const request = require('supertest');
const app = require('../app'); // This imports your Express app without starting the port

describe('Menu API', () => {
  it('should retrieve all menu items', async () => {
    const res = await request(app).get('/api/menu');
    
    // Assertions to check if the API is working correctly
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(1); // Because you have 4 tacos in store.js
  });

  it('should add a new menu item', async () => {
    const res = await request(app)
      .post('/api/menu')
      .send({
        name: "Quesadilla",
        description: "Cheese quesadilla",
        expectedDuration: 3,
        priorityLevel: "Normal"
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual("Quesadilla");
  });
});