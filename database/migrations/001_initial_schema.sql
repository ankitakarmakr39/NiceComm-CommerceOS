-- ============================================================
-- NiceComm MVP
-- Migration: 001_initial_schema
-- Purpose: Core Commerce OS database foundation
-- PostgreSQL 17/18 compatible
-- ============================================================

BEGIN;

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. RBAC - ROLES
-- ============================================================

CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- 3. PARTICIPANT TYPES
-- ============================================================

CREATE TABLE participant_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    capability_level VARCHAR(2) NOT NULL DEFAULT 'L1'
        CHECK (capability_level IN ('L0', 'L1', 'L2', 'L3')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. PARTICIPANTS
-- ============================================================

CREATE TABLE participants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_type_id BIGINT NOT NULL
        REFERENCES participant_types(id),
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(30),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A user can belong to a participant organization.
CREATE TABLE participant_users (
    participant_id BIGINT NOT NULL
        REFERENCES participants(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (participant_id, user_id)
);

-- ============================================================
-- 5. SELLER PROFILE
-- ============================================================

CREATE TABLE seller_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    business_name VARCHAR(200),
    tax_identifier VARCHAR(100),
    retail_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    wholesale_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================

CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_participant_id BIGINT NOT NULL
        REFERENCES participants(id),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(120),
    retail_price NUMERIC(14,2) NOT NULL CHECK (retail_price >= 0),
    wholesale_price NUMERIC(14,2) CHECK (wholesale_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (stock_quantity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive', 'Draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT products_sku_per_seller_unique
        UNIQUE (seller_participant_id, sku)
);

-- ============================================================
-- 7. CARTS
-- ============================================================

CREATE TABLE carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Converted', 'Abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX one_active_cart_per_customer
ON carts(customer_user_id)
WHERE status = 'Active';

CREATE TABLE cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL
        REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (cart_id, product_id)
);

-- ============================================================
-- 8. ORDERS
-- ============================================================

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_user_id BIGINT NOT NULL
        REFERENCES users(id),
    total_amount NUMERIC(14,2) NOT NULL
        CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (
            status IN (
                'Pending',
                'Confirmed',
                'Processing',
                'Packed',
                'Shipped',
                'Delivered',
                'Cancelled',
                'Completed'
            )
        ),
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    seller_participant_id BIGINT NOT NULL
        REFERENCES participants(id),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL
        CHECK (unit_price >= 0),
    line_total NUMERIC(14,2) NOT NULL
        CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. GENERIC ORDER ASSIGNMENTS
-- ============================================================

CREATE TABLE order_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL
        REFERENCES participants(id),
    participant_role VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (
            status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Rejected',
                'Cancelled'
            )
        ),
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (order_id, participant_id, participant_role)
);

-- ============================================================
-- 11. WAREHOUSE
-- ============================================================

CREATE TABLE warehouse_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    capacity_units INTEGER NOT NULL DEFAULT 0
        CHECK (capacity_units >= 0),
    available_units INTEGER NOT NULL DEFAULT 0
        CHECK (available_units >= 0),
    inventory_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. LOGISTICS
-- ============================================================

CREATE TABLE logistics_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    vehicle_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. PACKAGING
-- ============================================================

CREATE TABLE packaging_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    packaging_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    capacity_units INTEGER NOT NULL DEFAULT 0
        CHECK (capacity_units >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. MARKETING AGENCY
-- ============================================================

CREATE TABLE marketing_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketing_clients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_id BIGINT NOT NULL
        REFERENCES marketing_profiles(participant_id) ON DELETE CASCADE,
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketing_campaigns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_id BIGINT NOT NULL
        REFERENCES marketing_profiles(participant_id) ON DELETE CASCADE,
    campaign_name VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Planned'
        CHECK (status IN ('Planned', 'Running', 'Completed', 'Cancelled')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. AFFILIATE
-- ============================================================

CREATE TABLE affiliate_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    referral_code VARCHAR(80) NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (commission_rate >= 0 AND commission_rate <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE affiliate_commissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_id BIGINT NOT NULL
        REFERENCES affiliate_profiles(participant_id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id),
    amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Paid', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. INSPECTION
-- ============================================================

CREATE TABLE inspection_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL
        REFERENCES inspection_profiles(participant_id),
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (
            status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Rejected',
                'Cancelled'
            )
        ),
    inspection_notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 17. REPAIR
-- ============================================================

CREATE TABLE repair_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repair_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT
        REFERENCES orders(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL
        REFERENCES repair_profiles(participant_id),
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (
            status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Rejected',
                'Cancelled'
            )
        ),
    repair_notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 18. INSTALLATION
-- ============================================================

CREATE TABLE installation_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installation_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT
        REFERENCES orders(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL
        REFERENCES installation_profiles(participant_id),
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (
            status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Rejected',
                'Cancelled'
            )
        ),
    installation_notes TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 19. COMPLIANCE
-- ============================================================

CREATE TABLE compliance_profiles (
    participant_id BIGINT PRIMARY KEY
        REFERENCES participants(id) ON DELETE CASCADE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (
            verification_status IN (
                'Pending',
                'Verified',
                'Rejected',
                'Expired'
            )
        ),
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. SUPPORT
-- ============================================================

CREATE TABLE support_tickets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    created_by_user_id BIGINT NOT NULL
        REFERENCES users(id),
    subject VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'Open'
        CHECK (
            status IN (
                'Open',
                'In Progress',
                'Waiting',
                'Resolved',
                'Closed'
            )
        ),
    related_order_id BIGINT REFERENCES orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id BIGINT NOT NULL
        REFERENCES support_tickets(id) ON DELETE CASCADE,
    participant_id BIGINT
        REFERENCES participants(id),
    assigned_user_id BIGINT
        REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (
            status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Cancelled'
            )
        ),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 21. ACTIVITY LOG
-- ============================================================

CREATE TABLE activity_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    participant_id BIGINT REFERENCES participants(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 22. INDEXES
-- ============================================================

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_participants_type
    ON participants(participant_type_id);

CREATE INDEX idx_participant_users_user
    ON participant_users(user_id);

CREATE INDEX idx_products_seller
    ON products(seller_participant_id);

CREATE INDEX idx_products_status
    ON products(status);

CREATE INDEX idx_carts_customer
    ON carts(customer_user_id);

CREATE INDEX idx_cart_items_cart
    ON cart_items(cart_id);

CREATE INDEX idx_orders_customer
    ON orders(customer_user_id);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_order_items_order
    ON order_items(order_id);

CREATE INDEX idx_order_items_seller
    ON order_items(seller_participant_id);

CREATE INDEX idx_order_assignments_order
    ON order_assignments(order_id);

CREATE INDEX idx_order_assignments_participant
    ON order_assignments(participant_id);

CREATE INDEX idx_support_tickets_creator
    ON support_tickets(created_by_user_id);

CREATE INDEX idx_support_tickets_status
    ON support_tickets(status);

CREATE INDEX idx_activity_logs_user
    ON activity_logs(user_id);

CREATE INDEX idx_activity_logs_participant
    ON activity_logs(participant_id);

-- ============================================================
-- 23. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_participants_updated_at
BEFORE UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_seller_profiles_updated_at
BEFORE UPDATE ON seller_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_order_assignments_updated_at
BEFORE UPDATE ON order_assignments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_warehouse_profiles_updated_at
BEFORE UPDATE ON warehouse_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_logistics_profiles_updated_at
BEFORE UPDATE ON logistics_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_packaging_profiles_updated_at
BEFORE UPDATE ON packaging_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marketing_profiles_updated_at
BEFORE UPDATE ON marketing_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_affiliate_profiles_updated_at
BEFORE UPDATE ON affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inspection_profiles_updated_at
BEFORE UPDATE ON inspection_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_repair_profiles_updated_at
BEFORE UPDATE ON repair_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_installation_profiles_updated_at
BEFORE UPDATE ON installation_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_compliance_profiles_updated_at
BEFORE UPDATE ON compliance_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- END OF MIGRATION
-- ============================================================

COMMIT;