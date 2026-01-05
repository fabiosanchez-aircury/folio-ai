import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";

const model = google("gemini-2.0-flash");

export interface PortfolioContext {
  assets: {
    symbol: string;
    name?: string;
    type: "CRYPTO" | "STOCK";
    quantity: number;
    avgPrice: number;
    currentPrice?: number;
  }[];
  totalValue: number;
  news?: {
    title: string;
    summary: string;
    symbol: string;
  }[];
}

export async function generatePortfolioSummary(context: PortfolioContext) {
  const prompt = `You are a financial analyst assistant. Analyze this investment portfolio and provide a brief summary:

Portfolio:
${context.assets
  .map(
    (a) =>
      `- ${a.symbol}${a.name ? ` (${a.name})` : ""}: ${a.quantity} units at $${
        a.avgPrice
      } avg (${a.type})`
  )
  .join("\n")}

Total Portfolio Value: $${context.totalValue.toLocaleString()}

${
  context.news && context.news.length > 0
    ? `Recent News:
${context.news
  .slice(0, 5)
  .map((n) => `- [${n.symbol}] ${n.title}`)
  .join("\n")}`
    : ""
}

Provide:
1. A brief portfolio overview (2-3 sentences)
2. Asset allocation analysis
3. Key observations
4. Potential risks to watch

Keep the response concise and actionable.`;

  const { text } = await generateText({
    model,
    prompt,
    maxTokens: 500,
  });

  return text;
}

export async function generateNewsSummary(
  news: { title: string; summary: string; source: string }[]
) {
  const prompt = `You are a financial news analyst. Summarize these news articles and identify key market trends:

News Articles:
${news
  .slice(0, 10)
  .map(
    (n, i) => `${i + 1}. ${n.title}\n   ${n.summary}\n   Source: ${n.source}`
  )
  .join("\n\n")}

Provide:
1. A brief summary of the overall market sentiment
2. Key themes across the news
3. Potential market impacts
4. Assets mentioned and their sentiment (bullish/bearish/neutral)

Keep the response concise and focused on actionable insights.`;

  const { text } = await generateText({
    model,
    prompt,
    maxTokens: 500,
  });

  return text;
}

export async function chatWithAI(
  messages: { role: "user" | "assistant"; content: string }[],
  portfolioContext?: PortfolioContext
) {
  const systemPrompt = `You are Folio AI, a helpful financial assistant specializing in portfolio analysis, market trends, and investment insights. 

${
  portfolioContext
    ? `The user has the following portfolio:
${portfolioContext.assets
  .map(
    (a) =>
      `- ${a.symbol}: ${a.quantity} units at $${a.avgPrice} avg (${a.type})`
  )
  .join("\n")}
Total Value: $${portfolioContext.totalValue.toLocaleString()}`
    : "The user has not shared their portfolio yet."
}

Guidelines:
- Be helpful and provide actionable insights
- Explain financial concepts clearly
- When discussing investments, always mention that this is not financial advice
- Be concise but thorough
- Use data and facts when available
- If you don't know something, say so`;

  const formattedMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const result = streamText({
    model,
    system: systemPrompt,
    messages: formattedMessages,
  });

  return result;
}

export async function analyzeAsset(
  symbol: string,
  type: "CRYPTO" | "STOCK",
  historicalData?: { date: string; price: number }[]
) {
  const prompt = `You are a financial analyst. Analyze this ${
    type === "CRYPTO" ? "cryptocurrency" : "stock"
  }:

Symbol: ${symbol}
Type: ${type}

${
  historicalData && historicalData.length > 0
    ? `Recent Price History (last ${historicalData.length} data points):
${historicalData
  .slice(-10)
  .map((d) => `${d.date}: $${d.price}`)
  .join("\n")}`
    : ""
}

Provide:
1. Brief overview of the asset
2. Recent price trend analysis
3. Key factors affecting price
4. Risk assessment
5. General outlook (not financial advice)

Keep the analysis concise and factual.`;

  const { text } = await generateText({
    model,
    prompt,
    maxTokens: 500,
  });

  return text;
}
