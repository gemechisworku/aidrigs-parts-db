import apiClient from './api';
import { User } from '../types/auth';

export const usersApi = {
    getAll: async () => {
        const response = await apiClient.get<User[]>('/users/');
        return response.data;
    },

    updateStatus: async (userId: string, isActive: boolean) => {
        const response = await apiClient.put<User>(`/users/${userId}`, { is_active: isActive });
        return response.data;
    },

    adminResetPassword: async (userId: string) => {
        const response = await apiClient.post(`/users/${userId}/reset-password`);
        return response.data;
    }
};
