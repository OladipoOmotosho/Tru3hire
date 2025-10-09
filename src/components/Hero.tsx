import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm">AI-Powered Job Verification</span>
          </div>
          
          <h1 className="mb-6">
            Protect Yourself from Fake Job Scams
          </h1>
          
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
            Every year, thousands of newcomers to Canada fall victim to fraudulent job postings. 
            TrustCheck uses AI to analyze job offers and help you identify scams before it's too late.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button onClick={onGetStarted} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Check a Job Posting
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn How It Works
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-gray-500 text-sm mb-1">Safe Jobs Verified</div>
              <div className="text-2xl">12,400+</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-gray-500 text-sm mb-1">Scams Detected</div>
              <div className="text-2xl">3,800+</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-gray-500 text-sm mb-1">Users Protected</div>
              <div className="text-2xl">25,600+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
