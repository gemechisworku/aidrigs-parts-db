/**
 * User Management Page
 * Allows admins to view users, manage access, and send invitations
 */
import React, { useState, useEffect } from 'react';
import { invitesApi, Invite } from '../../services/invitesApi';
import { usersApi } from '../../services/usersApi';
import { User } from '../../types/auth';

const UserManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');

    // Data states
    const [invites, setInvites] = useState<Invite[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, invitesData] = await Promise.all([
                usersApi.getAll(),
                invitesApi.getAll()
            ]);
            setUsers(usersData);
            setInvites(invitesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');

        try {
            const response = await invitesApi.create({
                email: inviteEmail,
                send_email: sendEmail
            });

            if (response.email_sent === false) {
                setInviteSuccess('Invitation created, but email delivery failed. Please copy the link manually.');
            } else {
                setInviteSuccess('Invitation sent successfully!');
            }

            setInviteEmail('');
            setShowInviteModal(false);
            loadData();
        } catch (error: any) {
            setInviteError(error.response?.data?.detail || 'Failed to send invitation');
        }
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        alert('Invite link copied to clipboard!');
    };

    const handleDeleteInvite = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this invitation?')) {
            return;
        }

        try {
            await invitesApi.delete(id);
            setInviteSuccess('Invitation deleted successfully');
            loadData();
        } catch (error) {
            console.error('Failed to delete invite:', error);
            alert('Failed to delete invitation');
        }
    };

    const handleToggleStatus = async (user: User) => {
        const action = user.is_active ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} user ${user.username}?`)) {
            return;
        }

        try {
            await usersApi.updateStatus(user.id, !user.is_active);
            loadData();
        } catch (error) {
            console.error('Failed to update user status:', error);
            alert('Failed to update user status');
        }
    };

    const handleResetPassword = async (user: User) => {
        if (!window.confirm(`Send password reset email to ${user.email}?`)) {
            return;
        }

        try {
            await usersApi.adminResetPassword(user.id);
            alert(`Password reset email sent to ${user.email}`);
        } catch (error) {
            console.error('Failed to send reset email:', error);
            alert('Failed to send password reset email');
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {loading && (
                    <div className="fixed top-0 left-0 w-full h-1 bg-indigo-100 z-50">
                        <div className="h-full bg-indigo-600 animate-pulse"></div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">Manage system access and invitations</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="btn-primary"
                        >
                            Invite New User
                        </button>
                    </div>
                </div>

                {inviteSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{inviteSuccess}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Registered Users
                        </button>
                        <button
                            onClick={() => setActiveTab('invites')}
                            className={`${activeTab === 'invites'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Invitations
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="card">
                    {activeTab === 'users' ? (
                        /* Users Table */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                        <div className="text-xs text-gray-400">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_superuser ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {user.is_superuser ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                    >
                                                        {user.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button
                                                        onClick={() => handleResetPassword(user)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Reset Password
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Invites Table */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invites.map((invite) => (
                                        <tr key={invite.id || invite.token}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {invite.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {invite.is_used ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Accepted
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 w-fit">
                                                            Pending
                                                        </span>
                                                        {invite.email_sent === true && (
                                                            <span className="text-xs text-green-600 flex items-center">
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Email Sent
                                                            </span>
                                                        )}
                                                        {invite.email_sent === false && (
                                                            <span className="text-xs text-red-600 flex items-center" title={invite.email_error}>
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Email Failed
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(invite.expires_at!).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {!invite.is_used && (
                                                    <div className="flex space-x-3">
                                                        {invite.invite_link && (
                                                            <button
                                                                onClick={() => copyLink(invite.invite_link!)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Copy Link
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteInvite(invite.id!)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {invites.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                                No invitations found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New User</h3>
                                {inviteError && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                                        {inviteError}
                                    </div>
                                )}
                                <form onSubmit={handleInvite}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="input"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                        />
                                    </div>
                                    <div className="mb-6 flex items-center">
                                        <input
                                            id="send_email"
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={sendEmail}
                                            onChange={(e) => setSendEmail(e.target.checked)}
                                        />
                                        <label htmlFor="send_email" className="ml-2 block text-sm text-gray-900">
                                            Send invitation email via SMTP
                                        </label>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowInviteModal(false)}
                                            className="btn-outline"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                        >
                                            Send Invitation
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
