// routes/login.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Layout from "../components/Layout.tsx";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const password = form.get("password")?.toString();

    // Replace this with your env password
    if (password === Deno.env.get("ADMIN_PASSWORD")) {
      // Create headers with both the redirect and the cookie
      const headers = new Headers();
      headers.set("Location", "/admin");
      headers.set(
        "Set-Cookie",
        `auth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
      
      return new Response(null, {
        status: 302,
        headers,
      });
    }

    return ctx.render({ error: "Invalid password" });
  },
};

export default function LoginPage({ data }: PageProps<{ error?: string }>) {
  return (
    <Layout>
      <Head>
        <title>Login - Triple Click DB</title>
      </Head>

      <div class="max-w-sm mx-auto mt-10">
        <h1 class="text-3xl font-bold mb-6">Login</h1>
        
        {data?.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {data.error}
          </div>
        )}
        
        <form method="POST" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" for="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <button
            type="submit"
            class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </Layout>
  );
}
