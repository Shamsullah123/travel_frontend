"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        agencyName: '',
        adminName: '',
        mobileNumber: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            await ApiClient.post('/auth/register', {
                agencyName: formData.agencyName,
                adminName: formData.adminName,
                mobileNumber: formData.mobileNumber,
                email: formData.email,
                password: formData.password
            });

            // Auto login after registration
            const result = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]">
                <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Register your agency
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 hover:gap-2 transition-all">
                        sign in to your existing account
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md opacity-0 animate-[fadeInUp_0.5s_ease-out_0.2s_forwards]">
                <div className="bg-white py-8 px-4 shadow shadow-indigo-100 sm:rounded-xl sm:px-10 border border-gray-100">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm animate-[shake_0.5s_ease-in-out]">
                                {error}
                            </div>
                        )}

                        <div className="group">
                            <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Agency Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="agencyName"
                                    name="agencyName"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.agencyName}
                                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Admin (Your) Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="adminName"
                                    name="adminName"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Mobile Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    type="tel"
                                    required
                                    placeholder="03XXXXXXXXX"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.mobileNumber}
                                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Confirm Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Register'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
