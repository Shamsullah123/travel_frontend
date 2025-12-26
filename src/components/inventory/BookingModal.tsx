'use client';

import { useState, useEffect, useMemo } from 'react';

// Inline Icons to avoid missing dependency
const XMarkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

interface TicketGroup {
    _id: string | { $oid: string };
    airline: string;
    sector: string;
    price_per_seat: number;
    available_seats: number;
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketGroup: TicketGroup | null;
    onSubmit: (bookingData: any) => Promise<void>;
}

interface Passenger {
    type: 'Adult' | 'Child' | 'Infant';
    title: string;
    givenName: string;
    surName: string;
    passportNumber: string;
    passportIssueDate: string;
    expiryDate: string;
}

export default function BookingModal({ isOpen, onClose, ticketGroup, onSubmit }: BookingModalProps) {
    const [counts, setCounts] = useState({
        Adult: 1,
        Child: 0,
        Infant: 0
    });

    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initialize passengers when counts change
    useEffect(() => {
        if (!isOpen) return;

        const newPassengers: Passenger[] = [];

        // Helper to preserve existing data if resizing down then up
        const createPassenger = (type: 'Adult' | 'Child' | 'Infant', index: number): Passenger => {
            return {
                type,
                title: type === 'Infant' ? 'Infant' : 'Mr',
                givenName: '',
                surName: '',
                passportNumber: '',
                passportIssueDate: '',
                expiryDate: ''
            };
        };

        // Rebuild array based on counts, trying to keep existing values
        // This is a simple rebuild. For a better UX, we'd map and preserve by ID or index context, 
        // but simple regeneration with preserve logic is tricky without IDs. 
        // We'll simplisticly rebuild for now or map based on previous state if we want to be fancy.
        // Let's just generate strictly based on counts.

        // Actually, preventing data loss on count change is good UX.
        // Let's rely on simple addition/removal only? 
        // For this demo, let's regenerate for simplicity or check if we can preserve.
    }, [isOpen]);

    // Better approach: Update passengers array when counts change explicitly
    useEffect(() => {
        if (!isOpen) {
            setCounts({ Adult: 1, Child: 0, Infant: 0 });
            setPassengers([{
                type: 'Adult', title: 'Mr', givenName: '', surName: '', passportNumber: '', passportIssueDate: '', expiryDate: ''
            }]);
            return;
        }
    }, [isOpen]);

    const updateCount = (type: 'Adult' | 'Child' | 'Infant', delta: number) => {
        setCounts(prev => {
            const newVal = prev[type] + delta;
            if (newVal < 0) return prev;
            if (type === 'Adult' && newVal < 1 && prev.Adult === 1) return prev; // Min 1 adult usually

            // Check availability - Infants usually don't take seats in inventory logic, assuming Lap Infant.
            // If they do, include them. Assuming here only Adult+Child consume inventory.
            const totalSeats = (type === 'Adult' || type === 'Child')
                ? (prev.Adult + prev.Child + delta)
                : (prev.Adult + prev.Child);

            if (ticketGroup && totalSeats > ticketGroup.available_seats && delta > 0) {
                return prev; // Cap at available
            }

            return { ...prev, [type]: newVal };
        });

        // Update passenger list
        setPassengers(prev => {
            const currentTypeList = prev.filter(p => p.type === type);
            if (delta > 0) {
                // Add new
                const newP: Passenger = {
                    type,
                    title: type === 'Infant' ? 'Mstr' : 'Mr',
                    givenName: '',
                    surName: '',
                    passportNumber: '',
                    passportIssueDate: '',
                    expiryDate: ''
                };
                // Insert at end of this type block
                // Ordering: Adult, Child, Infant
                if (type === 'Adult') return [...prev.filter(p => p.type === 'Adult'), newP, ...prev.filter(p => p.type !== 'Adult')];
                if (type === 'Child') return [...prev.filter(p => p.type !== 'Infant'), newP, ...prev.filter(p => p.type === 'Infant')];
                return [...prev, newP];
            } else {
                // Remove last of this type
                const indexToRemove = prev.map((p, i) => p.type === type ? i : -1).filter(i => i !== -1).pop();
                if (indexToRemove !== undefined && indexToRemove > -1) {
                    const newArr = [...prev];
                    newArr.splice(indexToRemove, 1);
                    return newArr;
                }
                return prev;
            }
        });
    };

    const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const totalSeatsRequired = counts.Adult + counts.Child;
    const totalPrice = useMemo(() => {
        if (!ticketGroup) return 0;
        // Infants usually pay different price or tax only, but prompt implies simple calc.
        // "Total seats ... Total price". 
        // Assuming Price * (Adults + Children). Infants often free or fixed tax.
        // Let's calculate for seats.
        return totalSeatsRequired * ticketGroup.price_per_seat;
    }, [counts, ticketGroup, totalSeatsRequired]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({
                counts,
                passengers,
                totalPrice,
                totalSeats: totalSeatsRequired,
                ticketGroupId: ticketGroup ? (typeof ticketGroup._id === 'string' ? ticketGroup._id : ticketGroup._id.$oid) : null
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !ticketGroup) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] transition-all transform scale-100">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Book Seats</h2>
                        <p className="text-gray-500 text-sm mt-1">{ticketGroup.airline} • {ticketGroup.sector}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Details & Counters */}
                        <div className="md:col-span-1 space-y-6">
                            {/* Flight Info Card */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="text-sm text-blue-600 font-medium mb-1">Available Seats</div>
                                <div className="text-3xl font-bold text-blue-800">{ticketGroup.available_seats}</div>
                                <div className="text-sm text-blue-600 font-medium mt-3 mb-1">Price per Seat</div>
                                <div className="text-xl font-bold text-blue-800">Rs. {ticketGroup.price_per_seat.toLocaleString()}</div>
                            </div>

                            {/* Counters */}
                            <div className="bg-white border rounded-lg p-4 space-y-4 shadow-sm">
                                <h3 className="font-medium text-gray-900">Passengers</h3>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">Adults</div>
                                        <div className="text-xs text-gray-500">12+ yrs</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Adult', -1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                            disabled={counts.Adult <= 1}
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-4 text-center font-medium">{counts.Adult}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Adult', 1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                            disabled={totalSeatsRequired >= ticketGroup.available_seats}
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">Children</div>
                                        <div className="text-xs text-gray-500">2-12 yrs</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Child', -1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                            disabled={counts.Child <= 0}
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-4 text-center font-medium">{counts.Child}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Child', 1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                            disabled={totalSeatsRequired >= ticketGroup.available_seats}
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">Infants</div>
                                        <div className="text-xs text-gray-500">Under 2</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Infant', -1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                            disabled={counts.Infant <= 0}
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-4 text-center font-medium">{counts.Infant}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateCount('Infant', 1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600">Total Seats</span>
                                    <span className="font-medium text-gray-900">{totalSeatsRequired}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="font-bold text-gray-900">Total Price</span>
                                    <span className="font-bold text-indigo-600">Rs. {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Passenger Forms */}
                        <div className="md:col-span-2">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>Passenger Details</span>
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{passengers.length} Passengers</span>
                            </h3>

                            <div className="space-y-4">
                                {passengers.map((passenger, idx) => (
                                    <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm relative group hover:border-indigo-200 transition-colors">
                                        <div className="absolute -left-3 top-4 bg-gray-800 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                                            {idx + 1}
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 pl-4 flex justify-between">
                                            <span>{passenger.type}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                                <select
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    value={passenger.title}
                                                    onChange={e => handlePassengerChange(idx, 'title', e.target.value)}
                                                >
                                                    <option value="Mr">Mr</option>
                                                    <option value="Mrs">Mrs</option>
                                                    <option value="Ms">Ms</option>
                                                    <option value="Mstr">Mstr</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Given Name</label>
                                                <input
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    placeholder="As on passport"
                                                    value={passenger.givenName}
                                                    onChange={e => handlePassengerChange(idx, 'givenName', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Surname</label>
                                                <input
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    placeholder="As on passport"
                                                    value={passenger.surName}
                                                    onChange={e => handlePassengerChange(idx, 'surName', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Passport No</label>
                                                <input
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    value={passenger.passportNumber}
                                                    onChange={e => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Passport Issue Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    value={passenger.passportIssueDate}
                                                    onChange={e => handlePassengerChange(idx, 'passportIssueDate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                                    value={passenger.expiryDate}
                                                    onChange={e => handlePassengerChange(idx, 'expiryDate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || totalSeatsRequired > ticketGroup.available_seats || totalSeatsRequired === 0}
                        className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? 'Processing...' : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
}
