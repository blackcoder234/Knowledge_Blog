"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface PaginationProps {
  totalPages: number;
}

export const Pagination = ({ totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page));
  };

  if (totalPages <= 1) return null;

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Simplified logic for now: show start, end, and around current
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors border ${
                currentPage === page
                  ? "bg-accent text-black border-accent"
                  : "bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="w-10 h-10 flex items-center justify-center text-zinc-600"
            >
              ...
            </span>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};
