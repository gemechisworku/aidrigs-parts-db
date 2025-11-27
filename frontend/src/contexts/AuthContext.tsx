/**
 * Authentication Context Provider
 * Manages global auth state and provides auth methods to the app
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthState, LoginCredentials, RegisterData, User } from '../types/auth';
import { authAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                try {
                    // Verify token is still valid by fetching current user
                    const user = await authAPI.getCurrentUser();
                    setState({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    setState({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            } else {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();
    }, []);

    /**
     * Login function
     */
    const login = async (credentials: LoginCredentials) => {
        try {
            // Call login API
            const authResponse = await authAPI.login(credentials.email, credentials.password);

            // Store token
            localStorage.setItem('access_token', authResponse.access_token);

            // Fetch user info
            const user = await authAPI.getCurrentUser();
            localStorage.setItem('user', JSON.stringify(user));

            // Update state
            setState({
                user,
                token: authResponse.access_token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            // Clear any partial state
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    };

    /**
     * Register function
     */
    const register = async (data: RegisterData) => {
        try {
            await authAPI.register(data);
            // After registration, user needs to login
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Registration failed');
        }
    };

    /**
     * Logout function
     */
    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // Reset state
        setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });

        // Call backend logout (optional for stateless JWT)
        authAPI.logout().catch(() => {
            // Ignore errors, we've already cleared local state
        });
    };

    /**
     * Update user function  
     */
    const updateUser = (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        setState(prev => ({ ...prev, user }));
    };

    /**
     * Refresh user data from API
     */
    const refreshUser = async () => {
        try {
            const user = await authAPI.getCurrentUser();
            localStorage.setItem('user', JSON.stringify(user));
            setState(prev => ({ ...prev, user }));
        } catch (error) {
            console.error('Failed to refresh user data', error);
        }
    };

    const value: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
