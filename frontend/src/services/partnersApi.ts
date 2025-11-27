/**
 * Partners API Service
 */
import apiClient from './api';

export interface Partner {
    id: string;
    code?: string;
    name?: string;
    street_number?: string;
    city?: string;
    country?: string;
    type?: 'supplier' | 'customer' | 'AR_storage' | 'forwarder';
    created_at: string;
    updated_at: string;
}

export interface PartnerCreate {
    code?: string;
    name?: string;
    street_number?: string;
    city?: string;
    country?: string;
    type?: 'supplier' | 'customer' | 'AR_storage' | 'forwarder';
}

export interface PartnerUpdate {
    code?: string;
    name?: string;
    street_number?: string;
    city?: string;
    country?: string;
    type?: 'supplier' | 'customer' | 'AR_storage' | 'forwarder';
}

export const partnersAPI = {
    async getPartners(search?: string, partnerType?: string): Promise<Partner[]> {
        const params: any = {};
        if (search) params.search = search;
        if (partnerType) params.partner_type = partnerType;
        const response = await apiClient.get('/partners/', { params });
        return response.data;
    },

    async getPartner(id: string): Promise<Partner> {
        const response = await apiClient.get(`/partners/${id}`);
        return response.data;
    },

    async createPartner(data: PartnerCreate): Promise<Partner> {
        const response = await apiClient.post('/partners/', data);
        return response.data;
    },

    async updatePartner(id: string, data: PartnerUpdate): Promise<Partner> {
        const response = await apiClient.put(`/partners/${id}`, data);
        return response.data;
    },

    async deletePartner(id: string): Promise<void> {
        await apiClient.delete(`/partners/${id}`);
    },

    async bulkUpload(file: File): Promise<{ created: number; updated: number; errors: string[] }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/partners/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async downloadTemplate(): Promise<void> {
        const response = await apiClient.get('/partners/template/download', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'partners_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
