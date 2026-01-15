"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryData {
  _id: string;
  name: string;
  language: string;
  genre: string;
}

interface BlogControlsProps {
  categories: CategoryData[];
}

export const BlogControls = ({ categories }: BlogControlsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initial States from URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedLang, setSelectedLang] = useState(
    searchParams.get("lang") || "All"
  );
  const [selectedGenre, setSelectedGenre] = useState(
    searchParams.get("genre") || "All"
  );
  const [selectedCat, setSelectedCat] = useState(
    searchParams.get("category") || "All"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sort") || "latest"
  );

  // Derived Options
  const languages = Array.from(
    new Set(categories.map((c) => c.language))
  ).filter(Boolean);

  const genres = Array.from(
    new Set(
      categories
        .filter((c) => selectedLang === "All" || c.language === selectedLang)
        .map((c) => c.genre)
    )
  ).filter(Boolean);

  const subCategories = categories
    .filter(
      (c) =>
        (selectedLang === "All" || c.language === selectedLang) &&
        (selectedGenre === "All" || c.genre === selectedGenre)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Update URL on change
  const updateFilters = (newParams: {
    q?: string;
    lang?: string;
    genre?: string;
    category?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Merge new params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "All") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset logic
    if (newParams.lang && newParams.lang !== selectedLang) {
      params.delete("genre");
      params.delete("category");
      setSelectedGenre("All");
      setSelectedCat("All");
    }
    if (newParams.genre && newParams.genre !== selectedGenre) {
      params.delete("category");
      setSelectedCat("All");
    }

    startTransition(() => {
      router.push(`/blog?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: query });
  };

  return (
    <div className="w-full mb-12">
      {/* Search Bar - Minimal & Clean */}
      <form
        onSubmit={handleSearch}
        className="relative w-full max-w-3xl mx-auto mb-8"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/50 to-purple-600/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <input
            type="text"
            placeholder="Search topics, ideas, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="relative w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-4 py-5 text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-all shadow-2xl"
          />
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500 group-hover:text-accent transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors border border-white/5"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filter Bar - Floating Glass Pill */}
      <div className="max-w-5xl mx-auto hidden lg:block">
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full p-2 flex flex-col md:flex-row gap-2 shadow-xl">
          {/* Language */}
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              updateFilters({ lang: e.target.value });
            }}
            className="bg-transparent text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full cursor-pointer focus:outline-none focus:bg-white/5 hover:bg-white/5 transition-colors border-r border-white/5 md:border-none appearance-none"
            style={{ backgroundImage: "none" }}
          >
            <option value="All" className="bg-black">
              All Languages
            </option>
            {languages.map((l) => (
              <option key={l} value={l} className="bg-black">
                {l}
              </option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              updateFilters({ genre: e.target.value });
            }}
            disabled={selectedLang === "All" && genres.length === 0}
            className="bg-transparent text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full cursor-pointer focus:outline-none focus:bg-white/5 hover:bg-white/5 transition-colors border-r border-white/5 md:border-none appearance-none disabled:opacity-30"
          >
            <option value="All" className="bg-black">
              All Topics
            </option>
            {genres.map((g) => (
              <option key={g} value={g} className="bg-black">
                {g}
              </option>
            ))}
          </select>

          {/* Category */}
          <div className="flex-1 relative">
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                updateFilters({ category: e.target.value });
              }}
              className="w-full bg-transparent text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full cursor-pointer focus:outline-none focus:bg-white/5 hover:bg-white/5 transition-colors appearance-none disabled:opacity-30"
            >
              <option value="All" className="bg-black">
                All Categories
              </option>
              {subCategories.map((c) => (
                <option key={c._id} value={c.name} className="bg-black">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px bg-white/10 hidden md:block mx-1"></div>

          {/* Sort Order */}
          <div className="relative min-w-[140px]">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                updateFilters({ sort: e.target.value });
              }}
              className="w-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold px-4 py-2 rounded-full cursor-pointer focus:outline-none focus:bg-accent/20 transition-colors appearance-none"
            >
              <option value="latest" className="bg-black text-white">
                Latest
              </option>
              <option value="oldest" className="bg-black text-white">
                Oldest
              </option>
              <option value="popular" className="bg-black text-white">
                Popular
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Filter Fallback (Simple Stack) */}
      <div className="lg:hidden grid grid-cols-2 gap-2 mt-4">
        <select
          value={selectedLang}
          onChange={(e) => {
            setSelectedLang(e.target.value);
            updateFilters({ lang: e.target.value });
          }}
          className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="All">All Langs</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={selectedGenre}
          onChange={(e) => {
            setSelectedGenre(e.target.value);
            updateFilters({ genre: e.target.value });
          }}
          className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="All">All Topics</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={selectedCat}
          onChange={(e) => {
            setSelectedCat(e.target.value);
            updateFilters({ category: e.target.value });
          }}
          className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white col-span-2"
        >
          <option value="All">All Categories</option>
          {subCategories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            updateFilters({ sort: e.target.value });
          }}
          className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-accent col-span-2"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Popular</option>
        </select>
      </div>
    </div>
  );
};
