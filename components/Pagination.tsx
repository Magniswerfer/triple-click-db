interface PaginationButtonProps {
  page: number;
  currentPage: number;
  searchQuery: string;
  paramName: string;
}

function PaginationButton({ page, currentPage, searchQuery, paramName }: PaginationButtonProps) {
  const isActive = page === currentPage;
  const href = `?q=${encodeURIComponent(searchQuery)}&${paramName}=${page}`;
  
  return (
    <a
      href={href}
      class={`px-3 py-1 border rounded mx-1 ${
        isActive
          ? "bg-primary-500 text-light-50 border-primary-600"
          : "border-light-600 hover:bg-light-100"
      }`}
    >
      {page}
    </a>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  paramName: string;
}

export function Pagination({ currentPage, totalPages, searchQuery, paramName }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Helper to generate page URLs
  const getPageUrl = (page: number) => 
    `?q=${encodeURIComponent(searchQuery)}&${paramName}=${page}`;

  return (
    <div class="flex justify-center items-center mt-8">
      {currentPage > 1 && (
        <a
          href={getPageUrl(currentPage - 1)}
          class="px-3 py-1 border rounded mx-1 border-light-600 hover:bg-light-100"
        >
          Previous
        </a>
      )}
      
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page => 
          page === 1 || 
          page === totalPages || 
          (page >= currentPage - 2 && page <= currentPage + 2)
        )
        .map((page, index, array) => (
          <>
            {index > 0 && array[index - 1] !== page - 1 && (
              <span class="px-2">...</span>
            )}
            <PaginationButton
              page={page}
              currentPage={currentPage}
              searchQuery={searchQuery}
              paramName={paramName}
            />
          </>
        ))}

      {currentPage < totalPages && (
        <a
          href={getPageUrl(currentPage + 1)}
          class="px-3 py-1 border rounded mx-1 border-light-600 hover:bg-light-100"
        >
          Next
        </a>
      )}
    </div>
  );
}
