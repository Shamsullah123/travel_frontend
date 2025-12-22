import React from 'react';

interface ViewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any;
}

export default function ViewBookingModal({ isOpen, onClose, booking }: ViewBookingModalProps) {
    if (!isOpen || !booking) return null;

    const ticket = booking.ticket_details || {};
    const passengers = booking.passengers || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div id="booking-modal-print-container" className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Flight & Booking Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Flight Information</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Airline:</span> {ticket.airline}</p>
                                <p><span className="font-medium">Sector:</span> {ticket.sector}</p>
                                <p><span className="font-medium">Flight No:</span> {ticket.flight_no}</p>
                                <p><span className="font-medium">Date:</span> {new Date(ticket.date?.$date || ticket.date).toLocaleDateString()}</p>
                                <p><span className="font-medium">Time:</span> {ticket.departure_time} - {ticket.arrival_time}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Booking Summary</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-medium">Ref:</span> {booking.booking_reference}</p>
                                <p><span className="font-medium">Status:</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {booking.status.toUpperCase()}
                                    </span>
                                </p>
                                <p><span className="font-medium">Total Price:</span> Rs. {booking.total_price?.toLocaleString()}</p>
                                <p><span className="font-medium">Seats:</span> {booking.seats_booked}</p>
                            </div>
                        </div>
                    </div>

                    {/* Passenger List */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Passenger List ({passengers.length})</h4>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Passport</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {passengers.map((p: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 font-medium text-gray-900">
                                                {p.title} {p.givenName} {p.surName}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500">{p.type}</td>
                                            <td className="px-4 py-2 text-gray-500">{p.passportNumber}</td>
                                            <td className="px-4 py-2 text-gray-500">
                                                {new Date(p.dob?.$date || p.dob).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {passengers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-4 text-center text-gray-400">
                                                No passenger details found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                    #booking-modal-print-container, #booking-modal-print-container * {
                        visibility: visible;
                    }
                    #booking-modal-print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .no-print { display: none !important; }
                    
                    /* Hide browser default header/footer if possible, or clean up */
                    @page { margin: 0; }
                }
            `}</style>
        </div>
    );
}
