export interface Category {
    id: string;
    category_name_en: string;
    category_name_pr?: string;
    category_name_fr?: string;
    parent_id?: string;
    is_active?: boolean;
    children?: Category[];
}

export interface Manufacturer {
    id: string;
    name: string;
    code?: string;
    country?: string;
    website?: string;
    is_active: boolean;
    contact_info?: Record<string, any>;
}

export interface Part {
    id: string;
    part_number: string;
    name: string;
    description?: string;
    category_id?: string;
    manufacturer_id?: string;
    weight_kg?: number;
    dimensions_cm?: Record<string, number>;
    is_active: boolean;
    specifications?: Record<string, any>;
    category?: Category;
    manufacturer?: Manufacturer;
}

export interface PartFilters {
    search?: string;
    category_id?: string;
    manufacturer_id?: string;
    page?: number;
    size?: number;
}
