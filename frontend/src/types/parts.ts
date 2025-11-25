export interface Category {
    id: string;
    category_name_en: string;
    category_name_pr?: string;
    category_name_fr?: string;
    created_at: string;
    updated_at: string;
}

export interface Manufacturer {
    id: string;
    mfg_id: string;
    mfg_name: string;
    mfg_type: 'OEM' | 'APM' | 'Remanufacturers';
    country?: string;
    website?: string;
    contact_info?: Record<string, any>;
}

export interface Position {
    id: string;
    position_id: string;
    position_en: string;
    position_pr?: string;
    position_fr?: string;
}

export interface PartTranslation {
    part_name_en: string;
    part_name_pr?: string;
    part_name_fr?: string;
}

export interface Part {
    id: string;
    part_id: string;
    mfg_id?: string;
    part_name_en?: string;
    position_id?: string;
    drive_side: 'NA' | 'LHD' | 'RHD';
    designation?: string;
    moq?: number;
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
    note?: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
    // Nested relationships
    manufacturer?: Manufacturer;
    part_translation?: PartTranslation;
    position?: Position;
}

export interface PartCreate {
    part_id: string;
    mfg_id?: string;
    part_name_en?: string;
    position_id?: string;
    drive_side?: 'NA' | 'LHD' | 'RHD';
    designation?: string;
    moq?: number;
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
    note?: string;
    image_url?: string;
}

export interface PartFilters {
    search?: string;
    mfg_id?: string;
    part_name_en?: string;
    drive_side?: string;
    page?: number;
    page_size?: number;
}

export interface PartListResponse {
    items: Part[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
}
