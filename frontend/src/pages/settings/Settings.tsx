import React, { useState, useEffect } from 'react';
import { settingsApi, SystemSetting } from '../../services/settingsApi';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getAll();
            setSettings(data);
            setError(null);
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (setting: SystemSetting) => {
        setEditingKey(setting.key);
        setEditValue(setting.value || '');
    };

    const handleSave = async (key: string) => {
        try {
            await settingsApi.update(key, { value: editValue });
            setEditingKey(null);
            loadSettings();
        } catch (err) {
            alert('Failed to save setting');
            console.error(err);
        }
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    if (loading) return <div className="p-6">Loading settings...</div>;

    return (
        <div className="p-0">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {settings.map((setting) => (
                            <tr key={setting.key}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {setting.key}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {editingKey === setting.key ? (
                                        <input
                                            type={setting.is_secret ? "password" : "text"}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="border rounded px-2 py-1 w-full"
                                        />
                                    ) : (
                                        setting.is_secret ? '********' : (setting.value || <span className="text-gray-400 italic">Not set</span>)
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {setting.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {editingKey === setting.key ? (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleSave(setting.key)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(setting)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {settings.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No settings found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Settings;
