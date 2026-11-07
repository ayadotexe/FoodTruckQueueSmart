USE queuesmart;

CREATE TABLE UserCredentials (
    user_id CHAR(36) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash CHAR(128) NOT NULL,
    password_salt CHAR(32) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    CONSTRAINT uq_user_email UNIQUE (email)
);

CREATE TABLE UserProfile (
    user_id CHAR(36) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(25),
    preferences JSON,

    PRIMARY KEY (user_id),
    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id)
        REFERENCES UserCredentials(user_id)
);

CREATE TABLE MenuItem (
    menu_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    category ENUM('food', 'drink') NOT NULL DEFAULT 'food',
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(2048),
    expected_duration_minutes INT NOT NULL DEFAULT 5,
    addons JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (menu_item_id),

    CONSTRAINT chk_menu_price
        CHECK (price >= 0),

    CONSTRAINT chk_menu_duration
        CHECK (expected_duration_minutes BETWEEN 1 AND 60)
);

CREATE TABLE CustomerOrder (
    order_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id CHAR(36) NOT NULL,
    notes VARCHAR(200) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (order_id),

    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id)
        REFERENCES UserCredentials(user_id)
);

CREATE TABLE OrderItem (
    order_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id INT UNSIGNED NOT NULL,
    menu_item_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    prep_minutes INT NOT NULL,

    PRIMARY KEY (order_item_id),

    CONSTRAINT fk_orderitem_order
        FOREIGN KEY (order_id)
        REFERENCES CustomerOrder(order_id),

    CONSTRAINT fk_orderitem_menu
        FOREIGN KEY (menu_item_id)
        REFERENCES MenuItem(menu_item_id),

    CONSTRAINT chk_orderitem_quantity
        CHECK (quantity BETWEEN 1 AND 20),

    CONSTRAINT chk_orderitem_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_orderitem_prep
        CHECK (prep_minutes BETWEEN 1 AND 60)
);

CREATE TABLE Queue (
    queue_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (queue_id)
);

CREATE TABLE QueueEntry (
    entry_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    queue_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED NOT NULL,
    position INT,
    priority ENUM('normal', 'high') NOT NULL DEFAULT 'normal',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('waiting', 'served', 'canceled')
        NOT NULL DEFAULT 'waiting',
    finished_at TIMESTAMP NULL DEFAULT NULL,
    near_notified BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (entry_id),
    CONSTRAINT uq_queueentry_order UNIQUE (order_id),

    CONSTRAINT fk_queueentry_queue
        FOREIGN KEY (queue_id)
        REFERENCES Queue(queue_id),

    CONSTRAINT fk_queueentry_order
        FOREIGN KEY (order_id)
        REFERENCES CustomerOrder(order_id),

    CONSTRAINT chk_queueentry_position
        CHECK (position IS NULL OR position >= 1),

    INDEX idx_queueentry_waiting (queue_id, status, priority, joined_at)
);

CREATE TABLE Notification (
    notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id CHAR(36) NOT NULL,
    entry_id INT UNSIGNED,
    type ENUM('JOINED', 'NEAR_FRONT', 'SERVED') NOT NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'viewed') NOT NULL DEFAULT 'sent',

    PRIMARY KEY (notification_id),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES UserCredentials(user_id),

    CONSTRAINT fk_notification_entry
        FOREIGN KEY (entry_id)
        REFERENCES QueueEntry(entry_id),

    INDEX idx_notification_user (user_id, created_at)
);

SHOW TABLES;