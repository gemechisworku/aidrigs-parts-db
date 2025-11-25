/**
 * User Registration Page with Red Branding
 */
import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Calculate password strength
    const calculatePasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z\d]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError('Password must contain uppercase, lowercase, and number');
            return;
        }

        setIsSubmitting(true);

        try {
            await register({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                first_name: formData.first_name || undefined,
                last_name: formData.last_name || undefined,
            });

            // Redirect to login on success
            navigate('/login', {
                state: { message: 'Registration successful! Please login.' }
            });
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Update password strength
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Aid<span className="text-red-600">Rigs</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join the AidRigs platform
                    </p>
                </div>

                {/* Registration Form */}
                <div className="card">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="label">
                                    First Name
                                </label>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    className="input"
                                    placeholder="John"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="last_name" className="label">
                                    Last Name
                                </label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    className="input"
                                    placeholder="Doe"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="label">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="label">
                                Username *
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="input"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={handleChange}
                                pattern="[a-zA-Z0-9_]{3,}"
                                title="Username must be at least 3 characters (letters, numbers, underscore)"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="label">
                                Password *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-600">Password Strength:</span>
                                        <span className={`font-medium ${passwordStrength < 40 ? 'text-red-600' :
                                                passwordStrength < 70 ? 'text-yellow-600' :
                                                    'text-green-600'
                                            }`}>
                                            {getStrengthText(passwordStrength)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                                            style={{ width: `${passwordStrength}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Must include uppercase, lowercase, and number
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirm Password *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary w-full text-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-red-600 hover:text-red-700">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
