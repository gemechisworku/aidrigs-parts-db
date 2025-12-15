import apiClient from './api';

export interface Manufacturer {
    id: string;
    mfg_id: string;
    mfg_name: string;
    mfg_type: 'OEM' | 'APM' | 'Remanufacturers';
    country?: string;
    website?: string;
    contact_info?: Record<string, any>;
    certification?: string;
    created_at: string;
    updated_at: string;
}

export interface ManufacturerCreate {
    mfg_id?: string;
    mfg_name: string;
    mfg_type?: 'OEM' | 'APM' | 'Remanufacturers';
    country?: string;
    website?: string;
    contact_info?: Record<string, any>;
    certification?: string;
}

export interface ManufacturerUpdate {
    mfg_id?: string;
    mfg_name?: string;
    mfg_type?: 'OEM' | 'APM' | 'Remanufacturers';
    country?: string;
    website?: string;
    contact_info?: Record<string, any>;
    certification?: string;
}

export const manufacturersAPI = {
    getManufacturers: async (skip = 0, limit = 100) => {
        const response = await apiClient.get<Manufacturer[]>(`/manufacturers/?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getManufacturer: async (id: string) => {
        const response = await apiClient.get<Manufacturer>(`/manufacturers/${id}`);
        return response.data;
    },

    createManufacturer: async (data: ManufacturerCreate) => {
        const response = await apiClient.post<Manufacturer>('/manufacturers/', data);
        return response.data;
    },

    updateManufacturer: async (id: string, data: ManufacturerUpdate) => {
        const response = await apiClient.put<Manufacturer>(`/manufacturers/${id}`, data);
        return response.data;
    },

    deleteManufacturer: async (id: string) => {
        const response = await apiClient.delete<Manufacturer>(`/manufacturers/${id}`);
        return response.data;
    }
};
