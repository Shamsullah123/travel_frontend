import React from 'react';

interface ViewVisaBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
    currentUserAgencyId?: string;
}

export default function ViewVisaBookingModal({ isOpen, onClose, booking, currentUserAgencyId }: ViewVisaBookingModalProps) {
    if (!isOpen || !booking) return null;

    const visaGroup = booking.visa_group_id || booking.visa_group_details || {};
    const applicants = booking.applicants || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div id="visa-booking-modal-print-container" className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Visa Booking Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Visa & Booking Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Visa Information</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Title:</span> {visaGroup.visa_title}</p>
                                <p><span className="font-medium">Country:</span> {visaGroup.country}</p>
                                <p><span className="font-medium">Type:</span> {visaGroup.visa_type}</p>
                                <p><span className="font-medium">Processing:</span> {visaGroup.processing_time_days} Days</p>
                                <p><span className="font-medium">Validity:</span> {visaGroup.visa_validity_days} Days</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Booking Summary</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Ref:</span> {booking.booking_reference}</p>
                                <p><span className="font-medium">Status:</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {booking.status?.toUpperCase()}
                                    </span>
                                </p>
                                <p><span className="font-medium">Total Amount:</span> Rs. {booking.final_amount?.toLocaleString()}</p>
                                <p><span className="font-medium">Quantity:</span> {booking.quantity} Visa(s)</p>
                                <p><span className="font-medium">Date:</span> {new Date(booking.created_at?.$date || booking.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Counterparty Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Seller Info */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Seller Agency</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Name:</span> {booking.seller_agency_id?.name || 'N/A'}</p>
                                <p><span className="font-medium">Contact:</span> {booking.seller_agency_id?.contactInfo?.phone || 'N/A'}</p>
                                <p><span className="font-medium">Email:</span> {booking.seller_agency_id?.contactInfo?.email || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Buyer Info */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Buyer Agency</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Name:</span> {booking.buyer_agency_id?.name || 'N/A'}</p>
                                <p><span className="font-medium">Contact:</span> {booking.buyer_agency_id?.contactInfo?.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Applicant List */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant List ({applicants.length})</h4>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Passport</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {applicants.map((applicant: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 font-medium text-gray-900">
                                                {applicant.fullName}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500">{applicant.gender}</td>
                                            <td className="px-4 py-2 text-gray-500">{applicant.passportNumber}</td>
                                            <td className="px-4 py-2 text-gray-500">
                                                {new Date(applicant.dob?.$date || applicant.dob).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500">{applicant.nationality}</td>
                                        </tr>
                                    ))}
                                    {applicants.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-gray-400">
                                                No applicant details found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mt-6">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Details</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <p><span className="font-medium">Method:</span> {booking.payment_method || 'N/A'}</p>
                            <p><span className="font-medium">Discount:</span> Rs. {booking.discount?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2 no-print">
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #visa-booking-modal-print-container, #visa-booking-modal-print-container * {
                        visibility: visible;
                    }
                    #visa-booking-modal-print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .no-print { display: none !important; }
                    
                    @page { margin: 0; }
                }
            `}</style>
        </div>
    );
}
