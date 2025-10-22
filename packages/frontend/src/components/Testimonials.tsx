import { Card } from "./ui/card";
import { Quote } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      name: "Aisha M.",
      location: "Toronto, ON",
      story:
        "I almost sent $500 for 'training materials' before using TrustCheck. The system flagged it immediately as a scam. I'm so grateful!",
      role: "International Student",
    },
    {
      name: "Raj P.",
      location: "Vancouver, BC",
      story:
        "As a newcomer, I didn't know what was normal in Canadian job postings. TrustCheck gave me confidence to identify legitimate opportunities.",
      role: "Skilled Worker",
    },
    {
      name: "Maria S.",
      location: "Montreal, QC",
      story:
        "The detailed explanations helped me learn what to look for. Now I can spot red flags on my own. This tool is invaluable for newcomers.",
      role: "Recent Graduate",
    },
  ];

  return (
    <div className="py-16 bg-gradient-to-b">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            {/* Fixed: use text-foreground so heading is visible in both themes */}
            <h2 className="mb-4 text-foreground">
              Real Stories from Protected Users
            </h2>
            {/* Use muted-foreground for secondary text */}
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from newcomers who avoided scams and found confidence in
              their job search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 relative">
                {/* Use a themed primary color with opacity for the decorative quote */}
                <Quote className="w-10 h-10 text-primary/30 absolute top-4 right-4" />
                <div className="relative">
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.story}"
                  </p>
                  <div className="border-t pt-4 border-border">
                    <div className="text-foreground font-medium">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
