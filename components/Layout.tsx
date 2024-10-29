import { h, ComponentChildren } from "preact";
import Navbar from "./Navbar.tsx";

interface LayoutProps {
  children: ComponentChildren;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>Triple Click Index - A fan-made episode guide</p>
          <p className="text-sm mt-2">
            Not affiliated with Triple Click podcast. Made with ❤️ for the community.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
