const request = require('supertest');
const app = require('../app'); 
const db = require('../db'); 

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
    test('First item should have a menu_item_id property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('menu_item_id');
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

    test('First item should have an image_url property', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.body[0]).toHaveProperty('image_url');
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

describe('Admin Menu Operations (POST, PUT, DELETE)', () => {
    test('POST /api/menu should successfully create a valid item', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ name: 'Test Churro', category: 'food', price: 3.00 });
        
        expect(response.statusCode).toBeLessThan(400); 
    });

    test('PUT /api/menu/:id should update an existing item', async () => {
        const response = await request(app)
            .put('/api/menu/1')
            .send({ price: 6.50, name: 'Updated Carne Asada' });
        
        expect(response.statusCode).toBeLessThan(400);
    });

    test('PUT /api/menu/:id with invalid ID should be handled', async () => {
        const response = await request(app)
            .put('/api/menu/9999')
            .send({ price: 10.00 });
        
        expect(response.statusCode).not.toBe(200);
    });

    test('DELETE /api/menu/:id should handle missing items properly', async () => {
        const response = await request(app).delete('/api/menu/9999');
        expect(response.statusCode).toBe(200);
    });
});

describe('100% Coverage Checks', () => {
    test('GET /api/health should return 200 and a running message', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("QueueSmart backend is running");
    });

    test('POST /api/menu should reject a name over 50 characters', async () => {
        const tooLongName = "A".repeat(51); 
        const response = await request(app)
            .post('/api/menu')
            .send({ name: tooLongName });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Valid name under 50 characters is required.");
    });

    test('POST /api/menu should use default fallback values when optional fields are missing', async () => {
        const response = await request(app)
            .post('/api/menu')
            .send({ name: 'Minimal Taco' }); 
        
        expect(response.statusCode).toBe(201);
    });
});

describe('Error Handling & Catch Blocks', () => {
    beforeEach(() => {
        jest.spyOn(db, 'query').mockRejectedValue(new Error('Forced DB Error'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('POST /api/menu should trigger a 500 database error', async () => {
        const response = await request(app).post('/api/menu').send({ name: 'Crash Taco' });
        expect(response.statusCode).toBe(500);
    });

    test('GET /api/menu handles DB crash', async () => {
        const response = await request(app).get('/api/menu');
        expect(response.statusCode).toBe(500);
    });

    test('DELETE /api/menu/:id handles DB crash', async () => {
        const response = await request(app).delete('/api/menu/1');
        expect(response.statusCode).toBe(500);
    });

    test('PUT /api/menu/:id handles DB crash', async () => {
        const response = await request(app).put('/api/menu/1').send({ price: 10 });
        expect(response.statusCode).toBe(500);
    });
});

afterAll(async () => {
    await db.end(); 
});