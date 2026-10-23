const { menuItems, nextId } = require('../menu/store');

describe('Menu Store Business Logic', () => {
    test('Drinks should have an expected duration of 3 minutes', () => {
        const drinks = menuItems.filter(item => item.category === 'drink');
        drinks.forEach(drink => {
            expect(drink.expectedDuration).toBe(3); // Core business logic
        });
    });

    test('Menu items should contain all required fields', () => {
        menuItems.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('category');
        });
    });

    test('Next ID should be correctly initialized greater than existing items', () => {
        const maxId = Math.max(...menuItems.map(item => item.id));
        expect(nextId).toBeGreaterThan(maxId);
    });
});