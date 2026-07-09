export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  verse: string;
  verseRef: string;
  narration: string[]; // spoken lines
  mission: string;
  crown: string; // reward crown label
  crownIcon: string;
  // visual theme for the 3D world
  skyTop: string;
  skyBottom: string;
  fog: string;
  ground: string;
  accent: string;
  fogNear: number;
  fogFar: number;
  speed: number; // base run speed
  hasCompanion?: boolean;
  isFinal?: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "His Birth",
    subtitle: "Chapter One",
    verse:
      "Before I formed you in the womb I knew you, before you were born I set you apart.",
    verseRef: "Jeremiah 1:5",
    narration: [
      "In a peaceful African village, as the sun rose over the hills, a child was born.",
      "But before his first breath, before his first cry, Heaven had already written his name.",
      "God destined him for greatness, and a glowing star shone over the child.",
      "The journey of a General begins.",
    ],
    mission: "Rescue the trapped children. Collect Hope Stars. Avoid the darkness.",
    crown: "Bronze Crown",
    crownIcon: "🥉",
    skyTop: "#f6c98a",
    skyBottom: "#7a4a2c",
    fog: "#e9b57a",
    ground: "#6b4a2a",
    accent: "#ffd27a",
    fogNear: 14,
    fogFar: 55,
    speed: 12,
  },
  {
    id: 2,
    title: "A Call From Heaven",
    subtitle: "Chapter Two",
    verse: "Then I heard the voice of the Lord saying, 'Whom shall I send?' And I said, 'Here am I. Send me!'",
    verseRef: "Isaiah 6:8",
    narration: [
      "The heavens opened, and golden light poured over the mountain.",
      "In the stillness, he heard the voice of God calling his name.",
      "The road ahead grew dangerous — storms, chains, and dark valleys.",
      "Yet he answered: Here I am. Send me.",
    ],
    mission: "Free the prisoners in chains. Endure the storms. Press onward.",
    crown: "Silver Crown",
    crownIcon: "🥈",
    skyTop: "#8fb4d6",
    skyBottom: "#2c3e57",
    fog: "#5c7391",
    ground: "#3a4658",
    accent: "#cfe3ff",
    fogNear: 12,
    fogFar: 48,
    speed: 14,
  },
  {
    id: 3,
    title: "The Face of Persecution",
    subtitle: "Chapter Three",
    verse: "Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.",
    verseRef: "Matthew 5:10",
    narration: [
      "The seasons of ministry grew difficult. People rejected him. Opposition rose.",
      "Dark forces sought to stop his progress at every turn.",
      "Still, he would not turn back — for the persecuted needed rescue.",
      "Through the fire, his faith only burned brighter.",
    ],
    mission: "Rescue persecuted believers. Dodge the attacks. Never stop running.",
    crown: "Golden Crown",
    crownIcon: "👑",
    skyTop: "#b05a3c",
    skyBottom: "#2a1414",
    fog: "#7a3324",
    ground: "#3a1e18",
    accent: "#ff8a5c",
    fogNear: 10,
    fogFar: 42,
    speed: 16,
  },
  {
    id: 4,
    title: "He Raised Men",
    subtitle: "Chapter Four",
    verse: "And the things you have heard me say entrust to reliable people who will also be qualified to teach others.",
    verseRef: "2 Timothy 2:2",
    narration: [
      "God used him to raise leaders and shape a generation of faithful men and women.",
      "As he ran, the rescued began to follow — his disciples, his spiritual sons.",
      "And Heaven sent a gift: a treasure marked 'A Gift From God.'",
      "Within it — his beloved, who would strengthen and walk beside him.",
    ],
    mission:
      "Gather your followers. Open the Gift From God to welcome Mama Beatrice, then finish strong.",
    crown: "Royal Crown",
    crownIcon: "👑",
    skyTop: "#ffe0a3",
    skyBottom: "#4a6b3a",
    fog: "#cfd98a",
    ground: "#4c6b34",
    accent: "#fff0b0",
    fogNear: 16,
    fogFar: 60,
    speed: 15,
    hasCompanion: true,
  },
  {
    id: 5,
    title: "A Glorified General",
    subtitle: "Chapter Five",
    verse: "I have fought the good fight, I have finished the race, I have kept the faith.",
    verseRef: "2 Timothy 4:7",
    narration: [
      "Golden skies. Angelic trumpets. The atmosphere itself seemed to worship.",
      "With wisdom and grace gathered through the journey, he faced his greatest trial.",
      "Then angels sent by God appeared, guiding him along the final path.",
      "Ahead stood a magnificent gate, and upon it a single word: PROMISE.",
    ],
    mission: "Overcome the final trial. Reach the Promise gate. Cross into glory.",
    crown: "Crown of Glory",
    crownIcon: "✨",
    skyTop: "#fff4cf",
    skyBottom: "#d9b46a",
    fog: "#ffe9b0",
    ground: "#caa860",
    accent: "#fffbe6",
    fogNear: 18,
    fogFar: 70,
    speed: 18,
    isFinal: true,
  },
];

export const COLLECTIBLE_NAMES = [
  "Soul",
  "Crown",
  "Scroll",
  "Bible",
  "Prayer Flame",
  "Faith Gem",
  "Grace Token",
];
