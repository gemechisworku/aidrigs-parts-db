/**
 * Change Password Page
 */
import { useState } from 'react';
import { authAPI } from '../../services/api';

const ChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (formData.new_password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.changePassword(formData.old_password, formData.new_password);
            setSuccess('Password changed successfully');
            setFormData({
                old_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (err: any) {
            console.error('Error changing password:', err);
            setError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Change Password</h1>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Status Messages */}
                        {success && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Current Password */}
                        <div>
                            <label className="label">Current Password</label>
                            <input
                                type="password"
                                name="old_password"
                                value={formData.old_password}
                                onChange={handleChange}
                                required
                                className="input"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="label">New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleChange}
                                required
                                className="input"
                                minLength={8}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="label">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                className="input"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
