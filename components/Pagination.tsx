// components/Pagination.tsx
interface PaginationButtonProps {
  page: number;
  currentPage: number;
  searchQuery: string;
}

function PaginationButton({ page, currentPage, searchQuery }: PaginationButtonProps) {
  const isActive = page === currentPage;
  const href = `?page=${page}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`;
  
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
}

export function Pagination({ currentPage, totalPages, searchQuery }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div class="flex justify-center items-center mt-8">
      {currentPage > 1 && (
        <a
          href={`?page=${currentPage - 1}${
            searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
          }`}
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
            />
          </>
        ))}

      {currentPage < totalPages && (
        <a
          href={`?page=${currentPage + 1}${
            searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
          }`}
          class="px-3 py-1 border rounded mx-1 border-light-600 hover:bg-light-100"
        >
          Next
        </a>
      )}
    </div>
  );
}
