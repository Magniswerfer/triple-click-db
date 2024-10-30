import { h } from "preact";

const Navbar = () => {
  return (
    <nav className="bg-secondary-500 p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="text-light-100 hover:text-light-500 font-bold text-xl">
            <a href="/">Triple Click <span className="inline text-accent-500">Dex</span></a>
          </div>
          <div className="text-light-100 flex space-x-6">
            <a
              href="/episodes"
              className="hover:text-light-500 transition-colors duration-200"
            >
              Episodes
            </a>
            <a
              href="/games"
              className="hover:text-light-500 transition-colors duration-200"
            >
              Games
            </a>
            <a
              href="/one-more-thing"
              className="hover:text-light-500 transition-colors duration-200"
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

