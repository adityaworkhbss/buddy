import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, orientation = "horizontal", ...props }, ref) => {
  const isVertical = orientation === "vertical";
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "relative flex touch-none select-none items-center",
        isVertical 
          ? "h-full w-6 flex-col justify-center" 
          : "w-full pt-5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track 
        className={cn(
          "relative overflow-hidden rounded-full bg-gray-50",
          isVertical
            ? "h-full w-2"
            : "h-2 w-full grow"
        )}
      >
        <SliderPrimitive.Range 
          className={cn(
            "absolute bg-pink-500",
            isVertical ? "w-full" : "h-full"
          )} 
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-pink-500 bg-pink-500 text-white ring-offset-background transition hover:bg-pink-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm" />
      {(props.value && Array.isArray(props.value) && props.value.length > 1) || (props.defaultValue && Array.isArray(props.defaultValue) && props.defaultValue.length > 1) ? (
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-pink-500 bg-pink-500 text-white ring-offset-background transition hover:bg-pink-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm" />
      ) : null}
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
