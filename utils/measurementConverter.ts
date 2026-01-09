// Measurement converter utility
// Converts between standard (US) and metric units

interface ConversionResult {
  value: number;
  unit: string;
  originalValue: number;
  originalUnit: string;
}

// Conversion factors
const CONVERSIONS: { [key: string]: { [key: string]: number } } = {
  // Volume conversions (cups, tablespoons, teaspoons to ml/liters)
  cup: { ml: 236.588, liter: 0.236588 },
  "cups": { ml: 236.588, liter: 0.236588 },
  tablespoon: { ml: 14.7868, liter: 0.0147868 },
  "tablespoons": { ml: 14.7868, liter: 0.0147868 },
  tbsp: { ml: 14.7868, liter: 0.0147868 },
  teaspoon: { ml: 4.92892, liter: 0.00492892 },
  "teaspoons": { ml: 4.92892, liter: 0.00492892 },
  tsp: { ml: 4.92892, liter: 0.00492892 },
  fluid_ounce: { ml: 29.5735, liter: 0.0295735 },
  "fluid ounces": { ml: 29.5735, liter: 0.0295735 },
  fl_oz: { ml: 29.5735, liter: 0.0295735 },
  pint: { ml: 473.176, liter: 0.473176 },
  "pints": { ml: 473.176, liter: 0.473176 },
  quart: { ml: 946.353, liter: 0.946353 },
  "quarts": { ml: 946.353, liter: 0.946353 },
  gallon: { ml: 3785.41, liter: 3.78541 },
  "gallons": { ml: 3785.41, liter: 3.78541 },
  
  // Weight conversions (pounds, ounces to grams/kilograms)
  pound: { gram: 453.592, kilogram: 0.453592 },
  "pounds": { gram: 453.592, kilogram: 0.453592 },
  lb: { gram: 453.592, kilogram: 0.453592 },
  ounce: { gram: 28.3495, kilogram: 0.0283495 },
  "ounces": { gram: 28.3495, kilogram: 0.0283495 },
  oz: { gram: 28.3495, kilogram: 0.0283495 },
  
  // Reverse conversions (metric to standard)
  ml: { cup: 0.00422675, tablespoon: 0.067628, teaspoon: 0.202884 },
  milliliter: { cup: 0.00422675, tablespoon: 0.067628, teaspoon: 0.202884 },
  "milliliters": { cup: 0.00422675, tablespoon: 0.067628, teaspoon: 0.202884 },
  liter: { cup: 4.22675, gallon: 0.264172, quart: 1.05669 },
  "liters": { cup: 4.22675, gallon: 0.264172, quart: 1.05669 },
  gram: { ounce: 0.035274, pound: 0.00220462 },
  "grams": { ounce: 0.035274, pound: 0.00220462 },
  kilogram: { pound: 2.20462, ounce: 35.274 },
  "kilograms": { pound: 2.20462, ounce: 35.274 },
  kg: { pound: 2.20462, ounce: 35.274 },
};

// Temperature conversions
export const convertTemperature = (
  value: number,
  fromUnit: "C" | "F",
  toUnit: "C" | "F"
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "F" && toUnit === "C") {
    return Math.round(((value - 32) * 5) / 9);
  }
  if (fromUnit === "C" && toUnit === "F") {
    return Math.round((value * 9) / 5 + 32);
  }
  return value;
};

// Convert measurement
export const convertMeasurement = (
  value: number,
  unit: string,
  toSystem: "standard" | "metric"
): ConversionResult | null => {
  const normalizedUnit = unit.toLowerCase().trim();
  
  // Check if already in target system
  const isStandard = ["cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons", 
                      "pound", "pounds", "lb", "ounce", "ounces", "oz", "fl_oz", "fluid ounce", "fluid ounces",
                      "pint", "pints", "quart", "quarts", "gallon", "gallons"].includes(normalizedUnit);
  const isMetric = ["ml", "milliliter", "milliliters", "liter", "liters", "gram", "grams", "kilogram", "kilograms", "kg"].includes(normalizedUnit);
  
  if (toSystem === "standard" && isStandard) return null; // Already standard
  if (toSystem === "metric" && isMetric) return null; // Already metric
  
  // Find conversion
  const conversions = CONVERSIONS[normalizedUnit];
  if (!conversions) return null;
  
  if (toSystem === "metric") {
    // Convert to metric
    if (normalizedUnit.includes("cup") || normalizedUnit.includes("tbsp") || normalizedUnit.includes("tsp") || 
        normalizedUnit.includes("fluid") || normalizedUnit.includes("pint") || normalizedUnit.includes("quart") || 
        normalizedUnit.includes("gallon")) {
      // Volume to ml
      const mlValue = value * (conversions.ml || 0);
      return {
        value: Math.round(mlValue * 10) / 10,
        unit: mlValue >= 1000 ? "liters" : "ml",
        originalValue: value,
        originalUnit: unit,
      };
    } else {
      // Weight to grams
      const gramValue = value * (conversions.gram || 0);
      return {
        value: Math.round(gramValue * 10) / 10,
        unit: gramValue >= 1000 ? "kg" : "grams",
        originalValue: value,
        originalUnit: unit,
      };
    }
  } else {
    // Convert to standard
    if (normalizedUnit.includes("ml") || normalizedUnit.includes("liter")) {
      // Volume to cups/tablespoons
      const cupValue = value * (conversions.cup || 0);
      if (cupValue >= 1) {
        return {
          value: Math.round(cupValue * 10) / 10,
          unit: "cups",
          originalValue: value,
          originalUnit: unit,
        };
      } else {
        const tbspValue = value * (conversions.tablespoon || 0);
        return {
          value: Math.round(tbspValue * 10) / 10,
          unit: tbspValue >= 1 ? "tablespoons" : "teaspoons",
          originalValue: value,
          originalUnit: unit,
        };
      }
    } else {
      // Weight to ounces/pounds
      const ozValue = value * (conversions.ounce || 0);
      if (ozValue >= 16) {
        return {
          value: Math.round((ozValue / 16) * 10) / 10,
          unit: "pounds",
          originalValue: value,
          originalUnit: unit,
        };
      } else {
        return {
          value: Math.round(ozValue * 10) / 10,
          unit: "ounces",
          originalValue: value,
          originalUnit: unit,
        };
      }
    }
  }
};

// Parse ingredient string and convert
export const convertIngredientMeasurement = (
  ingredient: string,
  toSystem: "standard" | "metric"
): string => {
  // Try to extract number and unit
  const match = ingredient.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/);
  if (!match) return ingredient;
  
  const valueStr = match[1];
  const unit = match[2];
  
  // Parse value (handle fractions)
  let value: number;
  if (valueStr.includes("/")) {
    const [num, den] = valueStr.split("/").map(Number);
    value = num / den;
  } else {
    value = parseFloat(valueStr);
  }
  
  const converted = convertMeasurement(value, unit, toSystem);
  if (!converted) return ingredient;
  
  // Replace in original string
  return ingredient.replace(
    match[0],
    `${converted.value} ${converted.unit}`
  );
};

