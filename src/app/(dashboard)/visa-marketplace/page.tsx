'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ApiClient } from '@/lib/api';
import dynamic from 'next/dynamic';
import { VisaGroupType } from '@/components/visa/VisaBookingModal'; // Type only import is fine

// Lazy Load Modals
const VisaBookingModal = dynamic(() => import('@/components/visa/VisaBookingModal'), { ssr: false });
const CreateVisaGroupModal = dynamic(() => import('@/components/visa/CreateVisaGroupModal'), { ssr: false });
const ViewVisaBookingModal = dynamic(() => import('@/components/visa/ViewVisaBookingModal'), { ssr: false });
const UpdateVisaGroupModal = dynamic(() => import('@/components/visa/UpdateVisaGroupModal'), { ssr: false });

export default function VisaMarketplacePage() {
    const { data: session } = useSession();
    const [visas, setVisas] = useState<VisaGroupType[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState({ sales: 0, purchases: 0 });

    // Pagination State
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

    // Tabs: 'market', 'sales', 'purchases'
    const [activeTab, setActiveTab] = useState<'market' | 'sales' | 'purchases'>('market');

    // Filters
    const [filters, setFilters] = useState({
        country: '',
        visa_type: '',
    });

    const [selectedVisa, setSelectedVisa] = useState<VisaGroupType | null>(null);
    const [editingVisa, setEditingVisa] = useState<VisaGroupType | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewBooking, setViewBooking] = useState<any>(null);

    useEffect(() => {
        loadCounts();
        // Poll for notifications every 60 seconds
        const interval = setInterval(loadCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'market') {
            loadVisas();
        } else {
            // Mark as read when opening the tab
            markAsRead(activeTab);
            loadBookings(activeTab, 1); // Reset to page 1 on tab switch
        }
    }, [activeTab, filters]);

    const loadCounts = async () => {
        try {
            const res = await ApiClient.getInternal<any>('/visa-bookings/counts');
            setUnreadCounts(res);
        } catch (error) {
            console.error('Failed to load counts', error);
        }
    };

    const markAsRead = async (type: 'purchases' | 'sales') => {
        try {
            await ApiClient.postInternal('/visa-bookings/mark-read', { type });
            loadCounts(); // Refresh counts
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const loadVisas = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.country) queryParams.append('country', filters.country);
            if (filters.visa_type) queryParams.append('type', filters.visa_type);

            console.log("Loading Visas via Internal API...");
            const data = await ApiClient.getInternal<VisaGroupType[]>(`/visa-groups/marketplace/?${queryParams.toString()}`);
            setVisas(data || []);
        } catch (error) {
            console.error('Failed to load visas', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBookings = async (type: 'sales' | 'purchases', page = 1) => {
        setLoading(true);
        try {
            const data = await ApiClient.getInternal<any>(`/visa-bookings/?type=${type}&page=${page}&limit=${pagination.limit}`);
            // Handle new paginated structure
            if (data.data && data.meta) {
                setBookings(data.data);
                setPagination(data.meta);
            } else {
                // Fallback for flat array if API reverts
                setBookings(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to load bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (visa: VisaGroupType) => {
        setEditingVisa(visa);
    };

    const handleDeleteClick = async (visaId: string) => {
        if (!confirm("Are you sure you want to delete this visa group? This action cannot be undone.")) return;

        try {
            await ApiClient.delInternal(`/visa-groups/${visaId}`);
            alert("Visa Group deleted successfully");
            loadVisas();
        } catch (error: any) {
            console.error("Delete Error:", error);
            alert(error.message || "Failed to delete visa group");
        }
    };

    const handleBookClick = (visa: VisaGroupType) => {
        setSelectedVisa(visa);
        setShowBookingModal(true);
    };

    const handleBookingSubmit = async (bookingData: any) => {
        try {
            // Helper to convert file to base64
            const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            };

            // Process applicants to handle file uploads
            const processedApplicants = await Promise.all(bookingData.applicants.map(async (app: any) => {
                const processedApp = { ...app };

                // Fields to process
                const fileFields = ['passportScan', 'cnicScan', 'photo', 'medical', 'police', 'vaccine'];

                for (const field of fileFields) {
                    if (app[field] && app[field] instanceof FileList && app[field].length > 0) {
                        try {
                            processedApp[field] = await fileToBase64(app[field][0]);
                        } catch (e) {
                            console.error(`Failed to convert ${field}`, e);
                            processedApp[field] = ''; // Fallback
                        }
                    } else if (typeof app[field] === 'object') {
                        // If it's an empty object or invalid, clear it
                        processedApp[field] = '';
                    }
                }
                return processedApp;
            }));

            // Handle Receipt Upload
            let receiptUrl = '';
            if (bookingData.payment?.receipt && bookingData.payment.receipt instanceof FileList && bookingData.payment.receipt.length > 0) {
                receiptUrl = await fileToBase64(bookingData.payment.receipt[0]);
            }

            const payload = {
                visa_group_id: selectedVisa?._id,
                quantity: bookingData.quantity,
                applicants: processedApplicants,
                total_amount: bookingData.totalAmount,
                discount: bookingData.payment?.discount || 0,
                final_amount: bookingData.finalAmount,
                payment_method: bookingData.payment?.paymentMethod || 'Cash',
                receipt_url: receiptUrl
            };

            await ApiClient.postInternal('/visa-bookings', payload);
            alert('Booking Successful!');
            setShowBookingModal(false);
            if (activeTab === 'market') loadVisas();
            else loadBookings(activeTab, 1);
            loadCounts(); // Refresh notification counts
            return true;
        } catch (error: any) {
            console.error("Booking Submit Error:", error);
            alert(error.message || 'Booking Failed');
            return false;
        }
    };

    const handleViewDetails = (booking: any) => {
        setViewBooking(booking);
        setShowViewModal(true);
    };

    const handleConfirmBooking = async (bookingId: string) => {
        if (!confirm('Confirm this booking? This will finalize the visa reservation.')) return;

        try {
            await ApiClient.postInternal(`/visa-bookings/${bookingId}/confirm`, {});
            alert('Booking confirmed successfully!');

            // Refresh in parallel
            await Promise.all([
                activeTab === 'sales' ? loadBookings('sales', pagination.page) : Promise.resolve(),
                loadVisas(),
                loadCounts()
            ]);
        } catch (error: any) {
            console.error("Confirm Booking Error:", error);
            alert(error.message || 'Failed to confirm booking');
        }
    };

    const handleRejectBooking = async (bookingId: string) => {
        if (!confirm('Reject this booking? Visas will be restored to the marketplace.')) return;

        try {
            await ApiClient.postInternal(`/visa-bookings/${bookingId}/reject`, {});
            alert('Booking rejected successfully!');

            // Refresh in parallel
            await Promise.all([
                activeTab === 'sales' ? loadBookings('sales', pagination.page) : Promise.resolve(),
                loadVisas(),
                loadCounts()
            ]);
        } catch (error: any) {
            console.error("Reject Booking Error:", error);
            alert(error.message || 'Failed to reject booking');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Visa Marketplace</h1>
                {/* Add Group Button - consistent with requested UI */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Add Sell VISA
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b mb-6">
                <button
                    onClick={() => setActiveTab('market')}
                    className={`pb-4 px-2 font-medium ${activeTab === 'market' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Marketplace
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`pb-4 px-2 font-medium relative ${activeTab === 'sales' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                    className={`pb-4 px-2 font-medium relative ${activeTab === 'purchases' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    My Purchases
                    {unreadCounts.purchases > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {unreadCounts.purchases}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'market' && (
                <>
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by Country..."
                            className="border p-2 rounded w-64"
                            value={filters.country}
                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                        />
                        <select
                            className="border p-2 rounded w-48"
                            value={filters.visa_type}
                            onChange={(e) => setFilters({ ...filters, visa_type: e.target.value })}
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

                    {/* Market Table (Desktop) */}
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* ... (Keep existing table header) */}
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country / Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stay</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">Loading visas...</td></tr>
                                ) : visas.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">No active visas found.</td></tr>
                                ) : (
                                    visas.filter(v => v.available_visas > 0).map((visa) => {
                                        // @ts-ignore - Check if this visa belongs to the current user's agency
                                        const isOwnListing = session?.user?.agencyId && visa.agency_id?._id === session.user.agencyId;

                                        return (
                                            <tr key={visa._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{visa.visa_title}</div>
                                                    {/* @ts-ignore */}
                                                    <div className="text-xs text-gray-500">{visa.agency_id?.name || 'Verified Agency'}</div>
                                                    {/* @ts-ignore */}
                                                    {visa.agency_id?.contactInfo?.phone && (
                                                        <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                                                            <span>📞</span> {(visa.agency_id as any).contactInfo.phone}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{visa.country}</div>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{visa.visa_type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{visa.processing_time_days} Days</td>
                                                <td className="px-6 py-4">
                                                    {/* @ts-ignore */}
                                                    <div className="text-sm text-gray-500">{visa.visa_validity_days} Days</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* @ts-ignore */}
                                                    <div className="text-sm text-gray-500">{visa.stay_duration_days} Days</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* @ts-ignore */}
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {visa.entry_type || 'Single'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{visa.available_visas} / {visa.total_visas}</div>
                                                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${(visa.available_visas / visa.total_visas) * 100}%` }} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">Rs. {visa.price_per_visa.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isOwnListing ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleEditClick(visa)}
                                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(visa._id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBookClick(visa)}
                                                                disabled={visa.available_visas === 0}
                                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                                                            >
                                                                {visa.available_visas > 0 ? 'Book Now' : 'Sold Out'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View (Small Screens) */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading visas...</div>
                        ) : visas.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No active visas found.</div>
                        ) : (
                            visas.filter(v => v.available_visas > 0).map((visa) => (
                                <div key={visa._id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{visa.visa_title}</h3>
                                            <div className="text-xs text-gray-500">{visa.country} • {visa.visa_type}</div>
                                            {/* @ts-ignore */}
                                            {visa.agency_id?.contactInfo?.phone && (
                                                <div className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                                                    <span>📞</span> {(visa.agency_id as any).contactInfo.phone}
                                                </div>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {visa.visa_type}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                        <div>Processing: <span className="font-medium text-gray-900">{visa.processing_time_days} Days</span></div>
                                        <div>Validity: <span className="font-medium text-gray-900">{visa.visa_validity_days} Days</span></div>
                                    </div>

                                    <div className="flex justify-between items-center border-t pt-3 mt-2">
                                        <div>
                                            <span className="block text-xs text-gray-500">Price</span>
                                            <span className="font-bold text-indigo-600">Rs. {visa.price_per_visa.toLocaleString()}</span>
                                        </div>
                                        {/* @ts-ignore */}
                                        {session?.user?.agencyId && visa.agency_id?._id === session.user.agencyId ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(visa)}
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(visa._id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleBookClick(visa)}
                                                disabled={visa.available_visas === 0}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm font-medium"
                                            >
                                                {visa.available_visas > 0 ? 'Book' : 'Sold Out'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {(activeTab === 'sales' || activeTab === 'purchases') && (
                <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{activeTab === 'sales' ? 'Buyer' : 'Seller'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Group</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty / Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Loading bookings...</td></tr>
                                ) : bookings.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">No bookings found.</td></tr>
                                ) : (
                                    bookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {booking.booking_reference}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>{activeTab === 'sales' ? booking.buyer_agency_id?.name : booking.seller_agency_id?.name}</div>
                                                <div className="text-xs text-indigo-600 flex items-center gap-1">
                                                    <span>📞</span>
                                                    {activeTab === 'sales'
                                                        ? booking.buyer_agency_id?.contactInfo?.phone || 'N/A'
                                                        : booking.seller_agency_id?.contactInfo?.phone || 'N/A'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{booking.visa_group_id?.visa_title}</div>
                                                <div className="text-xs text-gray-500">{booking.visa_group_id?.country} • {booking.visa_group_id?.visa_type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>Qty: {booking.quantity}</div>
                                                <div className="text-xs">{new Date(booking.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Rs. {booking.final_amount.toLocaleString()}
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
                                                            onClick={() => handleConfirmBooking(booking._id)}
                                                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-medium"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectBooking(booking._id)}
                                                            className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {bookings.length > 0 && (
                        <div className="bg-gray-50 px-6 py-3 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.pages} (Total {pagination.total})
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadBookings(activeTab as any, pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => loadBookings(activeTab as any, pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <VisaBookingModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                visa={selectedVisa}
                onSubmit={handleBookingSubmit}
            />

            <ViewVisaBookingModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                booking={viewBooking}
                currentUserAgencyId={session?.user?.agencyId}
            />

            <CreateVisaGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setActiveTab('market');
                    loadVisas();
                }}
            />

            <UpdateVisaGroupModal
                isOpen={!!editingVisa}
                onClose={() => setEditingVisa(null)}
                visa={editingVisa}
                onSuccess={() => {
                    loadVisas(); // Refresh list
                }}
            />
        </div >
    );
}
