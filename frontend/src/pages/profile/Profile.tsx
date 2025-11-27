/**
 * User Profile Page
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                username: user.username || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.updateProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
            });

            await refreshUser();
            setSuccess('Profile updated successfully');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

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

                        {/* Username (Read-only) */}
                        <div>
                            <label className="label">Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                disabled
                                className="input bg-gray-100 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="input"
                            />
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
