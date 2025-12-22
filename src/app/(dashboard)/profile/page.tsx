'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Info State
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        agencyName: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await ApiClient.get<any>('/profile/me');
            setProfileData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                role: data.role || '',
                agencyName: data.agencyName || ''
            });
        } catch (error) {
            console.error('Failed to load profile', error);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await ApiClient.put('/profile/me', {
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone
            });

            // Update session if email changed
            if (session?.user?.email !== profileData.email) {
                await updateSession({
                    ...session,
                    user: {
                        ...session?.user,
                        email: profileData.email,
                        name: profileData.name
                    }
                });
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        // Validate password strength
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            setLoading(false);
            return;
        }

        try {
            await ApiClient.post('/profile/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h1>

            {/* Message Alert */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 inline-flex">
                <button
                    onClick={() => { setActiveTab('info'); setMessage(null); }}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === 'info' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Profile Information
                </button>
                <button
                    onClick={() => { setActiveTab('password'); setMessage(null); }}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === 'password' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Change Password
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
                {activeTab === 'info' ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                            <input
                                type="tel"
                                placeholder="+92 300 1234567"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                                type="text"
                                disabled
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                                value={profileData.role}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Agency</label>
                            <input
                                type="text"
                                disabled
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                                value={profileData.agencyName}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
