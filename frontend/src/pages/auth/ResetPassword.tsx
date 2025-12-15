/**
 * Reset Password Page
 */
import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid password reset link.');
        }
    }, [token]);

    const calculatePasswordStrength = (pwd: string): number => {
        let strength = 0;
        if (pwd.length >= 8) strength += 25;
        if (pwd.length >= 12) strength += 25;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
        if (/\d/.test(pwd)) strength += 15;
        if (/[^a-zA-Z\d]/.test(pwd)) strength += 10;
        return Math.min(strength, 100);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPassword(val);
        setPasswordStrength(calculatePasswordStrength(val));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            setStatus('error');
            return;
        }

        if (passwordStrength < 50) { // arbitrary threshold
            // Or validation from backend
        }

        setStatus('submitting');
        try {
            await authAPI.resetPassword(token!, password);
            setStatus('success');
            setMessage('Your password has been reset successfully.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Failed to reset password. Link may be expired.');
        }
    };

    const getStrengthColor = (strength: number) => {
        if (strength < 40) return 'bg-red-500';
        if (strength < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (strength: number) => {
        if (strength < 40) return 'Weak';
        if (strength < 70) return 'Fair';
        return 'Strong';
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-4 text-center">
                    <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
                        Invalid Request. Missing reset token.
                    </div>
                    <Link to="/login" className="btn-primary">Return to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Aid<span className="text-red-600">Rigs</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Set New Password
                    </h2>
                </div>

                <div className="card">
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="mb-4 text-green-600">
                                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-900 mb-6">{message}</p>
                            <p className="text-sm text-gray-500">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-sm text-red-700">
                                    {message}
                                </div>
                            )}

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="label">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="input"
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-600">Strength:</span>
                                            <span className={`font-medium ${passwordStrength < 40 ? 'text-red-600' :
                                                passwordStrength < 70 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {getStrengthText(passwordStrength)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                                                style={{ width: `${passwordStrength}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="label">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    className="input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="btn-primary w-full"
                            >
                                {status === 'submitting' ? 'Reseting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
