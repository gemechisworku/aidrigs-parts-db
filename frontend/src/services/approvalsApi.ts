import apiClient from './api';

export interface PendingPart {
    id: string;
    part_id: string;
    designation: string | null;
    approval_status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
}

export interface ApprovalSummary {
    pending_parts: number;
    pending_translations: number;
    pending_hscodes: number;
    pending_manufacturers: number;
    pending_ports: number;
    pending_partners: number;
    total_pending: number;
}

export const approvalsAPI = {
    // Get approval summary
    getSummary: async () => {
        const response = await apiClient.get<ApprovalSummary>('/approvals/summary');
        return response.data;
    },

    // Get pending parts
    getPendingParts: async (skip: number = 0, limit: number = 100) => {
        const response = await apiClient.get<PendingPart[]>('/approvals/pending/parts', {
            params: { skip, limit }
        });
        return response.data;
    },

    // Approve a part
    approvePart: async (partId: string, reviewNotes?: string) => {
        const response = await apiClient.post(`/approvals/parts/${partId}/approve`, {
            review_notes: reviewNotes
        });
        return response.data;
    },

    // Reject a part
    rejectPart: async (partId: string, rejectionReason: string) => {
        const response = await apiClient.post(`/approvals/parts/${partId}/reject`, {
            rejection_reason: rejectionReason
        });
        return response.data;
    },

    // Approve a translation
    approveTranslation: async (translationId: string, reviewNotes?: string) => {
        const response = await apiClient.post(`/approvals/translations/${translationId}/approve`, {
            review_notes: reviewNotes
        });
        return response.data;
    },

    // Reject a translation
    rejectTranslation: async (translationId: string, rejectionReason: string) => {
        const response = await apiClient.post(`/approvals/translations/${translationId}/reject`, {
            rejection_reason: rejectionReason
        });
        return response.data;
    },

    // Approve a port
    approvePort: async (portId: string, reviewNotes?: string) => {
        const response = await apiClient.post(`/approvals/ports/${portId}/approve`, {
            review_notes: reviewNotes
        });
        return response.data;
    },

    // Reject a port
    rejectPort: async (portId: string, rejectionReason: string) => {
        const response = await apiClient.post(`/approvals/ports/${portId}/reject`, {
            rejection_reason: rejectionReason
        });
        return response.data;
    },

    // Get all pending items (generic)
    getPendingItems: async (entityType?: string) => {
        const params = entityType ? { entity_type: entityType } : {};
        const response = await apiClient.get<any[]>('/approvals/pending', { params });
        return response.data;
    }
};
