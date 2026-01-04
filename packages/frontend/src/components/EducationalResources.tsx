import { Card } from "./ui/card";
import {
  BookOpen,
  Users,
  Lightbulb,
  ExternalLink,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export function EducationalResources() {
  const tips = [
    {
      title: "Research the Company",
      description:
        "Always verify the existence of the company. Check their official website, LinkedIn page, as well as online reviews before choosing to progress with the application.",
    },
    {
      title: "Verify Contact Information",
      description:
        "Legitimate employers use company email addresses (@companyname.com), not Gmail, Yahoo, or other personal email services.",
    },
    {
      title: "Never Pay to Apply",
      description:
        "Real employers never ask for money upfront for applications, training, background checks, or equipment.",
    },
    {
      title: "Watch for Unrealistic Promises",
      description:
        "Be skeptical of jobs offering very high pay for minimal work, guaranteed income, or 'get rich quick' opportunities.",
    },
    {
      title: "Protect Personal Information",
      description:
        "Never share your SIN, banking details, credit card information, or passport before receiving a formal job offer.",
    },
    {
      title: "Trust Your Instincts",
      description:
        "If something feels off or too good to be true, it probably is. Take your time and don't let urgency pressure you.",
    },
  ];

  const resources = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Canadian Anti-Fraud Centre",
      description:
        "Official resource for reporting and learning about fraud in Canada",
      link: "https://antifraudcentre-centreantifraude.ca/index-eng.htm",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Settlement Services",
      description: "Find local newcomer support organizations in your area",
      link: "https://ircc.canada.ca/english/newcomers/services/index.asp",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Job Search Guide for Newcomers",
      description: "Learn about the Canadian job market and hiring practices",
      link: "https://www.jobbank.gc.ca/findajob/newcomers",
    },
  ];

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-2xl font-medium">
              Protect Yourself: Quick Tips
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Knowledge is your best defense against employment scams. Learn to
              recognize warning signs and make safer job search decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {tips.map((tip, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <h4 className="mb-3 text-blue-600 dark:text-blue-400">
                  {tip.title}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {tip.description}
                </p>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="mb-6 text-center">Helpful Resources</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="mb-2">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {resource.description}
                      </p>
                      <div className="flex flex-row justify-end">
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 dark:text-blue-400 cursor-pointer"
                          >
                            Learn More <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* OPTION 1: Modern Glassmorphism */}
          <div className="mt-12 relative overflow-hidden rounded-2xl">
            {/* linear Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600" />

            {/* Animated linear Overlay */}
            {/* <div className="absolute inset-0 bg-muted-background from- via-white/10 to-transparent" /> */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent" />

            {/* Content */}
            <div className="relative p-8 md:p-12 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Icon Section */}
                  <div className="shrink-0">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                      <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Text Section */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-white">
                      Found a Scam?
                    </h3>
                    <p className="text-white/90 text-sm md:text-base mb-6">
                      Help protect others by reporting suspicious job postings.
                      Your vigilance helps us improve our AI detection system
                      which further enables us to disseminate the necessary
                      information regarding emerging scam tactics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                      <Link to="/report-scam">
                        <Button
                          size="lg"
                          className="bg-white text-blue-600 hover:bg-white/90 font-medium shadow-lg"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Report a Scam
                        </Button>
                      </Link>
                      <Link to="/safety-tips">
                        <Button
                          size="lg"
                          variant="outline"
                          className="bg-white/10 dark:border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                        >
                          Learn More
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
