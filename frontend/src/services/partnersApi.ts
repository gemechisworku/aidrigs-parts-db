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
    contacts?: Contact[];
}

export interface Contact {
    id: string;
    partner_id: string;
    full_name?: string;
    job_title?: string;
    email?: string;
    phone1?: string;
    phone2?: string;
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

export interface ContactCreate {
    partner_id: string;
    full_name?: string;
    job_title?: string;
    email?: string;
    phone1?: string;
    phone2?: string;
}

export interface ContactUpdate {
    full_name?: string;
    job_title?: string;
    email?: string;
    phone1?: string;
    phone2?: string;
}

export const partnersAPI = {
    // Partners CRUD
    async getPartners(search?: string, type?: string, skip: number = 0, limit: number = 10): Promise<Partner[]> {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (type) params.append('type', type);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        const response = await apiClient.get<Partner[]>('/partners/', { params });
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

    // Contact management
    async getContacts(partnerId: string): Promise<Contact[]> {
        const response = await apiClient.get<Contact[]>(`/partners/${partnerId}/contacts`);
        return response.data;
    },

    async createContact(data: ContactCreate): Promise<Contact> {
        const response = await apiClient.post<Contact>(`/partners/${data.partner_id}/contacts`, data);
        return response.data;
    },

    async updateContact(contactId: string, data: ContactUpdate): Promise<Contact> {
        const response = await apiClient.put<Contact>(`/partners/contacts/${contactId}`, data);
        return response.data;
    },

    async deleteContact(contactId: string): Promise<void> {
        await apiClient.delete(`/partners/contacts/${contactId}`);
    },

    // Bulk operations
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
