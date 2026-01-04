export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-3xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Folio</h1>
          </div>

          {/* Hero text */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Track Your Investments
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                With AI Insights
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Monitor stocks, crypto, and get AI-powered analysis with real-time news 
              and market data from Binance and more.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/register"
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="px-8 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition-colors"
            >
              Sign In
            </a>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-chart-green/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-chart-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Charts</h3>
              <p className="text-sm text-muted-foreground">
                Interactive TradingView charts with technical indicators and historical data.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Gemini-powered insights, news summaries, and investment recommendations.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Binance Sync</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Binance account to automatically sync your crypto portfolio.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 text-sm text-muted-foreground">
          Built with Next.js, Prisma, and Gemini AI
        </footer>
      </div>
    </main>
  );
}

