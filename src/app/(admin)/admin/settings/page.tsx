"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');

    useEffect(() => {
        if (session?.user?.accessToken) {
            // Fetch Messages
            const PROD_SERVER = "https://travel-backend-jmld.onrender.com";
            const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || (process.env.NODE_ENV === 'production' ? PROD_SERVER : 'http://localhost:5000');

            fetch(`${BASE_URL}/api/admin/messages`, {
                headers: { Authorization: `Bearer ${session.user.accessToken}` }
            })
                .then(res => res.json())
                .then(data => setMessages(data))
                .catch(err => console.error(err));

            fetch(`${BASE_URL}/api/admin/settings`, {
                headers: { Authorization: `Bearer ${session.user.accessToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data) setSettings(data);
                })
                .catch(err => console.error(err));
        }

    }, [session]);

    const handleSave = async () => {
        if (!session?.user?.accessToken) return;

        try {
            const PROD_SERVER = "https://travel-backend-jmld.onrender.com";
            const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || (process.env.NODE_ENV === 'production' ? PROD_SERVER : 'http://localhost:5000');
            await fetch(`${BASE_URL}/api/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify(settings)
            });
            alert("Settings saved!");
        } catch (err) {
            console.error("Error saving settings", err);
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6">Settings & Feedback</h2>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${activeTab === 'messages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('messages')}
                >
                    Contact Messages
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    System Configuration
                </button>
            </div>

            {activeTab === 'messages' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No messages found.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {messages.map((msg) => (
                                <li key={msg._id?.$oid || msg.id} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex justify-between">
                                        <div className="font-semibold text-gray-900">{msg.subject}</div>
                                        <div className="text-xs text-gray-400">{new Date(msg.createdAt?.$date || Date.now()).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">{msg.name} &lt;{msg.email}&gt;</div>
                                    <p className="mt-2 text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{msg.message}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                            <input
                                type="text"
                                value={settings['support_phone'] || ''}
                                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                            <input
                                type="text"
                                value={settings['support_email'] || ''}
                                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="support@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SMS Gateway API Key</label>
                            <input
                                type="password"
                                value={settings['sms_api_key'] || ''}
                                onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="sk_live_..."
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
