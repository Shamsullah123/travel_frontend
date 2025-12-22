"use client";

import { useEffect, useState, useMemo } from "react";
import { ApiClient } from "@/lib/api";
import { Package } from "@/types/package";
import ServiceCard from "@/components/ServiceCard";

interface Customer {
    _id: string;
    fullName: string;
    phone: string;
    passportNumber?: string;
    cnic?: string;
    gender?: string;
    bookingStatus?: string;
    createdAt: string;
}

interface Booking {
    _id: string;
    bookingNumber: string;
    customerName?: string;
    packageName?: string;
    category: string;
    baseAmount: number;
    totalAmount: number;
    discount: number;
    paidAmount: number;
    balanceDue: number;
    status: string;
    createdAt: string;
    customerId: string;
    packageId: string;
}

export default function BookingsPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal States
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [bookingForm, setBookingForm] = useState({
        packageId: "",
        category: "Sharing",
        discount: 0,
        paidAmount: 0
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [serviceCardModalOpen, setServiceCardModalOpen] = useState(false);
    const [serviceCardData, setServiceCardData] = useState<any>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await ApiClient.get<Customer[]>(`/customers?search=${search}`);
            setCustomers(data);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const data = await ApiClient.get<Package[]>('/packages');
            setPackages(data);
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        }
    };

    const fetchBookings = async () => {
        try {
            const data = await ApiClient.get<Booking[]>('/bookings');
            setBookings(data);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        }
    };

    const fetchServiceCard = async (bookingId: string) => {
        try {
            const data = await ApiClient.get(`/service-cards/${bookingId}`);
            setServiceCardData(data);
            setServiceCardModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch service card:", error);
            alert("Failed to load service card data");
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchPackages();
        fetchBookings();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.passportNumber && c.passportNumber.includes(search)) ||
        (c.cnic && c.cnic.includes(search))
    );

    // Export Functions
    const exportToCSV = async () => {
        try {
            const blob = await ApiClient.getFile('/bookings/export?format=csv');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to export to CSV:", error);
            alert(`Failed to export to CSV: ${error.message || 'Please try again'}`);
        }
    };

    const exportToExcel = async () => {
        try {
            const blob = await ApiClient.getFile('/bookings/export?format=excel');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to export to Excel:", error);
            alert(`Failed to export to Excel: ${error.message || 'Please try again'}`);
        }
    };

    const exportToPDF = async () => {
        try {
            const blob = await ApiClient.getFile('/bookings/export?format=pdf');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_${new Date().toISOString().split('T')[0]}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to export to PDF:", error);
            alert(`Failed to export to PDF: ${error.message || 'Please try again'}`);
        }
    };

    const handleViewBooking = async (customerId: string) => {
        try {
            const booking = bookings.find(b => b.customerId === customerId);
            if (booking) {
                setSelectedBooking(booking);
                setViewModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch booking details:", error);
        }
    };

    const handleEditBooking = async (customerId: string) => {
        try {
            const booking = bookings.find(b => b.customerId === customerId);
            const customer = customers.find(c => c._id === customerId);

            if (booking && customer) {
                setSelectedCustomer(customer);
                setSelectedBooking(booking);
                setIsEditMode(true);

                // Pre-fill form with existing booking data
                setBookingForm({
                    packageId: booking.packageId || "",
                    category: booking.category || "Sharing",
                    discount: booking.discount || 0,
                    paidAmount: booking.paidAmount || 0
                });

                setBookingModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to load booking for edit:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Customer Bookings
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage customer bookings and create new bookings
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                        onClick={exportToCSV}
                        disabled={bookings.length === 0}
                        className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        📄 CSV
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={bookings.length === 0}
                        className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        📊 Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={bookings.length === 0}
                        className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        📑 PDF
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passport Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading customers...</td>
                            </tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No customers found.</td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={customer._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {customer.fullName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.gender || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.cnic || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.passportNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {customer.bookingStatus ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                YES
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                No Booking
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {customer.bookingStatus ? (
                                            <>
                                                <button
                                                    onClick={() => handleViewBooking(customer._id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleEditBooking(customer._id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const booking = bookings.find(b => b.customerId === customer._id);
                                                        if (booking) fetchServiceCard(booking._id);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Service Card
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setSelectedBooking(null);
                                                    setIsEditMode(false);
                                                    setBookingForm({
                                                        packageId: packages.length > 0 ? packages[0]._id : "",
                                                        category: "Sharing",
                                                        discount: 0,
                                                        paidAmount: 0
                                                    });
                                                    setBookingModalOpen(true);
                                                }}
                                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
                                            >
                                                Booking
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Booking Modal */}
            {bookingModalOpen && selectedCustomer && (
                <BookingModal
                    customer={selectedCustomer}
                    packages={packages}
                    initialForm={bookingForm}
                    existingBooking={isEditMode ? selectedBooking : null}
                    onClose={() => {
                        setBookingModalOpen(false);
                        setIsEditMode(false);
                        setSelectedBooking(null);
                    }}
                    onSave={() => {
                        setBookingModalOpen(false);
                        setIsEditMode(false);
                        setSelectedBooking(null);
                        fetchCustomers();
                        fetchBookings();
                    }}
                />
            )}

            {/* View Booking Modal */}
            {viewModalOpen && selectedBooking && (
                <ViewBookingModal
                    booking={selectedBooking}
                    customer={customers.find(c => c._id === selectedBooking.customerId)}
                    onClose={() => setViewModalOpen(false)}
                />
            )}

            {/* Service Card Modal */}
            {serviceCardModalOpen && serviceCardData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Service Card</h2>
                                <button
                                    onClick={() => setServiceCardModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                            <ServiceCard
                                customer={serviceCardData.customer}
                                moaleem={serviceCardData.moaleem}
                                agency={serviceCardData.agency}
                                booking={serviceCardData.booking}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// View Booking Modal Component with Print Button
function ViewBookingModal({ booking, customer, onClose }: { booking: Booking, customer?: Customer, onClose: () => void }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* Screen View (Modal with Scroll) */}
            <div className="fixed inset-0 z-50 overflow-y-auto print:hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Booking Details
                                </h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                    <span className="text-2xl">×</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Booking Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Booking Number</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.bookingNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Created Date</p>
                                            <p className="text-sm font-medium text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Information */}
                                {customer && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Name</p>
                                                <p className="text-sm font-medium text-gray-900">{customer.fullName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">CNIC</p>
                                                <p className="text-sm font-medium text-gray-900">{customer.cnic || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Passport Number</p>
                                                <p className="text-sm font-medium text-gray-900">{customer.passportNumber || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Package Details */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Package Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Package Name</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.packageName || 'Direct Booking'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Category</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.category}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Breakdown</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Amount:</span>
                                            <span className="text-sm font-medium text-gray-900">Rs. {(booking.baseAmount || (booking.totalAmount + (booking.discount || 0)))?.toLocaleString()}</span>
                                        </div>
                                        {booking.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Discount:</span>
                                                <span className="text-sm font-medium text-red-600">- Rs. {booking.discount?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-gray-200 pt-2">
                                            <span className="text-sm font-semibold text-gray-700">Final Amount:</span>
                                            <span className="text-sm font-semibold text-gray-900">Rs. {booking.totalAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Paid Amount:</span>
                                            <span className="text-sm font-medium text-green-600">Rs. {booking.paidAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-200 pt-2">
                                            <span className="text-sm font-semibold text-gray-700">Balance Due:</span>
                                            <span className={`text-sm font-semibold ${booking.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                Rs. {booking.balanceDue?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    🖨️ Print
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print View (Dedicated Structure - Invisible on screen, visible on print) */}
            <div id="print-view" className="hidden">
                <div className="p-8 max-w-3xl mx-auto">
                    <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
                        <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
                        <p className="text-sm text-gray-600 mt-1">Bannu Pilot | Agency Manager</p>
                    </div>

                    <div className="space-y-6">
                        {/* Booking Information */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Booking Number</p>
                                    <p className="text-sm font-medium text-gray-900">{booking.bookingNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Created Date</p>
                                    <p className="text-sm font-medium text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        {customer && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{customer.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">CNIC</p>
                                        <p className="text-sm font-medium text-gray-900">{customer.cnic || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Passport Number</p>
                                        <p className="text-sm font-medium text-gray-900">{customer.passportNumber || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Package Details */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Package Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Package Name</p>
                                    <p className="text-sm font-medium text-gray-900">{booking.packageName || 'Direct Booking'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Category</p>
                                    <p className="text-sm font-medium text-gray-900">{booking.category}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Breakdown</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Amount:</span>
                                    <span className="text-sm font-medium text-gray-900">Rs. {(booking.baseAmount || (booking.totalAmount + (booking.discount || 0)))?.toLocaleString()}</span>
                                </div>
                                {booking.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Discount:</span>
                                        <span className="text-sm font-medium text-red-600">- Rs. {booking.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-green-200 pt-2">
                                    <span className="text-sm font-semibold text-gray-700">Final Amount:</span>
                                    <span className="text-sm font-semibold text-gray-900">Rs. {booking.totalAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Paid Amount:</span>
                                    <span className="text-sm font-medium text-green-600">Rs. {booking.paidAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-green-200 pt-2">
                                    <span className="text-sm font-semibold text-gray-700">Balance Due:</span>
                                    <span className={`text-sm font-semibold ${booking.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        Rs. {booking.balanceDue?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }

                    /* Hide everything normally */
                    body * {
                        visibility: hidden;
                    }

                    /* Show print view container and its children */
                    #print-view,
                    #print-view * {
                        visibility: visible;
                    }

                    /* Position print view to take over the page */
                    #print-view {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        z-index: 9999;
                    }
                    
                    /* Utility overrides for print to ensure layout works */
                    .grid { display: grid !important; }
                    .flex { display: flex !important; }
                    .hidden { display: block !important; }
                    .mx-auto { margin-left: auto !important; margin-right: auto !important; }
                    
                    /* Ensure background colors print exactly */
                    .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
                    .bg-blue-50 { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; }
                    .bg-purple-50 { background-color: #faf5ff !important; -webkit-print-color-adjust: exact; }
                    .bg-green-50 { background-color: #f0fdf4 !important; -webkit-print-color-adjust: exact; }
                    .bg-green-100 { background-color: #dcfce7 !important; -webkit-print-color-adjust: exact; }
                    .bg-red-100 { background-color: #fee2e2 !important; -webkit-print-color-adjust: exact; }
                    
                    /* Ensure font sizes are readable */
                    .text-2xl { font-size: 1.5rem !important; }
                    .text-sm { font-size: 0.875rem !important; }
                    .text-xs { font-size: 0.75rem !important; }
                }
            `}</style>
        </>
    );
}

// Booking Modal Component (updated to support edit mode)
function BookingModal({ customer, packages, initialForm, existingBooking, onClose, onSave }: {
    customer: Customer,
    packages: Package[],
    initialForm: any,
    existingBooking: Booking | null,
    onClose: () => void,
    onSave: () => void
}) {
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Real-time calculations
    const totalAmount = useMemo(() => {
        const pkg = packages.find(p => p._id === form.packageId);
        if (!pkg) return 0;

        const priceMap: Record<string, number> = {
            'Sharing': pkg.sharingPrice || 0,
            '4 Bed': pkg.fourBedPrice || 0,
            '3 Bed': pkg.threeBedPrice || 0,
            '2 Bed': pkg.twoBedPrice || 0
        };
        return priceMap[form.category] || 0;
    }, [form.packageId, form.category, packages]);

    const finalAmount = useMemo(() => {
        return Math.max(0, totalAmount - (form.discount || 0));
    }, [totalAmount, form.discount]);

    const remainingAmount = useMemo(() => {
        return Math.max(0, finalAmount - (form.paidAmount || 0));
    }, [finalAmount, form.paidAmount]);

    const handleSave = async () => {
        setError("");

        // Validation
        if (!form.packageId) {
            setError("Please select a package");
            return;
        }
        if (form.discount < 0) {
            setError("Discount cannot be negative");
            return;
        }
        if (form.paidAmount < 0) {
            setError("Paid amount cannot be negative");
            return;
        }
        if (finalAmount < 0) {
            setError("Final amount cannot be negative");
            return;
        }

        setSaving(true);
        try {
            if (existingBooking) {
                // Update existing booking
                await ApiClient.put(`/bookings/${existingBooking._id}`, {
                    packageId: form.packageId,
                    category: form.category,
                    totalAmount: totalAmount,
                    discount: form.discount,
                    finalAmount: finalAmount,
                    paidAmount: form.paidAmount
                });
            } else {
                // Create new booking
                await ApiClient.post('/bookings', {
                    customerId: customer._id,
                    packageId: form.packageId,
                    category: form.category,
                    totalAmount: totalAmount,
                    discount: form.discount,
                    finalAmount: finalAmount,
                    paidAmount: form.paidAmount
                });
            }
            onSave();
        } catch (e: any) {
            setError(e.message || `Failed to ${existingBooking ? 'update' : 'create'} booking`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            {existingBooking ? 'Edit' : 'Create'} Booking for {customer.fullName}
                        </h3>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Package Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Package Name <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.packageId}
                                    onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select Package</option>
                                    {packages.map(pkg => (
                                        <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="Sharing">Sharing</option>
                                    <option value="4 Bed">4 Bed</option>
                                    <option value="3 Bed">3 Bed</option>
                                    <option value="2 Bed">2 Bed</option>
                                </select>
                            </div>

                            {/* Total Amount (Auto-calculated) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Amount
                                </label>
                                <input
                                    type="number"
                                    value={totalAmount}
                                    disabled
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                                />
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount
                                </label>
                                <input
                                    type="number"
                                    value={form.discount}
                                    onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min="0"
                                />
                            </div>

                            {/* Final Amount (Auto-calculated) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Final Amount
                                </label>
                                <input
                                    type="number"
                                    value={finalAmount}
                                    disabled
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500 font-semibold"
                                />
                            </div>

                            {/* Total Paid */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Paid
                                </label>
                                <input
                                    type="number"
                                    value={form.paidAmount}
                                    onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min="0"
                                />
                            </div>

                            {/* Remaining Amount (Auto-calculated) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remaining Amount
                                </label>
                                <input
                                    type="number"
                                    value={remainingAmount}
                                    disabled
                                    className={`w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : existingBooking ? 'Update Booking' : 'Save Booking'}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
