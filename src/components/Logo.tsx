import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40 }) => {
  const [error, setError] = React.useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!error ? (
        <img 
          src="https://lh3.googleusercontent.com/d/18DxK9dI0ubE_q1i_bsb0GXbpo7glmwcs" 
          alt="Jiffex Logo" 
          style={{ height: size }}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="font-black text-2xl tracking-tighter text-indigo-600">
          JIFFEX
        </div>
      )}
    </div>
  );
};
