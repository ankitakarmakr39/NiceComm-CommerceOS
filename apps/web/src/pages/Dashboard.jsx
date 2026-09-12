import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Dashboard() {
    const { user } = useAuth();

    const roles = user?.roles || [];
    const primaryRole = roles[0] || "User";

    const initials = (user?.full_name || "User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const hasParticipantRole = roles.some((role) =>
        [
            "Seller",
            "Warehouse Provider",
            "Logistics Provider",
            "Packaging Provider",
            "Marketing Agency",
            "Affiliate Partner",
            "Inspection Partner",
            "Repair Partner",
            "Installation Partner",
        ].includes(role)
    );

    const quickLinks = [];

    if (roles.includes("Seller")) {
        quickLinks.push(
            {
                title: "Seller Products",
                description: "Manage products belonging to your seller account.",
                to: "/seller/products",
            },
            {
                title: "Seller Orders",
                description: "Review and process orders assigned to you.",
                to: "/seller/orders",
            }
        );
    }

    if (roles.includes("Customer")) {
        quickLinks.push(
            {
                title: "Browse Products",
                description: "Explore products available on NiceComm.",
                to: "/products",
            },
            {
                title: "My Orders",
                description: "View your recent purchases and order status.",
                to: "/orders",
            }
        );
    }

    if (roles.includes("Platform Admin")) {
        quickLinks.push(
            {
                title: "Admin Dashboard",
                description: "Monitor and manage the NiceComm platform.",
                to: "/admin/dashboard",
            },
            {
                title: "Users",
                description: "Manage platform users and role assignments.",
                to: "/admin/users",
            }
        );
    }

    if (hasParticipantRole) {
        quickLinks.push({
            title: "Compliance",
            description: "View your current participant verification status.",
            to: "/compliance",
        });
    }

    return (
        <div className="nice-dashboard">
            <section className="nice-page-heading">
                <div>
                    <div className="nice-section-kicker">OVERVIEW</div>
                    <h1>Dashboard</h1>
                    <p>
                        Welcome back. Here is a quick overview of your NiceComm
                        workspace.
                    </p>
                </div>

                <div className="nice-dashboard-avatar">
                    {initials || "U"}
                </div>
            </section>

            <section className="nice-welcome-card">
                <div className="nice-welcome-content">
                    <div className="nice-welcome-kicker">WELCOME BACK</div>
                    <h2>{user?.full_name || "User"}</h2>
                    <p>
                        Your NiceComm workspace is ready. Use the navigation
                        on the left to access your available Commerce OS
                        capabilities.
                    </p>
                </div>

                <div className="nice-welcome-role">
                    <span>Primary role</span>
                    <strong>{primaryRole}</strong>
                </div>
            </section>

            <section className="nice-stat-grid">
                <div className="nice-stat-card">
                    <div className="nice-stat-label">ACCOUNT STATUS</div>
                    <div className="nice-stat-value">
                        <span className="nice-status-dot" />
                        {user?.status || "Active"}
                    </div>
                    <div className="nice-stat-meta">
                        Your account is currently available.
                    </div>
                </div>

                <div className="nice-stat-card">
                    <div className="nice-stat-label">ACCESS ROLE</div>
                    <div className="nice-stat-value role">
                        {primaryRole}
                    </div>
                    <div className="nice-stat-meta">
                        {roles.length} role{roles.length === 1 ? "" : "s"} assigned.
                    </div>
                </div>

                <div className="nice-stat-card">
                    <div className="nice-stat-label">WORKSPACE ACCESS</div>
                    <div className="nice-stat-value role">
                        {roles.length}
                    </div>
                    <div className="nice-stat-meta">
                        Enabled role-based capabilities.
                    </div>
                </div>

                <div className="nice-stat-card">
                    <div className="nice-stat-label">PLATFORM</div>
                    <div className="nice-stat-value role">NiceComm</div>
                    <div className="nice-stat-meta">
                        Commerce Operating System
                    </div>
                </div>
            </section>

            <section className="nice-dashboard-grid">
                <div className="nice-panel">
                    <div className="nice-panel-header">
                        <div>
                            <div className="nice-panel-kicker">ACCOUNT</div>
                            <h3>Account Overview</h3>
                        </div>
                    </div>

                    <div className="nice-account-list">
                        <div className="nice-account-row">
                            <span>Full Name</span>
                            <strong>{user?.full_name || "—"}</strong>
                        </div>

                        <div className="nice-account-row">
                            <span>Email</span>
                            <strong>{user?.email || "—"}</strong>
                        </div>

                        <div className="nice-account-row">
                            <span>Roles</span>
                            <strong>{roles.join(", ") || "—"}</strong>
                        </div>

                        <div className="nice-account-row">
                            <span>Status</span>
                            <strong className="nice-inline-status">
                                <span className="nice-status-dot" />
                                {user?.status || "Active"}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="nice-panel">
                    <div className="nice-panel-header">
                        <div>
                            <div className="nice-panel-kicker">SHORTCUTS</div>
                            <h3>Quick Access</h3>
                        </div>
                    </div>

                    {quickLinks.length > 0 ? (
                        <div className="nice-quick-links">
                            {quickLinks.slice(0, 4).map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="nice-quick-link"
                                >
                                    <div>
                                        <strong>{item.title}</strong>
                                        <span>{item.description}</span>
                                    </div>
                                    <span className="nice-arrow">→</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="nice-empty-state">
                            <strong>No shortcuts available</strong>
                            <span>
                                Available modules will appear here based on
                                your role.
                            </span>
                        </div>
                    )}
                </div>
            </section>

            <section className="nice-info-strip">
                <div className="nice-info-icon">N</div>
                <div>
                    <strong>NiceComm Commerce OS</strong>
                    <span>
                        Your workspace is powered by role-based access and
                        modular commerce services.
                    </span>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
