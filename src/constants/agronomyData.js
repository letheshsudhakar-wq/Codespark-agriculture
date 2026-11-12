// Agronomic knowledge base, ICAR standards, crop data, and sample soil reports

export const CROPS = [
  { id: "paddy", name: "Paddy (Rice)", icon: "🌾", kannada: "ಭತ್ತ", hindi: "धान (चावल)", tamil: "நெல்" },
  { id: "wheat", name: "Wheat", icon: "🌱", kannada: "ಗೋಧಿ", hindi: "गेहूं", tamil: "கோதுமை" },
  { id: "sugarcane", name: "Sugarcane", icon: "🎋", kannada: "ಕಬ್ಬು", hindi: "गन्ना", tamil: "கரும்பு" },
  { id: "cotton", name: "Cotton", icon: "☁️", kannada: "ಹತ್ತಿ", hindi: "कपास", tamil: "பருத்தி" },
  { id: "maize", name: "Maize (Corn)", icon: "🌽", kannada: "ಮೆಕ್ಕೆಜೋಳ", hindi: "मक्का", tamil: "மக்காச்சோளம்" },
  { id: "groundnut", name: "Groundnut", icon: "🥜", kannada: "ಕಡಲೆಕಾಯಿ", hindi: "मूंगफली", tamil: "நிலக்கடலை" },
  { id: "tomato", name: "Tomato", icon: "🍅", kannada: "ಟೊಮೇಟೊ", hindi: "टमाटर", tamil: "தக்காளி" },
];

export const GROWTH_STAGES = [
  { id: "land_prep", name: "Land Preparation / Sowing", icon: "🚜", days: "Day 0 - 15" },
  { id: "vegetative", name: "Vegetative / Tillering", icon: "🌿", days: "Day 16 - 45" },
  { id: "flowering", name: "Panicle / Flowering", icon: "🌸", days: "Day 46 - 75" },
  { id: "maturity", name: "Grain Filling / Maturity", icon: "🌾", days: "Day 76 - 110" },
];

export const IRRIGATION_METHODS = [
  { id: "drip", name: "Drip Irrigation", efficiency: "90% water saving" },
  { id: "canal_flood", name: "Canal / Flood Irrigation", efficiency: "Traditional" },
  { id: "sprinkler", name: "Sprinkler Irrigation", efficiency: "70% water saving" },
  { id: "rainfed", name: "Rainfed (Monsoon Dependent)", efficiency: "Weather dependent" },
];

// Sample verified laboratory soil report (e.g., Mandya KVK Soil Health Card)
export const SAMPLE_LAB_REPORT = {
  hasReport: true,
  labName: "Krishi Vigyan Kendra (KVK) Soil Testing Laboratory, Mandya",
  reportNumber: "SHC-KA-MDY-2026-8842",
  testDate: "15 Oct 2026",
  fileName: "Mandya_KVK_Soil_Health_Card.pdf",
  fileSize: "1.2 MB",
  fileType: "application/pdf",
  verified: true,
  parameters: {
    ph: {
      name: "Soil pH (Acidity/Alkalinity)",
      value: 6.8,
      unit: "",
      status: "optimal",
      statusLabel: "Normal / Neutral",
      range: "6.5 - 7.5",
      min: 4.0,
      max: 9.5,
      description: "Ideal neutral pH. Maximizes nutrient availability and healthy root biology.",
      recommendation: "Maintain with compost. No lime or gypsum needed at this stage.",
    },
    nitrogen: {
      name: "Available Nitrogen (N)",
      value: 235,
      unit: "kg/ha",
      status: "medium",
      statusLabel: "Medium",
      range: "280 - 560 kg/ha is High",
      min: 100,
      max: 600,
      description: "Slightly below optimal for heavy vegetative growth. Responds well to split urea application.",
      recommendation: "Apply recommended split dose of neem-coated urea during tillering.",
    },
    phosphorus: {
      name: "Available Phosphorus (P₂O₅)",
      value: 19.5,
      unit: "kg/ha",
      status: "medium",
      statusLabel: "Medium",
      range: "23 - 56 kg/ha is High",
      min: 5,
      max: 70,
      description: "Adequate for early root establishment. Do not overdose DAP.",
      recommendation: "Apply single super phosphate (SSP) or balanced DAP at basal land prep.",
    },
    potassium: {
      name: "Available Potassium (K₂O)",
      value: 285,
      unit: "kg/ha",
      status: "optimal",
      statusLabel: "High / Sufficient",
      range: "140 - 280 kg/ha",
      min: 50,
      max: 450,
      description: "Strong potassium reserve supports drought resistance and pest protection.",
      recommendation: "Apply maintenance Muriate of Potash (MOP) during panicle initiation.",
    },
    organicCarbon: {
      name: "Organic Carbon (OC)",
      value: 0.54,
      unit: "%",
      status: "low",
      statusLabel: "Low to Moderate",
      range: "0.50% - 0.75% is Medium",
      min: 0.1,
      max: 1.5,
      description: "Lower organic carbon reduces moisture retention and beneficial soil microbes.",
      recommendation: "Add 3-5 tonnes/acre of well-decomposed Farmyard Manure (FYM) or green manure (Dhaincha/Sunn hemp).",
    },
    electricalConductivity: {
      name: "Electrical Conductivity (EC)",
      value: 0.42,
      unit: "dS/m",
      status: "optimal",
      statusLabel: "Normal (Non-saline)",
      range: "< 1.0 dS/m",
      min: 0,
      max: 3.0,
      description: "Low salinity. Soil will not hinder seedling germination.",
      recommendation: "Ensure good drainage to prevent salt accumulation from canal water.",
    },
    zinc: {
      name: "Available Zinc (Zn)",
      value: 0.72,
      unit: "ppm",
      status: "low",
      statusLabel: "Deficient (< 0.8 ppm)",
      range: "> 0.8 ppm",
      min: 0.2,
      max: 2.5,
      description: "Zinc deficiency can cause Khaira disease (rusty brown spots on lower leaves).",
      recommendation: "Soil application of 10 kg/acre Zinc Sulphate (ZnSO₄ 21%) or foliar spray at tillering.",
    }
  }
};

// Crop specific fertilizer advice tables calibrated to ICAR standards
export const FERTILIZER_SCHEDULES = {
  paddy: {
    cropName: "Paddy (Rice)",
    standardRecommendation: "100:50:50 kg N:P₂O₅:K₂O per hectare",
    schedule: [
      {
        stageId: "land_prep",
        stageName: "Basal (At Final Puddling/Transplanting)",
        timing: "Day 0 - 2",
        fertilizers: [
          { name: "DAP (Diammonium Phosphate)", dosePerAcre: 45, unit: "kg/acre", bagEquivalent: "1 bag (50kg)" },
          { name: "MOP (Muriate of Potash)", dosePerAcre: 15, unit: "kg/acre", bagEquivalent: "~0.3 bag" },
          { name: "Zinc Sulphate (21%)", dosePerAcre: 10, unit: "kg/acre", bagEquivalent: "10 kg pack" },
        ],
        precautions: "Drain excess standing water before broadcasting; incorporate into top 5 cm soil.",
        source: "ICAR-National Rice Research Institute (NRRI) & TNAU Agronomy Guide",
      },
      {
        stageId: "vegetative",
        stageName: "First Top Dressing (Active Tillering)",
        timing: "Day 20 - 25 after transplanting",
        isCurrent: true,
        fertilizers: [
          { name: "Neem Coated Urea", dosePerAcre: 35, unit: "kg/acre", bagEquivalent: "~0.8 bag (45kg)" },
        ],
        precautions: "Apply when thin film of water (1-2 cm) is present. Avoid application if heavy rain is forecasted within 24 hours.",
        source: "State Agricultural University Package of Practices (Paddy 2026)",
      },
      {
        stageId: "flowering",
        stageName: "Second Top Dressing (Panicle Initiation)",
        timing: "Day 45 - 50",
        fertilizers: [
          { name: "Neem Coated Urea", dosePerAcre: 25, unit: "kg/acre", bagEquivalent: "~0.5 bag" },
          { name: "MOP (Muriate of Potash)", dosePerAcre: 15, unit: "kg/acre", bagEquivalent: "~0.3 bag" },
        ],
        precautions: "Potash at this stage hardens the stem and promotes grain weight.",
        source: "ICAR Crop Production Guide",
      },
      {
        stageId: "maturity",
        stageName: "Grain Filling & Hardening",
        timing: "Day 75+",
        fertilizers: [
          { name: "No nitrogen fertilizer", dosePerAcre: 0, unit: "kg", bagEquivalent: "Stop application" },
          { name: "Optional: 1% 13-0-45 foliar spray", dosePerAcre: 1, unit: "kg/acre", bagEquivalent: "Foliar mist" }
        ],
        precautions: "Stop chemical fertilizers to avoid grain discoloration and lodged crops.",
        source: "Directorate of Rice Development, Govt of India",
      }
    ],
    costEstimates: [
      { item: "Neem Coated Urea (45kg bag)", subsidizedMRP: 266, qtyNeeded: "1.5 bags / acre", totalPerAcre: 400 },
      { item: "DAP (50kg bag)", subsidizedMRP: 1350, qtyNeeded: "1 bag / acre", totalPerAcre: 1350 },
      { item: "MOP (50kg bag)", subsidizedMRP: 1700, qtyNeeded: "0.6 bag / acre", totalPerAcre: 1020 },
      { item: "Zinc Sulphate (10kg)", subsidizedMRP: 450, qtyNeeded: "1 pack / acre", totalPerAcre: 450 },
    ]
  },
  sugarcane: {
    cropName: "Sugarcane",
    standardRecommendation: "250:100:125 kg N:P₂O₅:K₂O per hectare",
    schedule: [
      {
        stageId: "land_prep",
        stageName: "Basal (At Planting)",
        timing: "Day 0",
        fertilizers: [
          { name: "DAP", dosePerAcre: 60, unit: "kg/acre", bagEquivalent: "1.2 bags" },
          { name: "MOP", dosePerAcre: 25, unit: "kg/acre", bagEquivalent: "0.5 bag" },
        ],
        precautions: "Place in furrows below cane setts.",
        source: "ICAR-Indian Institute of Sugarcane Research (IISR)",
      },
      {
        stageId: "vegetative",
        stageName: "Formative / Tillering Stage",
        timing: "Day 30 - 60",
        isCurrent: true,
        fertilizers: [
          { name: "Neem Coated Urea", dosePerAcre: 50, unit: "kg/acre", bagEquivalent: "1.1 bags" },
        ],
        precautions: "Earth up after application to prevent volatilization.",
        source: "Sugarcane Breeding Institute (SBI) Coimbatore",
      }
    ],
    costEstimates: [
      { item: "Urea", subsidizedMRP: 266, qtyNeeded: "3 bags / acre", totalPerAcre: 798 },
      { item: "DAP", subsidizedMRP: 1350, qtyNeeded: "1.2 bags / acre", totalPerAcre: 1620 },
      { item: "MOP", subsidizedMRP: 1700, qtyNeeded: "1 bag / acre", totalPerAcre: 1700 },
    ]
  },
  wheat: {
    cropName: "Wheat",
    standardRecommendation: "120:60:40 kg N:P₂O₅:K₂O per hectare",
    schedule: [
      {
        stageId: "land_prep",
        stageName: "Basal Dose (Sowing)",
        timing: "Day 0",
        fertilizers: [
          { name: "DAP", dosePerAcre: 55, unit: "kg/acre", bagEquivalent: "1.1 bags" },
          { name: "MOP", dosePerAcre: 20, unit: "kg/acre", bagEquivalent: "0.4 bag" },
        ],
        precautions: "Drill with seed-cum-fertilizer drill at 5 cm depth.",
        source: "ICAR-Indian Institute of Wheat & Barley Research (IIWBR)",
      },
      {
        stageId: "vegetative",
        stageName: "First Irrigation (CRI Stage)",
        timing: "Day 21 - 25",
        isCurrent: true,
        fertilizers: [
          { name: "Neem Coated Urea", dosePerAcre: 40, unit: "kg/acre", bagEquivalent: "~0.9 bag" },
        ],
        precautions: "Apply just before or immediately after first irrigation.",
        source: "Punjab Agricultural University (PAU) / ICAR",
      }
    ],
    costEstimates: [
      { item: "Urea", subsidizedMRP: 266, qtyNeeded: "2 bags / acre", totalPerAcre: 532 },
      { item: "DAP", subsidizedMRP: 1350, qtyNeeded: "1.1 bags / acre", totalPerAcre: 1485 },
      { item: "MOP", subsidizedMRP: 1700, qtyNeeded: "0.4 bag / acre", totalPerAcre: 680 },
    ]
  }
};

// Pre-calibrated demo Q&A for Chatbot Screen
export const DEMO_CHAT_QA = [
  {
    triggers: ["yellow", "leaf yellowing", "leaves", "हल्दी", "हಳದಿ", "மஞ்சள்"],
    question: "Why are my leaves turning yellow?",
    answer: "Leaf yellowing (chlorosis) in your crop typically points to one of three common causes:\n\n1. **Nitrogen Deficiency:** Lower/older leaves turn uniform pale yellow starting from the leaf tip inwards in a 'V' shape.\n2. **Zinc Deficiency:** Middle and younger leaves develop rusty brown blotches or yellow streaks along the midrib.\n3. **Waterlogging / Oxygen Stress:** If field was submerged for several days, roots cannot breathe and temporarily stop taking up nutrients.\n\n**Action Step:** Inspect whether yellowing started on older or younger leaves. If soil is wet, drain excess water. If older leaves, top-dress with 20 kg/acre Urea under moist conditions.",
    sources: ["ICAR-NRRI Diagnostic Key", "Soil Health Management Bulletin 2026"]
  },
  {
    triggers: ["fertilizer", "which fertilizer", "उर्वरक", "ಗೊಬ್ಬರ", "உரம்"],
    question: "Which fertilizer should I use right now?",
    answer: "The right fertilizer depends on your current crop stage:\n\n- **Land Preparation:** DAP (Phosphorus for root establishment) + MOP (Potash for resilience).\n- **Active Tillering / Vegetative:** Top-dress with **Neem-Coated Urea** in 2 split doses. Avoid putting all nitrogen at once as 40% can leach away into groundwater.\n- **Panicle / Flowering:** Balanced Potassium (MOP) to increase grain filling weight.\n\nCheck your customized schedule on the **Fertilizer Advisor** screen for exact per-acre quantities.",
    sources: ["ICAR Package of Practices", "National Fertilizer Development Center"]
  },
  {
    triggers: ["organic carbon", "carbon", "जैविक कार्बन", "ಸಾವಯವ ಇಂಗಾಲ", "அங்ககக் கரிமம்"],
    question: "What is organic carbon and how can I increase it?",
    answer: "Soil Organic Carbon (SOC) is the life of your soil! It represents decomposed plant and animal matter that feeds soil microbes, holds soil water like a sponge, and makes chemical fertilizers 30% more efficient.\n\n**To Increase Soil Organic Carbon:**\n1. Apply 4-5 tonnes/acre of well-rotted Farmyard Manure (FYM) or 2 tonnes of vermicompost before sowing.\n2. Practice green manuring with **Dhaincha (Sesbania)** or **Sunn hemp** and plow it back into the soil after 45 days.\n3. Avoid burning crop stubble (paddy straw/cane trash); instead, chop and mulch it into the soil with a rotavator.",
    sources: ["ICAR-Indian Institute of Soil Science (IISS), Bhopal", "Soil Health Card Scheme"]
  },
  {
    triggers: ["soil test", "testing", "मिट्टी जांच", "ಮಣ್ಣು ಪರೀಕ್ಷೆ", "மண் பரிசோதனை"],
    question: "Why is soil testing important and how do I do it?",
    answer: "Without a soil test, applying fertilizer is like taking medicine without a doctor's prescription! Studies show Indian farmers spend up to ₹1,800/acre extra on unnecessary DAP or Urea.\n\n**How to Test:**\n- Collect 8-10 'V'-shaped soil cuts (15 cm depth) across your field.\n- Mix, quarter, and retain 500 grams.\n- Submit it to your local **Krishi Vigyan Kendra (KVK)** or **Raitha Samparka Kendra**. Government fee is typically only ₹20 to ₹50 per sample under the Soil Health Card Scheme.",
    sources: ["Ministry of Agriculture & Farmers Welfare", "Soil Health Card Guidelines"]
  },
  {
    triggers: ["rain", "weather", "barish", "ಮಳೆ", "மழை"],
    question: "Will rain affect my fertilizer application?",
    answer: "Yes, significantly! Never broadcast Urea or DAP if heavy rains are predicted within 24 to 48 hours.\n\n- **Heavy Rain Risk:** Nitrogen fertilizers dissolve rapidly. Heavy surface runoff will wash the expensive fertilizer straight into irrigation ditches.\n- **Ideal Condition:** Apply fertilizer when the soil has healthy moisture ('vapsa' condition) and light cloud cover, but no heavy downpours forecasted.\n\nCheck our weather status card on the main dashboard before purchasing or applying inputs.",
    sources: ["IMD Agromet Advisory Service", "TNAU Weather & Crop Guide"]
  }
];

// Initial default farm reminders / activities
export const INITIAL_REMINDERS = [
  {
    id: "act-1",
    title: "Apply second split of Neem-Coated Urea",
    subtitle: "35 kg/acre during active tillering stage. Ensure moist soil.",
    category: "Nutrient",
    dueDate: "Today",
    completed: false,
    priority: "high"
  },
  {
    id: "act-2",
    title: "Inspect leaf undersides for brown planthopper",
    subtitle: "Check 10 hills randomly near water channels for nymph clusters.",
    category: "Pest Check",
    dueDate: "Tomorrow",
    completed: false,
    priority: "medium"
  },
  {
    id: "act-3",
    title: "Maintain shallow 2-3 cm standing water",
    subtitle: "Do not let soil crack during active tillering phase.",
    category: "Irrigation",
    dueDate: "In 2 days",
    completed: false,
    priority: "medium"
  },
  {
    id: "act-4",
    title: "Plan composite soil testing after harvest",
    subtitle: "Collect composite soil sample from field plots A & B.",
    category: "Soil Health",
    dueDate: "Next week",
    completed: true,
    priority: "low"
  }
];

// Historical soil reports for Screen 11 comparison
export const HISTORICAL_REPORTS = [
  {
    id: "rep-2026",
    title: "KVK Mandya - Post Rabi 2026",
    date: "15 Oct 2026",
    status: "Verified",
    ph: 6.8,
    nitrogen: 235,
    phosphorus: 19.5,
    potassium: 285,
    organicCarbon: 0.54,
    ec: 0.42,
    zinc: 0.72,
    lab: "KVK Mandya Soil Testing Lab",
    notes: "Report uploaded via AGRIWISE"
  },
  {
    id: "rep-2025",
    title: "Govt Soil Health Card - Kharif 2025",
    date: "10 Jun 2025",
    status: "Verified",
    ph: 6.4,
    nitrogen: 210,
    phosphorus: 16.0,
    potassium: 270,
    organicCarbon: 0.46,
    ec: 0.38,
    zinc: 0.65,
    lab: "Dept. of Agriculture, Karnataka",
    notes: "Baseline report before FYM application"
  }
];

export const HISTORICAL_FERTILIZERS = [
  { id: "fert-1", date: "02 Nov 2026", crop: "Paddy", item: "Neem Coated Urea", quantity: "70 kg (2 bags)", stage: "Active Tillering" },
  { id: "fert-2", date: "16 Oct 2026", crop: "Paddy", item: "DAP + MOP", quantity: "100 kg DAP + 30 kg MOP", stage: "Basal Transplanting" },
  { id: "fert-3", date: "05 Oct 2026", crop: "Paddy", item: "Well-decomposed FYM (Cow Dung)", quantity: "3 Tractor Trollies (~6 tonnes)", stage: "Land Preparation" },
];

