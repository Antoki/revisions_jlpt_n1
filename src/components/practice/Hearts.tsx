import { Heart } from "lucide-react";
import { MAX_HEARTS } from "@/lib/quiz";

export function Hearts({ remaining }: { remaining: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${remaining} of ${MAX_HEARTS} chances remaining`}
    >
      {Array.from({ length: MAX_HEARTS }, (_, index) => {
        const filled = index < remaining;
        return (
          <Heart
            key={index}
            className={`size-5 ${filled ? "text-accent" : "text-muted"}`}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 2}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
