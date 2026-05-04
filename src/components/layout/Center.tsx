import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Center = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-center", className)} {...props}>
    {children}
  </div>
);
