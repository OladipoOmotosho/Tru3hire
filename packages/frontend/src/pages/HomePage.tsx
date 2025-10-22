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
    <>
      <Hero onGetStarted={handleGetStarted} />
      <HowItWorks />
      <Testimonials />
      <EducationalResources />
    </>
  );
}
