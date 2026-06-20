import { CheckCircle2 } from "lucide-react";

export function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-success-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-light">You're All Set!</h1>
      <p className="text-lg text-gray-600 max-w-xl mx-auto">
        Your profile is ready. We'll now show you personalized job
        recommendations with TrueScore ratings based on your skills and
        preferences.
      </p>
      <div className="bg-info-50 border border-info-200 rounded-lg p-4 text-left">
        <p className="text-sm text-info-900 font-medium mb-2">
          What happens next:
        </p>
        <ul className="list-disc list-inside text-sm text-info-800 space-y-1">
          <li>Browse jobs with personalized TrueScore ratings</li>
          <li>See which skills you're missing for top opportunities</li>
          <li>Track your applications in the pipeline manager</li>
          <li>Get insights about companies and hiring trends</li>
        </ul>
      </div>
    </div>
  );
}
