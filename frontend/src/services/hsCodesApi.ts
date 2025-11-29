import apiClient from './api';

export interface HSCode {
    hs_code: string;
    description_en?: string;
    description_pr?: string;
    description_pt?: string;
}

export interface HSCodeCreate {
    hs_code: string;
    description_en?: string;
    description_pr?: string;
    description_pt?: string;
}

export interface HSCodeUpdate {
    description_en?: string;
    description_pr?: string;
    description_pt?: string;
}

export interface HSCodeTariff {
    hs_code: string;
    country_name: string;
    tariff_rate?: number;
    last_updated?: string;
}

export interface HSCodeTariffCreate {
    hs_code: string;
    country_name: string;
    tariff_rate?: number;
    last_updated?: string;
}

export interface HSCodeTariffUpdate {
    tariff_rate?: number;
    last_updated?: string;
}

export interface HSCodeWithTariffs extends HSCode {
    tariffs: HSCodeTariff[];
}

export interface BulkUploadResult {
    created: number;
    updated: number;
    errors: string[];
}

export interface HSCodesPaginatedResponse {
    items: HSCode[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export const hsCodesAPI = {
    // HS Codes
    getHSCodes: async (search = '', skip = 0, limit = 100) => {
        const response = await apiClient.get<HSCodesPaginatedResponse>(`/hs-codes/?search=${search}&skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getHSCode: async (hsCode: string) => {
        const response = await apiClient.get<HSCodeWithTariffs>(`/hs-codes/${hsCode}`);
        return response.data;
    },

    createHSCode: async (hsCode: HSCodeCreate) => {
        const response = await apiClient.post<HSCode>('/hs-codes/', hsCode);
        return response.data;
    },

    updateHSCode: async (hsCode: string, data: HSCodeUpdate) => {
        const response = await apiClient.put<HSCode>(`/hs-codes/${hsCode}`, data);
        return response.data;
    },

    deleteHSCode: async (hsCode: string) => {
        const response = await apiClient.delete<HSCode>(`/hs-codes/${hsCode}`);
        return response.data;
    },

    // Tariffs
    getTariffs: async (hsCode: string) => {
        const response = await apiClient.get<HSCodeTariff[]>(`/hs-codes/${hsCode}/tariffs`);
        return response.data;
    },

    createTariff: async (tariff: HSCodeTariffCreate) => {
        const response = await apiClient.post<HSCodeTariff>(`/hs-codes/${tariff.hs_code}/tariffs`, tariff);
        return response.data;
    },

    updateTariff: async (hsCode: string, countryName: string, data: HSCodeTariffUpdate) => {
        const response = await apiClient.put<HSCodeTariff>(`/hs-codes/${hsCode}/tariffs/${countryName}`, data);
        return response.data;
    },

    deleteTariff: async (hsCode: string, countryName: string) => {
        const response = await apiClient.delete<HSCodeTariff>(`/hs-codes/${hsCode}/tariffs/${countryName}`);
        return response.data;
    },

    // Bulk upload
    bulkUpload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<BulkUploadResult>('/hs-codes/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    downloadTemplate: async () => {
        const response = await apiClient.get('/hs-codes/download/template', {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'hs_codes_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
