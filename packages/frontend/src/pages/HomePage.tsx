import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Testimonials } from "../components/Testimonials";
import { EducationalResources } from "../components/EducationalResources";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/analyze");
  };

  return (
    <div className="relative min-h-screen">
      {/* Hero Section with Background Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 opacity-50" />
        <Hero onGetStarted={handleGetStarted} />
      </div>

      {/* How It Works Section */}
      <section className="py-16 bg-background">
        <HowItWorks />
      </section>

      {/* Testimonials Section with Accent Background */}
      <section className="py-16 bg-muted/30">
        <Testimonials />
      </section>

      {/* Educational Resources Section */}
      <section className="py-16 bg-background">
        <EducationalResources />
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">
            © {new Date().getFullYear()} TrustCheck. Protecting job seekers from
            scams.
          </p>
        </div>
      </footer>
    </div>
  );
}
