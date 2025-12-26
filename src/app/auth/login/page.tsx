"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError(res.error);
            } else {
                // Fetch basic session via API or just refetch to verify role
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (session?.user?.role === 'SuperAdmin') {
                    router.push("/admin/dashboard");
                } else if (session?.user?.role === 'AgencyAdmin' || session?.user?.role === 'Agent') {
                    router.push("/dashboard");
                } else {
                    router.push("/");
                }
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 border-t-8 border-indigo-600">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]">
                <div className="text-center mb-8">
                    <div className="group mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bannu Pilot</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your agency account</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Or <a href="/auth/register" className="text-indigo-600 hover:text-indigo-500 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            register your agency
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </p>
                </div>

                {registered && (
                    <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center border border-green-200 shadow-sm animate-[fadeIn_0.5s_ease-out]">
                        <p className="font-semibold text-base mb-1">Registration Successful!</p>
                        <p>Please wait for Admin approval before logging in.</p>
                    </div>
                )}

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 animate-[shake_0.5s_ease-in-out]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-indigo-600">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                            placeholder="you@agency.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-indigo-600">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md active:scale-[0.98]"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span className="flex items-center gap-2">
                                Sign In
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; 2025 Bannu Pilot SaaS. All rights reserved.
                </div>
            </div>
        </div>
    );
}
