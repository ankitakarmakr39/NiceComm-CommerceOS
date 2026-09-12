import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function Icon({ name }) {
    const common = {
        width: 18,
        height: 18,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
    };

    const paths = {
        dashboard: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </>
        ),

        products: (
            <>
                <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
                <path d="M4 12.5 12 17l8-4.5" />
                <path d="M4 17 12 21l8-4" />
            </>
        ),

        cart: (
            <>
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
            </>
        ),

        orders: (
            <>
                <path d="M6 3h9l3 3v15H6z" />
                <path d="M14 3v4h4M9 12h6M9 16h5" />
            </>
        ),

        support: (
            <>
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
                <path d="M8 8h8M8 11.5h5" />
            </>
        ),

        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                <circle cx="9.5" cy="7" r="4" />
                <path d="M17 11a4 4 0 0 0 0-8M21 21v-2a4 4 0 0 0-3-3.9" />
            </>
        ),

        participants: (
            <>
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                <path d="M16 11h5M18.5 8.5v5" />
            </>
        ),

        compliance: (
            <>
                <path d="m12 3 7 3v5c0 4.5-2.8 8.1-7 10-4.2-1.9-7-5.5-7-10V6z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
            </>
        ),

        warehouse: (
            <>
                <path d="M3 10 12 4l9 6v10H3z" />
                <path d="M8 20v-6h8v6M7 10h10" />
            </>
        ),

        packaging: (
            <>
                <path d="m4 7 8-4 8 4-8 4-8-4Z" />
                <path d="M4 7v10l8 4 8-4V7M12 11v10" />
            </>
        ),

        logistics: (
            <>
                <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
            </>
        ),

        marketing: (
            <>
                <path d="M4 14V10l12-4v12z" />
                <path d="M16 10h3a2 2 0 0 1 0 4h-3M7 15l1.5 5" />
            </>
        ),

        affiliate: (
            <>
                <circle cx="7" cy="12" r="3" />
                <circle cx="17" cy="7" r="3" />
                <circle cx="17" cy="17" r="3" />
                <path d="m9.5 10.5 5-2M9.5 13.5l5 2" />
            </>
        ),

        inspection: (
            <>
                <path d="M5 4h14v16H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
                <path d="m15 16 1.5 1.5L20 14" />
            </>
        ),

        repair: (
            <>
                <path d="m14.5 5.5 4 4M13 7l-6.5 6.5a2.1 2.1 0 0 0 3 3L16 10" />
                <path d="M19 3a4 4 0 0 0-4.5 5.5l-2 2" />
            </>
        ),

        installation: (
            <>
                <path d="M4 4h16v16H4z" />
                <path d="M8 12h8M12 8v8" />
            </>
        ),

        admin: (
            <>
                <path d="M12 3 19 6v5c0 4.5-2.8 8.1-7 10-4.2-1.9-7-5.5-7-10V6z" />
                <path d="M9.5 12h5M12 9.5v5" />
            </>
        ),

        logout: (
            <>
                <path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9" />
            </>
        ),

        menu: (
            <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
            </>
        ),

        close: (
            <>
                <path d="M6 6l12 12" />
                <path d="M18 6 6 18" />
            </>
        ),
    };

    return <svg {...common}>{paths[name] || paths.dashboard}</svg>;
}

function NavItem({ to, icon, children, end = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `nice-nav-item${isActive ? " active" : ""}`
            }
        >
            <span className="nice-nav-icon">
                <Icon name={icon} />
            </span>

            <span>{children}</span>
        </NavLink>
    );
}

function DashboardLayout() {
    const { user, logout } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const roles = user?.roles || [];

    const isAdmin = roles.includes("Platform Admin");
    const isCustomer = roles.includes("Customer");
    const isSeller = roles.includes("Seller");
    const isWarehouse = roles.includes("Warehouse Provider");
    const isPackaging = roles.includes("Packaging Provider");
    const isMarketing = roles.includes("Marketing Agency");
    const isLogistics = roles.includes("Logistics Provider");
    const isAffiliate = roles.includes("Affiliate Partner");
    const isInspection = roles.includes("Inspection Partner");
    const isRepair = roles.includes("Repair Partner");
    const isInstallation = roles.includes("Installation Partner");

    const isCompliance =
        roles.includes("Platform Admin") ||
        roles.includes("Seller") ||
        roles.includes("Warehouse Provider") ||
        roles.includes("Logistics Provider") ||
        roles.includes("Packaging Provider") ||
        roles.includes("Marketing Agency") ||
        roles.includes("Affiliate Partner") ||
        roles.includes("Inspection Partner") ||
        roles.includes("Repair Partner") ||
        roles.includes("Installation Partner");

    const initials = (user?.full_name || "User")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="nice-shell">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="nice-mobile-overlay"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`nice-sidebar ${
                    sidebarOpen ? "nice-sidebar-open" : ""
                }`}
            >
                <div className="nice-brand">
                    <div className="nice-brand-mark">N</div>

                    <div>
                        <div className="nice-brand-name">
                            NiceComm
                        </div>

                        <div className="nice-brand-subtitle">
                            Commerce OS
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        className="nice-mobile-close"
                        onClick={closeSidebar}
                        aria-label="Close menu"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <div className="nice-nav-section">
                    <div className="nice-nav-label">
                        WORKSPACE
                    </div>

                    <nav
                        className="nice-nav"
                        onClick={closeSidebar}
                    >
                        <NavItem
                            to="/dashboard"
                            icon="dashboard"
                            end
                        >
                            Dashboard
                        </NavItem>

                        {isCustomer && (
                            <>
                                <NavItem
                                    to="/products"
                                    icon="products"
                                >
                                    Products
                                </NavItem>

                                <NavItem
                                    to="/cart"
                                    icon="cart"
                                >
                                    Cart
                                </NavItem>

                                <NavItem
                                    to="/orders"
                                    icon="orders"
                                >
                                    My Orders
                                </NavItem>

                                <NavItem
                                    to="/support"
                                    icon="support"
                                >
                                    Support
                                </NavItem>
                            </>
                        )}

                        {isSeller && (
                            <>
                                <NavItem
                                    to="/seller/products"
                                    icon="products"
                                >
                                    Seller Products
                                </NavItem>

                                <NavItem
                                    to="/seller/orders"
                                    icon="orders"
                                >
                                    Orders
                                </NavItem>
                            </>
                        )}

                        {isWarehouse && (
                            <NavItem
                                to="/warehouse"
                                icon="warehouse"
                            >
                                Warehouse
                            </NavItem>
                        )}

                        {isPackaging && (
                            <NavItem
                                to="/packaging"
                                icon="packaging"
                            >
                                Packaging
                            </NavItem>
                        )}

                        {isLogistics && (
                            <NavItem
                                to="/logistics"
                                icon="logistics"
                            >
                                Logistics
                            </NavItem>
                        )}

                        {isMarketing && (
                            <NavItem
                                to="/marketing"
                                icon="marketing"
                            >
                                Marketing
                            </NavItem>
                        )}

                        {isAffiliate && (
                            <NavItem
                                to="/affiliate"
                                icon="affiliate"
                            >
                                Affiliate
                            </NavItem>
                        )}

                        {isInspection && (
                            <NavItem
                                to="/inspection"
                                icon="inspection"
                            >
                                Inspection
                            </NavItem>
                        )}

                        {isRepair && (
                            <NavItem
                                to="/repair"
                                icon="repair"
                            >
                                Repair
                            </NavItem>
                        )}

                        {isInstallation && (
                            <NavItem
                                to="/installation"
                                icon="installation"
                            >
                                Installation
                            </NavItem>
                        )}

                        {isCompliance && (
                            <NavItem
                                to="/compliance"
                                icon="compliance"
                            >
                                Compliance
                            </NavItem>
                        )}
                    </nav>
                </div>

                {isAdmin && (
                    <div className="nice-nav-section nice-admin-section">
                        <div className="nice-nav-label">
                            ADMINISTRATION
                        </div>

                        <nav
                            className="nice-nav"
                            onClick={closeSidebar}
                        >
                            <NavItem
                                to="/admin/dashboard"
                                icon="admin"
                            >
                                Admin Dashboard
                            </NavItem>

                            <NavItem
                                to="/admin/users"
                                icon="users"
                            >
                                Users
                            </NavItem>

                            <NavItem
                                to="/admin/participants"
                                icon="participants"
                            >
                                Participants
                            </NavItem>

                            {/* Admin Products */}
                            <NavItem
                                to="/admin/products"
                                icon="products"
                            >
                                Products
                            </NavItem>

                            <NavItem
                                to="/admin/orders"
                                icon="orders"
                            >
                                Orders
                            </NavItem>

                            <NavItem
                                to="/admin/support"
                                icon="support"
                            >
                                Support
                            </NavItem>
                        </nav>
                    </div>
                )}

                <div className="nice-sidebar-footer">
                    <div className="nice-user-mini">
                        <div className="nice-avatar">
                            {initials || "U"}
                        </div>

                        <div className="nice-user-mini-info">
                            <div className="nice-user-name">
                                {user?.full_name || "User"}
                            </div>

                            <div className="nice-user-role">
                                {roles[0] || "User"}
                            </div>
                        </div>
                    </div>

                    <button
                        className="nice-logout-button"
                        type="button"
                        onClick={logout}
                    >
                        <Icon name="logout" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div className="nice-main">

                <header className="nice-topbar">

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        className="nice-mobile-menu-button"
                        onClick={() =>
                            setSidebarOpen(
                                (previous) => !previous
                            )
                        }
                        aria-label={
                            sidebarOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        aria-expanded={sidebarOpen}
                    >
                        <Icon
                            name={
                                sidebarOpen
                                    ? "close"
                                    : "menu"
                            }
                        />
                    </button>

                    <div className="nice-topbar-heading">
                        <div className="nice-topbar-eyebrow">
                            NiceComm
                        </div>

                        <div className="nice-topbar-title">
                            Commerce Workspace
                        </div>
                    </div>

                    <div className="nice-topbar-user">
                        <div className="nice-topbar-user-text">
                            <strong>
                                {user?.full_name || "User"}
                            </strong>

                            <span>
                                {roles.join(" • ") || "User"}
                            </span>
                        </div>

                        <div className="nice-avatar small">
                            {initials || "U"}
                        </div>
                    </div>
                </header>

                <main className="nice-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;