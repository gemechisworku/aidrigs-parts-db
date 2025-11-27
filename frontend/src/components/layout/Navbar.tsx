/**
 * Navbar Component
 * Header with user profile dropdown
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) return null;

    return (
        <div className="flex items-center justify-end space-x-4 px-4">
            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 focus:outline-none"
                >
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm hover:bg-red-700 transition-colors">
                        <span className="text-sm font-bold">
                            {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-700">
                            {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                            <p className="text-sm font-medium text-gray-700">
                                {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setDropdownOpen(false)}
                        >
                            My Profile
                        </Link>
                        <Link
                            to="/change-password"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setDropdownOpen(false)}
                        >
                            Change Password
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;
