export interface PricingInput {
  hoursMin: number;
  hoursMax: number;
  hourlyRateMinor: number;
  minimumChargeMinor: number;
  riskPercent: number;
  urgencyPercent: number;
}

export function calculateRecommendedCharge(input: PricingInput) {
  const {
    hoursMin,
    hoursMax,
    hourlyRateMinor,
    minimumChargeMinor,
    riskPercent,
    urgencyPercent,
  } = input;
  if (
    ![
      hoursMin,
      hoursMax,
      hourlyRateMinor,
      minimumChargeMinor,
      riskPercent,
      urgencyPercent,
    ].every(Number.isFinite) ||
    hoursMin < 0 ||
    hoursMax < hoursMin ||
    hoursMax > 10000 ||
    hourlyRateMinor <= 0 ||
    minimumChargeMinor < 0 ||
    riskPercent < 0 ||
    riskPercent > 100 ||
    urgencyPercent < 100 ||
    urgencyPercent > 300
  )
    throw new Error("Invalid pricing inputs.");
  const cents = (hours: number) =>
    Math.max(
      minimumChargeMinor,
      Math.round(
        (hours * hourlyRateMinor * (100 + riskPercent) * urgencyPercent) /
          10000,
      ),
    );
  return {
    minMinor: cents(hoursMin),
    maxMinor: cents(hoursMax),
    recommendedMinor: cents((hoursMin + hoursMax) / 2),
    ...input,
  };
}
