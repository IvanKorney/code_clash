import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Row = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-row", className)} {...props} />
);
