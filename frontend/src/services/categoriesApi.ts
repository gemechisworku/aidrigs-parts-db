/**
 * Categories API Service
 */
import apiClient from './api';

export interface Category {
    id: string;
    category_name_en: string;
    category_name_pr?: string | null;
    category_name_fr?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CategoryCreate {
    category_name_en: string;
    category_name_pr?: string | null;
    category_name_fr?: string | null;
}

export interface CategoryUpdate {
    category_name_en?: string;
    category_name_pr?: string | null;
    category_name_fr?: string | null;
}

export const categoriesAPI = {
    /**
     * Get all categories
     */
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<Category[]>('/categories/');
        return response.data;
    },

    /**
     * Create a new category
     */
    async createCategory(data: CategoryCreate): Promise<Category> {
        const response = await apiClient.post<Category>('/categories/', data);
        return response.data;
    },

    /**
     * Update a category
     */
    async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
        const response = await apiClient.put<Category>(`/categories/${id}`, data);
        return response.data;
    },

    /**
     * Delete a category
     */
    async deleteCategory(id: string): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};
