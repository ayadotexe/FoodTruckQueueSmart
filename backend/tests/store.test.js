const { menuItems, nextId } = require('../menu/store');

describe('Menu Store Initialization', () => {
    test('menuItems should be an array', () => {
        expect(Array.isArray(menuItems)).toBe(true);
    });
    test('menuItems should have an initial length of 6', () => {
        expect(menuItems.length).toBe(6);
    });
    test('nextId should initially be 7', () => {
        expect(nextId).toBe(7);
    });
});

describe('Menu Store Data Integrity', () => {
    test('Item 1 is Carne Asada Tacos', () => {
        expect(menuItems[0].name).toBe('Carne Asada Tacos');
    });
    test('Item 2 is Tacos Al Pastor', () => {
        expect(menuItems[1].name).toBe('Tacos Al Pastor');
    });
    test('Item 3 is Chicken Tacos', () => {
        expect(menuItems[2].name).toBe('Chicken Tacos');
    });
    test('Item 4 is Mulitas de Birria', () => {
        expect(menuItems[3].name).toBe('Mulitas de Birria');
    });
    test('Item 5 is Bottled Coke', () => {
        expect(menuItems[4].name).toBe('Bottled Coke');
    });
    test('Item 6 is Mangonada', () => {
        expect(menuItems[5].name).toBe('Mangonada');
    });
});

describe('Menu Store Business Rules', () => {
    test('All items must have a unique ID', () => {
        const ids = menuItems.map(item => item.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(menuItems.length);
    });
    test('All items must have a string name', () => {
        menuItems.forEach(item => expect(typeof item.name).toBe('string'));
    });
    test('All items must have a numeric price', () => {
        menuItems.forEach(item => expect(typeof item.price).toBe('number'));
    });
    test('All items must have a positive price', () => {
        menuItems.forEach(item => expect(item.price).toBeGreaterThan(0));
    });
    test('All items must have an expectedDuration', () => {
        menuItems.forEach(item => expect(item.expectedDuration).toBeDefined());
    });
    test('All items must have a priorityLevel of Normal', () => {
        menuItems.forEach(item => expect(item.priorityLevel).toBe('Normal'));
    });
    test('Food items should have expectedDuration >= 5', () => {
        const foods = menuItems.filter(i => i.category === 'food');
        foods.forEach(food => expect(food.expectedDuration).toBeGreaterThanOrEqual(5));
    });
    test('Drink items should have expectedDuration === 3', () => {
        const drinks = menuItems.filter(i => i.category === 'drink');
        drinks.forEach(drink => expect(drink.expectedDuration).toBe(3));
    });
    test('Addons property must be an array for all items', () => {
        menuItems.forEach(item => expect(Array.isArray(item.addons)).toBe(true));
    });
});