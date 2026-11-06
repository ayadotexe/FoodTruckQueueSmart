USE queuesmart;

-- Create the food truck's initial queue.
INSERT INTO Queue (queue_id, status)
VALUES (1, 'open');

-- Add the existing Taco Express menu.
INSERT INTO MenuItem (
    name,
    description,
    category,
    price,
    expected_duration,
    addons
)
VALUES
(
    'Carne Asada Tacos',
    '2 carne asada tacos with corn tortillas, cilantro, and salsa.',
    'food',
    5.00,
    5,
    JSON_ARRAY('Extra Salsa', 'No Onions', 'Extra Lime')
),
(
    'Tacos Al Pastor',
    '2 tacos with thinly sliced pork, cilantro, salsa, and corn tortillas.',
    'food',
    4.00,
    5,
    JSON_ARRAY('Extra Salsa', 'No Onions', 'Extra Lime')
),
(
    'Chicken Tacos',
    '2 chicken tacos with corn tortillas, cilantro, and salsa.',
    'food',
    4.00,
    5,
    JSON_ARRAY('Extra Salsa', 'No Onions', 'Extra Lime')
),
(
    'Mulitas de Birria',
    'Birria with Oaxaca cheese, onions, cilantro, and salsa between two corn tortillas.',
    'food',
    6.00,
    6,
    JSON_ARRAY('Extra Salsa', 'No Onions')
),
(
    'Bottled Coke',
    'Cold Mexican Coca-Cola.',
    'drink',
    2.50,
    3,
    JSON_ARRAY()
),
(
    'Mangonada',
    'Mango sorbet topped with tajin, chamoy, lime, and mango chunks.',
    'drink',
    6.00,
    3,
    JSON_ARRAY()
);

SELECT * FROM Queue;

SELECT menu_item_id, name, price, expected_duration
FROM MenuItem;