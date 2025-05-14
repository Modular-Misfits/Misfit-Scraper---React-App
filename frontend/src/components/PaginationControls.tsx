// frontend/src/components/PaginationControls.tsx

import * as React from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  fontSize: string; // Added fontSize prop
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handlePrevious = () => {
    if (currentPage > 0) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex justify-center items-center gap-4 py-4 text-yellow-300 text-lg">
      <button
        className="px-4 py-2 bg-gray-800 hover:bg-gray-600 rounded disabled:opacity-40"
        onClick={handlePrevious}
        disabled={currentPage === 0}
      >
        Previous
      </button>

      <span className="text-white">
        Page {currentPage + 1} of {totalPages}
      </span>

      <button
        className="px-4 py-2 bg-gray-800 hover:bg-gray-600 rounded disabled:opacity-40"
        onClick={handleNext}
        disabled={currentPage >= totalPages - 1}
      >
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
