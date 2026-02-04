'use client';

import React, { useState } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">JanSaarthi</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-8">
                            <NavLink href="#simplify">Simplify</NavLink>
                            <NavLink href="#schemes">Schemes</NavLink>
                            <NavLink href="#learn">Learn</NavLink>
                            <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                Login
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Overlay */}
            {isMenuOpen && (
                <div className="border-t border-slate-100 bg-white p-4 md:hidden">
                    <div className="space-y-1">
                        <MobileNavLink href="#simplify">Simplify</MobileNavLink>
                        <MobileNavLink href="#schemes">Schemes</MobileNavLink>
                        <MobileNavLink href="#learn">Learn</MobileNavLink>
                        <div className="pt-4">
                            <button className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white">Login</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
        href={href}
        className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-2 py-1"
    >
        {children}
    </a>
);

const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
        href={href}
        className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
    >
        {children}
    </a>
);

export default Navbar;
