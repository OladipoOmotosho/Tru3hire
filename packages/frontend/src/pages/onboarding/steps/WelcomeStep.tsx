import { CheckCircle2 } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-info-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-light">Welcome to TrueHire!</h1>
      <p className="text-lg text-gray-600 max-w-xl mx-auto">
        Let's personalize your job search experience. We'll help you find jobs
        that truly match your skills and preferences.
      </p>
      <div className="bg-info-50 border border-info-200 rounded-lg p-4 text-left">
        <p className="text-sm text-info-900">
          <strong>What to expect:</strong>
        </p>
        <ul className="list-disc list-inside text-sm text-info-800 mt-2 space-y-1">
          <li>Upload your resume (we'll extract your skills automatically)</li>
          <li>Confirm and edit your skills and experience</li>
          <li>Set your job preferences</li>
          <li>Start getting personalized TrueScore recommendations</li>
        </ul>
      </div>
    </div>
  );
}
