/**
 * Navbar Component
 * Simple navbar for layout header
 */
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="flex items-center justify-end space-x-4 px-4">
            <span className="text-sm text-gray-600">
                {user.first_name || user.username}
            </span>
            <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
                Sign Out
            </button>
        </div>
    );
};

export default Navbar;
