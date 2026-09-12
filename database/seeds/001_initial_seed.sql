-- ============================================================
-- NiceComm MVP
-- Seed: 001_initial_seed
-- Purpose: Roles, permissions and participant types
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ROLES
-- ============================================================

INSERT INTO roles (name, description)
VALUES
    ('Platform Admin', 'Full platform administration access'),
    ('Customer', 'Customer access to shopping and orders'),
    ('Participant', 'Base role for Commerce OS participants'),
    ('Seller', 'Seller participant access'),
    ('Warehouse Provider', 'Warehouse participant access'),
    ('Logistics Provider', 'Logistics participant access'),
    ('Packaging Provider', 'Packaging participant access'),
    ('Marketing Agency', 'Marketing agency participant access'),
    ('Affiliate Partner', 'Affiliate partner access'),
    ('Inspection Partner', 'Inspection partner access'),
    ('Repair Partner', 'Repair partner access'),
    ('Installation Partner', 'Installation partner access')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

INSERT INTO permissions (name, description)
VALUES

    -- Users
    ('users.view', 'View users'),
    ('users.create', 'Create users'),
    ('users.update', 'Update users'),
    ('users.delete', 'Deactivate users'),

    -- Participants
    ('participants.view', 'View participants'),
    ('participants.create', 'Create participants'),
    ('participants.update', 'Update participants'),
    ('participants.delete', 'Deactivate participants'),

    -- Products
    ('products.view', 'View products'),
    ('products.create', 'Create products'),
    ('products.update', 'Update products'),
    ('products.delete', 'Deactivate products'),

    -- Cart
    ('cart.view', 'View own cart'),
    ('cart.create', 'Add items to cart'),
    ('cart.update', 'Update cart items'),
    ('cart.delete', 'Remove cart items'),

    -- Checkout
    ('checkout.create', 'Create checkout'),

    -- Orders
    ('orders.view', 'View orders'),
    ('orders.create', 'Create orders'),
    ('orders.update', 'Update orders'),
    ('orders.cancel', 'Cancel orders'),

    -- Assignments
    ('assignments.view', 'View assignments'),
    ('assignments.create', 'Create assignments'),
    ('assignments.update', 'Update assignments'),

    -- Support
    ('support.view', 'View support tickets'),
    ('support.create', 'Create support tickets'),
    ('support.update', 'Update support tickets'),
    ('support.assign', 'Assign support tickets'),

    -- Dashboard
    ('dashboard.view', 'View dashboard'),

    -- Compliance
    ('compliance.view', 'View compliance information'),
    ('compliance.update', 'Update compliance information')

ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 3. PARTICIPANT TYPES
-- ============================================================

INSERT INTO participant_types
    (name, code, capability_level, description)
VALUES
    (
        'Seller',
        'SELLER',
        'L3',
        'Commerce seller responsible for products and selling'
    ),
    (
        'Warehouse Provider',
        'WAREHOUSE',
        'L1',
        'Warehouse and storage service provider'
    ),
    (
        'Logistics Provider',
        'LOGISTICS',
        'L1',
        'Logistics and delivery service provider'
    ),
    (
        'Packaging Provider',
        'PACKAGING',
        'L1',
        'Packaging service provider'
    ),
    (
        'Marketing Agency',
        'MARKETING',
        'L1',
        'Marketing and campaign service provider'
    ),
    (
        'Affiliate Partner',
        'AFFILIATE',
        'L1',
        'Affiliate and referral partner'
    ),
    (
        'Inspection Partner',
        'INSPECTION',
        'L1',
        'Inspection service provider'
    ),
    (
        'Repair Partner',
        'REPAIR',
        'L1',
        'Repair service provider'
    ),
    (
        'Installation Partner',
        'INSTALLATION',
        'L1',
        'Installation service provider'
    )
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 4. PLATFORM ADMIN
-- Full access to all seeded permissions
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Platform Admin'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. CUSTOMER PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'products.view',
        'cart.view',
        'cart.create',
        'cart.update',
        'cart.delete',
        'checkout.create',
        'orders.view',
        'orders.create',
        'orders.cancel',
        'support.view',
        'support.create'
    )
WHERE r.name = 'Customer'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 6. BASE PARTICIPANT PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'support.view'
    )
WHERE r.name = 'Participant'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 7. SELLER PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'products.view',
        'products.create',
        'products.update',
        'products.delete',
        'orders.view',
        'assignments.view',
        'assignments.update',
        'support.view'
    )
WHERE r.name = 'Seller'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 8. WAREHOUSE PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Warehouse Provider'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. LOGISTICS PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Logistics Provider'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 10. PACKAGING PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Packaging Provider'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 11. MARKETING PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'support.view'
    )
WHERE r.name = 'Marketing Agency'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. AFFILIATE PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Affiliate Partner'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 13. INSPECTION PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Inspection Partner'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 14. REPAIR PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Repair Partner'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 15. INSTALLATION PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.name IN (
        'dashboard.view',
        'participants.view',
        'participants.update',
        'assignments.view',
        'assignments.update',
        'orders.view',
        'support.view'
    )
WHERE r.name = 'Installation Partner'
ON CONFLICT DO NOTHING;


COMMIT;