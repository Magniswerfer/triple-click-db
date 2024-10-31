// plugins/session.ts
import { FreshContext, Plugin } from "$fresh/server.ts";

export function sessionPlugin(): Plugin {
  return {
    name: "session",
    middleware: {
      handler: async (req: Request, ctx: FreshContext) => {
        // Check for auth cookie
        const cookies = req.headers.get("cookie");
        const authCookie = cookies?.split(";")
          .find((c) => c.trim().startsWith("auth="));
        
        ctx.state.session = authCookie ? true : false;
        
        return await ctx.next();
      },
    },
  };
}
