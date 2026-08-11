// Star Shard — duet/compatibility + misc content
export const ELEMENTS = ['fire', 'earth', 'air', 'water'];
export const ELEMENT_PAIRS = {
  'fire-fire': ['twin flames', 'two fire suns! you hype each other into the stratosphere. just decide whose turn it is to hold the aux cord.'],
  'earth-earth': ['garden neighbors', 'two earth suns: you build slow, cozy, permanent things together. your friendship has load-bearing walls.'],
  'air-air': ['group chat soulmates', 'two air suns: the conversation literally never ends, it just changes apps.'],
  'water-water': ['tide pool twins', 'two water suns: you feel each other\'s weather before either of you says a word.'],
  'fire-air': ['bellows & spark', 'fire and air suns feed each other: one of you starts the idea, the other makes it enormous.'],
  'earth-water': ['river & valley', 'earth and water suns shape each other gently: one gives form, one gives feeling. classic duo.'],
  'fire-water': ['steam engine', 'fire and water suns make steam: dramatic, powerful, occasionally whistling. never boring.'],
  'fire-earth': ['kiln friends', 'fire and earth suns: one brings heat, one brings clay. together you make things that last.'],
  'air-water': ['mist & breeze', 'air and water suns make mist: dreamy, atmospheric, slightly confusing to outsiders. it works.'],
  'air-earth': ['kite & anchor', 'air and earth suns: one flies, one holds the string. you keep each other possible.']
};
export const SIGN_ELEMENT = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; // index into ELEMENTS by sign
export function duetScore(chartA, chartB) {
  const d = a => { const x = Math.abs(a % 360); return Math.min(x, 360 - x); };
  const sunGap = d(chartA.sunLon - chartB.sunLon), moonGap = d(chartA.moonLon - chartB.moonLon);
  const near = (g, t) => Math.max(0, 1 - Math.abs(g - t) / 30);
  const harm = g => Math.max(near(g, 0), near(g, 60), near(g, 120), near(g, 180) * 0.7, near(g, 90) * 0.5);
  return Math.round(68 + 30 * (harm(sunGap) * 0.5 + harm(moonGap) * 0.5));
}
// Duet-reading building blocks (see reading.js duetReading).
export const DUET_OPENERS = [
  (a, b, pairTitle) => `${a} × ${b}: the sky filed you two under "${pairTitle}."`,
  (a, b, pairTitle) => `${a} and ${b}, cross-referenced: the charts call this pairing "${pairTitle}."`,
  (a, b, pairTitle) => `run ${a} against ${b} and the old star-math spits out "${pairTitle}."`,
  (a, b, pairTitle) => `${a} meets ${b}: two charts, one verdict from the sky: "${pairTitle}."`,
  (a, b, pairTitle) => `the compatibility engine looked at ${a} and ${b} and said "${pairTitle}."`,
];

export const DUET_CLOSERS = [
  () => `different orbits, same constellation. keep trading playlists and finishing each other's sentences. ✦`,
  () => `two separate charts, one shared frequency. that's rarer than it sounds. ✦`,
  () => `not identical, just compatible, which honestly works out better. ✦`,
  () => `the sky doesn't do this for just anyone. ✦`,
  () => `file this one under: worth keeping. ✦`,
];
export const GLOSSARY = [
  ['🏠 Placidus houses', 'A way of slicing the sky into 12 "houses" based on the exact time and place you were born, worked out by Placidus de Titis in the 1600s and still the most-used system today. Your sun\'s house says where in life your light points. We compute the real cusps. no shortcuts.'],
  ['🪞 Jungian archetypes', 'Carl Jung believed we all carry shared inner characters (the Hero, the Caregiver, the Magician) living in the collective unconscious. Your moon sign hints at which one runs your backstage. It\'s psychology wearing a costume, and we love it for that.'],
  ['🌙 Manāzil al-qamar', 'The 28 "lunar mansions" of classical Arabic astronomy: the stations the moon visits on its monthly journey, recorded by scholars in the anwāʾ star-calendar books. We share them with love and respect, as a poetic and scholarly tradition of the Islamic golden age, not as religious guidance.'],
  ['🕯️ Folk star-lore', 'The old European birthday traditions: the "Monday\'s Child" rhyme (first printed in 1838) and the far older planetary week, where each day belongs to a wandering star. Your grandmother\'s astrology: small, sweet, and surprisingly sturdy.']
];
// Shown only while guestbook_entries is empty. Dates computed relative to
// "now" so this doesn't drift further into the past every week it's live.
const daysAgo = n => {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10).replaceAll('-', '.');
};
export function getGuestbookSeed() {
  return [
    { name: 'mikufan39', msg: 'got the luckiest mansion on my first try!!! buying the gacha pull', stamp: '⭐', date: daysAgo(2) },
    { name: 'teto_tuesday', msg: 'scorpio rising girlies rise up (mysteriously)', stamp: '🎀', date: daysAgo(3) },
    { name: 'anon', msg: 'the moon shard made me cry a little. in a cute way', stamp: '🌙', date: daysAgo(4) },
  ];
}
