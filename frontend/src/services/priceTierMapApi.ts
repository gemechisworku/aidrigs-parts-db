/**
 * Price Tier Map API Service
 */
import apiClient from './api';

export interface PriceTierMap {
    id: string;
    part_id: string;
    tier_id: string;
    price: number | null;
    created_at: string;
    tier_name?: string;
    tier_kind?: string;
}

export interface PriceTierMapCreate {
    part_id: string;
    tier_id: string;
    price?: number;
}

export interface PriceTierMapUpdate {
    price?: number;
}

export const priceTierMapAPI = {
    async getPartPrices(partId: string): Promise<PriceTierMap[]> {
        const response = await apiClient.get(`/price-tier-maps/part/${partId}`);
        return response.data;
    },

    async createPrice(data: PriceTierMapCreate): Promise<PriceTierMap> {
        const response = await apiClient.post('/price-tier-maps/', data);
        return response.data;
    },

    async updatePrice(id: string, data: PriceTierMapUpdate): Promise<PriceTierMap> {
        const response = await apiClient.put(`/price-tier-maps/${id}`, data);
        return response.data;
    },

    async deletePrice(id: string): Promise<void> {
        await apiClient.delete(`/price-tier-maps/${id}`);
    }
};
