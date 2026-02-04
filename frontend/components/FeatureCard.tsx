import React from 'react';
import { ChevronRight } from 'lucide-react';

interface FeatureCardProps {
    icon: React.ReactElement;
    title: string;
    description: string;
    color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
    return (
        <div className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-8 transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${color} transition-transform group-hover:scale-110`}>
                {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-3 leading-relaxed text-slate-600">
                {description}
            </p>
            <div className="mt-auto pt-6">
                <span className="inline-flex items-center text-sm font-bold text-indigo-600 group-hover:underline">
                    Learn more <ChevronRight size={16} className="ml-1" />
                </span>
            </div>
        </div>
    );
};

export default FeatureCard;
