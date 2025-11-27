/**
 * API Service with Axios interceptors for authentication
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

console.log('🔍 API Base URL:', API_BASE_URL); //  DEBUG

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear token and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');

            // Redirect to login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API methods
export const authAPI = {
    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login/json', {
            email,
            password,
        });
        return response.data;
    },

    /**
     * Register a new user
     */
    async register(data: {
        email: string;
        username: string;
        password: string;
        first_name?: string;
        last_name?: string;
    }) {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    /**
     * Get current user info
     */
    async getCurrentUser() {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    /**
     * Update current user profile
     */
    async updateProfile(data: {
        first_name?: string;
        last_name?: string;
        email?: string;
    }) {
        const response = await apiClient.put('/auth/me', data);
        return response.data;
    },

    /**
     * Change password
     */
    async changePassword(oldPassword: string, newPassword: string) {
        const response = await apiClient.post('/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    },

    /**
     * Logout (client-side only for JWT)
     */
    async logout() {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};

export default apiClient;
