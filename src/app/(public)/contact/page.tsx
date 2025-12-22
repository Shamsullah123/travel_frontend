"use client";

import { useState } from 'react';
import { ApiClient } from '@/lib/api';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            await ApiClient.post('/contact', formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Failed to submit contact form", error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white py-16 px-4 overflow-hidden sm:px-6 lg:px-8 lg:py-24">
            <div className="relative max-w-xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Get in touch</h2>
                    <p className="mt-4 text-lg leading-6 text-gray-500">
                        Have questions about our pricing or features? Drop us a message.
                    </p>
                </div>
                <div className="mt-12">
                    {status === 'success' ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                            <h3 className="text-lg font-medium text-green-800">Message Sent!</h3>
                            <p className="mt-2 text-sm text-green-700">Thanks for reaching out. We will get back to you shortly.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-4 text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                            <div className="sm:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        autoComplete="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="subject"
                                        id="subject"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                                    Message
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md border"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {status === 'submitting' ? 'Sending...' : 'Let\'s talk'}
                                </button>
                                {status === 'error' && (
                                    <p className="mt-2 text-sm text-red-600 text-center">Failed to send message. Please try again.</p>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
