import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
  fullWidth = false,
}) => {
  const baseStyle = "flex items-center justify-center gap-2";
  const variants = {
    primary: "glass-button",
    outline: "glass-button-outline",
    danger: "bg-red-500/80 hover:bg-red-600/90 text-white rounded-xl px-4 py-2 font-medium shadow backdrop-blur transition-all",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseStyle} 
        ${variants[variant]} 
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-60 cursor-not-allowed transform-none hover:shadow-md" : ""} 
        ${className}
      `}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!isLoading && children}
    </button>
  );
};

export default Button;
