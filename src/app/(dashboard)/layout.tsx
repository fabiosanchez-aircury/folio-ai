import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <Header user={session.user} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
