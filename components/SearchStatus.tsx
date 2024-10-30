interface SearchStatusProps {
  totalResults: number;
  searchQuery: string;
  itemName?: string;
}

export function SearchStatus({ 
  totalResults, 
  searchQuery,
  itemName = "episode"
}: SearchStatusProps) {
  if (!searchQuery) return null;

  return (
    <div class="mt-4 text-sm text-gray-600">
      {totalResults === 0
        ? `No ${itemName}s found`
        : `Found ${totalResults} ${itemName}${
            totalResults === 1 ? "" : "s"
          }`}
      {" "}for "{searchQuery}"
    </div>
  );
}
