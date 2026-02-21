import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const location = useLocation();
  const isJobsPage = location.pathname.startsWith("/jobs");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Hide footer on the jobs view for a cleaner app-like scroll UX */}
      {!isJobsPage && <Footer />}
    </div>
  );
}
