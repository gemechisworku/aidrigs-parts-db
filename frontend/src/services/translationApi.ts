/**
 * Translation API Service
 * Client for translation management endpoints
 */
import apiClient from './api';

export interface Translation {
    id: string;
    part_name_en: string;
    part_name_pr?: string;
    part_name_fr?: string;
    hs_code?: string;
    category_en?: string;
    drive_side_specific?: 'yes' | 'no';
    alternative_names?: string;
    links?: string;
    approval_status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    created_at: string;
    updated_at: string;
}

export interface TranslationCreate {
    part_name_en: string;
    part_name_pr?: string;
    part_name_fr?: string;
    hs_code?: string;
    category_en?: string;
    drive_side_specific?: 'yes' | 'no';
    alternative_names?: string;
    links?: string;
}

export interface TranslationListResponse {
    items: Translation[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface BulkUploadResponse {
    success_count: number;
    error_count: number;
    errors: Array<{ row: number; data: any; error: string }>;
    created_ids: string[];
}

export const translationAPI = {
    /**
     * Get list of translations with filters
     */
    async getTranslations(params?: {
        search?: string;
        category_en?: string;
        drive_side_specific?: string;
        page?: number;
        page_size?: number;
    }): Promise<TranslationListResponse> {
        const response = await apiClient.get<TranslationListResponse>('/translations/', { params });
        return response.data;
    },

    /**
     * Get single translation by ID
     */
    async getTranslation(id: string): Promise<Translation> {
        const response = await apiClient.get<Translation>(`/translations/${id}`);
        return response.data;
    },

    /**
     * Create new translation
     */
    async createTranslation(data: TranslationCreate): Promise<Translation> {
        const response = await apiClient.post<Translation>('/translations/', data);
        return response.data;
    },

    /**
     * Update translation
     */
    async updateTranslation(id: string, data: Partial<TranslationCreate>): Promise<Translation> {
        const response = await apiClient.put<Translation>(`/translations/${id}`, data);
        return response.data;
    },

    /**
     * Delete translation
     */
    async deleteTranslation(id: string): Promise<void> {
        await apiClient.delete(`/translations/${id}`);
    },

    /**
     * Bulk upload translations from CSV
     */
    async bulkUpload(file: File): Promise<BulkUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<BulkUploadResponse>('/translations/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Download CSV template
     */
    async downloadTemplate(): Promise<Blob> {
        const response = await apiClient.get('/translations/template/download', {
            responseType: 'blob',
        });
        return response.data;
    },
};
