import apiClient from './api';

export interface Country {
    code: string;
    name: string;
    currency_code?: string;
    currency_name?: string;
}

export const countriesAPI = {
    getCountries: async (skip = 0, limit = 300) => {
        const response = await apiClient.get<Country[]>(`/countries/?skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getCountry: async (code: string) => {
        const response = await apiClient.get<Country>(`/countries/${code}`);
        return response.data;
    }
};
