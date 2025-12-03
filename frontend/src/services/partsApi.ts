import apiClient from './api';
import { Category, Manufacturer, Part, PartCreate, PartFilters, PartListResponse, Position } from '../types/parts';

// Re-export types for convenience
export type { Category, Manufacturer, Part, PartCreate, PartFilters, Position };

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

    // Positions
    getPositions: async () => {
        const response = await apiClient.get<Position[]>('/positions/');
        return response.data;
    },

    // Parts with pagination
    getParts: async (filters: PartFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.mfg_id) params.append('mfg_id', filters.mfg_id);
        if (filters.part_name_en) params.append('part_name_en', filters.part_name_en);
        if (filters.drive_side) params.append('drive_side', filters.drive_side);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());

        const response = await apiClient.get<PartListResponse>('/parts/', { params });
        return response.data;
    },

    getPart: async (id: string) => {
        const response = await apiClient.get<Part>(`/parts/${id}`);
        return response.data;
    },

    createPart: async (data: PartCreate) => {
        const response = await apiClient.post<Part>('/parts/', data);
        return response.data;
    },

    updatePart: async (id: string, data: Partial<PartCreate>) => {
        const response = await apiClient.put<Part>(`/parts/${id}`, data);
        return response.data;
    },

    deletePart: async (id: string) => {
        const response = await apiClient.delete<{ message: string; part_id: string }>(`/parts/${id}`);
        return response.data;
    },

    // Part Equivalences
    getEquivalences: async (partId: string) => {
        const response = await apiClient.get(`/parts/${partId}/equivalences`);
        return response.data;
    },

    createEquivalence: async (partId: string, equivalentPartId: string) => {
        const response = await apiClient.post(`/parts/${partId}/equivalences`, {
            part_id: partId,
            equivalent_part_id: equivalentPartId
        });
        return response.data;
    },

    deleteEquivalence: async (partId: string, equivalentPartId: string) => {
        const response = await apiClient.delete(`/parts/${partId}/equivalences/${equivalentPartId}`);
        return response.data;
    },

    bulkCreateEquivalences: async (partId: string, partIds: string[]) => {
        const response = await apiClient.post(`/parts/${partId}/equivalences/bulk`, {
            part_ids: partIds
        });
        return response.data;
    },

    // Dimension Suggestions
    getDimensionSuggestions: async (partNameEn: string) => {
        try {
            const response = await apiClient.get(`/parts/suggestions/${encodeURIComponent(partNameEn)}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.data?.count === 0) {
                return { suggestions: [], count: 0, recommended: null };
            }
            throw error;
        }
    },
};
