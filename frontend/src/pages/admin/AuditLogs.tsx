/**
 * Audit Logs Admin Page
 * View all system audit trail with filtering
 */
import { useState, useEffect } from 'react';
import apiClient from '../../services/api';

interface AuditLog {
    id: string;
    user_id?: string;
    username: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    changes?: any;
    ip_address?: string;
    created_at: string;
}

interface AuditLogListResponse {
    items: AuditLog[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
}

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');

    useEffect(() => {
        loadAuditLogs();
    }, [page, filterAction, filterEntity]);

    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', '20');
            if (filterAction) params.append('action', filterAction);
            if (filterEntity) params.append('entity_type', filterEntity);

            const response = await apiClient.get<AuditLogListResponse>('/audit-logs/', { params });
            setLogs(response.data.items);
            setTotal(response.data.total);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'LOGIN': return 'bg-purple-100 text-purple-800';
            case 'LOGOUT': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
                    <p className="text-gray-600">System audit trail - all CREATE, UPDATE, DELETE, and LOGIN operations</p>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <select
                                value={filterAction}
                                onChange={(e) => {
                                    setFilterAction(e.target.value);
                                    setPage(1);
                                }}
                                className="input"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="LOGIN">LOGIN</option>
                                <option value="LOGOUT">LOGOUT</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filterEntity}
                                onChange={(e) => {
                                    setFilterEntity(e.target.value);
                                    setPage(1);
                                }}
                                className="input"
                            >
                                <option value="">All Entities</option>
                                <option value="parts">Parts</option>
                                <option value="manufacturers">Manufacturers</option>
                                <option value="translations">Translations</option>
                                <option value="auth">Authentication</option>
                            </select>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                            {total} total audit logs
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No audit logs found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {log.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {log.entity_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.ip_address || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {log.changes ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-blue-600 hover:text-blue-900">
                                                            View changes
                                                        </summary>
                                                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                                                            {JSON.stringify(log.changes, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 flex justify-between items-center border-t">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-outline disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="btn-outline disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
