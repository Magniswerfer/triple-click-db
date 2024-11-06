// RecommendationCard.tsx
import { type OneMoreThingCategory } from "../types.ts";

interface RecommendationCardProps {
  id: string;
  episodeNumber: number;
  episodeTitle: string;
  date: string;
  host: string;
  content: string;
  category: OneMoreThingCategory;
}

function RecommendationCard({
  id,
  episodeNumber,
  episodeTitle,
  date,
  host,
  content,
  category
}: RecommendationCardProps) {
  return (
    <div class="break-inside-avoid-column bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow flex flex-col inline-block w-full">
      <div class="p-4 flex flex-col">
        <p class="text-lg mb-2">{content}</p>
        <div class="mt-2">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded whitespace-nowrap">
              {category}
            </span>
            <span class="text-sm text-gray-600 capitalize whitespace-nowrap">
              by {host}
            </span>
          </div>
          <div class="pt-3 border-t">
            <a
              href={`/episodes/${id}`}
              class="text-sm text-gray-600 hover:text-blue-600"
            >
              <div class="line-clamp-1">
                Episode {episodeNumber}: {episodeTitle}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {new Date(date).toLocaleDateString()}
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
