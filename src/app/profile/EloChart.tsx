"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";

interface EloPoint {
  match: number;
  elo: number;
  delta: number;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: EloPoint }[];
}) => {
  if (!active || !payload?.length) {
    return null;
  }
  const { elo, delta } = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-1.5 text-xs shadow-md">
      <span className="font-semibold tabular-nums">{elo} ELO</span>
      <span
        className={delta >= 0 ? "ml-2 text-green-400" : "ml-2 text-destructive"}
      >
        {delta > 0 ? `+${delta}` : delta}
      </span>
    </div>
  );
};

export const EloChart = ({ data }: { data: EloPoint[] }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "hsl(var(--border))" : "hsl(var(--border))";
  const textColor = isDark
    ? "hsl(var(--muted-foreground))"
    : "hsl(var(--muted-foreground))";

  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Play more matches to see your ELO history
      </div>
    );
  }

  const minElo = Math.min(...data.map((d) => d.elo));
  const maxElo = Math.max(...data.map((d) => d.elo));
  const padding = Math.max(50, Math.round((maxElo - minElo) * 0.2));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <XAxis
          dataKey="match"
          tick={{ fontSize: 11, fill: textColor }}
          tickLine={false}
          axisLine={false}
          label={undefined}
        />
        <YAxis
          domain={[minElo - padding, maxElo + padding]}
          tick={{ fontSize: 11, fill: textColor }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={1000} stroke={gridColor} strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="elo"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
