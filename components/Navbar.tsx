import { h } from "preact";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-xl">Triple Click Index</div>
          <div className="flex space-x-6">
            <a
              href="/episodes"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Episodes
            </a>
            <a
              href="/games"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Games
            </a>
            <a
              href="/one-more-thing"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              One More Thing
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
