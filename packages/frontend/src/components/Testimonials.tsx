import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Aisha M.",
    location: "Toronto, ON",
    story:
      "I almost sent $500 for 'training materials' before using TrueHire. The system flagged it immediately as a scam. I'm so grateful!",
    role: "International Student",
    avatar: "A",
  },
  {
    name: "Raj P.",
    location: "Vancouver, BC",
    story:
      "As a newcomer, I didn't know what was normal in Canadian job postings. TrueHire gave me confidence to identify legitimate opportunities.",
    role: "Skilled Worker",
    avatar: "R",
  },
  {
    name: "Maria S.",
    location: "Montreal, QC",
    story:
      "The detailed explanations helped me learn what to look for. Now I can spot red flags on my own. This tool is invaluable for newcomers.",
    role: "Recent Graduate",
    avatar: "M",
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]); // Removed testimonials dependency (implicitly stable as module constant)

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  };

  const currentTestimonial = testimonials[activeIndex];

  return (
    <section className="relative py-24 px-4 bg-zinc-50 dark:bg-[#09090B] overflow-hidden">
      {/* Grid background pattern */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          {/* Numbered Label */}
          <p className="text-xs text-blue-600 dark:text-blue-400 tracking-widest uppercase font-mono">
            [02] Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Real Stories from Protected Users
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from newcomers who avoided scams and found confidence in their
            job search.
          </p>
        </div>

        {/* Hero Quote */}
        <div className="relative">
          {/* Quote Content */}
          <div className="text-center mb-12">
            {/* Avatar */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center text-2xl shadow-sm">
                {currentTestimonial.avatar}
              </div>
            </div>

            {/* Large Quote */}
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground leading-relaxed max-w-4xl mx-auto mb-8 transition-all duration-500">
              "{currentTestimonial.story}"
            </blockquote>

            {/* Attribution */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg font-semibold text-foreground">
                {currentTestimonial.name}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                {currentTestimonial.role}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground/70">
                {currentTestimonial.location}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`flex items-center gap-1 text-sm font-mono transition-all duration-300 ${
                    index === activeIndex
                      ? "text-foreground"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {index === activeIndex && (
                    <span className="w-8 h-0.5 bg-foreground rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
