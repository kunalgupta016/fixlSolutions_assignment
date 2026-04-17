import React from "react";

const Card = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-6 ${onClick ? "cursor-pointer glass-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
