/**
 * Shared types for approvals components
 */

export type EntityType = 'parts' | 'translations' | 'hscodes' | 'manufacturers' | 'ports';

export interface TabComponentProps {
    isActive: boolean;
    onCountChange?: (count: number) => void;
    onRefreshNeeded?: () => void; // Called after approve/reject to refresh all counts
}

export interface ApprovalAction {
    review_notes?: string;
    rejection_reason?: string;
}

export interface TabConfig {
    id: EntityType;
    label: string;
    component: React.ComponentType<TabComponentProps>;
}
