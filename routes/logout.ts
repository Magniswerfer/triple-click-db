// routes/logout.ts
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      },
    });
  },
};
