// A StatsCard's "change" for a month against the last, from Go's growth
// numbers: "+12% vs last month", or what to say when last month had none.
export function monthOnMonth({
  current,
  previous,
  percentage,
}: {
  current: number;
  previous: number;
  percentage: number;
}) {
  if (previous === 0) {
    return {
      value: current > 0 ? "None last month" : "None this month",
      type: "neutral" as const,
    };
  }
  const rounded = Math.round(percentage);
  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}% vs last month`,
    type:
      rounded > 0
        ? ("increase" as const)
        : rounded < 0
          ? ("decrease" as const)
          : ("neutral" as const),
  };
}
