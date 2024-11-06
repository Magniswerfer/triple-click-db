import { useState } from "preact/hooks";
import { JSX } from "preact";

const SearchBar = () => {
  const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("search");
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query.toString())}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="w-full max-w-2xl">
      <div class="relative">
        <input
          type="search"
          name="search"
          placeholder="Search episodes, games, or One More Thing..."
          class="w-full px-4 py-2 pr-10 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <button
          type="submit"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg
            class="w-5 h-5"
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
        </button>
      </div>
    </form>
  );
};

export default function NavbarIsland() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav class="bg-secondary-500 p-4 shadow-lg">
      <div class="container mx-auto">
        {/* Desktop Navigation */}
        <div class="hidden lg:flex items-center justify-between gap-4">
          <div class="text-light-100 hover:text-light-500 font-bold text-xl whitespace-nowrap">
            <a href="/">Triple Click <span class="inline text-accent-500">Dex</span></a>
          </div>
          
          <div class="flex-1 flex justify-center px-4">
            <SearchBar />
          </div>

          <div class="text-light-100 flex items-center space-x-6 whitespace-nowrap">
            <a
              href="/episodes"
              class="hover:text-light-500 transition-colors duration-200"
            >
              Episodes
            </a>
            <a
              href="/games"
              class="hover:text-light-500 transition-colors duration-200"
            >
              Games
            </a>
            <a
              href="/one-more-thing"
              class="hover:text-light-500 transition-colors duration-200"
            >
              One More Thing
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div class="lg:hidden">
          <div class="flex items-center justify-between">
            <div class="text-light-100 hover:text-light-500 font-bold text-xl">
              <a href="/">Triple Click <span class="inline text-accent-500">Dex</span></a>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              class="text-light-100 p-2"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {isMobileMenuOpen && (
            <div class="mt-4 space-y-4">
              <SearchBar />
              <div class="flex flex-col space-y-2 text-light-100">
                <a
                  href="/episodes"
                  class="hover:text-light-500 transition-colors duration-200 py-2"
                >
                  Episodes
                </a>
                <a
                  href="/games"
                  class="hover:text-light-500 transition-colors duration-200 py-2"
                >
                  Games
                </a>
                <a
                  href="/one-more-thing"
                  class="hover:text-light-500 transition-colors duration-200 py-2"
                >
                  One More Thing
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
