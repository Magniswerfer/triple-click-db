import { JSX } from "preact";

interface SearchBarProps {
  searchQuery: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  showClear?: boolean;
}

export default function SearchBar({
  searchQuery,
  placeholder = "Search...",
  onSearch,
  showClear = true
}: SearchBarProps) {
  const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search") as string;
    onSearch?.(query);
  };

  return (
    <div class="mb-6">
      <form onSubmit={handleSubmit} class="flex gap-2 items-center">
        <div class="flex-1">
          <input
            type="search"
            name="search"
            value={searchQuery}
            placeholder={placeholder}
            class="w-full px-4 py-2 border rounded-lg"
          />
          <input type="hidden" name="page" value="1" />
        </div>
        <button
          type="submit"
          class="px-4 py-2 bg-primary-500 text-light-50 rounded-lg hover:bg-primary-800"
        >
          Search
        </button>
        {showClear && searchQuery && (
          <a
            href="?"
            class="px-4 py-2 border border-light-600 rounded-lg hover:bg-light-100"
          >
            Clear
          </a>
        )}
      </form>
    </div>
  );
}
