import apiClient from './api';
import { Category, Manufacturer, Part, PartFilters } from '../types/parts';

// Re-export types for convenience
export type { Category, Manufacturer, Part, PartFilters };

export const partsAPI = {
    // Categories
    getCategories: async () => {
        const response = await apiClient.get<Category[]>('/categories/');
        return response.data;
    },

    createCategory: async (data: Partial<Category>) => {
        const response = await apiClient.post<Category>('/categories/', data);
        return response.data;
    },

    // Manufacturers
    getManufacturers: async () => {
        const response = await apiClient.get<Manufacturer[]>('/manufacturers/');
        return response.data;
    },

    createManufacturer: async (data: Partial<Manufacturer>) => {
        const response = await apiClient.post<Manufacturer>('/manufacturers/', data);
        return response.data;
    },

    // Parts
    getParts: async (filters: PartFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.manufacturer_id) params.append('manufacturer_id', filters.manufacturer_id);
        if (filters.page) params.append('skip', ((filters.page - 1) * (filters.size || 10)).toString());
        if (filters.size) params.append('limit', filters.size.toString());

        const response = await apiClient.get<Part[]>('/parts/', { params });
        return response.data;
    },

    getPart: async (id: string) => {
        const response = await apiClient.get<Part>(`/parts/${id}`);
        return response.data;
    },

    createPart: async (data: Partial<Part>) => {
        const response = await apiClient.post<Part>('/parts/', data);
        return response.data;
    },

    updatePart: async (id: string, data: Partial<Part>) => {
        const response = await apiClient.put<Part>(`/parts/${id}`, data);
        return response.data;
    },

    deletePart: async (id: string) => {
        const response = await apiClient.delete<Part>(`/parts/${id}`);
        return response.data;
    },
};
