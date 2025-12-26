import Link from 'next/link';
import Image from 'next/image';
import PublicMarketplace from '@/components/marketplace/PublicMarketplace';
import { Plane, DollarSign, Calendar, CreditCard, Users, BarChart3, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 overflow-hidden min-h-screen flex items-center">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center px-4 sm:px-6 lg:px-8 py-20">
                        {/* Left Content */}
                        <div className="text-center lg:text-left space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
                                <Sparkles className="w-4 h-4" />
                                <span>All-in-One Travel Management</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight font-extrabold opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
                                <span className="block text-gray-900">Manage your</span>
                                <span className="block text-gray-900">agency</span>
                                <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-[gradient_3s_ease_infinite] bg-clip-text text-transparent">
                                    with minimal effort
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
                                Comprehensive management solution for Travel Agencies. Handle Visas, Bookings, Accounting, and Customers in one secured platform.
                            </p>

                            {/* Key Benefits */}
                            <div className="flex flex-col sm:flex-row gap-4 text-left opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">14-day free trial</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
                                <Link
                                    href="/auth/register"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 transition-all duration-300 hover:scale-105"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 hover:scale-105"
                                >
                                    Learn More
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="pt-8 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards]">
                                <p className="text-sm text-gray-500 mb-4">Trusted by travel agencies worldwide</p>
                                <div className="flex flex-wrap items-center gap-4 sm:gap-8 justify-center lg:justify-start">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900">500+</div>
                                        <div className="text-sm text-gray-600">Active Agencies</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900">50K+</div>
                                        <div className="text-sm text-gray-600">Bookings Managed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900">99.9%</div>
                                        <div className="text-sm text-gray-600">Uptime</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative lg:h-[600px] flex items-center justify-center">
                            <div className="relative w-full h-full max-w-2xl opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                                {/* Decorative elements */}
                                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-2xl"></div>
                                <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl"></div>

                                {/* Image container */}
                                <div className="relative z-10 bg-white/50 backdrop-blur-sm rounded-3xl p-4 shadow-2xl">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/images/hero-illustration.png"
                                        alt="Travel Agency Management Platform"
                                        className="w-full h-full object-contain rounded-2xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Public Marketplace */}
            <PublicMarketplace />

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span>Powerful Features</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                            Everything you need to run your agency
                        </h2>
                        <p className="text-xl text-gray-600">
                            Streamline your operations with our comprehensive suite of tools
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={feature.name}
                                className="group relative bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards] hover:-translate-y-2 border border-gray-100"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/30">
                                    {feature.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                    {feature.name}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="mt-4 text-xl text-gray-500">
                            Everything you need to grow your agency.
                        </p>
                    </div>

                    <div className="max-w-lg mx-auto rounded-2xl shadow-xl border border-indigo-100 bg-white overflow-hidden transform hover:scale-105 transition-transform duration-300">
                        <div className="px-6 py-8 bg-indigo-50 sm:p-10 sm:pb-6 text-center">
                            <h3 className="text-2xl font-bold text-indigo-700 tracking-tight">Standard Plan</h3>
                            <div className="mt-4 flex items-baseline justify-center text-5xl font-extrabold text-gray-900">
                                Rs. 1000
                                <span className="ml-1 text-2xl font-medium text-gray-500">/mo</span>
                            </div>
                            <p className="mt-4 text-gray-500">Full access to all features</p>
                        </div>
                        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
                            <ul className="space-y-4">
                                {[
                                    'Unlimited Visas & Bookings',
                                    'Advanced Accounting',
                                    'Customer CRM',
                                    'Marketplace Access',
                                    '24/7 Support'
                                ].map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        </div>
                                        <p className="ml-3 text-base text-gray-700">{feature}</p>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 rounded-md shadow">
                                <Link
                                    href="/auth/register"
                                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 overflow-hidden">
                {/* Animated background shapes */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-[blob_7s_infinite]"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-[blob_7s_infinite_2s]"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-white rounded-full blur-3xl animate-[blob_7s_infinite_4s]"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center py-24 px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                            Ready to boost your productivity?
                        </h2>
                        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                            Join hundreds of travel agencies managing their operations efficiently. Start your free trial today—no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/auth/register"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-indigo-600 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300"
                            >
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

const features = [
    {
        name: 'Visa Management',
        description: 'Track visa statuses, expiry dates, and follow-ups effortlessly with automated reminders.',
        icon: <Plane className="w-7 h-7" />,
    },
    {
        name: 'Sell & Buy Visas/Tickets',
        description: 'Seamlessly trade visas and tickets on our integrated marketplace.',
        icon: <Sparkles className="w-7 h-7" />,
    },
    {
        name: 'Accounting & Ledger',
        description: 'Manage customer ledgers, payments, and generate professional invoices instantly.',
        icon: <DollarSign className="w-7 h-7" />,
    },
    {
        name: 'Booking Management',
        description: 'Create and manage bookings for Hajj, Umrah, and Ziarat packages seamlessly.',
        icon: <Calendar className="w-7 h-7" />,
    },
    {
        name: 'Service Cards',
        description: 'Generate professional service cards for your customers with Moaleem details.',
        icon: <CreditCard className="w-7 h-7" />,
    },
    {
        name: 'Customer CRM',
        description: 'Maintain detailed customer profiles, passport data, and complete history.',
        icon: <Users className="w-7 h-7" />,
    },
    {
        name: 'Analytics & Reports',
        description: 'Get real-time insights into your agency performance with comprehensive dashboards.',
        icon: <BarChart3 className="w-7 h-7" />,
    },
];
