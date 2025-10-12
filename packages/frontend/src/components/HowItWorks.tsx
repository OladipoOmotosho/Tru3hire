import { FileText, Brain, ShieldCheck, TrendingUp } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Submit Job Posting",
      description: "Copy and paste the job description, email, or any job-related text you want to verify."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Analysis",
      description: "Our AI analyzes the text using pattern recognition and rule-based logic to detect suspicious elements."
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Get Trust Score",
      description: "Receive an instant Trust Score (0-100) with clear explanations of any red flags detected."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Make Informed Decisions",
      description: "Use the insights to decide whether to proceed, research further, or avoid the opportunity entirely."
    }
  ];

  return (
    <div id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">How TrustCheck Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered system combines pattern recognition with expert knowledge 
              of employment scams to protect you in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-0.5 bg-blue-200 -z-10 hidden lg:block" 
                       style={{ 
                         display: index === steps.length - 1 ? 'none' : undefined 
                       }} 
                  />
                  <div className="mb-3">{step.title}</div>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
            <h3 className="mb-6 text-center">What We Check For</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-red-600 mb-3">🚩 Red Flags</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Personal email addresses (not company domains)</li>
                  <li>• Requests for upfront payments or fees</li>
                  <li>• Unrealistic salary promises</li>
                  <li>• Excessive urgency or pressure tactics</li>
                  <li>• Requests for sensitive personal information</li>
                  <li>• Vague or missing company details</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="text-green-600 mb-3">✓ Trust Indicators</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Company email domain addresses</li>
                  <li>• Detailed job responsibilities</li>
                  <li>• Realistic salary ranges</li>
                  <li>• Clear company information</li>
                  <li>• Professional language and formatting</li>
                  <li>• Transparent application process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
