import type { Locale } from "@/lib/i18n/config"

/**
 * Photographs of Ghormu, used with their owners' permission.
 *
 * Files live in public/images/ghormu, resized and re-encoded without
 * metadata (no camera or GPS data). Every use shows its credit; add a new
 * photo here with its source before using it anywhere.
 */

export const photoSources = {
  ply: {
    name: "Plein Leurs Yeux",
    url: "https://www.pleinleursyeux.com/j331-ghormu/",
  },
  lwnf: {
    name: "Little World Nepal France",
    url: "https://littleworldnepalfrance.blogspot.com/2017/03/un-endroit-de-reve-au-nepal-ghormu.html",
  },
} as const

export type PhotoSource = keyof typeof photoSources

export type Photo = {
  id: string
  src: string
  width: number
  height: number
  source: PhotoSource
  alt: Record<Locale, string>
}

function photo(id: string, width: number, height: number, ne: string, en: string): Photo {
  return {
    id,
    src: `/images/ghormu/${id}.webp`,
    width,
    height,
    source: id.startsWith("lwnf") ? "lwnf" : "ply",
    alt: { ne, en },
  }
}

const LANDSCAPE = [1600, 1066] as const
const WIDE = [1440, 1080] as const
const TALL = [1080, 1440] as const

export const photos = {
  village: photo("lwnf-5974", ...LANDSCAPE, "हिउँ परेको डाँडामुनि पहाडको भिरमा फैलिएको घोर्मु गाउँ", "Ghormu spread across the hillside below a snow-dusted ridge"),
  welcome: photo("lwnf-5218", ...LANDSCAPE, "गाउँकी महिलाले पाहुनालाई खादा ओढाउँदै", "A village woman welcomes a guest with a khata scarf"),
  hillsideChildren: photo("lwnf-5267", ...LANDSCAPE, "गराको डिलमाथि बसेका गाउँका केटाकेटी", "Village children sitting above the terraced hillside"),
  forest: photo("lwnf-5538", ...LANDSCAPE, "डाँडामाथिको वन", "Forest on the ridge"),
  trail: photo("lwnf-5927", ...LANDSCAPE, "पहाडको छेउ हुँदै जाने पैदल बाटो", "A footpath along the mountainside"),
  chorten: photo("ply-01", ...TALL, "प्रार्थना झण्डासहितको चोर्तेन", "A chorten with prayer flags"),
  terraces: photo("ply-02", ...TALL, "पहाडको भिरमा गराहरू र गाउँका घरहरू", "Terraced fields and village houses on the hillside"),
  football: photo("ply-03", ...WIDE, "उपत्यकामाथिको चौरमा फुटबल खेल्दै केटाकेटी", "Children playing football on a ground above the valley"),
  fields: photo("ply-04", ...TALL, "हरियो बालीको खेत र पर धमिलो पहाड", "A green field of crops with hazy mountains beyond"),
  fodder: photo("ply-05", ...TALL, "घाँसको भारी बोकेकी महिला, काखमा कुकुरको छाउरो", "A woman carrying a load of fodder, holding a puppy"),
  ploughing: photo("ply-06", 1440, 1078, "पहाडमुनि खेतमा उभिएकी महिला, पछाडि गोरुले जोत्दै", "A woman in a field below the mountains as oxen plough behind her"),
  sharedMeal: photo("ply-07", ...WIDE, "बाहिर चौरमा सँगै खाना खाँदै केटाकेटी", "Children sharing a meal outdoors"),
  mealtime: photo("ply-08", ...TALL, "थालमा खाना खाँदै बालबालिका", "Children eating from their plates"),
  smiles: photo("ply-09", ...WIDE, "घरअगाडि हाँसिरहेका केटाकेटी", "Smiling children in front of a house"),
  play: photo("ply-10", ...WIDE, "हात उठाएर खुसीले खेलिरहेका केटाकेटी", "Children playing together with their arms raised"),
  carrom: photo("ply-11", ...WIDE, "क्यारम खेलिरहेका केटाकेटी", "Children playing carrom"),
  greens: photo("ply-12", ...WIDE, "गराबीच हरियो घाँस बोक्दै मुस्कुराउँदै महिला", "A smiling woman carrying fresh greens among the terraces"),
  meeting: photo("ply-13", ...TALL, "स्थानीय आमा र बच्चासँग भेट्दै पाहुना केटाकेटी", "Visiting children meeting a local mother and her baby"),
  oven: photo("ply-14", ...TALL, "ढुङ्गाको आधारमाथि बनेको माटोको चुलो", "A clay oven built on a stone base"),
  terraceWork: photo("ply-15", ...WIDE, "गोरुले गरा जोत्दै, घाँसको भारी बोकेर हिँड्दै गाउँले", "Oxen ploughing a terrace as villagers carry fodder"),
  doko: photo("ply-16", ...TALL, "पिठ्युँमा डोको बोकेर उकालो चढ्दै महिला", "A woman climbing with a doko basket on her back"),
  courtyard: photo("ply-17", ...WIDE, "आँगनमा परिवारसँग खाना तयार गर्दै", "Preparing a meal with the family in the courtyard"),
  grandmother: photo("ply-18", ...TALL, "गाउँकी हजुरआमा र पाहुना सँगै", "A village grandmother with a guest"),
  doorway: photo("ply-19", ...WIDE, "पाहुनासँग घरको ढोकामा बसेका केटाकेटी", "Children sitting with a guest at a doorway"),
  khata: photo("ply-20", ...TALL, "खादा ओढेर सँगै उभिएका गाउँले र पाहुना", "Villagers and guests together, wearing khata scarves"),
  friends: photo("ply-21", ...TALL, "गाउँका युवा र पाहुना बालिका", "A young villager and a visiting girl"),
  flags: photo("ply-22", ...TALL, "घरको छानामा फहराइरहेका प्रार्थना झण्डा", "Prayer flags strung from a house roof"),
} satisfies Record<string, Photo>

export type PhotoName = keyof typeof photos

/** The gallery's order: the village first, then life, people and visits. */
export const galleryOrder: PhotoName[] = [
  "village", "terraces", "chorten", "trail", "ploughing", "smiles", "welcome", "forest",
  "terraceWork", "doko", "greens", "fields", "fodder", "flags", "football", "hillsideChildren",
  "sharedMeal", "mealtime", "courtyard", "play", "carrom", "grandmother", "meeting", "doorway",
  "khata", "friends", "oven",
]

const creditWord: Record<Locale, string> = { ne: "तस्बिर", en: "Photo" }

/** "तस्बिर: Plein Leurs Yeux" / "Photo: Plein Leurs Yeux" */
export function creditLine(locale: Locale, photo: Photo): string {
  return `${creditWord[locale]}: ${photoSources[photo.source].name}`
}
