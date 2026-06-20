import { Card } from "@/components/ui/card";

interface BasicInfoSectionProps {
  name: string;
  email: string;
  phone: string;
  location: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onLocationChange: (v: string) => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function BasicInfoSection({
  name,
  email,
  phone,
  location,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
}: BasicInfoSectionProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Basic Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="City, State/Country"
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </Card>
  );
}
