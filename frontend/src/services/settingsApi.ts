import apiClient from './api';

export interface SystemSetting {
    key: string;
    value: string;
    description?: string;
    type: 'string' | 'boolean' | 'int' | 'json';
    is_secret: boolean;
    category: string;
}

export interface SettingUpdate {
    value?: string;
    description?: string;
    is_secret?: boolean;
}

export const settingsApi = {
    getAll: async (): Promise<SystemSetting[]> => {
        const response = await apiClient.get<SystemSetting[]>('/settings/');
        return response.data;
    },

    update: async (key: string, data: SettingUpdate): Promise<SystemSetting> => {
        const response = await apiClient.put<SystemSetting>(`/settings/${key}`, data);
        return response.data;
    },

    create: async (data: SystemSetting): Promise<SystemSetting> => {
        const response = await apiClient.post<SystemSetting>('/settings/', data);
        return response.data;
    }
};
