import React, { forwardRef } from "react";

const Input = forwardRef(({ label, error, className = "", id, ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`glass-input w-full ${error ? "border-red-400 focus:ring-red-400/50" : ""}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1 font-medium">{error}</span>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
