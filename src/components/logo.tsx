import { cn } from "@/lib/utils"

export default function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      className={cn("h-10 w-10", className)}
      {...props}
    >
      <g fill="currentColor">
        {/* House */}
        <path d="M60 5 L20 35 L20 80 L100 80 L100 35 Z" />
        {/* Door */}
        <path fill="var(--background, #fff)" d="M52 80 V60 H68 V80 H52 Z" />
        {/* Chimney */}
        <path d="M80 30 V15 H90 V30 Z" />

        {/* Side Connectors */}
        <circle cx="10" cy="40" r="5" />
        <circle cx="10" cy="75" r="5" />
        <rect x="8" y="40" width="4" height="35" />
        <circle cx="110" cy="40" r="5" />
        <circle cx="110" cy="75" r="5" />
        <rect x="108" y="40" width="4" height="35" />
      </g>
      
      <text x="60" y="110" fontFamily="sans-serif" fontSize="28" fontWeight="bold" textAnchor="middle" fill="currentColor">
        RESA
      </text>
    </svg>
  )
}
