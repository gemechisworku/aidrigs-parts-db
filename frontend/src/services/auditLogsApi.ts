
import apiClient from './api';

// Interface for General System Audit Logs
export interface SystemAuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_identifier?: string;
    changes: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    username: string;
}

// Interface for Approval Logs
export interface ApprovalLog {
    id: string;
    entity_type: string;
    entity_id: string;
    entity_identifier?: string;
    old_status: string | null;
    new_status: string;
    reviewed_by: string;
    review_notes: string | null;
    created_at: string;
    reviewer_name?: string; // Optional, might need to be fetched or joined
}

// Unified Log Interface for UI
export interface UnifiedLog {
    id: string;
    type: 'system' | 'approval';
    action: string; // 'create', 'update', 'approve', 'reject', etc.
    entity_type: string;
    entity_id: string;
    entity_identifier?: string;
    user_id: string;
    username: string;
    timestamp: string;
    details: any; // Flexible field for changes or review notes
    status?: string; // For approvals (approved/rejected)
}

export interface AuditLogListResponse {
    items: SystemAuditLog[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
}

export const auditLogsAPI = {
    // Fetch General System Logs
    getSystemLogs: async (
        page: number = 1,
        pageSize: number = 20,
        filters?: { action?: string; entity_type?: string; user_id?: string; startDate?: Date; endDate?: Date }
    ): Promise<AuditLogListResponse> => {
        const params: any = { page, page_size: pageSize };
        if (filters?.action) params.action = filters.action;
        if (filters?.entity_type) params.entity_type = filters.entity_type;
        if (filters?.user_id) params.user_id = filters.user_id;
        if (filters?.startDate) params.start_date = filters.startDate.toISOString();
        if (filters?.endDate) params.end_date = filters.endDate.toISOString();

        const response = await apiClient.get('/audit-logs/', { params });
        return response.data;
    },

    // Fetch Approval Logs
    getApprovalLogs: async (
        skip: number = 0,
        limit: number = 100,
        filters?: { entity_type?: string; entity_id?: string; startDate?: Date; endDate?: Date }
    ): Promise<ApprovalLog[]> => {
        const params: any = { skip, limit };
        if (filters?.entity_type) params.entity_type = filters.entity_type;
        if (filters?.entity_id) params.entity_id = filters.entity_id;
        if (filters?.startDate) params.start_date = filters.startDate.toISOString();
        if (filters?.endDate) params.end_date = filters.endDate.toISOString();

        const response = await apiClient.get('/approvals/logs', { params });
        return response.data;
    },

    // Fetch and Merge Logs (Helper for UI)
    getAllLogs: async (
        page: number = 1,
        pageSize: number = 20,
        filters?: { entity_type?: string; startDate?: Date; endDate?: Date }
    ): Promise<{ items: UnifiedLog[]; total: number }> => {
        try {
            // Fetch both in parallel
            // Note: Pagination is tricky with merged sources. 
            // For now, we'll fetch a larger chunk of approvals to interleave, 
            // or we could just display them in separate lists. 
            // A true merged pagination requires backend support or fetching all (if feasible).
            // Given the requirement, let's fetch a reasonable amount of both and merge client-side for the "recent activity" view.

            const [systemLogsData, approvalLogs] = await Promise.all([
                auditLogsAPI.getSystemLogs(page, pageSize, filters),
                auditLogsAPI.getApprovalLogs(0, 100, filters) // Fetch recent 100 approvals
            ]);

            // Transform System Logs
            const unifiedSystemLogs: UnifiedLog[] = systemLogsData.items.map(log => ({
                id: log.id,
                type: 'system',
                action: log.action,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                entity_identifier: log.entity_identifier,
                user_id: log.user_id,
                username: log.username,
                timestamp: log.created_at,
                details: log.changes
            }));

            // Transform Approval Logs
            // Note: Approval logs might not have username directly if not joined in backend.
            // We might see UUIDs. Ideally backend should provide names.
            // Assuming backend returns what we saw in ApprovalLogResponse.
            const unifiedApprovalLogs: UnifiedLog[] = approvalLogs.map(log => ({
                id: log.id,
                type: 'approval',
                action: log.new_status === 'APPROVED' ? 'approve' : (log.new_status === 'REJECTED' ? 'reject' : 'review'),
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                entity_identifier: log.entity_identifier,
                user_id: log.reviewed_by,
                username: 'Reviewer', // Placeholder if name not available
                timestamp: log.created_at,
                details: {
                    old_status: log.old_status,
                    new_status: log.new_status,
                    notes: log.review_notes
                },
                status: log.new_status
            }));

            // Merge and Sort
            const allLogs = [...unifiedSystemLogs, ...unifiedApprovalLogs].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Slice for pagination simulation if needed, or just return all for the current "page" view
            // Since system logs are paginated but approvals are not fully aligned, 
            // this is a "best effort" merged view.

            return {
                items: allLogs,
                total: systemLogsData.total + approvalLogs.length // Approximate total
            };

        } catch (error) {
            console.error("Error fetching audit logs:", error);
            throw error;
        }
    }
};
