"use client";
import React from "react";

interface StatCardProps {
    label: string;
    value: number | string;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color = "#9DE2D0" }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <span className="text-4xl font-bold" style={{ color: color }}>
                {value}
            </span>
            <span className="text-sm font-medium text-gray-500">
                {label}
            </span>
        </div>
    );
};
