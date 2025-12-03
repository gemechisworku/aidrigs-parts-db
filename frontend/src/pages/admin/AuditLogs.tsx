import { useState, useEffect } from 'react';
import { auditLogsAPI, UnifiedLog } from '../../services/auditLogsApi';

const AuditLogs = () => {
    const [logs, setLogs] = useState<UnifiedLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [minDate, setMinDate] = useState<string>('');
    const [selectedLog, setSelectedLog] = useState<UnifiedLog | null>(null);

    useEffect(() => {
        loadMetadata();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [filterType, dateFilter, customStartDate, customEndDate]);

    const loadMetadata = async () => {
        try {
            const meta = await auditLogsAPI.getLogMetadata();
            if (meta.oldest_date) {
                // Format as YYYY-MM-DD for input min attribute
                setMinDate(meta.oldest_date.split('T')[0]);
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            let startDate: Date | undefined;
            let endDate: Date | undefined;
            const now = new Date();

            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    endDate = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    const firstDay = now.getDate() - now.getDay(); // First day is the day of the month - the day of the week
                    startDate = new Date(now.setDate(firstDay));
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date();
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date();
                    break;
                case 'custom':
                    if (customStartDate) startDate = new Date(customStartDate);
                    if (customEndDate) endDate = new Date(customEndDate);
                    break;
            }

            const filters = {
                entity_type: filterType || undefined,
                startDate,
                endDate
            };

            const data = await auditLogsAPI.getAllLogs(1, 50, filters);
            setLogs(data.items);
            if (data.items.length > 0 && !selectedLog) {
                setSelectedLog(data.items[0]);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (customEndDate && newDate > customEndDate) {
            alert("Start date cannot be after end date");
            return;
        }
        setCustomStartDate(newDate);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (customStartDate && newDate < customStartDate) {
            alert("End date cannot be before start date");
            return;
        }
        setCustomEndDate(newDate);
    };

    const getActionColor = (action: string, status?: string) => {
        const lowerAction = action.toLowerCase();
        if (status === 'APPROVED' || lowerAction === 'approve') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'REJECTED' || lowerAction === 'reject') return 'bg-red-100 text-red-800 border-red-200';
        if (lowerAction === 'create') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (lowerAction === 'update') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (lowerAction === 'delete') return 'bg-red-100 text-red-800 border-red-200 font-bold';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const getEntityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'part':
            case 'parts':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            case 'translation':
            case 'translations':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                );
            case 'hs_code':
            case 'hscode':
            case 'hs_codes':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </span>
                    Audit Logs
                </h1>
                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="input min-w-[150px]"
                    >
                        <option value="">All Entities</option>
                        <option value="part">Parts</option>
                        <option value="translation">Translations</option>
                        <option value="hs_code">HS Codes</option>
                    </select>

                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="input min-w-[150px]"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={handleStartDateChange}
                                max={new Date().toISOString().split('T')[0]}
                                min={minDate}
                                className="input w-32"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={handleEndDateChange}
                                max={new Date().toISOString().split('T')[0]}
                                min={minDate}
                                className="input w-32"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => loadLogs()}
                        className="btn-secondary p-2"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Pane: List */}
                <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500 text-sm">Loading...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No logs found
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <div
                                    key={`${log.type}-${log.id}`}
                                    onClick={() => setSelectedLog(log)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedLog?.id === log.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action, log.status)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium uppercase">
                                                {log.entity_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDate(log.timestamp)}
                                        </span>
                                    </div>

                                    <h3 className="font-medium text-gray-900 truncate mb-1">
                                        {log.entity_identifier || log.entity_id}
                                    </h3>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-[10px]">
                                            {log.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{log.username}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Pane: Detail */}
                <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
                    {selectedLog ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Detail Header */}
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedLog.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                            selectedLog.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            {getEntityIcon(selectedLog.entity_type)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {selectedLog.entity_identifier || 'Unknown Entity'}
                                            </h2>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <span className="uppercase font-medium">{selectedLog.entity_type.replace('_', ' ')}</span>
                                                <span>•</span>
                                                <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                                                    {selectedLog.entity_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(selectedLog.action, selectedLog.status)}`}>
                                        {selectedLog.status || selectedLog.action.toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="font-medium text-gray-900">{selectedLog.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{formatDate(selectedLog.timestamp)} at {formatTime(selectedLog.timestamp)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Change Details</h3>

                                {selectedLog.type === 'approval' ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 uppercase mb-1">Old Status</div>
                                                <div className="font-medium text-gray-700">
                                                    {selectedLog.details.old_status || 'PENDING'}
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 uppercase mb-1">New Status</div>
                                                <div className={`font-bold ${selectedLog.status === 'APPROVED' ? 'text-green-600' :
                                                    selectedLog.status === 'REJECTED' ? 'text-red-600' :
                                                        'text-gray-900'
                                                    }`}>
                                                    {selectedLog.status}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedLog.details.notes && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Review Notes</h4>
                                                <div className="bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-100 italic">
                                                    "{selectedLog.details.notes}"
                                                </div>
                                            </div>
                                        )}

                                        {selectedLog.details.rejection_reason && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Rejection Reason</h4>
                                                <div className="bg-red-50 text-red-900 p-4 rounded-lg border border-red-100 italic">
                                                    "{selectedLog.details.rejection_reason}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-sm text-green-400 font-mono">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">Select a log to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
