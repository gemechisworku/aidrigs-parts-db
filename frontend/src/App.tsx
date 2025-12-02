/**
 * Main App Component with Authentication and Sidebar Navigation
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components';
import Layout from './components/layout/Layout';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected pages
import Dashboard from './pages/Dashboard';
import PartList from './pages/parts/PartList';
import PartForm from './pages/parts/PartForm';
import PartDetail from './pages/parts/PartDetail';

// Profile pages
import Profile from './pages/profile/Profile';
import ChangePassword from './pages/profile/ChangePassword';

// New menu pages
import PartsTranslation from './pages/translation/PartsTranslation';
import Manufacturers from './pages/reference/Manufacturers';
import Categories from './pages/admin/Categories';
import ChangeRequests from './pages/requests/ChangeRequests';
import MyRequests from './pages/requests/MyRequests';
import Roles from './pages/admin/Roles';
import Permissions from './pages/admin/Permissions';
import Configs from './pages/admin/Configs';
import AuditLogs from './pages/admin/AuditLogs';
import QuotesList from './pages/quotes/QuotesList';

// Reference Data pages
import Ports from './pages/reference/Ports';
import PriceTiers from './pages/reference/PriceTiers';
import HSCodes from './pages/reference/HSCodes';
import Vehicles from './pages/reference/Vehicles';

// Business pages
import Partners from './pages/partners/Partners';

// Approval pages
import PendingApprovals from './pages/approvals/PendingApprovals';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />

                    {/* Auth Routes */}
                    <Route
                        path="/login"
                        element={
                            <ProtectedRoute requireAuth={false}>
                                <Login />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <ProtectedRoute requireAuth={false}>
                                <Register />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected Routes with Layout */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard */}
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* User Profile */}
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/change-password" element={<ChangePassword />} />

                        {/* Parts */}
                        <Route path="/parts" element={<PartList />} />
                        <Route path="/parts/new" element={<PartForm />} />
                        <Route path="/parts/:id" element={<PartDetail />} />
                        <Route path="/parts/:id/edit" element={<PartForm />} />

                        {/* Translation & Data */}
                        <Route path="/translation" element={<PartsTranslation />} />
                        <Route path="/manufacturers" element={<Manufacturers />} />
                        <Route path="/categories" element={<Categories />} />

                        {/* Reference Data */}
                        <Route path="/ports" element={<Ports />} />
                        <Route path="/price-tiers" element={<PriceTiers />} />
                        <Route path="/hs-codes" element={<HSCodes />} />
                        <Route path="/vehicles" element={<Vehicles />} />

                        {/* Business */}
                        <Route path="/partners" element={<Partners />} />

                        {/* Requests */}
                        <Route path="/change-requests" element={<ChangeRequests />} />
                        <Route path="/my-requests" element={<MyRequests />} />

                        {/* Administration */}
                        <Route path="/admin/roles" element={<Roles />} />
                        <Route path="/admin/permissions" element={<Permissions />} />
                        <Route path="/admin/configs" element={<Configs />} />
                        <Route path="/admin/approvals" element={<PendingApprovals />} />
                        <Route path="/admin/audit-logs" element={<AuditLogs />} />

                        {/* Quotes */}
                        <Route path="/quotes" element={<QuotesList />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
