const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const roles = Array.isArray(req.user.roles)
            ? req.user.roles
            : [];

        const isAdmin = roles.includes("Platform Admin");

        if (!isAdmin) {
            return res.status(403).json({
                message: "Admin access required",
            });
        }

        next();
    } catch (error) {
        console.error(
            "Admin Middleware Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to verify admin access",
        });
    }
};

module.exports = requireAdmin;