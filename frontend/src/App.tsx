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

// New menu pages
import PartsTranslation from './pages/translation/PartsTranslation';
import ManufacturersList from './pages/manufacturers/ManufacturersList';
import ChangeRequests from './pages/requests/ChangeRequests';
import MyRequests from './pages/requests/MyRequests';
import Roles from './pages/admin/Roles';
import Permissions from './pages/admin/Permissions';
import Configs from './pages/admin/Configs';
import QuotesList from './pages/quotes/QuotesList';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />

                    {/* Auth Routes - Redirect to dashboard if already logged in */}
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

                        {/* Parts */}
                        <Route path="/parts" element={<PartList />} />
                        <Route path="/parts/new" element={<PartForm />} />
                        <Route path="/parts/:id" element={<PartDetail />} />
                        <Route path="/parts/:id/edit" element={<PartForm />} />

                        {/* Translation */}
                        <Route path="/translation" element={<PartsTranslation />} />

                        {/* Manufacturers */}
                        <Route path="/manufacturers" element={<ManufacturersList />} />

                        {/* Requests */}
                        <Route path="/change-requests" element={<ChangeRequests />} />
                        <Route path="/my-requests" element={<MyRequests />} />

                        {/* Administration */}
                        <Route path="/admin/roles" element={<Roles />} />
                        <Route path="/admin/permissions" element={<Permissions />} />
                        <Route path="/admin/configs" element={<Configs />} />

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
