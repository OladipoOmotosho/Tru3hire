import { MapPin } from "lucide-react";
import { formatPostedTime } from "@/lib/utils";

interface JobCardHeaderProps {
  title: string;
  daysAgo: number;
  location: string;
}

export function JobCardHeader({
  title,
  daysAgo,
  location,
}: JobCardHeaderProps) {
  const postedLabel = formatPostedTime(daysAgo);

  return (
    <div className="flex flex-col gap-1">
      {/* Header: Title + Time */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
          {postedLabel}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{location}</span>
      </div>
    </div>
  );
}
