const requireAdmin = (req, res, next) => {
    try {
        const roles = req.user?.roles || [];

        if (!roles.includes("Platform Admin")) {
            return res.status(403).json({
                message: "Admin access required",
            });
        }

        next();
    } catch (error) {
        console.error(
            "Support Admin Middleware Error:",
            error
        );

        return res.status(403).json({
            message: "Admin access required",
        });
    }
};

module.exports = requireAdmin;