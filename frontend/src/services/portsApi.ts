/**
 * Ports API Service
 */
import apiClient from './api';

export interface Port {
    id: string;
    port_code: string;
    port_name?: string;
    country?: string;
    country_name?: string;
    city?: string;
    type?: 'Sea' | 'Air' | 'Land';
    created_at: string;
    updated_at: string;
}

export interface PortCreate {
    port_code: string;
    port_name?: string;
    country?: string;
    city?: string;
    type?: 'Sea' | 'Air' | 'Land';
}

export interface PortUpdate {
    port_code?: string;
    port_name?: string;
    country?: string;
    city?: string;
    type?: 'Sea' | 'Air' | 'Land';
}

export const portsAPI = {
    async getPorts(search?: string): Promise<Port[]> {
        const params = search ? { search } : {};
        const response = await apiClient.get('/ports/', { params });
        return response.data;
    },

    async getPort(id: string): Promise<Port> {
        const response = await apiClient.get(`/ports/${id}`);
        return response.data;
    },

    async createPort(data: PortCreate): Promise<Port> {
        const response = await apiClient.post('/ports/', data);
        return response.data;
    },

    async updatePort(id: string, data: PortUpdate): Promise<Port> {
        const response = await apiClient.put(`/ports/${id}`, data);
        return response.data;
    },

    async deletePort(id: string): Promise<void> {
        await apiClient.delete(`/ports/${id}`);
    },

    async bulkUpload(file: File): Promise<{ created: number; updated: number; errors: string[] }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/ports/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async downloadTemplate(): Promise<void> {
        const response = await apiClient.get('/ports/template/download', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ports_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
