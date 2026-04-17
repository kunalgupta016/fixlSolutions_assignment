import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * @component Pagination
 * @desc A reusable premium pagination control with glassmorphism styling
 */
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total } = pagination;

  const renderPageNumbers = () => {
    const numbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
            page === i
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 grow-0 shrink-0"
              : "text-gray-600 hover:bg-white/40 hover:text-gray-900"
          }`}
        >
          {i}
        </button>
      );
    }
    return numbers;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm">
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-800">{(page - 1) * pagination.limit + 1}</span> to{" "}
        <span className="font-semibold text-gray-800">{Math.min(page * pagination.limit, total)}</span> of{" "}
        <span className="font-semibold text-gray-800">{total}</span> records
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-gray-600 hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-2 rounded-lg text-gray-600 hover:bg-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
