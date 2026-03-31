
import React from 'react';

const ShoeCardSkeleton: React.FC = () => {
    return (
        <div className="w-full h-[550px] rounded-[40px] bg-zinc-50 border border-zinc-100 p-6 flex flex-col justify-between animate-pulse">
            <div className="flex flex-col items-center">
                <div className="w-48 h-8 bg-zinc-200 rounded-lg mb-2" />
                <div className="w-24 h-4 bg-zinc-100 rounded-md" />
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="w-64 h-64 bg-zinc-200 rounded-full opacity-50" />
            </div>

            <div className="flex justify-center">
                <div className="w-32 h-12 bg-zinc-200 rounded-full" />
            </div>
        </div>
    );
};

export default ShoeCardSkeleton;
