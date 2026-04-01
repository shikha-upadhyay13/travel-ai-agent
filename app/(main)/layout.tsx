import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="md:ml-[240px] flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
