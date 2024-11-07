import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  paramName: string;
  onPageChange?: (page: number) => void;
}

function PaginationButton({
  page,
  currentPage,
  onClick
}: {
  page: number;
  currentPage: number;
  onClick: () => void;
}) {
  const isActive = page === currentPage;

  return (
    <button
      onClick={onClick}
      class={`px-3 py-1 border rounded mx-1 ${isActive
          ? "bg-primary-500 text-light-50 border-primary-600"
          : "border-light-600 hover:bg-light-100"
        }`}
    >
      {page}
    </button>
  );
}

export default function PaginationIsland({
  currentPage: initialPage,
  totalPages,
  searchQuery,
  paramName
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const currentPage = useSignal(initialPage);
  const isLoading = useSignal(false);

  const fetchNewData = async (url: string) => {
    isLoading.value = true;
    try {
      const response = await fetch(`/api/search${new URL(url).search}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      // Get the section key based on paramName
      const sectionKey = paramName === 'episodePage' ? 'episodes' :
        paramName === 'gamePage' ? 'games' :
          paramName === 'omtPage' ? 'oneMoreThings' : null;

      if (!sectionKey || !data[sectionKey]) {
        throw new Error('Invalid section or missing data');
      }

      // Force a page reload for now
      window.location.reload();

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!IS_BROWSER) return;

    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set(paramName, newPage.toString());
    window.history.pushState({}, '', url.toString());

    // Update current page
    currentPage.value = newPage;

    // Fetch new data
    await fetchNewData(url.toString());

    // Scroll to top of the section
    const sectionHeader = document.querySelector(`[data-section="${paramName}"]`);
    if (sectionHeader) {
      sectionHeader.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div class="flex justify-center items-center mt-8 relative">
      {isLoading.value && (
        <div class="absolute inset-0 bg-white/50 flex items-center justify-center">
          Loading...
        </div>
      )}

      {currentPage.value > 1 && (
        <button
          onClick={() => handlePageChange(currentPage.value - 1)}
          class="px-3 py-1 border rounded mx-1 border-light-600 hover:bg-light-100"
          disabled={isLoading.value}
        >
          Previous
        </button>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page =>
          page === 1 ||
          page === totalPages ||
          (page >= currentPage.value - 2 && page <= currentPage.value + 2)
        )
        .map((page, index, array) => (
          <>
            {index > 0 && array[index - 1] !== page - 1 && (
              <span class="px-2">...</span>
            )}
            <PaginationButton
              page={page}
              currentPage={currentPage.value}
              onClick={() => handlePageChange(page)}
            />
          </>
        ))}
      {currentPage.value < totalPages && (
        <button
          onClick={() => handlePageChange(currentPage.value + 1)}
          class="px-3 py-1 border rounded mx-1 border-light-600 hover:bg-light-100"
          disabled={isLoading.value}
        >
          Next
        </button>
      )}
    </div>
  );
}
