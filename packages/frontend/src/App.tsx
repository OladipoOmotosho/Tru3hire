import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { JobAnalyzer } from "./components/JobAnalyzer";
import { HowItWorks } from "./components/HowItWorks";
import { EducationalResources } from "./components/EducationalResources";
import { Testimonials } from "./components/Testimonials";
import { Footer } from "./components/Footer";

export default function App() {
  const scrollToAnalyzer = () => {
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onCheckJob={scrollToAnalyzer} />
      <main>
        <Hero onGetStarted={scrollToAnalyzer} />
        <JobAnalyzer />
        <HowItWorks />
        <Testimonials />
        <EducationalResources />
      </main>
      <Footer />
    </div>
  );
}
