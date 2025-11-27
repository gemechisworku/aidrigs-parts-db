/**
 * Price Tiers API Service
 */
import apiClient from './api';

export interface PriceTier {
    id: string;
    tier_name: string;
    description?: string;
    tier_kind?: string;
    created_at: string;
    updated_at: string;
}

export interface PriceTierCreate {
    tier_name: string;
    description?: string;
    tier_kind?: string;
}

export interface PriceTierUpdate {
    tier_name?: string;
    description?: string;
    tier_kind?: string;
}

export const priceTiersAPI = {
    async getPriceTiers(search?: string): Promise<PriceTier[]> {
        const params = search ? { search } : {};
        const response = await apiClient.get('/price-tiers/', { params });
        return response.data;
    },

    async getPriceTier(id: string): Promise<PriceTier> {
        const response = await apiClient.get(`/price-tiers/${id}`);
        return response.data;
    },

    async createPriceTier(data: PriceTierCreate): Promise<PriceTier> {
        const response = await apiClient.post('/price-tiers/', data);
        return response.data;
    },

    async updatePriceTier(id: string, data: PriceTierUpdate): Promise<PriceTier> {
        const response = await apiClient.put(`/price-tiers/${id}`, data);
        return response.data;
    },

    async deletePriceTier(id: string): Promise<void> {
        await apiClient.delete(`/price-tiers/${id}`);
    },

    async bulkUpload(file: File): Promise<{ created: number; updated: number; errors: string[] }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/price-tiers/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async downloadTemplate(): Promise<void> {
        const response = await apiClient.get('/price-tiers/template/download', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'price_tiers_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
