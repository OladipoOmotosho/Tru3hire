import { Card } from "../components/ui/card";
import { Shield, Brain, Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
              <Shield className="w-4 h-4" />
              <span className="text-sm">About TrustCheck</span>
            </div>
            <h1 className="mb-4">Protecting Newcomers from Job Scams</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every year, thousands of newcomers to Canada fall victim to fraudulent job postings. 
              TrustCheck uses AI to help identify and avoid these scams.
            </p>
          </div>

          {/* Mission */}
          <Card className="p-8 mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <h2 className="mb-4 text-center">Our Mission</h2>
            <p className="text-gray-700 text-center max-w-2xl mx-auto">
              To empower newcomers with the tools and knowledge to identify fake job offers, 
              build confidence during their job search, and learn to recognize warning signs of employment scams.
            </p>
          </Card>

          {/* The Problem */}
          <div className="mb-12">
            <h2 className="mb-6">The Problem We're Solving</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="mb-2">Financial Loss</h4>
                <p className="text-sm text-gray-600">
                  Scammers exploit newcomers' urgency to find work, leading to loss of money through fake fees and deposits.
                </p>
              </Card>

              <Card className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="mb-2">Identity Theft</h4>
                <p className="text-sm text-gray-600">
                  Fake job postings often request sensitive personal information that can be used for identity theft.
                </p>
              </Card>

              <Card className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="mb-2">Slower Integration</h4>
                <p className="text-sm text-gray-600">
                  Employment scams delay newcomers' ability to find legitimate work and integrate into the workforce.
                </p>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="mb-6">How TrustCheck Works</h2>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-2">AI Pattern Recognition</h4>
                    <p className="text-sm text-gray-600">
                      Our AI model is trained on thousands of legitimate and fraudulent job postings to recognize 
                      text patterns, tone, and language commonly used in scams.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="mb-2">Rule-Based Detection</h4>
                    <p className="text-sm text-gray-600">
                      We check for obvious red flags such as personal emails, payment requests, unrealistic promises, 
                      and suspicious contact information.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="mb-2">Trust Score & Explanation</h4>
                    <p className="text-sm text-gray-600">
                      You receive a clear Trust Score (0-100) along with detailed explanations of any warning signs, 
                      helping you make informed decisions.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* What We Check */}
          <div className="mb-12">
            <h2 className="mb-6">What We Analyze</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-red-600 mb-4">🚩 Red Flags We Detect</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Personal email addresses (not company domains)</li>
                  <li>• Requests for upfront payments or fees</li>
                  <li>• Unrealistic salary promises</li>
                  <li>• Excessive urgency or pressure tactics</li>
                  <li>• Requests for sensitive personal information</li>
                  <li>• Vague or missing company details</li>
                  <li>• "Too good to be true" job offers</li>
                  <li>• Guaranteed income claims</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h4 className="text-green-600 mb-4">✓ Trust Indicators</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Company email domain addresses</li>
                  <li>• Detailed job responsibilities</li>
                  <li>• Realistic salary ranges</li>
                  <li>• Clear company information</li>
                  <li>• Professional language and formatting</li>
                  <li>• Transparent application process</li>
                  <li>• Verifiable company details</li>
                  <li>• Standard hiring practices</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Privacy & Ethics */}
          <Card className="p-8 mb-8 border-gray-200">
            <h3 className="mb-4">Privacy & Ethics</h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>We do not store personal data:</strong> Your job posting submissions are analyzed in real-time 
                and are not stored in our systems.
              </p>
              <p>
                <strong>Text-only analysis:</strong> Our AI only analyzes text patterns, not user identities or personal information.
              </p>
              <p>
                <strong>Advisory results:</strong> Our results are recommendations based on pattern analysis, not definitive 
                judgments. Always conduct your own research.
              </p>
              <p>
                <strong>Transparency:</strong> We believe in open, ethical AI. Our detection methods are documented and 
                our code is available for review.
              </p>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h3 className="mb-4">Ready to Check a Job Posting?</h3>
            <p className="text-gray-600 mb-6">
              Get instant analysis and protect yourself from employment scams.
            </p>
            <Link to="/analyze">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Analyze Job Posting
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
