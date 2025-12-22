'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';

type ConfigType = 'airline' | 'sector' | 'travel_type';

interface ConfigItem {
    id: string;
    value: string;
    created_at: string;
}

export default function SystemConfigPage() {
    const [activeTab, setActiveTab] = useState<ConfigType>('airline');
    const [configs, setConfigs] = useState<Record<ConfigType, ConfigItem[]>>({
        airline: [],
        sector: [],
        travel_type: []
    });
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await ApiClient.get<Record<ConfigType, ConfigItem[]>>('/system-config/');
            setConfigs({
                airline: data.airline || [],
                sector: data.sector || [],
                travel_type: data.travel_type || []
            });
        } catch (error) {
            console.error('Failed to load configs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newValue.trim()) {
            alert('Please enter a value');
            return;
        }

        try {
            await ApiClient.post('/system-config/', {
                config_type: activeTab,
                value: newValue.trim()
            });
            setNewValue('');
            await loadConfigs();
            alert('Added successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to add');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await ApiClient.delete(`/system-config/${id}`);
            await loadConfigs();
            alert('Deleted successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to delete');
        }
    };

    const getTabLabel = (type: ConfigType) => {
        switch (type) {
            case 'airline': return 'Airlines';
            case 'sector': return 'Sectors';
            case 'travel_type': return 'Travel Types';
        }
    };

    const getPlaceholder = (type: ConfigType) => {
        switch (type) {
            case 'airline': return 'e.g., Emirates, PIA, Saudi Airlines';
            case 'sector': return 'e.g., LHE-JHD, ISB-DXB, KHI-RUH';
            case 'travel_type': return 'e.g., Umrah, KSA One Way, UAE One Way';
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h1>
            <p className="text-gray-600 mb-6">Manage airlines, sectors, and travel types that will appear in ticket booking forms.</p>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 inline-flex">
                {(['airline', 'sector', 'travel_type'] as ConfigType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === type ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {getTabLabel(type)}
                    </button>
                ))}
            </div>

            {/* Add New */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New {getTabLabel(activeTab).slice(0, -1)}</h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder={getPlaceholder(activeTab)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Current {getTabLabel(activeTab)} ({configs[activeTab].length})
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : configs[activeTab].length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No {getTabLabel(activeTab).toLowerCase()} added yet. Add one above to get started.
                        </div>
                    ) : (
                        configs[activeTab].map((item) => (
                            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{item.value}</div>
                                    <div className="text-xs text-gray-500">
                                        Added {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
