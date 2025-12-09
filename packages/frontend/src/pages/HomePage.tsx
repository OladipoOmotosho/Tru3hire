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
        <div className="absolute inset-0 bg-hero-bg">
          <div className="absolute inset-0 bg-linear-to-br from-hero-gradient-from via-hero-gradient-via to-hero-gradient-to" />
        </div>
        <Hero onGetStarted={handleGetStarted} />
      </div>

      {/* How It Works Section */}
      <section className="bg-background">
        <HowItWorks />
      </section>

      {/* Testimonials Section with Accent Background */}
      <section className="bg-background">
        <Testimonials />
      </section>

      {/* Educational Resources Section */}
      <section className="bg-background">
        <EducationalResources />
      </section>
    </div>
  );
}
