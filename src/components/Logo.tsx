import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  showIcon?: boolean;
  variant?: 'light' | 'dark';
  height?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  iconSize = 24, 
  textSize = "text-xl", 
  showIcon = true,
  variant = 'dark',
  height = "h-12"
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="https://lh3.googleusercontent.com/d/18DxK9dI0ubE_q1i_bsb0GXbpo7glmwcs" 
        alt="JiffEX Logo" 
        className={`${height} w-auto object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
