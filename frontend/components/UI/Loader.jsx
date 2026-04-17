import React from "react";
import { Loader2 } from "lucide-react";

const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-sm text-gray-600 font-medium animate-pulse">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        {content}
      </div>
    );
  }

  return <div className="p-8 flex items-center justify-center">{content}</div>;
};

export default Loader;
