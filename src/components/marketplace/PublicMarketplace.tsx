"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';

// Simplified ApiClient for public use (no token)
// Helper to fetch without interceptor if token missing?
// ApiClient uses localStorage token. If not logged in, it sends null token.
// Backend now handles null token as Public. So existing ApiClient works!

export default function PublicMarketplace() {
    const [ticketGroups, setTicketGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configOptions, setConfigOptions] = useState({
        airline: [] as string[],
        sector: [] as string[],
        travel_type: [] as string[]
    });

    // Visa State
    const [visaGroups, setVisaGroups] = useState<any[]>([]);
    const [loadingVisas, setLoadingVisas] = useState(true);
    const [visaFilters, setVisaFilters] = useState({
        country: '',
        type: ''
    });

    const [filters, setFilters] = useState({
        sector: '',
        travel_type: '',
        airline: '',
        date: ''
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    useEffect(() => {
        loadConfigOptions();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadTicketGroups();
            loadVisaGroups();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters, sortConfig, visaFilters]);

    const loadConfigOptions = async () => {
        try {
            const [airlineRes, sectorRes, travelRes] = await Promise.all([
                ApiClient.get<any>('/system-config/?type=airline'),
                ApiClient.get<any>('/system-config/?type=sector'),
                ApiClient.get<any>('/system-config/?type=travel_type')
            ]);
            setConfigOptions({
                airline: (airlineRes.airline || []).map((i: any) => i.value),
                sector: (sectorRes.sector || []).map((i: any) => i.value),
                travel_type: (travelRes.travel_type || []).map((i: any) => i.value)
            });
        } catch (error) {
            console.error('Failed to load config options', error);
        }
    };

    const loadTicketGroups = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction,
                status: 'active'
            });

            // Filter out empty params
            Array.from(queryParams.keys()).forEach(key => {
                if (!queryParams.get(key)) queryParams.delete(key);
            });

            // Correct endpoint is /ticket-groups/ (as registered in backend)
            const response = await ApiClient.get<any>(`/ticket-groups/?${queryParams}`);

            // Backend returns { ticket_groups: [...] }
            setTicketGroups(response.ticket_groups || []);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVisaGroups = async () => {
        setLoadingVisas(true);
        try {
            const queryParams = new URLSearchParams();
            if (visaFilters.country) queryParams.append('country', visaFilters.country);
            if (visaFilters.type) queryParams.append('type', visaFilters.type);

            // Use getInternal for Next.js API routes
            const response = await ApiClient.getInternal<any[]>(`/visa-groups/marketplace/?${queryParams}`);
            setVisaGroups(response || []);
        } catch (error) {
            console.error('Failed to load visas', error);
        } finally {
            setLoadingVisas(false);
        }
    };

    return (
        <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Live Marketplace
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                        Browse active ticket listings from verified agencies.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 justify-center">
                    <div className="w-full sm:w-auto">
                        <input
                            list="sector-list-public"
                            placeholder="Filter by Sector..."
                            className="border p-2 rounded w-full sm:w-64"
                            value={filters.sector}
                            onChange={e => setFilters({ ...filters, sector: e.target.value })}
                        />
                    </div>
                    <datalist id="sector-list-public">
                        {configOptions.sector.map(s => <option key={s} value={s} />)}
                    </datalist>

                    <div className="w-full sm:w-auto">
                        <select
                            className="border p-2 rounded w-full sm:w-48"
                            value={filters.travel_type}
                            onChange={e => setFilters({ ...filters, travel_type: e.target.value })}
                        >
                            <option value="">All Travel Types</option>
                            {configOptions.travel_type.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <input
                            list="airline-list-public"
                            placeholder="Filter by Airline..."
                            className="border p-2 rounded w-full sm:w-48"
                            value={filters.airline}
                            onChange={e => setFilters({ ...filters, airline: e.target.value })}
                        />
                    </div>
                    <datalist id="airline-list-public">
                        {configOptions.airline.map(a => <option key={a} value={a} />)}
                    </datalist>

                    <div className="w-full sm:w-auto">
                        <input
                            type="date"
                            className="border p-2 rounded w-full sm:w-40"
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 border p-2 rounded bg-white">
                        <span className="text-sm text-gray-500">Sort:</span>
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction });
                            }}
                            className="bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="created_at-desc">Newest First</option>
                            <option value="price_per_seat-asc">Price: Low to High</option>
                            <option value="price_per_seat-desc">Price: High to Low</option>
                            <option value="date-asc">Flight Date: Sooner</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airline / Sector</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ticketGroups
                                    .filter((group: any) => {
                                        const groupDate = new Date(group.date.$date || group.date);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return group.available_seats > 0 && groupDate >= today;
                                    })
                                    .map((group: any) => (
                                        <tr key={group._id?.$oid || group._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{group.airline}</div>
                                                <div className="text-sm text-gray-500">{group.sector} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{group.travel_type}</span></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{group.flight_no}</div>
                                                <div className="text-xs text-gray-500">
                                                    <div>{new Date(group.date.$date || group.date).toLocaleDateString()}</div>
                                                    <div className="mt-1 font-medium">
                                                        Dep: {(() => {
                                                            const time = group.departure_time || group.time;
                                                            if (!time) return '';
                                                            const [h, m] = time.split(':');
                                                            const hour = parseInt(h);
                                                            return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                                        })()}
                                                    </div>
                                                    {group.arrival_time && (
                                                        <div className="font-medium">
                                                            Arr: {(() => {
                                                                const [h, m] = group.arrival_time.split(':');
                                                                const hour = parseInt(h);
                                                                return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Return Flight Info */}
                                                {group.return_flight_no && (
                                                    <div className="mt-2 text-xs border-t pt-1 border-gray-200">
                                                        <div className="font-semibold text-gray-700">Return: {group.return_flight_no}</div>
                                                        <div className="text-gray-500">
                                                            {group.return_date && new Date(group.return_date.$date || group.return_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="font-medium">
                                                            {group.return_departure_time && <span>Dep: {group.return_departure_time}</span>}
                                                            {group.return_arrival_time && <span> • Arr: {group.return_arrival_time}</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {group.agency_contact ? (
                                                    <div className="text-sm font-medium text-gray-900">{group.agency_contact.name}</div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Verified Agency</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{group.available_seats} / {group.total_seats}</div>
                                                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-green-500 h-1.5 rounded-full"
                                                        style={{ width: `${(group.available_seats / group.total_seats) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                                Rs. {group.price_per_seat?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href="/auth/login"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    Login to Book
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                {ticketGroups.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                            No active tickets found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {ticketGroups
                        .filter((group: any) => {
                            const groupDate = new Date(group.date.$date || group.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return group.available_seats > 0 && groupDate >= today;
                        })
                        .map((group: any) => (
                            <div key={group._id?.$oid || group._id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-gray-900 text-lg">{group.airline}</div>
                                        <div className="text-sm text-gray-500 font-medium">{group.sector}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium mb-1">
                                            {group.travel_type}
                                        </span>
                                        <div className="text-lg font-bold text-indigo-600">Rs. {group.price_per_seat?.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t border-b border-gray-100 py-3">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Flight</div>
                                        <div className="font-medium">{group.flight_no}</div>
                                        <div className="text-gray-600">{new Date(group.date.$date || group.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Dep: {(() => {
                                                const time = group.departure_time || group.time;
                                                if (!time) return '';
                                                const [h, m] = time.split(':');
                                                const hour = parseInt(h);
                                                return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                                            })()}
                                        </div>
                                    </div>

                                    {group.return_flight_no ? (
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Return</div>
                                            <div className="font-medium">{group.return_flight_no}</div>
                                            <div className="text-gray-600">{group.return_date && new Date(group.return_date.$date || group.return_date).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {group.return_departure_time && <span>Dep: {group.return_departure_time}</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Seats</div>
                                            <div className="font-medium">{group.available_seats} / {group.total_seats}</div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full"
                                                    style={{ width: `${(group.available_seats / group.total_seats) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-xs text-gray-500">
                                        {group.agency_contact ? (
                                            <span className="font-medium text-gray-900">{group.agency_contact.name}</span>
                                        ) : (
                                            <span>Verified Agency</span>
                                        )}
                                    </div>
                                    <Link
                                        href="/auth/login"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    {ticketGroups.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                            No active tickets found matching your criteria.
                        </div>
                    )}
                </div>
                {loading && (
                    <div className="p-8 text-center text-gray-500">Loading marketplace...</div>
                )}
            </div>

            {/* Visa Marketplace Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-12">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Visa Marketplace
                    </h2>
                    <p className="mt-2 text-lg text-gray-500">
                        Browse active visa listings from verified agencies.
                    </p>
                </div>

                {/* Visa Filters */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 justify-center">
                    <div className="w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Filter by Country..."
                            className="border p-2 rounded w-full sm:w-64"
                            value={visaFilters.country}
                            onChange={(e) => setVisaFilters({ ...visaFilters, country: e.target.value })}
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <select
                            className="border p-2 rounded w-full sm:w-48"
                            value={visaFilters.type}
                            onChange={(e) => setVisaFilters({ ...visaFilters, type: e.target.value })}
                        >
                            <option value="">All Visa Types</option>
                            <option value="Work">Work</option>
                            <option value="Umrah">Umrah</option>
                            <option value="Visit">Visit</option>
                            <option value="Family">Family</option>
                            <option value="Business">Business</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Visa Table */}
                {/* Desktop Visa Table */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country / Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {visaGroups
                                    .filter(v => v.available_visas > 0)
                                    .map((visa) => (
                                        <tr key={visa._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{visa.visa_title}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{visa.country}</div>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{visa.visa_type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* @ts-ignore */}
                                                <div className="text-sm font-medium text-gray-900">{visa.agency_id?.name || 'Verified Agency'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {visa.visa_validity_days} Days
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{visa.available_visas} / {visa.total_visas}</div>
                                                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(visa.available_visas / visa.total_visas) * 100}%` }} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                                Rs. {visa.price_per_visa.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href="/auth/login"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    Login to Book
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                {visaGroups.length === 0 && !loadingVisas && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                            No active visas found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Visa Cards */}
                <div className="md:hidden space-y-4">
                    {visaGroups
                        .filter(v => v.available_visas > 0)
                        .map((visa) => (
                            <div key={visa._id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-gray-900 text-lg">{visa.visa_title}</div>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {visa.visa_type}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 mb-2">{visa.country}</div>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t border-b border-gray-100 py-3">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Validity</div>
                                        <div className="font-medium">{visa.visa_validity_days} Days</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Availability</div>
                                        <div className="font-medium">{visa.available_visas} / {visa.total_visas}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Price</div>
                                        <div className="text-xl font-bold text-indigo-600">Rs. {visa.price_per_visa.toLocaleString()}</div>
                                    </div>
                                    <Link
                                        href="/auth/login"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    {visaGroups.length === 0 && !loadingVisas && (
                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                            No active visas found.
                        </div>
                    )}
                </div>
                {loadingVisas && (
                    <div className="p-8 text-center text-gray-500">Loading visas...</div>
                )}
            </div>

        </div>
    );
}
