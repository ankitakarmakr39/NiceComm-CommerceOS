import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

import Products from "../pages/Products.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import Orders from "../pages/Orders.jsx";
import OrderDetails from "../pages/OrderDetails.jsx";

import AdminOrders from "../pages/AdminOrders.jsx";
import AdminOrderDetails from "../pages/AdminOrderDetails.jsx";
import AdminSupport from "../pages/AdminSupport.jsx";
import AdminUsers from "../pages/AdminUsers.jsx";
import AdminParticipants from "../pages/AdminParticipants.jsx";
import AdminProducts from "../pages/AdminProducts.jsx";

import Support from "../pages/Support.jsx";

import SellerProducts from "../pages/SellerProducts.jsx";
import SellerOrders from "../pages/SellerOrders.jsx";

import Warehouse from "../pages/Warehouse.jsx";
import Packaging from "../pages/Packaging.jsx";
import Marketing from "../pages/Marketing.jsx";
import Logistics from "../pages/Logistics.jsx";
import Affiliate from "../pages/Affiliate.jsx";
import Inspection from "../pages/Inspection.jsx";
import Repair from "../pages/Repair.jsx";
import Installation from "../pages/Installation.jsx";
import Compliance from "../pages/Compliance.jsx";


function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    Public Routes
                ========================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* =========================
                    Protected Routes
                ========================== */}

                <Route element={<ProtectedRoute />}>

                    <Route element={<DashboardLayout />}>

                        {/* =========================
                            Common Dashboard
                        ========================== */}

                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />


                        {/* =========================
                            ADMIN ROUTES
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Platform Admin",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/admin/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/admin/users"
                                element={<AdminUsers />}
                            />

                            <Route
                                path="/admin/participants"
                                element={<AdminParticipants />}
                            />

                            {/* Admin Product Management */}
                            <Route
                                path="/admin/products"
                                element={<AdminProducts />}
                            />

                            <Route
                                path="/admin/orders"
                                element={<AdminOrders />}
                            />

                            <Route
                                path="/admin/orders/:id"
                                element={<AdminOrderDetails />}
                            />

                            <Route
                                path="/admin/support"
                                element={<AdminSupport />}
                            />

                        </Route>


                        {/* =========================
                            CUSTOMER ROUTES
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Customer",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/customer/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/products"
                                element={<Products />}
                            />

                            <Route
                                path="/cart"
                                element={<Cart />}
                            />

                            <Route
                                path="/checkout"
                                element={<Checkout />}
                            />

                            <Route
                                path="/orders"
                                element={<Orders />}
                            />

                        </Route>


                        {/* =========================
                            ORDER DETAILS
                        ========================== */}

                        <Route
                            path="/orders/:id"
                            element={<OrderDetails />}
                        />


                        {/* =========================
                            CUSTOMER SUPPORT
                        ========================== */}

                        <Route
                            path="/support"
                            element={<Support />}
                        />


                        {/* =========================
                            SELLER ROUTES
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Seller",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/seller/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/seller/products"
                                element={<SellerProducts />}
                            />

                            <Route
                                path="/seller/orders"
                                element={<SellerOrders />}
                            />

                        </Route>


                        {/* =========================
                            WAREHOUSE PROVIDER
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Warehouse Provider",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/warehouse"
                                element={<Warehouse />}
                            />

                        </Route>


                        {/* =========================
                            PACKAGING PROVIDER
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Packaging Provider",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/packaging"
                                element={<Packaging />}
                            />

                        </Route>


                        {/* =========================
                            OTHER PARTICIPANT ROUTES
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Participant",
                                        "Warehouse Provider",
                                        "Logistics Provider",
                                        "Packaging Provider",
                                        "Marketing Agency",
                                        "Affiliate Partner",
                                        "Inspection Partner",
                                        "Repair Partner",
                                        "Installation Partner",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/participant/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/marketing"
                                element={<Marketing />}
                            />

                            <Route
                                path="/logistics"
                                element={<Logistics />}
                            />

                            <Route
                                path="/affiliate"
                                element={<Affiliate />}
                            />

                            <Route
                                path="/inspection"
                                element={<Inspection />}
                            />

                            <Route
                                path="/repair"
                                element={<Repair />}
                            />

                            <Route
                                path="/installation"
                                element={<Installation />}
                            />

                        </Route>


                        {/* =========================
                            COMPLIANCE
                        ========================== */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRoles={[
                                        "Platform Admin",
                                        "Seller",
                                        "Warehouse Provider",
                                        "Logistics Provider",
                                        "Packaging Provider",
                                        "Marketing Agency",
                                        "Affiliate Partner",
                                        "Inspection Partner",
                                        "Repair Partner",
                                        "Installation Partner",
                                    ]}
                                />
                            }
                        >

                            <Route
                                path="/compliance"
                                element={<Compliance />}
                            />

                        </Route>

                    </Route>


                    {/* =========================
                        FALLBACK
                    ========================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;