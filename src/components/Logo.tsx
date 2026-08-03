import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  height?: string;
  iconSize?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40, height, iconSize }) => {
  const [error, setError] = React.useState(false);
  const finalSize = iconSize || size;

  return (
    <div className={`flex items-center gap-2 ${height || ''} ${className}`}>
      {!error ? (
        <img 
          src="https://lh3.googleusercontent.com/d/1XuJvOVPtaq-Ifmz3Uw0S5HgeGY2ygOIL" 
          alt="Jiffex Logo" 
          style={{ 
            height: !height ? finalSize : undefined,
            transform: 'scale(1.1)'
          }}
          className={height ? `w-auto ${height}` : undefined}
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
