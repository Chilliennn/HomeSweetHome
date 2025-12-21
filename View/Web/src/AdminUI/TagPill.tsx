"use client";

import React from "react";

interface TagPillProps {
    children: React.ReactNode;
    variant?: "category" | "severity";
}

export const TagPill: React.FC<TagPillProps> = ({ children, variant = "category" }) => {
    // Updated colors to match Figma "pastel" aesthetic
    const style = variant === "category"
        ? { backgroundColor: "#dfd3e6", color: "#6b4c7b" } // Lighter purple bg, darker purple text
        : { backgroundColor: "#f6d5d1", color: "#a84f42" }; // Lighter red bg, darker red red text

    return (
        <span className="inline-flex items-center rounded-md px-3 py-1 text-xs font-bold"
            style={style}>
            {children}
        </span>
    );
};
