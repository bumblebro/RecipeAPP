/**
 * Formats a numeric quantity into a mixed fraction string for display.
 * e.g. 0.5 -> "1/2"
 *      1.5 -> "1 1/2"
 *      1.33 -> "1 1/3"
 *      2 -> "2"
 */
export function formatQuantity(num: number | undefined | null): string | number {
  if (num === null || num === undefined) return "";
  
  // Return early if not a number
  if (typeof num !== 'number') return num;

  // Handle integers
  if (Number.isInteger(num)) return num;

  const whole = Math.floor(num);
  const decimal = num - whole;
  
  // Tolerance for float comparison
  const tolerance = 0.01;

  // Common fraction mapping
  const fractions: { [key: number]: string } = {
    0.125: "1/8",
    0.25: "1/4",
    0.33: "1/3",
    0.333: "1/3",
    0.5: "1/2",
    0.66: "2/3",
    0.666: "2/3",
    0.75: "3/4",
    0.875: "7/8"
  };

  // Find closest fraction
  let fractionString = "";
  let minDiff = tolerance;

  for (const [val, str] of Object.entries(fractions)) {
    const diff = Math.abs(decimal - parseFloat(val));
    if (diff < minDiff) {
      minDiff = diff;
      fractionString = str;
    }
  }

  // If match found
  if (fractionString) {
    return whole > 0 ? `${whole} ${fractionString}` : fractionString;
  }

  // If no common fraction found, round to 1 decimal place if simple, otherwise 2
  // Or just return the number as is if we want to support exact metrics
  // For cooking, usually 1 decimal is fine (e.g. 1.2 kg)
  const rounded = Math.round(num * 100) / 100;
  return rounded;
}
