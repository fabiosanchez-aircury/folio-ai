import { auth } from "@/lib/auth";
import { getPortfolios } from "@/lib/queries";
import { PortfolioList } from "@/components/portfolio/portfolio-list";
import { CreatePortfolioButton } from "@/components/portfolio/create-portfolio-button";

export default async function PortfolioPage() {
  const session = await auth();

  if (!session?.user) return null;

  const portfolios = await getPortfolios(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Manage your investment portfolios and assets
          </p>
        </div>
        <CreatePortfolioButton />
      </div>

      <PortfolioList portfolios={portfolios} />
    </div>
  );
}
