"use client";

import React from 'react';

interface ServiceCardProps {
    customer: {
        name: string;
        gender: string;
        cnic: string;
        passportNumber: string;
        pictureUrl?: string | null;
    };
    moaleem: {
        name: string;
        contact: string;
    };
    agency: {
        name: string;
    };
    booking?: {
        bookingNumber?: string;
        category?: string;
    };
}

export default function ServiceCard({ customer, moaleem, agency, booking }: ServiceCardProps) {
    const [scale, setScale] = React.useState(1);
    const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBackgroundImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {/* Controls Toolbar (Hidden in Print) */}
            <div className="bg-gray-100 p-4 rounded-lg flex flex-wrap gap-4 items-center justify-center mb-6 print:hidden shadow-sm w-full max-w-2xl">
                <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
                    <span className="text-sm font-medium text-gray-700">Scaling:</span>
                    <button
                        onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        className="p-1 px-3 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-bold"
                    >
                        -
                    </button>
                    <span className="text-sm w-12 text-center text-gray-600">{(scale * 100).toFixed(0)}%</span>
                    <button
                        onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
                        className="p-1 px-3 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-bold"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setScale(1)}
                        className="text-xs text-blue-600 hover:text-blue-800 ml-1"
                    >
                        Reset
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <span>📷</span> Upload Background
                    </button>
                    {backgroundImage && (
                        <button
                            onClick={() => setBackgroundImage(null)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Remove
                        </button>
                    )}
                </div>

                <div className="ml-auto">
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <span>🖨️</span> Print Card
                    </button>
                </div>
            </div>

            {/* Service Card Container - Centered and Scalable */}
            <div className="overflow-auto w-full flex justify-center p-4">
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center'
                    }}
                    className="bg-white border-2 border-gray-800 rounded-lg p-6 w-[700px] print:w-full print:border-black transition-transform duration-200 shadow-xl relative overflow-hidden"
                >
                    {/* Background Image (Absolute Print-safe Image) */}
                    {backgroundImage && (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={backgroundImage}
                                alt="Card Background"
                                className="w-full h-full object-cover opacity-100 print:opacity-100" // Ensure visibility
                            />
                        </div>
                    )}

                    {/* Optional Overlay for readability if bg is dark */}
                    <div className={`absolute inset-0 bg-white/80 ${backgroundImage ? 'block' : 'hidden'} print:bg-white/60 z-0 pointer-events-none`} />

                    {/* Content Wrapper to ensure z-index above background overlay */}
                    <div className="relative z-10">
                        {/* Header - Agency Name */}
                        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">{agency.name}</h2>
                            {booking?.bookingNumber && (
                                <p className="text-sm text-gray-600 mt-1">Booking: {booking.bookingNumber}</p>
                            )}
                        </div>

                        {/* Main Content - Two Columns */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            {/* Left Column - Customer Details */}
                            <div className="col-span-2 space-y-3">
                                <div className="border-b border-gray-300 pb-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Customer Name</label>
                                    <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                                </div>

                                <div className="border-b border-gray-300 pb-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                                    <p className="text-base text-gray-900">{customer.gender}</p>
                                </div>

                                <div className="border-b border-gray-300 pb-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">CNIC</label>
                                    <p className="text-base text-gray-900">{customer.cnic}</p>
                                </div>

                                <div className="border-b border-gray-300 pb-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Passport Number</label>
                                    <p className="text-base text-gray-900">{customer.passportNumber}</p>
                                </div>
                            </div>

                            {/* Right Column - Customer Picture */}
                            <div className="col-span-1 flex items-center justify-center">
                                {customer.pictureUrl ? (
                                    <img
                                        src={customer.pictureUrl.startsWith('http')
                                            ? customer.pictureUrl
                                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}/uploads/${customer.pictureUrl}`
                                        }
                                        alt="Customer"
                                        className="w-32 h-32 object-cover border-2 border-gray-300 rounded-lg bg-white"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-32 h-32 bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-xs text-center">No Photo</span></div>';
                                        }}
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                                        <span className="text-gray-400 text-xs text-center">No Photo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Section - Moaleem Details */}
                        <div className="border-t-2 border-gray-800 pt-4 mt-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Moaleem Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Moaleem Name</label>
                                    <p className="text-base font-medium text-gray-900">{moaleem.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Contact Number</label>
                                    <p className="text-base font-medium text-gray-900">{moaleem.contact}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
