import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-slate-200 bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-indigo-600" />
                        <span className="text-lg font-bold tracking-tight">JanSaarthi</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} JanSaarthi Project. Built with ❤️ for the community.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600">Privacy</a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600">Terms</a>
                        <a href="https://github.com/Adithkp03" className="text-sm font-medium text-slate-500 hover:text-indigo-600">Github</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
