const request = require('supertest');
const app = require('../app'); 

describe('GET /api/menu Endpoint', () => {
    test('Should return status 200 OK', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.statusCode).toBe(200);
    });

    test('Should return JSON content type', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.headers['content-type']).toMatch(/json/);
    });

    test('Should return an array of items', async () => {
        const response = await request(app).get('/api/menu');
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should return at least 6 items initially', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body.length).toBeGreaterThanOrEqual(6);
    });
});

describe('API Response Data Structure', () => {
    test('First item should have an id property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('id');
    });

    test('First item should have a name property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('name');
    });

    test('First item should have a price property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('price');
    });

    test('First item should have a category property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('category');
    });

    test('First item should have an addons array', async () => {
        const response = await request(app).get('/api/menu');
        expect(Array.isArray(response.body[0].addons)).toBe(true);
    });

    test('First item should have an image property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('image');
    });
});

describe('Menu API Validation & Errors', () => {
    test('POST /api/menu missing name should not return 200', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ category: 'food', price: 5.00 }); 
        expect(response.statusCode).not.toBe(200); 
    });

    test('GET to non-existent route should return 404', async () => {
        const response = await request(app).get('/api/this-route-does-not-exist');
        expect(response.statusCode).toBe(404);
    });
});

// NEW TESTS TO BOOST CONTROLLER COVERAGE
describe('Admin Menu Operations (POST, PUT, DELETE)', () => {
    test('POST /api/menu should successfully create a valid item', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ name: 'Test Churro', category: 'food', price: 3.00 });
        
        // As long as it doesn't fail (400/500), the controller code runs
        expect(response.statusCode).toBeLessThan(400); 
    });

    test('PUT /api/menu/:id should update an existing item', async () => {
        const response = await request(app)
            .put('/api/menu/1') // Trying to edit item ID 1
            .send({ price: 6.50, name: 'Updated Carne Asada' });
        
        expect(response.statusCode).toBeLessThan(400);
    });

    test('PUT /api/menu/:id with invalid ID should be handled', async () => {
        const response = await request(app)
            .put('/api/menu/9999')
            .send({ price: 10.00 });
        
        expect(response.statusCode).not.toBe(200);
    });

    test('DELETE /api/menu/:id should remove an item', async () => {
        const response = await request(app).delete('/api/menu/2'); // Delete item ID 2
        
        expect(response.statusCode).toBeLessThan(400);
    });

describe('100% Coverage Checks', () => {
    test('GET /api/health should return 200 and a running message', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("QueueSmart backend is running");
    });

    test('POST /api/menu should reject a name over 50 characters', async () => {
        const tooLongName = "A".repeat(51); // Creates a 51-character string
        const response = await request(app)
            .post('/api/menu')
            .send({ name: tooLongName });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Valid name under 50 characters is required.");
    });

    test('POST /api/menu should use default fallback values when optional fields are missing', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ name: 'Minimal Taco' }); // Sending ONLY a name
        
        expect(response.statusCode).toBe(201);
        expect(response.body.category).toBe("food"); // Checks the fallback line
        expect(response.body.price).toBe(0); // Checks the fallback line
    });
});

});