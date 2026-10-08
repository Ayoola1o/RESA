import { cn } from "@/lib/utils";

export default function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 140"
      className={cn("h-10 w-10", className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id="propHuntaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Hexagonal Trust Shield */}
      <polygon
        points="70,12 122,38 122,96 70,128 18,96 18,38"
        fill="url(#propHuntaGrad)"
        stroke="#60a5fa"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Modern House Roof & Chimney */}
      <path
        d="M40 70 L70 42 L100 70"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M86 46 V34 H94 V53"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Verified Checkmark inside House Base */}
      <circle cx="70" cy="85" r="16" fill="#10b981" />
      <path
        d="M62 85 L67 90 L78 79"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
