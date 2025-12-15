/**
 * Extracted Quotes API Service
 */
import apiClient from './api';

export interface ExtractedQuoteItem {
    id?: string;
    extracted_quote_id?: string;
    part_name: string;
    quantity: number;
    unit_price: number;
    tax_code?: string | null;
    discount?: number | null;
    total_price: number;
    position?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Uploader {
    id: string;
    username: string;
    email: string;
}

export interface ExtractedQuote {
    id: string;
    quote_number?: string | null;
    quote_date?: string | null;
    valid_until?: string | null;
    vehicle_vin?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    customer_name?: string | null;
    customer_city?: string | null;
    customer_country?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
    currency: string;
    origin_incoterm?: string | null;
    origin_port?: string | null;
    extraction_status: string;
    uploaded_by?: string | null;
    uploader?: Uploader | null;
    items: ExtractedQuoteItem[];
    attachment_filename?: string | null;
    attachment_mime_type?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ExtractedQuoteListResponse {
    items: ExtractedQuote[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
}

export interface ExtractedQuoteCreate {
    quote_number?: string | null;
    quote_date?: string | null;
    valid_until?: string | null;
    vehicle_vin?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    customer_name?: string | null;
    customer_city?: string | null;
    customer_country?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
    currency?: string;
    origin_incoterm?: string | null;
    origin_port?: string | null;
    items: ExtractedQuoteItem[];
}

export interface ExtractedQuoteUpdate {
    quote_number?: string | null;
    quote_date?: string | null;
    valid_until?: string | null;
    vehicle_vin?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    customer_name?: string | null;
    customer_city?: string | null;
    customer_country?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
    currency?: string;
    origin_incoterm?: string | null;
    origin_port?: string | null;
    extraction_status?: string;
    items?: ExtractedQuoteItem[];
}

export const extractedQuotesAPI = {
    /**
     * Upload a quote file for AI extraction
     * Uses multipart/form-data with extended timeout (120s)
     */
    async uploadQuoteFile(file: File): Promise<ExtractedQuote> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<ExtractedQuote>('/extracted-quotes/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 120 second timeout for AI processing
        });
        return response.data;
    },

    /**
     * Get list of extracted quotes with pagination and filters
     */
    async getExtractedQuotes(params?: {
        search?: string;
        extraction_status?: string;
        uploaded_by?: string;
        page?: number;
        page_size?: number;
    }): Promise<ExtractedQuoteListResponse> {
        const response = await apiClient.get<ExtractedQuoteListResponse>('/extracted-quotes/', {
            params,
        });
        return response.data;
    },

    /**
     * Get single extracted quote by ID
     */
    async getExtractedQuote(id: string): Promise<ExtractedQuote> {
        const response = await apiClient.get<ExtractedQuote>(`/extracted-quotes/${id}`);
        return response.data;
    },

    /**
     * Update an extracted quote
     */
    async updateExtractedQuote(id: string, data: ExtractedQuoteUpdate): Promise<ExtractedQuote> {
        const response = await apiClient.put<ExtractedQuote>(`/extracted-quotes/${id}`, data);
        return response.data;
    },

    /**
     * Delete an extracted quote
     */
    async deleteExtractedQuote(id: string): Promise<{ message: string; id: string }> {
        const response = await apiClient.delete(`/extracted-quotes/${id}`);
        return response.data;
    },

    /**
     * Get file preview URL for an extracted quote
     */
    getQuoteFilePreviewUrl(id: string): string {
        const baseURL = apiClient.defaults.baseURL || '';
        const token = localStorage.getItem('access_token');
        return `${baseURL}/extracted-quotes/${id}/preview?token=${token}`;
    },

    /**
     * Download the original quote file
     */
    async downloadQuoteFile(id: string, filename?: string): Promise<void> {
        const response = await apiClient.get(`/extracted-quotes/${id}/file`, {
            responseType: 'blob',
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename || 'quote-file');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
