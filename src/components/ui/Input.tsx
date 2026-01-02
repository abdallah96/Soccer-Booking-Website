import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-black text-white/80 mb-2 uppercase tracking-tight font-mono">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 border-2
              focus:outline-none focus:ring-2 transition-all duration-200
              ${error 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30 bg-gray-800/50 text-white' 
                : 'border-white/20 focus:border-red-500 focus:ring-red-500/30 bg-gray-800/50 text-white hover:border-white/30'
              }
              placeholder:text-white/40 font-light
              ${className || ''}
            `}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-red-500 text-lg">⚠️</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 font-light flex items-center">
            <span className="mr-1">•</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-white/50 font-light">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
