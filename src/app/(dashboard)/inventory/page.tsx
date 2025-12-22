'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ApiClient } from '@/lib/api';
import BookingModal from '@/components/inventory/BookingModal';
import ViewBookingModal from '@/components/inventory/ViewBookingModal';


export default function InventoryPage() {
    const { data: session } = useSession();
    const [ticketGroups, setTicketGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        sector: '',
        travel_type: '',
        airline: '',
        date: '',
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    // Form State
    const [formData, setFormData] = useState({
        airline: '',
        sector: '',
        travel_type: 'Umrah',
        date: '',
        flight_no: '',
        departure_time: '',
        arrival_time: '',
        time: '', // Legacy
        // Return Details
        return_flight_no: '',
        return_date: '',
        return_departure_time: '',
        return_arrival_time: '',
        baggage: '23KG',
        meal: false,
        price_per_seat: '',
        total_seats: '',
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadTicketGroups();
    }, [filters, sortConfig]);

    const [activeTab, setActiveTab] = useState<'market' | 'purchases' | 'sales'>('market');
    const [bookings, setBookings] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState({ sales: 0, purchases: 0 });
    const [stats, setStats] = useState({ active_tickets: 0, sold_tickets: 0 });
    const [configOptions, setConfigOptions] = useState<{
        airline: string[];
        sector: string[];
        travel_type: string[];
    }>({ airline: [], sector: [], travel_type: [] });

    useEffect(() => {
        loadCounts();
        // Poll for notifications
        const interval = setInterval(loadCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadConfigOptions();
    }, []);

    const loadConfigOptions = async () => {
        try {
            const data = await ApiClient.get<any>('/system-config/');
            setConfigOptions({
                airline: (data.airline || []).map((item: any) => item.value),
                sector: (data.sector || []).map((item: any) => item.value),
                travel_type: (data.travel_type || []).map((item: any) => item.value)
            });
        } catch (error) {
            console.error('Failed to load config options', error);
        }
    };

    const loadCounts = async () => {
        try {
            const res = await ApiClient.get<any>('/ticket-bookings/counts');
            setUnreadCounts(res);
            if (res.stats) {
                setStats(res.stats);
            }
        } catch (error) {
            console.error('Failed to load counts', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'market') {
            loadTicketGroups();
        } else {
            // Mark as read when opening the tab
            markAsRead(activeTab);
            loadBookings(activeTab);
        }
    }, [activeTab, filters]);

    const markAsRead = async (type: 'purchases' | 'sales') => {
        try {
            await ApiClient.post('/ticket-bookings/mark-read', { type });
            loadCounts(); // Refresh counts
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const loadTicketGroups = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters as any);
            queryParams.append('sort_by', sortConfig.key);
            queryParams.append('sort_order', sortConfig.direction);

            const response = await ApiClient.get<{ ticket_groups: any[] }>(`/ticket-groups/?${queryParams.toString()}`);
            setTicketGroups(response.ticket_groups);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBookings = async (type: 'purchases' | 'sales') => {
        try {
            setLoading(true);
            const response = await ApiClient.get<any[]>(`/ticket-bookings/?type=${type}`);
            setBookings(response);
        } catch (error) {
            console.error('Failed to load bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price_per_seat: parseFloat(formData.price_per_seat),
                total_seats: parseInt(formData.total_seats),
            };

            if (editingId) {
                await ApiClient.put(`/ticket-groups/${editingId}`, payload);
            } else {
                await ApiClient.post('/ticket-groups/', payload);
            }

            setShowModal(false);
            setEditingId(null);
            resetForm();
            if (activeTab === 'market') loadTicketGroups();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const resetForm = () => {
        setFormData({
            airline: '',
            sector: '',
            travel_type: 'Umrah',
            date: '',
            flight_no: '',
            departure_time: '',
            arrival_time: '',
            time: '',
            // Return Details
            return_flight_no: '',
            return_date: '',
            return_departure_time: '',
            return_arrival_time: '',
            baggage: '23KG',
            meal: false,
            price_per_seat: '',
            total_seats: '',
        });
    };

    const handleEdit = (group: any) => {
        setEditingId(group._id.$oid || group._id);
        const dateObj = new Date(group.date.$date || group.date);
        const dateStr = dateObj.toISOString().split('T')[0];

        setFormData({
            airline: group.airline,
            sector: group.sector,
            travel_type: group.travel_type,
            date: dateStr,
            flight_no: group.flight_no,
            departure_time: group.departure_time || '',
            arrival_time: group.arrival_time || '',
            time: group.time || '',
            // Return Details
            return_flight_no: group.return_flight_no || '',
            return_date: group.return_date ? new Date(group.return_date.$date || group.return_date).toISOString().split('T')[0] : '',
            return_departure_time: group.return_departure_time || '',
            return_arrival_time: group.return_arrival_time || '',
            baggage: group.baggage,
            meal: group.meal,
            price_per_seat: group.price_per_seat.toString(),
            total_seats: group.total_seats.toString(),
        });
        setShowModal(true);
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'closed' : 'active';
        try {
            await ApiClient.patch(`/ticket-groups/${id}/status`, { status: newStatus });
            loadTicketGroups();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket group? This action cannot be undone.')) return;
        try {
            await ApiClient.delete(`/ticket-groups/${id}`);
            loadTicketGroups();
        } catch (error) {
            console.error('Failed to delete group', error);
            alert('Failed to delete group');
        }
    };

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    const handleBookClick = (group: any) => {
        setSelectedGroup(group);
        setShowBookingModal(true);
    };

    const handleConfirmBooking = async (bookingId: string) => {
        if (!confirm('Confirm this booking? This will finalize the seat reservation.')) return;

        try {
            await ApiClient.post(`/bookings/${bookingId}/confirm`, {});
            alert('Booking confirmed successfully!');
            if (activeTab === 'sales') {
                await loadBookings('sales');
            }
            await loadTicketGroups();
        } catch (error: any) {
            alert(error.message || 'Failed to confirm booking');
        }
    };

    const handleRejectBooking = async (bookingId: string) => {
        if (!confirm('Reject this booking? Seats will be restored to the marketplace.')) return;

        try {
            await ApiClient.post(`/bookings/${bookingId}/reject`, {});
            alert('Booking rejected and seats restored!');
            if (activeTab === 'sales') {
                await loadBookings('sales');
            }
            await loadTicketGroups();
        } catch (error: any) {
            alert(error.message || 'Failed to reject booking');
        }
    };

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewBooking, setViewBooking] = useState<any>(null);

    const handleViewDetails = (booking: any) => {
        setViewBooking(booking);
        setShowViewModal(true);
    };

    const handleBookingSubmit = async (bookingData: any) => {
        try {
            await ApiClient.post('/ticket-bookings/', bookingData);
            alert('Booking Successful!');
            // Reload whatever view makes sense
            if (activeTab === 'market') loadTicketGroups();
            else loadBookings(activeTab);
            loadCounts(); // Refresh notification counts
        } catch (error: any) {
            const errMsg = error.message || 'Booking Request Failed';
            alert('Booking Failed: ' + errMsg);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Ticket Marketplace</h1>
                    <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg mt-3 inline-flex">
                        <button
                            onClick={() => setActiveTab('market')}
                            className={`px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium rounded-md transition-shadow ${activeTab === 'market' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Marketplace
                        </button>
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium rounded-md transition-shadow relative ${activeTab === 'sales' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Incoming Sales
                            {unreadCounts.sales > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {unreadCounts.sales}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium rounded-md transition-shadow relative ${activeTab === 'purchases' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Purchases
                            {unreadCounts.purchases > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {unreadCounts.purchases}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {activeTab === 'market' && (
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Stats Widget */}
                        <div className="bg-white border px-4 py-2 rounded-lg flex flex-row gap-4 md:gap-6 text-sm shadow-sm items-center justify-between md:justify-start">
                            <div className="text-center md:text-left">
                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Total Active</span>
                                <span className="font-bold text-indigo-600 text-lg block leading-none mt-1">{stats.active_tickets}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-center md:text-left">
                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Total Sold</span>
                                <span className="font-bold text-green-600 text-lg block leading-none mt-1">{stats.sold_tickets}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 w-full md:w-auto"
                        >
                            <span>+</span> Add Sell Ticket
                        </button>
                    </div>
                )}
            </div>

            {/* Filters (Only for Market) */}
            {activeTab === 'market' && (
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row flex-wrap gap-4">
                    <input
                        list="sector-list-filter"
                        placeholder="Filter by Sector..."
                        className="border p-2 rounded w-full md:w-64"
                        value={filters.sector}
                        onChange={e => setFilters({ ...filters, sector: e.target.value })}
                    />
                    <datalist id="sector-list-filter">
                        {configOptions.sector.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <select
                        className="border p-2 rounded w-full md:w-48"
                        value={filters.travel_type}
                        onChange={e => setFilters({ ...filters, travel_type: e.target.value })}
                    >
                        <option value="">All Travel Types</option>
                        {configOptions.travel_type.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <input
                        list="airline-list-filter"
                        placeholder="Filter by Airline..."
                        className="border p-2 rounded w-full md:w-48"
                        value={filters.airline}
                        onChange={e => setFilters({ ...filters, airline: e.target.value })}
                    />
                    <datalist id="airline-list-filter">
                        {configOptions.airline.map(a => <option key={a} value={a} />)}
                    </datalist>

                    <input
                        type="date"
                        className="border p-2 rounded w-full md:w-40"
                        value={filters.date}
                        onChange={e => setFilters({ ...filters, date: e.target.value })}
                    />

                    <div className="flex items-center gap-2 border p-2 rounded bg-gray-50 w-full md:w-auto">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Sort:</span>
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction });
                            }}
                            className="bg-transparent text-sm font-medium outline-none w-full"
                        >
                            <option value="created_at-desc">Newest First</option>
                            <option value="price_per_seat-asc">Price: Low to High</option>
                            <option value="price_per_seat-desc">Price: High to Low</option>
                            <option value="date-asc">Flight Date: Sooner</option>
                            <option value="date-desc">Flight Date: Later</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                {activeTab === 'market' ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airline / Sector</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ticketGroups
                                .filter((group: any) => {
                                    // Hide tickets with 0 available seats or past dates from marketplace
                                    const groupDate = new Date(group.date.$date || group.date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return group.available_seats > 0 && groupDate >= today;
                                })
                                .map((group: any) => {
                                    const id = group._id?.$oid || group._id;
                                    const isOwnTicket = group.agencyId?.$oid === session?.user?.agencyId || group.agencyId === session?.user?.agencyId;
                                    return (
                                        <tr key={id} className="hover:bg-gray-50">
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
                                                    <>
                                                        <div className="text-sm font-medium text-gray-900">{group.agency_contact.name}</div>
                                                        {group.agency_contact.phone && (
                                                            <div className="text-xs text-gray-500">📞 {group.agency_contact.phone}</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No contact</span>
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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                Rs. {group.price_per_seat?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(id, group.status)}
                                                    className={`px-2 py-1 text-xs rounded-full font-semibold ${group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {group.status}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleBookClick(group)}
                                                    className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={group.status !== 'active' || group.available_seats === 0}
                                                >
                                                    Book
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(group)}
                                                    className="text-gray-600 hover:text-gray-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!isOwnTicket}
                                                    title={!isOwnTicket ? "You can only edit your own tickets" : "Edit ticket"}
                                                >
                                                    Edit
                                                </button>
                                                {isOwnTicket && (
                                                    <button
                                                        onClick={() => handleDelete(id)}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                        title="Delete ticket group"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    {activeTab === 'sales' ? 'Buyer' : 'Seller'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passengers</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Ref</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking: any) => (
                                <tr key={booking._id?.$oid || booking._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{booking.counterparty}</div>
                                        {booking.counterparty_phone && (
                                            <div className="text-xs text-gray-500">📞 {booking.counterparty_phone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.ticket_details ? (
                                            <>
                                                <div className="text-sm font-medium">{booking.ticket_details.airline}</div>
                                                <div className="text-xs text-gray-500">
                                                    {booking.ticket_details.sector} • {booking.ticket_details.flight_no}
                                                </div>
                                                {/* Flight Times */}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {booking.ticket_details.departure_time && <span>Dep: {booking.ticket_details.departure_time}</span>}
                                                    {booking.ticket_details.departure_time && booking.ticket_details.arrival_time && <span className="mx-1">•</span>}
                                                    {booking.ticket_details.arrival_time && <span>Arr: {booking.ticket_details.arrival_time}</span>}
                                                </div>
                                            </>
                                        ) : <span className="text-gray-400">N/A</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{booking.seats_booked} Seats</div>
                                        <div className="text-xs text-gray-500">{booking.passengers?.length || 0} Pax details</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                        Rs. {booking.total_price?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {booking.booking_reference}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(booking.created_at?.$date || booking.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleViewDetails(booking)}
                                            className="text-indigo-600 hover:text-indigo-900 text-xs font-medium bg-indigo-50 px-2 py-1 rounded"
                                        >
                                            View
                                        </button>

                                        {activeTab === 'sales' && booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirmBooking(booking._id?.$oid || booking._id)}
                                                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-medium"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleRejectBooking(booking._id?.$oid || booking._id)}
                                                    className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && !loading && (
                                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No bookings found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Shared Loading State */}
                {loading && (activeTab === 'market' ? ticketGroups.length === 0 : bookings.length === 0) && (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                )}
            </div>

            {/* Booking Modal */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                ticketGroup={selectedGroup}
                onSubmit={handleBookingSubmit}
            />

            {/* View Modal */}
            <ViewBookingModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                booking={viewBooking}
            />

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Ticket Group' : 'Add New Ticket Group'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
                                    <input
                                        required
                                        list="airline-list"
                                        className="w-full border p-2 rounded"
                                        value={formData.airline}
                                        onChange={e => setFormData({ ...formData, airline: e.target.value })}
                                        placeholder="Select or type airline"
                                    />
                                    <datalist id="airline-list">
                                        {configOptions.airline.map(airline => (
                                            <option key={airline} value={airline} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Travel Type</label>
                                    <select className="w-full border p-2 rounded" value={formData.travel_type} onChange={e => setFormData({ ...formData, travel_type: e.target.value })}>
                                        {configOptions.travel_type.length > 0 ? (
                                            configOptions.travel_type.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Umrah">Umrah</option>
                                                <option value="KSA One Way">KSA One Way</option>
                                                <option value="UAE One Way">UAE One Way</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                                    <input
                                        required
                                        list="sector-list"
                                        placeholder="e.g. LHE-JED"
                                        className="w-full border p-2 rounded"
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                    />
                                    <datalist id="sector-list">
                                        {configOptions.sector.map(sector => (
                                            <option key={sector} value={sector} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input required type="date" className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Flight No</label>
                                    <input required className="w-full border p-2 rounded" value={formData.flight_no} onChange={e => setFormData({ ...formData, flight_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                                    <input required type="time" className="w-full border p-2 rounded" value={formData.departure_time} onChange={e => setFormData({ ...formData, departure_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                                    <input required type="time" className="w-full border p-2 rounded" value={formData.arrival_time} onChange={e => setFormData({ ...formData, arrival_time: e.target.value })} />
                                </div>

                                {/* Return Ticket Fields - Conditional */}
                                {formData.travel_type === 'Umrah' && (
                                    <>
                                        <div className="col-span-2 border-t pt-4 mt-2">
                                            <h3 className="font-semibold text-gray-800">Return Ticket Details</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Flight No</label>
                                            <input required className="w-full border p-2 rounded" value={formData.return_flight_no} onChange={e => setFormData({ ...formData, return_flight_no: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                                            <input required type="date" className="w-full border p-2 rounded" value={formData.return_date} onChange={e => setFormData({ ...formData, return_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Departure</label>
                                            <input required type="time" className="w-full border p-2 rounded" value={formData.return_departure_time} onChange={e => setFormData({ ...formData, return_departure_time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Arrival</label>
                                            <input required type="time" className="w-full border p-2 rounded" value={formData.return_arrival_time} onChange={e => setFormData({ ...formData, return_arrival_time: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 border-b mb-2"></div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Baggage</label>
                                    <input className="w-full border p-2 rounded" value={formData.baggage} onChange={e => setFormData({ ...formData, baggage: e.target.value })} />
                                </div>
                                <div className="flex items-center mt-6">
                                    <input type="checkbox" id="meal" className="mr-2" checked={formData.meal} onChange={e => setFormData({ ...formData, meal: e.target.checked })} />
                                    <label htmlFor="meal" className="text-sm font-medium text-gray-700">Meal Included</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                                    <input required type="number" min="1" className="w-full border p-2 rounded" value={formData.total_seats} onChange={e => setFormData({ ...formData, total_seats: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Seat (Rs)</label>
                                    <input required type="number" className="w-full border p-2 rounded" value={formData.price_per_seat} onChange={e => setFormData({ ...formData, price_per_seat: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
