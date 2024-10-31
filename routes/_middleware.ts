import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const pathname = new URL(req.url).pathname;
  
  // Only protect admin routes
  if (pathname.startsWith("/admin")) {
    // Get auth cookie
    const cookies = req.headers.get("cookie");
    const authCookie = cookies?.split(";")
      .find((c) => c.trim().startsWith("auth="));
    
    if (!authCookie) {
      // Redirect to login if not authenticated
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }
  }
  
  return await ctx.next();
}
