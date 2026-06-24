import React from 'react';
import Link from 'next/link';

export interface ButtonProps {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'submit' | 'button' | 'reset';
  className?: string;
  variant?: 'outline' | 'ghost' | 'bracket';
}

export function Button({
  label,
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  variant = 'outline'
}: ButtonProps) {
  const baseClasses = "font-mono transition-all uppercase inline-block text-center w-fit select-none";
  
  let variantClasses = "";
  if (variant === 'outline') {
    variantClasses = "text-[10px] font-bold tracking-[0.3em] border border-[#ECEEDF]/30 hover:border-[#ECEEDF] hover:bg-[#ECEEDF] hover:text-black px-5 py-2";
  } else if (variant === 'bracket') {
    variantClasses = "text-[12px] font-bold tracking-[0.25em] text-[#ECEEDF]/60 border border-[#ECEEDF]/20 hover:border-[#ECEEDF] hover:text-white px-4 py-2";
  } else {
    variantClasses = "text-[11px] font-light tracking-widest hover:text-white px-3 py-3";
  }

  const disabledClasses = disabled ? "opacity-40 pointer-events-none" : "cursor-pointer";

  const allClassNames = `${baseClasses} ${variantClasses} ${disabledClasses} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={allClassNames}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClassNames}
    >
      {label}
    </button>
  );
}
