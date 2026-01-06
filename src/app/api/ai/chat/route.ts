import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAI, PortfolioContext } from "@/lib/api/gemini";

// Helper to extract text from UIMessage parts
function getTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages: rawMessages } = await request.json();

    // Convert UIMessage format (with parts) to simple format (with content)
    const messages = rawMessages.map((m: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.parts ? getTextFromParts(m.parts) : m.content || "",
    }));

    // Get user's portfolio for context
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: { assets: true },
    });

    let portfolioContext: PortfolioContext | undefined;

    if (portfolios.length > 0) {
      const allAssets = portfolios.flatMap((p) =>
        p.assets.map((a) => ({
          symbol: a.symbol,
          name: a.name || undefined,
          type: a.type as "CRYPTO" | "STOCK",
          quantity: Number(a.quantity),
        }))
      );

      // Total value will be calculated with current prices if needed
      const totalValue = 0;

      portfolioContext = {
        assets: allAssets,
        totalValue,
      };
    }

    const result = await chatWithAI(messages, portfolioContext);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat" }),
      { status: 500 }
    );
  }
}

