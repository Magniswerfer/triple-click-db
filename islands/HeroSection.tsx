import { useEffect, useState } from "preact/hooks";
import { Gamepad2, Headphones, Radio } from "https://esm.sh/lucide-preact@0.363.0";

const HeroSection = () => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const phrases = [
    "Discover games discussed on Triple Click",
    "Track your favorite episodes",
    "Find new games to play"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div class="relative -m-6 mb-6 rounded-t-lg overflow-hidden">
      <div class="relative bg-gradient-to-br from-secondary-700 via-secondary-600 to-secondary-500 py-16">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute transform -rotate-12 -left-10 top-10">
            <Gamepad2 size={120} strokeWidth={1.5} class="text-primary-300" />
          </div>
          <div class="absolute right-10 bottom-10">
            <Headphones size={100} strokeWidth={1.5} class="text-primary-300" />
          </div>
          <div class="absolute left-1/2 top-1/2">
            <Radio size={80} strokeWidth={1.5} class="text-primary-300" />
          </div>
        </div>

        <div class="relative container mx-auto px-4">
          <div class="text-center">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-light-400 mb-6">
              Triple Click <span class="inline text-accent-500">Dex</span>
            </h1>

            <div class="h-16 flex items-center justify-center">
              <p class="text-xl md:text-2xl text-primary-200 transition-opacity duration-500">
                {phrases[currentPhrase]}
              </p>
            </div>

            <div class="mt-8 flex justify-center gap-4">
              <a
                href="/games"
                class="bg-primary-500 text-white hover:bg-primary-400 transition-colors px-6 py-3 rounded-lg font-medium"
              >
                Browse Games
              </a>
              <a
                href="/episodes"
                class="bg-secondary-200 text-secondary-800 hover:bg-secondary-100 transition-colors px-6 py-3 rounded-lg font-medium"
              >
                Latest Episodes
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
