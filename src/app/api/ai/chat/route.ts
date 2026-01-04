import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAI, PortfolioContext } from "@/lib/api/gemini";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { messages } = await request.json();

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
          avgPrice: Number(a.avgPrice),
        }))
      );

      const totalValue = allAssets.reduce(
        (acc, a) => acc + a.quantity * a.avgPrice,
        0
      );

      portfolioContext = {
        assets: allAssets,
        totalValue,
      };
    }

    const result = await chatWithAI(messages, portfolioContext);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat" }),
      { status: 500 }
    );
  }
}

