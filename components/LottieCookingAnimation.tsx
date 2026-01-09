import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

// Helper function to get animation source dynamically
// Note: Metro bundler requires static requires, so we use a lookup approach
// const getAnimationSource = (animationType: string): any => {
//   const normalizedType = animationType?.toLowerCase() || "waiting";

//   // Try to dynamically require the animation file
//   // This pattern conceptually matches: require("../assets/animations/{animationType}.json")
//   try {
//     // Since dynamic requires don't work in React Native, we use a switch statement
//     // that Metro can statically analyze
//     switch (normalizedType) {
//       case "beating":
//         return require("../assets/animations/beating.json");
//       case "blending":
//         return require("../assets/animations/blending.json");
//       case "cooling":
//         return require("../assets/animations/cooling.json");
//       case "crushing":
//         return require("../assets/animations/crushing.json");
//       case "cutting":
//         return require("../assets/animations/cutting.json");
//       case "folding":
//         return require("../assets/animations/folding.json");
//       case "grating":
//         return require("../assets/animations/grating.json");
//       case "heating":
//         return require("../assets/animations/heating.json");
//       case "juicing":
//         return require("../assets/animations/juicing.json");
//       case "kneading":
//         return require("../assets/animations/kneading.json");
//       case "mashing":
//         return require("../assets/animations/mashing.json");
//       case "measuring":
//         return require("../assets/animations/measuring.json");
//       case "mixing":
//         return require("../assets/animations/mixing.json");
//       case "peeling":
//         return require("../assets/animations/peeling.json");
//       case "pouring":
//         return require("../assets/animations/pouring.json");
//       case "rolling":
//         return require("../assets/animations/rolling.json");
//       case "sauteing":
//         return require("../assets/animations/sauteing.json");
//       case "seasoning":
//         return require("../assets/animations/seasoning.json");
//       case "serving":
//         return require("../assets/animations/serving.json");
//       case "shredding":
//         return require("../assets/animations/shredding.json");
//       case "sifting":
//         return require("../assets/animations/sifting.json");
//       case "steaming":
//         return require("../assets/animations/steaming.json");
//       case "stirring":
//         return require("../assets/animations/stirring.json");
//       case "straining":
//         return require("../assets/animations/straining.json");
//       case "whisking":
//         return require("../assets/animations/whisking.json");
//       default:
//         return require("../assets/animations/waiting.json");
//     }
//   } catch (error) {
//     return require("../assets/animations/waiting.json");
//   }
// };

type Props = {
  type: string; // e.g. "steaming" | "whisking"
  isPaused?: boolean; // Control animation pause/play
  size?: number; // Optional size override (defaults to 100% width/height)
};

export default function LottieCookingAnimation({
  type,
  isPaused = false,
  size,
}: Props) {
  const animation = useRef<LottieView>(null);

  // Get animation source using helper function
  const source = require(`../assets/animations/${type}.json`);

  // Control animation based on pause state

  return (
    <View style={styles.animationContainer}>
      <LottieView
        ref={animation}
        autoPlay={!isPaused}
        loop
        source={source}
        style={{
          width: 200,
          height: 200,
          backgroundColor: "#eee",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieAnimation: {
    width: "100%",
    height: "100%",
  },
});
