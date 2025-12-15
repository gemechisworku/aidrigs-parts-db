import apiClient from './api';

export interface DashboardStats {
    total_parts: number;
    total_translations: number;
    pending_translations: number;
    total_manufacturers: number;
    total_partners: number;
    pending_approvals: number;
}

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get<DashboardStats>('/dashboard/stats');
        return response.data;
    }
};
