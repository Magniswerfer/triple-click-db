import { useCallback } from "preact/hooks";
import SearchBar from "../components/SearchBar.tsx";

interface SearchBarIslandProps {
  initialQuery: string;
  placeholder?: string;
  showClear?: boolean;
}

export default function SearchBarIsland({ 
  initialQuery, 
  placeholder,
  showClear 
}: SearchBarIslandProps) {
  const handleSearch = useCallback((query: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("search", query);
    url.searchParams.set("page", "1");
    window.location.href = url.toString();
  }, []);

  return (
    <SearchBar 
      searchQuery={initialQuery} 
      placeholder={placeholder}
      onSearch={handleSearch}
      showClear={showClear}
    />
  );
}
