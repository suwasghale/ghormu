import { bilingual } from "./bilingual"

/**
 * Attractions and Local Experiences.
 *
 * `attractions.places` and `experiences.hosts` start empty: list a place or
 * a host only once it is confirmed, with the owner's agreement for hosts.
 */
export default bilingual({
  ne: {
    eyebrow: "घुमफिर",
    attractions: {
      title: "मुख्य आकर्षण",
      lead: "गाउँ वरपर कहाँ हिँड्ने र के हेर्ने।",
      places: [] as { name: string; kind: string; body: string }[],
      emptyTitle: "आकर्षणहरूको सूची तयार हुँदैछ",
      emptyBody: "गाउँका दृश्यस्थल, धार्मिक तथा ऐतिहासिक स्थल र पैदल मार्गहरू गाउँलेसँगै पहिचान गरेर यहाँ राखिनेछन्। कुनै ठाउँ सुझाउन चाहनुहुन्छ?",
      emptyAction: "ठाउँ सुझाउनुहोस्",
      mapTitle: "घोर्मु ३D मा हेर्नुहोस्",
      mapBody: "डाँडा घुमाउनुहोस्, झुकाउनुहोस्, र विद्यालय, बाटो तथा गाउँका सार्वजनिक ठाउँहरू नक्सामा फेला पार्नुहोस्।",
      mapLink: "३D नक्सा खोल्नुहोस्",
    },
    experiences: {
      title: "स्थानीय अनुभव",
      lead: "कुनै परिवारसँग खाना खानुहोस्, चाडमा सामेल हुनुहोस्, बाटो चिनेको मान्छेसँग हिँड्नुहोस्।",
      ideasTitle: "यहाँ समय कसरी बिताउने",
      ideas: [
        { title: "गाउँको खाना", body: "घरमै पाकेका परम्परागत परिकार चाख्नुहोस् र पकाउने तरिका सिक्नुहोस्।" },
        { title: "चाडपर्वमा सहभागिता", body: "ल्होसार वा दशैँजस्ता चाडमा गाउँको रमझमसँग जोडिनुहोस्।" },
        { title: "पैदल यात्रा", body: "स्थानीय जानकारसँग गाउँका गोरेटो र दृश्यस्थल घुम्नुहोस्।" },
        { title: "दैनिक जीवन", body: "घाँस, खेत, भान्सा: गाउँको एक दिनको काममा साथ दिनुहोस्।" },
      ],
      hosts: [] as { name: string; offer: string; contact: string }[],
      hostsTitle: "स्थानीय आतिथेय",
      hostsPending: "पाहुना स्वागत गर्न चाहने गाउँलेहरूको सूची तयार हुँदैछ। तपाईं आतिथेय बन्न चाहनुहुन्छ वा अनुभवको व्यवस्था गर्न चाहनुहुन्छ भने हामीलाई सम्पर्क गर्नुहोस्।",
      respectTitle: "सम्मानपूर्वक घुम्नुहोस्",
      respectBody: "स्थानीय चलन, धार्मिक स्थल र मानिसको निजताको सम्मान गर्नुहोस्। जिम्मेवार पर्यटनका सुझाव पर्यटन पृष्ठमा छन्।",
      respectLink: "जिम्मेवार पर्यटनका सुझाव",
      cta: "सम्पर्क गर्नुहोस्",
    },
  },
  en: {
    eyebrow: "Explore",
    attractions: {
      title: "Attractions",
      lead: "Where to walk and what to see around the village.",
      places: [] as { name: string; kind: string; body: string }[],
      emptyTitle: "The list of attractions is being prepared",
      emptyBody: "Viewpoints, religious and historic sites and walking trails will be identified with villagers and listed here. Would you like to suggest a place?",
      emptyAction: "Suggest a place",
      mapTitle: "See Ghormu in 3D",
      mapBody: "Turn and tilt the hills, and find the school, the trails and the village's public places.",
      mapLink: "Open the 3D map",
    },
    experiences: {
      title: "Local Experiences",
      lead: "Eat with a family, join a festival, walk the paths with someone who knows them.",
      ideasTitle: "Ways to spend your time here",
      ideas: [
        { title: "Village food", body: "Taste traditional dishes cooked at home, and learn how they're made." },
        { title: "Joining a festival", body: "Be part of the village's celebrations at Lhosar or Dashain." },
        { title: "Walking", body: "Explore the village paths and viewpoints with someone who knows them." },
        { title: "Everyday life", body: "Fodder, fields, cooking: spend a day alongside the work." },
      ],
      hosts: [] as { name: string; offer: string; contact: string }[],
      hostsTitle: "Local hosts",
      hostsPending: "A list of villagers who'd like to welcome guests is being prepared. If you'd like to become a host, or to arrange an experience, please get in touch.",
      respectTitle: "Travel with respect",
      respectBody: "Respect local customs, religious sites and people's privacy. The Tourism page has tips for travelling responsibly.",
      respectLink: "Tips for responsible travel",
      cta: "Get in touch",
    },
  },
})
