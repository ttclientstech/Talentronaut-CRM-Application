'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            if (session?.user?.role === 'Admin') {
                router.push('/admin');
            } else if (session?.user?.role === 'Sales Person') {
                router.push('/sales');
            }
        }
    }, [status, session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                accessCode: token,
            });

            if (result?.error) {
                setError('Invalid access code. Please try again.');
            } else if (result?.ok) {
                // Immediately fetch the session to get the role — don't rely on useEffect
                const { getSession } = await import('next-auth/react');
                const session = await getSession();
                if (session?.user?.role === 'Admin') {
                    window.location.href = '/admin';
                } else if (session?.user?.role === 'Sales Person') {
                    window.location.href = '/sales';
                } else {
                    // Fallback: refresh and let useEffect handle it
                    router.refresh();
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Brand & Marketing */}
            <div className="hidden w-1/2 flex-col bg-primary p-12 text-primary-foreground lg:flex">
                <div className="flex flex-1 flex-col justify-center">
                    <div>
                        <div className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-semibold backdrop-blur-sm">
                            🚀 POWERFUL CRM SOLUTION
                        </div>
                        <h1 className="mt-8 font-brand text-[72px] font-bold leading-[90px] text-white">
                            Talentronaut
                            <br />
                            <span className="opacity-90">CRM</span>
                        </h1>
                        <p className="mt-6 max-w-md text-lg text-primary-foreground/90">
                            The ultimate solution for managing talent, sales, and customer
                            relationships efficiently. Empower your team and drive growth.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-10 w-10 rounded-full border-2 border-primary bg-white/20 flex items-center justify-center text-xs backdrop-blur-md`}>
                                {/* Placeholder for avatars */}
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <p className="text-sm font-medium">Trusted by 10,000+ teams worldwide</p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex w-full flex-col justify-center bg-white p-8 lg:w-1/2">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="font-brand text-4xl font-bold text-foreground">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Please enter your access code to continue.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label
                                htmlFor="access-token"
                                className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Access Code
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Key className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="access-token"
                                    name="accessToken"
                                    type="text"
                                    autoComplete="off"
                                    required
                                    className="block w-full rounded-lg border border-border bg-secondary py-3 pl-10 pr-3 text-foreground placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                    placeholder="ENTER CODE"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                        >
                            {loading ? (
                                'Verifying...'
                            ) : (
                                <>
                                    Access Dashboard <span className="ml-2">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don't have an access code?{' '}
                        <a href="#" className="font-medium text-primary hover:underline">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
