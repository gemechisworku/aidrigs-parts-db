/**
 * Forgot Password Page
 */
import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setMessage('');

        try {
            await authAPI.forgotPassword(email);
            setStatus('success');
            setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
        } catch (error: any) {
            setStatus('error');
            setMessage('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Aid<span className="text-red-600">Rigs</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email to receive reset instructions
                    </p>
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
                            <Link to="/login" className="btn-primary w-full inline-block">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-sm text-red-700">
                                    {message}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="label">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="btn-primary w-full flex justify-center"
                            >
                                {status === 'submitting' ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm font-medium text-red-600 hover:text-red-700">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
