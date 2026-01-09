const data = [
  {
    action: "Preheat the oven to 400 degrees F (200 degrees C).",
    ingredients: [],
    equipment: ["oven"],
    temperature: 400,
    temperatureUnit: "F",
    animationType: "heating",
  },
  {
    action: "Peel the butternut squash using a sharp vegetable peeler.",
    ingredients: [[Object]],
    equipment: ["sharp vegetable peeler"],
    animationType: "peeling",
  },
  {
    action: "Cut the peeled butternut squash in half lengthwise.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action: "Scoop out and discard the seeds from the butternut squash halves.",
    ingredients: [[Object]],
    equipment: ["spoon"],
    animationType: "cutting",
  },
  {
    action: "Cut the butternut squash halves into 1-inch slices.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action: "Cut the 1-inch slices of butternut squash into 1-inch cubes.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action:
      "Combine the butternut squash cubes, olive oil, and minced garlic in a large bowl.",
    ingredients: [[Object], [Object], [Object]],
    equipment: ["large bowl"],
    animationType: "mixing",
  },
  {
    action:
      "Toss the ingredients until the butternut squash cubes are well coated with oil and garlic.",
    ingredients: [],
    equipment: ["large bowl"],
    animationType: "mixing",
    notes: "Ensure an even coating for uniform roasting.",
  },
  {
    action:
      "Season the coated butternut squash with salt and ground black pepper to taste.",
    ingredients: [[Object], [Object]],
    animationType: "seasoning",
  },
  {
    action:
      "Arrange the seasoned butternut squash in a single layer on a baking sheet.",
    ingredients: [[Object]],
    equipment: ["baking sheet"],
    animationType: "serving",
  },
  {
    action: "Roast the butternut squash in the preheated oven.",
    duration: 25,
    durationUnit: "minutes",
    ingredients: [[Object]],
    equipment: ["oven", "baking sheet"],
    temperature: 400,
    temperatureUnit: "F",
    animationType: "heating",
    notes:
      "Roast for 25 to 35 minutes, until the squash is lightly browned and tender when pierced with a fork.",
  },
];

[
  {
    action: "Preheat the oven to 400 degrees F (200 degrees C).",
    equipment: ["oven"],
    temperature: 400,
    temperatureUnit: "F",
    animationType: "heating",
    notes:
      "Preheating ensures even cooking and optimal browning of the squash.",
  },
  {
    action: "Peel the butternut squash using a sharp vegetable peeler.",
    ingredients: [[Object]],
    equipment: ["sharp vegetable peeler"],
    animationType: "peeling",
  },
  {
    action: "Cut the peeled butternut squash in half lengthwise.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action: "Scoop out and discard the seeds from the butternut squash halves.",
    ingredients: [[Object]],
    equipment: ["spoon"],
    animationType: "cutting",
    notes:
      "A spoon or ice cream scoop works well for removing the fibrous insides and seeds.",
  },
  {
    action: "Cut the butternut squash halves into 1-inch thick slices.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action: "Cut the 1-inch slices into 1-inch cubes.",
    ingredients: [[Object]],
    equipment: ["knife", "cutting board"],
    animationType: "cutting",
  },
  {
    action:
      "In a large bowl, combine the butternut squash cubes, olive oil, and minced garlic.",
    ingredients: [[Object], [Object], [Object]],
    equipment: ["large bowl"],
    animationType: "mixing",
  },
  {
    action:
      "Toss the ingredients until the butternut squash cubes are well coated.",
    ingredients: [[Object], [Object], [Object]],
    animationType: "stirring",
    notes: "Ensure all squash pieces are coated for even cooking and flavor.",
  },
  {
    action:
      "Season the coated butternut squash with salt and ground black pepper to taste.",
    ingredients: [[Object], [Object]],
    animationType: "seasoning",
  },
  {
    action:
      "Arrange the seasoned butternut squash cubes in a single layer on a baking sheet.",
    ingredients: [[Object]],
    equipment: ["baking sheet"],
    animationType: "serving",
    notes:
      "Avoid overcrowding the baking sheet to allow the squash to roast rather than steam.",
  },
  {
    action: "Roast the butternut squash in the preheated oven for 25 minutes.",
    duration: 25,
    durationUnit: "minutes",
    ingredients: [[Object]],
    equipment: ["oven"],
    animationType: "heating",
    notes:
      "Continue roasting for up to 35 minutes, or until the squash is lightly browned and tender when pierced with a fork.",
  },
];
