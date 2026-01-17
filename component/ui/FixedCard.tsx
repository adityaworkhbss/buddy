import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/component/ui/card";

interface FixedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind height classes for responsive sizes. Default provided. */
  heightClasses?: string;
}

const DEFAULT_HEIGHT = "h-[440px] sm:h-[520px] md:h-[560px] lg:h-[600px]";

export const FixedCard = React.forwardRef<HTMLDivElement, FixedCardProps>(
  ({ className, heightClasses = DEFAULT_HEIGHT, style, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn("flex flex-col", heightClasses, className)}
        style={style}
        {...props}
      />
    );
  }
);

FixedCard.displayName = "FixedCard";

export default FixedCard;
