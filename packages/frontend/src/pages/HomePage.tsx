import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Testimonials } from "../components/Testimonials";
import { EducationalResources } from "../components/EducationalResources";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../components/PageWrapper";

export function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = (url?: string) => {
    navigate("/analyze", { state: { initialUrl: url } });
  };

  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      {/* All sections now have their own dark backgrounds with grid patterns */}

      {/* Hero Section */}
      <Hero onGetStarted={handleGetStarted} />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Educational Resources Section */}
      <EducationalResources />
    </PageWrapper>
  );
}
