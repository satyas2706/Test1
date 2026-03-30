import React from 'react';
import { Truck } from 'lucide-react';

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
      {showIcon && (
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Truck size={iconSize} />
        </div>
      )}
      <span className={`${textSize} font-black tracking-tighter ${variant === 'light' ? 'text-white' : 'text-slate-900'} font-sans`}>
        JIFF<span className={variant === 'light' ? 'text-indigo-400' : 'text-indigo-600'}>EX</span>
      </span>
    </div>
  );
};
