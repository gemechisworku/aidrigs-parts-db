import apiClient from './api';

export interface Vehicle {
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    engine?: string;
    trim?: string;
    transmission?: string;
    drive_type?: string;
    created_at: string;
    updated_at: string;
}

export interface VehicleCreate {
    vin: string;
    make: string;
    model: string;
    year: number;
    engine?: string;
    trim?: string;
    transmission?: string;
    drive_type?: string;
}

export interface VehicleUpdate {
    vin?: string;
    make?: string;
    model?: string;
    year?: number;
    engine?: string;
    trim?: string;
    transmission?: string;
    drive_type?: string;
}

export interface VehicleEquivalence {
    id: string;
    vin_prefix: string;
    equivalent_families: string;
    created_at: string;
    updated_at: string;
}

export interface VehicleEquivalenceCreate {
    vin_prefix: string;
    equivalent_families: string;
}

export interface VehiclePartCompatibility {
    id: string;
    vehicle_id: string;
    part_id: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface VehiclePartCompatibilityCreate {
    vehicle_id: string;
    part_id: string;
    notes?: string;
}

export interface BulkUploadResult {
    created: number;
    updated: number;
    errors: string[];
}

export interface VehiclesPaginatedResponse {
    items: Vehicle[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export const vehiclesAPI = {
    // Vehicles
    getVehicles: async (search = '', skip = 0, limit = 100) => {
        const response = await apiClient.get<VehiclesPaginatedResponse>(`/vehicles/?search=${search}&skip=${skip}&limit=${limit}`);
        return response.data;
    },

    getVehicle: async (id: string) => {
        const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
        return response.data;
    },

    createVehicle: async (vehicle: VehicleCreate) => {
        const response = await apiClient.post<Vehicle>('/vehicles/', vehicle);
        return response.data;
    },

    updateVehicle: async (id: string, data: VehicleUpdate) => {
        const response = await apiClient.put<Vehicle>(`/vehicles/${id}`, data);
        return response.data;
    },

    deleteVehicle: async (id: string) => {
        const response = await apiClient.delete<Vehicle>(`/vehicles/${id}`);
        return response.data;
    },

    // Bulk upload
    bulkUpload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<BulkUploadResult>('/vehicles/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    downloadTemplate: async () => {
        const response = await apiClient.get('/vehicles/download/template', {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'vehicles_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Equivalences
    getEquivalences: async (vehicleId: string) => {
        const response = await apiClient.get<VehicleEquivalence[]>(`/vehicles/${vehicleId}/equivalences`);
        return response.data;
    },

    createEquivalence: async (vehicleId: string, data: VehicleEquivalenceCreate) => {
        const response = await apiClient.post<VehicleEquivalence>(`/vehicles/${vehicleId}/equivalences`, data);
        return response.data;
    },

    deleteEquivalence: async (vehicleId: string, equivalenceId: string) => {
        const response = await apiClient.delete<VehicleEquivalence>(`/vehicles/${vehicleId}/equivalences/${equivalenceId}`);
        return response.data;
    },

    // Compatible parts
    getCompatibleParts: async (vehicleId: string) => {
        const response = await apiClient.get<VehiclePartCompatibility[]>(`/vehicles/${vehicleId}/compatible-parts`);
        return response.data;
    },

    createCompatiblePart: async (vehicleId: string, data: VehiclePartCompatibilityCreate) => {
        const response = await apiClient.post<VehiclePartCompatibility>(`/vehicles/${vehicleId}/compatible-parts`, data);
        return response.data;
    },

    deleteCompatiblePart: async (vehicleId: string, partId: string) => {
        const response = await apiClient.delete<VehiclePartCompatibility>(`/vehicles/${vehicleId}/compatible-parts/${partId}`);
        return response.data;
    }
};
