const request = require('supertest');
const app = require('../app'); // FIXED: Now points to app.js

describe('API Validation Rules', () => {
    test('GET /api/menu should return a list of items', async () => {
        const response = await request(app).get('/api/menu');
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('POST /api/menu should reject items missing a name', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ category: 'food', price: 5.00 }); // Purposely missing the name

        // It should throw an error status code if validation is working
        expect(response.statusCode).not.toBe(200); 
    });
});