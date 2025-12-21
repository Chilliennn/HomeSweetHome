"use client";

import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    children,
    disabled,
    ...rest
}) => {
    return (
        <button
            {...rest}
            disabled={disabled}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow"}
      `}
            style={{
                backgroundColor: "#9DE2D0",
                color: "#FFFFFF",
            }}
        >
            {children}
        </button>
    );
};
