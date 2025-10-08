import { auth } from "@/lib/auth";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
 
const handler = async (req: Request) => {
  // session contains the access token record with scopes and user ID
  const session = await auth.api.getMcpSession({
    headers: req.headers
  })
  
  if (!session) {
    // this is important and you must return 401
    return new Response(null, {
      status: 401
    })
  }
  
  return createMcpHandler(
    (server) => {
      server.tool(
        "echo",
        "Echo a message",
        {
          message: z.string().describe("The message to echo")
        },
        async (args) => {
          return {
            content: [{ type: "text", text: `Tool echo: ${args.message}` }],
          };
        }
      );
    },
    {
      capabilities: {
        tools: {
          echo: {
            description: "Echo a message",
          },
        },
      },
    },
    {
      basePath: "/api",
      verboseLogs: true,
      maxDuration: 60,
    },
  )(req);
}
 
export { handler as GET, handler as POST, handler as DELETE };
