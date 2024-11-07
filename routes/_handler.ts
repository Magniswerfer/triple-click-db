import { HandlerContext } from "$fresh/server.ts";

export function handler(_req: Request, ctx: HandlerContext) {
  return ctx.render({ async: true });
}
