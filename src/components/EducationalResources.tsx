import { Card } from "./ui/card";
import { BookOpen, Users, Lightbulb, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

export function EducationalResources() {
  const tips = [
    {
      title: "Research the Company",
      description: "Always verify the company exists. Check their official website, LinkedIn page, and online reviews before applying."
    },
    {
      title: "Verify Contact Information",
      description: "Legitimate employers use company email addresses (@companyname.com), not Gmail, Yahoo, or other personal email services."
    },
    {
      title: "Never Pay to Apply",
      description: "Real employers never ask for money upfront for applications, training, background checks, or equipment."
    },
    {
      title: "Watch for Unrealistic Promises",
      description: "Be skeptical of jobs offering very high pay for minimal work, guaranteed income, or 'get rich quick' opportunities."
    },
    {
      title: "Protect Personal Information",
      description: "Never share your SIN, banking details, credit card information, or passport before receiving a formal job offer."
    },
    {
      title: "Trust Your Instincts",
      description: "If something feels off or too good to be true, it probably is. Take your time and don't let urgency pressure you."
    }
  ];

  const resources = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Canadian Anti-Fraud Centre",
      description: "Official resource for reporting and learning about fraud in Canada",
      link: "#"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Settlement Services",
      description: "Find local newcomer support organizations in your area",
      link: "#"
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Job Search Guide for Newcomers",
      description: "Learn about the Canadian job market and hiring practices",
      link: "#"
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Protect Yourself: Quick Tips</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Knowledge is your best defense against employment scams. 
              Learn to recognize warning signs and make safer job search decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {tips.map((tip, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <h4 className="mb-3 text-blue-600">{tip.title}</h4>
                <p className="text-gray-600 text-sm">
                  {tip.description}
                </p>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="mb-6 text-center">Helpful Resources</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="mb-2">{resource.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {resource.description}
                      </p>
                      <Button variant="link" className="p-0 h-auto text-blue-600">
                        Learn More <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-12 p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="mb-4 text-white">Found a Scam?</h3>
              <p className="mb-6 text-blue-50">
                Help protect others by reporting suspicious job postings. Your reports help improve 
                our AI detection and warn the community about emerging scam tactics.
              </p>
              <Button variant="secondary" size="lg">
                Report a Scam
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
