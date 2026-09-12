const pool = require("../db");

const requirePermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.sub) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }

            const userId = Number(req.user.sub);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(401).json({
                    message: "Invalid user identity",
                });
            }

            if (!permissionName) {
                return res.status(500).json({
                    message: "Permission name is required",
                });
            }

            const result = await pool.query(
                `
                SELECT DISTINCT
                    p.name AS permission_name
                FROM user_roles ur
                INNER JOIN roles r
                    ON r.id = ur.role_id
                INNER JOIN role_permissions rp
                    ON rp.role_id = r.id
                INNER JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE ur.user_id = $1
                  AND p.name = $2
                `,
                [userId, permissionName]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action",
                });
            }

            next();
        } catch (error) {
            console.error(
                "Order Permission Middleware Error:",
                error
            );

            return res.status(500).json({
                message: "Failed to verify permission",
            });
        }
    };
};

module.exports = requirePermission;