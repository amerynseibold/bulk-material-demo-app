export const pricingConfig = {
  materials: [
    // ========================================================
    // SAND
    // ========================================================

    {
      id: "mason-sand",
      name: "Mason Sand",
      category: "Sand",
      unit: "Cubic Yard",
      price: 52,
    },

    {
      id: "fill-sand",
      name: "Fill Sand",
      category: "Sand",
      unit: "Cubic Yard",
      price: 38,
    },

    {
      id: "concrete-sand",
      name: "Concrete Sand",
      category: "Sand",
      unit: "Cubic Yard",
      price: 58,
    },

    // ========================================================
    // ROCK & GRAVEL
    // ========================================================

    {
      id: "pea-gravel",
      name: "Pea Gravel",
      category: "Rock & Gravel",
      unit: "Cubic Yard",
      price: 65,
    },

    {
      id: "river-rock",
      name: "River Rock",
      category: "Rock & Gravel",
      unit: "Cubic Yard",
      price: 95,
    },

    {
      id: "crushed-limestone",
      name: "Crushed Limestone",
      category: "Rock & Gravel",
      unit: "Cubic Yard",
      price: 58,
    },

    {
      id: "decomposed-granite",
      name: "Decomposed Granite",
      category: "Rock & Gravel",
      unit: "Cubic Yard",
      price: 72,
    },

    // ========================================================
    // SOIL
    // ========================================================

    {
      id: "topsoil",
      name: "Topsoil",
      category: "Soil",
      unit: "Cubic Yard",
      price: 45,
    },

    {
      id: "sandy-loam",
      name: "Sandy Loam",
      category: "Soil",
      unit: "Cubic Yard",
      price: 48,
    },

    // ========================================================
    // OTHER MATERIALS
    // ========================================================

    {
      id: "mulch",
      name: "Mulch",
      category: "Other",
      unit: "Cubic Yard",
      price: 42,
    },

    {
      id: "flex-base",
      name: "Flex Base",
      category: "Other",
      unit: "Cubic Yard",
      price: 55,
    },

    {
      id: "asphalt-millings",
      name: "Asphalt Millings",
      category: "Other",
      unit: "Cubic Yard",
      price: 68,
    },
  ],

    deliveryTiers: [
      { maxMiles: 5, fee: 40 },
      { maxMiles: 10, fee: 60 },
      { maxMiles: 15, fee: 80 },
      { maxMiles: 20, fee: 100 },
      { maxMiles: 25, fee: 120 },
      { maxMiles: 30, fee: 140 },
      { maxMiles: 35, fee: 150 },
    ],

    maxDeliveryMiles: 35,

    outsideDeliveryMessage:
      "This address appears to be outside the standard 35-mile delivery area. Please call to confirm delivery availability.",

    taxRate: 0.0825,
}