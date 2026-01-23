"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface Category {
  _id: string;
  name: string;
}

interface AdminFilterProps {
  categories: Category[];
}

export function AdminFilter({ categories }: AdminFilterProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter
    replace(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      {/* Category Filter */}
      <div className="relative">
        <select
          onChange={(e) => handleFilterChange("category", e.target.value)}
          defaultValue={searchParams.get("category")?.toString() || ""}
          className="appearance-none bg-[#09090b] border border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium min-w-[150px] cursor-pointer"
        >
          <option value="" className="bg-[#09090b]">
            All Categories
          </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id} className="bg-[#09090b]">
              {cat.name}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>

      {/* Sort Filter */}
      <div className="relative">
        <select
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          defaultValue={searchParams.get("sort")?.toString() || "newest"}
          className="appearance-none bg-[#09090b] border border-zinc-800 rounded-lg pl-4 pr-10 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium min-w-[150px] cursor-pointer"
        >
          <option value="newest" className="bg-[#09090b]">
            Newest First
          </option>
          <option value="oldest" className="bg-[#09090b]">
            Oldest First
          </option>
          <option value="views_desc" className="bg-[#09090b]">
            Most Views
          </option>
          <option value="views_asc" className="bg-[#09090b]">
            Least Views
          </option>
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    </div>
  );
}
