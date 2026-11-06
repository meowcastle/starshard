// lexicon.js: every term the chart page shows, with the line a hover or a tap reveals (SS6,
// 1 Nov 2026). Plain JavaScript, no React, so test/chart.test.mjs can hold the page to it.
//
// WRITING.md's law: use the astrology term, define it once in a few words, then use it
// without apology. Everything here is free vocabulary (the planets, the signs, the houses,
// the five aspects, retrograde, the angles) except "station", the one coined noun this page
// spends (COSMOLOGY.md section 2: the 28 lunar mansions, which standard astrology has no
// word for). Nothing is explained twice: the definition is the line, and the line is short.
// Value judgments are attributed (the old books, the traditions), never ours.

export const LEXICON = {
  // the ten bodies
  sun: 'where the sun stood at your birth: the sign most horoscopes mean by "your sign".',
  moon: 'where the moon stood at your birth; it moves a full station in about a day.',
  mercury: 'the planet nearest the sun, in the old books the one that carries messages.',
  venus: 'the morning and evening star; the old books give it love, pleasure and what is prized.',
  mars: 'the red planet; the old books give it heat, drive and the fight.',
  jupiter: 'the largest planet, slow, about a year in each sign; the old books call it the greater good fortune.',
  saturn: 'the ringed planet, about two and a half years in each sign; the old books give it limits, time and work.',
  uranus: 'seven years in each sign, so it marks a generation more than a person.',
  neptune: 'about fourteen years in each sign; it marks a generation.',
  pluto: 'the slowest, twelve to thirty years in a sign; it marks a generation.',

  // the two angles and their opposites
  ascendant: 'your rising sign: the point of the zodiac coming up over the eastern horizon the minute you were born.',
  midheaven: 'the point overhead at your birth, where the zodiac crosses the meridian.',
  descendant: 'the point setting in the west at your birth, opposite the ascendant.',
  ic: 'the point under your feet at your birth, opposite the midheaven.',

  // the frame
  sign: 'one of the twelve 30 degree stretches of the zodiac, counted from the spring equinox.',
  house: 'one of twelve divisions of the sky at your birth, counted from the ascendant; the houses turn with the earth, the signs do not.',
  cusp: 'the degree where a house begins.',
  degree: 'a planet\'s place in its sign, 0 to 29, with minutes of arc after it.',
  retrograde: 'a planet moving backward against the stars, as seen from earth; the planet does not reverse, the earth overtakes it.',
  orb: 'how far an aspect is from exact; inside the orb the aspect counts.',
  aspect: 'an angle between two points of the chart that the old books read as a relation.',
  station: 'one of the 28 stretches of the moon\'s road, 12°51′ wide each, starting at 0° aries; the moon spends about a night in each.',
  placidus: 'the house division most charts use: each quarter of the sky is cut by the time a degree takes to rise.',
  porphyry: 'a simpler house division, each quarter of the sky cut in three equal parts; used where placidus breaks down, far north or far south.',
  tropical: 'the zodiac measured from the spring equinox, the one western astrology and this chart use.',
  'noon chart': 'a chart cast for noon because the birth time is not known: the houses and the ascendant are left out, and the moon may stand up to 6° either side of where it is drawn.',

  // the twelve signs
  aries: 'the ram: the first sign, the spring equinox; cardinal fire in the old books.',
  taurus: 'the bull: the second sign; fixed earth in the old books.',
  gemini: 'the twins: the third sign; mutable air in the old books.',
  cancer: 'the crab: the fourth sign, the summer solstice; cardinal water in the old books.',
  leo: 'the lion: the fifth sign; fixed fire in the old books.',
  virgo: 'the maiden: the sixth sign; mutable earth in the old books.',
  libra: 'the scales: the seventh sign, the autumn equinox; cardinal air in the old books.',
  scorpio: 'the scorpion: the eighth sign; fixed water in the old books.',
  sagittarius: 'the archer: the ninth sign; mutable fire in the old books.',
  capricorn: 'the sea goat: the tenth sign, the winter solstice; cardinal earth in the old books.',
  aquarius: 'the water bearer: the eleventh sign; fixed air in the old books.',
  pisces: 'the fishes: the twelfth sign; mutable water in the old books.',

  // the twelve houses, as the traditions assign them
  'house 1': 'the first house, beginning at the ascendant: the body, the face, how you arrive, in every tradition\'s reading.',
  'house 2': 'the second house: what you own and earn.',
  'house 3': 'the third house: siblings, neighbours, short journeys, the daily mind.',
  'house 4': 'the fourth house, beginning at the ic: home, family, roots.',
  'house 5': 'the fifth house: children, pleasure, play, what you make for joy.',
  'house 6': 'the sixth house: work, routine, service, the body\'s upkeep.',
  'house 7': 'the seventh house, beginning at the descendant: partners, marriage, open rivals.',
  'house 8': 'the eighth house: what is shared, inherited, owed; endings.',
  'house 9': 'the ninth house: long journeys, higher learning, belief.',
  'house 10': 'the tenth house, beginning at the midheaven: vocation, standing, the public.',
  'house 11': 'the eleventh house: friends, allies, hopes.',
  'house 12': 'the twelfth house: what is hidden, withdrawn, done alone.',

  // the five aspects, PRODUCT.md section 3's table and plain names
  conjunction: 'two points within 8° of each other: stacked, same place, same time.',
  opposition: 'two points 180° apart, within 8°: facing each other across the chart.',
  trine: 'two points 120° apart, within 6°: the old books read it as easy, they get along without trying.',
  square: 'two points 90° apart, within 6°: the old books read it as grinding, they want different things.',
  sextile: 'two points 60° apart, within 4°: available, it works if you use it.',
};

/** The definition for a term, or null if the lexicon has none. Case-insensitive. */
export function define(term) {
  if (!term) return null;
  const k = String(term).toLowerCase();
  return Object.prototype.hasOwnProperty.call(LEXICON, k) ? LEXICON[k] : null;
}

export const BODY_NAMES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
export const SIGN_NAMES = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
export const ASPECT_NAMES = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
export const HOUSE_NAMES = Array.from({ length: 12 }, (_, i) => `house ${i + 1}`);
