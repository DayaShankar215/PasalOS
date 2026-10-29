CREATE DATABASE IF NOT EXISTS pasalos_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pasalos_db;

SHOW DATABASES LIKE 'pasalos_db';

CREATE TABLE IF NOT EXISTS shops (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    address VARCHAR(255),
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    UNIQUE KEY uq_users_shop_email (shop_id, email),
    INDEX idx_users_shop (shop_id)
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    UNIQUE KEY uq_categories_shop_name (shop_id, name),
    INDEX idx_categories_shop (shop_id)
);

SHOW TABLES;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    description TEXT,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 5,
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL,

    UNIQUE KEY uq_products_shop_sku (shop_id, sku),
    INDEX idx_products_shop (shop_id),
    INDEX idx_products_category (category_id)
);

SELECT * FROM products;

-- B. customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    address VARCHAR(255),
    credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    INDEX idx_customers_shop (shop_id),
    INDEX idx_customers_phone (shop_id, phone)
);

-- C. Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(255),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_suppliers_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    INDEX idx_suppliers_shop (shop_id)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(255),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_suppliers_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    INDEX idx_suppliers_shop (shop_id)
);

-- Expense Table
CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    INDEX idx_expenses_shop_date (shop_id, expense_date)
);


SHOW TABLES;


-- Sales TABLE
CREATE TABLE IF NOT EXISTS sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id BIGINT UNSIGNED NULL,
    customer_name VARCHAR(150),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method ENUM('cash', 'card', 'mobile_payment', 'credit')
        NOT NULL DEFAULT 'cash',
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('completed', 'cancelled', 'refunded')
        NOT NULL DEFAULT 'completed',
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE SET NULL,

    UNIQUE KEY uq_sales_shop_invoice (shop_id, invoice_number),
    INDEX idx_sales_shop_date (shop_id, sale_date)
);


-- Sales Item Table
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    sale_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(100),
    quantity DECIMAL(12,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_sale_items_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id) REFERENCES sales(id),

    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id) REFERENCES products(id),

    INDEX idx_sale_items_sale (shop_id, sale_id)
);


-- Purchase Table
CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    purchase_number VARCHAR(100) NOT NULL,
    supplier_id BIGINT UNSIGNED NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('received', 'pending', 'cancelled')
        NOT NULL DEFAULT 'received',
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchases_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        ON DELETE SET NULL,

    UNIQUE KEY uq_purchases_shop_number (shop_id, purchase_number),
    INDEX idx_purchases_shop_date (shop_id, purchase_date)
);


-- purchase item table
CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    purchase_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_purchase_items_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_purchase_items_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(id),

    CONSTRAINT fk_purchase_items_product
        FOREIGN KEY (product_id) REFERENCES products(id),

    INDEX idx_purchase_items_purchase (shop_id, purchase_id)
);

-- stock movement table
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('stock_added', 'stock_removed', 'adjustment')
        NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    previous_stock DECIMAL(12,3) NOT NULL,
    new_stock DECIMAL(12,3) NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NULL,
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movements_shop
        FOREIGN KEY (shop_id) REFERENCES shops(id),

    CONSTRAINT fk_movements_product
        FOREIGN KEY (product_id) REFERENCES products(id),

    CONSTRAINT fk_movements_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_movements_shop_date (shop_id, movement_date),
    INDEX idx_movements_product_date (shop_id, product_id, movement_date)
);

SHOW TABLES;

USE pasalos_db;

INSERT INTO shops (id, shop_name, owner_name, email, status)
VALUES (
    1,
    'PasalOS Development Shop',
    'Development Owner',
    'dev-shop@pasalos.local',
    'active'
)
ON DUPLICATE KEY UPDATE
    shop_name = 'PasalOS Development Shop';

SELECT id, shop_name, email
FROM shops
WHERE id = 1;

DESCRIBE purchases;
DESCRIBE purchase_items;
DESCRIBE products;
DESCRIBE stock_movements;
