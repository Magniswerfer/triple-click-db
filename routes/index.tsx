import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { kv } from "../utils/db.ts";
import Layout from "../components/Layout.tsx";

interface Episode {
  id: string;
  title: string;
  description: string;
  sections: {
    mainText: string;
    oneMoreThing: {
      kirk: string;
      maddy: string;
      jason: string;
    };
  };
  date: string;
  duration: string;
  audioUrl: string;
  episodeNumber: number;
  authors: string;
  explicit: boolean;
  type: string;
}

export const handler: Handlers<Episode[]> = {
  async GET(_req, ctx) {
    const entries = await kv.list<Episode>({ prefix: ["episodes"] });
    const episodes = [];
    for await (const entry of entries) {
      episodes.push(entry.value);
    }
    return ctx.render(episodes.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  },
};

export default function Home({ data: episodes }: PageProps<Episode[]>) {
  if (!episodes || episodes.length === 0) {
    return (
      <Layout>
        <p>No episodes found.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Triple Click Episode Guide</title>
      </Head>
      
      <h1 className="text-3xl font-bold mb-6">Triple Click Episode Guide</h1>
      
      <div className="space-y-6">
        {episodes.map((episode) => (
          <div key={episode.id} className="border rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xl font-semibold">
                Episode {episode.episodeNumber}: {episode.title}
              </h2>
              {episode.explicit && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                  Explicit
                </span>
              )}
            </div>
            
            <div className="flex gap-4 text-sm text-gray-600 mb-3">
              <time dateTime={episode.date}>
                {new Date(episode.date).toLocaleDateString()}
              </time>
              <span>{episode.duration}</span>
              <span>{episode.authors}</span>
            </div>

            {episode.sections?.mainText && (
              <p className="mb-4">{episode.sections.mainText}</p>
            )}

            {episode.sections?.oneMoreThing && (
              <div className="bg-gray-50 p-4 rounded mb-4">
                <h3 className="font-semibold mb-2">One More Thing</h3>
                <div className="space-y-2">
                  {episode.sections.oneMoreThing.kirk && (
                    <p>
                      <span className="font-medium">Kirk:</span>{" "}
                      {episode.sections.oneMoreThing.kirk}
                    </p>
                  )}
                  {episode.sections.oneMoreThing.maddy && (
                    <p>
                      <span className="font-medium">Maddy:</span>{" "}
                      {episode.sections.oneMoreThing.maddy}
                    </p>
                  )}
                  {episode.sections.oneMoreThing.jason && (
                    <p>
                      <span className="font-medium">Jason:</span>{" "}
                      {episode.sections.oneMoreThing.jason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {episode.audioUrl && (
              <audio controls className="w-full">
                <source src={episode.audioUrl} type="audio/mpeg" />
              </audio>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
