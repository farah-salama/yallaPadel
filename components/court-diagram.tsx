import { cn } from "@/lib/utils";

export function CourtDiagram({
  accent = false,
  occupied = false,
  className,
}: {
  accent?: boolean;
  occupied?: boolean;
  className?: string;
}) {
  const stroke = occupied ? "#89938D" : accent ? "#C8FF00" : "rgba(200,255,0,0.45)";
  return (
    <svg viewBox="0 0 200 120" className={cn("w-full", className)} fill="none">
      <rect x="8" y="8" width="184" height="104" rx="4" stroke={stroke} strokeWidth="1.4" />
      <rect x="14" y="14" width="172" height="92" rx="2" stroke={stroke} strokeOpacity="0.4" />
      <line x1="100" y1="14" x2="100" y2="106" stroke={stroke} strokeWidth="1" />
      <rect x="86" y="48" width="28" height="24" stroke={stroke} strokeWidth="1" />
      <line x1="14" y1="60" x2="86" y2="60" stroke={stroke} strokeOpacity="0.35" />
      <line x1="114" y1="60" x2="186" y2="60" stroke={stroke} strokeOpacity="0.35" />
      <circle cx="40" cy="36" r="3" fill={occupied ? "#FFB84D" : "#C8FF00"} className={accent ? "pulse" : ""} />
      <circle cx="40" cy="84" r="3" fill={occupied ? "#FFB84D" : "#C8FF00"} opacity="0.7" />
      <circle cx="160" cy="36" r="3" fill={occupied ? "#89938D" : "#00D6A3"} opacity="0.8" />
      <circle cx="160" cy="84" r="3" fill={occupied ? "#89938D" : "#00D6A3"} opacity="0.6" />
    </svg>
  );
}
