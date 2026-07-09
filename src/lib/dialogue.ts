// Pools of varied inspirational lines. A non-repeating picker keeps NPC
// dialogue and encouragements from feeling repetitive. Structured so the
// source can later be swapped for a live AI endpoint.

const rescueLines = [
  "Thank you, man of God! I am free at last!",
  "I was bound, but your prayers reached me!",
  "The chains are broken — glory to God!",
  "You came for me. I will never forget this.",
  "Hope has returned to my heart!",
  "I felt the darkness lift the moment you passed.",
  "Because of you, my family will hear the Good News.",
  "I was lost, and now I run beside you!",
  "The light found me in my deepest night.",
  "Your faith carried me out of the pit.",
  "I will tell my children of this day.",
  "Freedom! I can breathe again!",
  "You did not pass me by. Bless you, General.",
  "My burden is gone. I feel new.",
  "Heaven sent you to me today.",
];

const encouragements = [
  "Keep running — the finish line is glorious.",
  "Every soul you save shakes the kingdom of darkness.",
  "Your labour is not in vain.",
  "Grace is your strength today.",
  "Look ahead — greater things are coming.",
  "Faith moves you forward. Do not look back.",
  "The General presses on.",
  "One more step. One more soul.",
  "Heaven is cheering you on.",
  "Weeping endures for a night, but joy comes in the morning.",
];

const testimonies = [
  "A woman was healed the night he prayed.",
  "A village found Christ through one faithful visit.",
  "A prodigal son came home because he refused to give up.",
  "Prison doors opened where he preached hope.",
  "A dying church was revived under his hand.",
  "Children he mentored now lead thousands.",
  "Marriages were restored in his crusades.",
  "The hopeless found purpose in his words.",
];

const chapterFourTestimonies = [
  "Apostle Prince, thank you for answering your call — I saw JESUS because of you.",
  "Papa P, you have transformed my Christian life with your prayers.",
  "Apostle Prince, I am a preacher today because you preached to me.",
  "Papa P, you are a blessing to my family and city.",
  "Apostle Prince, you will do great and do mightily in every season.",
  "Papa P, because of your obedience, my household now worships Jesus.",
  "Apostle Prince, my ministry began the day you prayed for me.",
  "Papa P, the Lord used your faith to break the chains in my life.",
  "Apostle Prince, I saw hope return through your faithful witness.",
  "Papa P, every sermon you preached became the turning point for me.",
];

const chapterFiveTestimonies = [
  "A widow in Ghana was healed of terminal cancer and now leads a praise team in her village.",
  "A student in the USA walked out of a coma after doctors gave up, saying he had seen Jesus standing beside him.",
  "A mother in China watched her child recover from a deadly infection after the family prayed through the night.",
  "A family in the UK experienced sudden breakthrough when prayer turned their hospital death sentence into a testimony of life.",
  "A street revival in Israel drew crowds into the market as people said they saw Jesus moving among them.",
  "Believers in Iran reported the impossible: a citywide outbreak of praise after weeks of secret prayer.",
  "A teenager in Pakistan was declared free from HIV and now shares the Gospel with his whole community.",
  "A city in Mexico was flooded with worship after an altar call sparked a revival that spread from town to town.",
  "A church in Nigeria reopened after a revival wave toppled years of spiritual darkness.",
  "A young doctor in Canada gave God the glory for an academic breakthrough that saved her residency.",
  "A man in Egypt returned from death and testified that Jesus carried him back to life.",
  "A revival in Kenya reached every street corner as people encountered Christ while walking to the market.",
  "A pastor in Brazil saw his town transformed when revival broke out in the main square.",
  "A child in Japan was healed of paralysis, and the whole city declared the power of Jesus.",
  "A nurse in South Africa left her job to lead ministry after seeing God heal a patient the doctors said would die.",
  "A teacher in Australia watched a classroom full of students surrender to Christ after a miraculous demonstration of faith.",
];

const prophecies = [
  "Prince, you will be great in the kingdom of God.",
  "You are an evangelist to the nations—go forth with boldness.",
  "God will use you for mighty works that shake the heavens.",
  "You will save many souls and lead multitudes to the Cross.",
  "You are a General in the army of the Lord.",
  "You are a giant in the kingdom of God—unmovable and strong.",
  "Jesus will be seen through you and your ministry.",
  "Your name will be known for righteousness and power.",
  "The blind will see through your prayers.",
  "The deaf will hear the Gospel through your voice.",
  "Revival will follow wherever your feet tread.",
  "Multitudes will come to know the Father through you.",
  "Your legacy will impact generations yet unborn.",
  "You are chosen, anointed, and set apart for glory.",
  "The gates of hell will not prevail against your faith.",
];

const facts = [
  "Kingdom Impact grows with every life you touch.",
  "A General of God is measured by the souls he carries.",
  "True crowns are earned in faithfulness, not comfort.",
  "The harvest is plentiful; the workers are few.",
];

function makePicker(pool: string[]) {
  let bag: string[] = [];
  return () => {
    if (bag.length === 0) bag = [...pool].sort(() => Math.random() - 0.5);
    return bag.pop() as string;
  };
}

export const nextRescueLine = makePicker(rescueLines);
export const nextEncouragement = makePicker(encouragements);
export const nextTestimony = makePicker([...testimonies, ...facts]);
// For chapter 4 we want name-prefixed, non-repeating testimonies
export const nextChapterFourTestimony = makePicker(chapterFourTestimonies);
export const nextChapterFiveTestimony = makePicker(chapterFiveTestimonies);
export function chapterFourCagedTestimony() {
  return "THE CAGE IS DESTROYED. I AM FREE NOW.";
}
export const nextProphecy = makePicker(prophecies);

// ---- Live AI-generated lines ----
// Primed at the start of each chapter from the OpenAI-powered server function.
// When present, rescue callouts prefer these fresh lines so no two runs feel
// the same; they gracefully fall back to the curated pool.
let aiRescueBag: string[] = [];

export function primeAiLines(lines: string[]) {
  aiRescueBag = [...lines].filter(Boolean).sort(() => Math.random() - 0.5);
}

export function nextDynamicRescueLine(chapterId?: number): string {
  // Chapter 1 (His Birth) uses prophecies instead of testimonies
  if (chapterId === 1) {
    return nextProphecy();
  }
  if (chapterId === 4) {
    return nextChapterFourTestimony();
  }
  if (chapterId === 5) {
    return nextChapterFiveTestimony();
  }
  if (aiRescueBag.length > 0) return aiRescueBag.pop() as string;
  return nextRescueLine();
}
