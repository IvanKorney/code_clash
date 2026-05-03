import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Column = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col", className)} {...props} />
);
