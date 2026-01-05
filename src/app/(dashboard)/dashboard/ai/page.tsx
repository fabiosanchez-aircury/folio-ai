"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { Bot, Send, User, Loader2, Sparkles, RefreshCw } from "lucide-react";

export default function AIPage() {
  const [portfolioSummary, setPortfolioSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/chat",
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPortfolioSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch("/api/ai/summary?type=portfolio");
      const data = await response.json();
      setPortfolioSummary(data.summary);
    } catch {
      setPortfolioSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">
          Get AI-powered insights about your portfolio and markets
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Portfolio Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Portfolio Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolioSummary ? (
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm whitespace-pre-wrap">{portfolioSummary}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click below to get an AI-generated analysis of your portfolio.
              </p>
            )}
            <Button
              onClick={fetchPortfolioSummary}
              disabled={isLoadingSummary}
              variant="outline"
              className="w-full"
            >
              {isLoadingSummary ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {portfolioSummary ? "Refresh Summary" : "Generate Summary"}
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 flex flex-col h-[600px]">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with Folio AI
            </CardTitle>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Ask me anything about your portfolio, market trends, or investment strategies.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {[
                    "Analyze my portfolio",
                    "What's the market trend?",
                    "Should I diversify?",
                    "Explain DCA strategy",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fakeEvent = {
                          target: { value: suggestion },
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(fakeEvent);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                Error: {error.message}. Make sure GEMINI_API_KEY is configured.
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your portfolio, markets, or strategies..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by Google Gemini • Not financial advice
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

