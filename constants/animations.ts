// Animation lookup table - maps animation names to their JSON files
// Must be at module level for Metro bundler to statically analyze and bundle them

export const animations: Record<string, any> = {
  beating: require("../assets/animations/beating.json"),
  blending: require("../assets/animations/blending.json"),
  cooling: require("../assets/animations/cooling.json"),
  crushing: require("../assets/animations/crushing.json"),
  cutting: require("../assets/animations/cutting.json"),
  folding: require("../assets/animations/folding.json"),
  grating: require("../assets/animations/grating.json"),
  heating: require("../assets/animations/heating.json"),
  juicing: require("../assets/animations/juicing.json"),
  kneading: require("../assets/animations/kneading.json"),
  mashing: require("../assets/animations/mashing.json"),
  measuring: require("../assets/animations/measuring.json"),
  mixing: require("../assets/animations/mixing.json"),
  peeling: require("../assets/animations/peeling.json"),
  pouring: require("../assets/animations/pouring.json"),
  rolling: require("../assets/animations/rolling.json"),
  sauteing: require("../assets/animations/sauteing.json"),
  seasoning: require("../assets/animations/seasoning.json"),
  serving: require("../assets/animations/serving.json"),
  shredding: require("../assets/animations/shredding.json"),
  sifting: require("../assets/animations/sifting.json"),
  steaming: require("../assets/animations/steaming.json"),
  stirring: require("../assets/animations/stirring.json"),
  straining: require("../assets/animations/straining.json"),
  waiting: require("../assets/animations/waiting.json"),
  whisking: require("../assets/animations/whisking.json"),
};

