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
      lead: "घोर्मु र आसपासका हेर्नैपर्ने ठाउँहरू।",
      places: [] as { name: string; kind: string; body: string }[],
      emptyTitle: "आकर्षणहरूको सूची तयार हुँदैछ",
      emptyBody: "गाउँका दृश्यस्थल, धार्मिक तथा ऐतिहासिक स्थल र पैदल मार्गहरू गाउँलेसँगै पहिचान गरेर यहाँ राखिनेछन्। कुनै ठाउँ सुझाउन चाहनुहुन्छ?",
      emptyAction: "ठाउँ सुझाउनुहोस्",
      mapTitle: "३D नक्सामा हेर्नुहोस्",
      mapBody: "पछि यी सबै ठाउँहरू घोर्मुको ३D अन्तरक्रियात्मक नक्सामा देखिनेछन्।",
      planLink: "यात्राको योजना बनाउनुहोस्",
    },
    experiences: {
      title: "स्थानीय अनुभव",
      lead: "गाउँलेसँगै बिताउने समय: खाना, चाडपर्व, पैदल यात्रा र दैनिक जीवन।",
      ideasTitle: "घोर्मुमा के अनुभव गर्न सकिन्छ",
      ideas: [
        { title: "गाउँको खाना", body: "घरमै पाकेका परम्परागत परिकार चाख्नुहोस् र पकाउने तरिका सिक्नुहोस्।" },
        { title: "चाडपर्वमा सहभागिता", body: "ल्होसार वा दशैँजस्ता चाडमा गाउँको रमझमसँग जोडिनुहोस्।" },
        { title: "पैदल यात्रा", body: "स्थानीय जानकारसँग गाउँका गोरेटो र दृश्यस्थल घुम्नुहोस्।" },
        { title: "दैनिक जीवन", body: "गाउँलेको दैनिक काम र दिनचर्यालाई नजिकबाट हेर्नुहोस्।" },
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
      lead: "Places worth seeing in and around Ghormu.",
      places: [] as { name: string; kind: string; body: string }[],
      emptyTitle: "The list of attractions is being prepared",
      emptyBody: "Viewpoints, religious and historic sites and walking trails will be identified with villagers and listed here. Would you like to suggest a place?",
      emptyAction: "Suggest a place",
      mapTitle: "See them on the 3D map",
      mapBody: "Later, all of these places will appear on an interactive 3D map of Ghormu.",
      planLink: "Plan your trip",
    },
    experiences: {
      title: "Local Experiences",
      lead: "Time spent with villagers: food, festivals, walks and everyday life.",
      ideasTitle: "What you can experience in Ghormu",
      ideas: [
        { title: "Village food", body: "Taste traditional dishes cooked at home, and learn how they're made." },
        { title: "Joining a festival", body: "Be part of the village's celebrations at Lhosar or Dashain." },
        { title: "Walking", body: "Explore the village paths and viewpoints with someone who knows them." },
        { title: "Everyday life", body: "See the work and rhythm of village days up close." },
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
