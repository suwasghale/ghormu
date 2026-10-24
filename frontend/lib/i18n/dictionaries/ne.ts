/**
 * Nepali — the source language.
 *
 * Every other dictionary is typed against this one, so a key added here
 * fails the build until it is translated.
 */
const ne = {
  site: {
    name: "घोर्मु",
    tagline: "नेपालको एउटा पहाडी गाउँ, गाउँलेकै शब्दमा",
    description: "घोर्मु गाउँको इतिहास, संस्कृति, पर्यटन र समुदायबारे जानकारी।",
  },

  header: {
    skipToContent: "मुख्य सामग्रीमा जानुहोस्",
    mainNavigation: "मुख्य नेभिगेसन",
    homeLink: "घोर्मु गृहपृष्ठ",
    openMenu: "मेनु खोल्नुहोस्",
    closeMenu: "मेनु बन्द गर्नुहोस्",
    switchLanguage: "यो पृष्ठ अंग्रेजीमा हेर्नुहोस्",
    breadcrumb: "तपाईं यहाँ हुनुहुन्छ",
    support: "सहयोग गर्नुहोस्",
  },

  nav: {
    home: "गृहपृष्ठ",

    about: "परिचय",
    aboutGhormu: "घोर्मुको परिचय",
    history: "इतिहास",
    vision: "हाम्रो दृष्टि",
    culture: "संस्कृति र सम्पदा",
    archive: "डिजिटल अभिलेख",

    explore: "घुमफिर",
    tourism: "पर्यटन",
    attractions: "मुख्य आकर्षण",
    map: "३D नक्सा",
    gallery: "तस्बिर संग्रह",
    experiences: "स्थानीय अनुभव",
    travelGuide: "यात्रा निर्देशिका",

    community: "समुदाय",
    communityOverview: "समुदायको परिचय",
    surnames: "थर समुदायहरू",
    events: "कार्यक्रम पात्रो",
    portal: "समुदाय पोर्टल",

    updates: "सूचना",
    news: "समाचार",
    announcements: "घोषणाहरू",
    development: "विकास आयोजनाहरू",

    contact: "सम्पर्क",
    contactUs: "सम्पर्क गर्नुहोस्",
    feedback: "सुझाव तथा प्रतिक्रिया",
    emergency: "आपत्कालीन सम्पर्क",

    faq: "बारम्बार सोधिने प्रश्न",
    privacy: "गोपनीयता नीति",
    terms: "प्रयोगका सर्तहरू",
    accessibility: "पहुँचयोग्यता",
    sitemap: "साइट नक्सा",
    support: "घोर्मुलाई सहयोग",
  },

  footer: {
    discover: "जान्नुहोस्",
    community: "समुदाय",
    help: "सहायता",
    closing: "घोर्मुको कथा अझै लेखिँदैछ। अर्को अध्याय लेख्न हामीलाई साथ दिनुहोस्।",
    /** `{year}` is replaced with the year in Nepali digits. */
    copyright: "© {year} घोर्मु। सर्वाधिकार सुरक्षित।",
  },

  home: {
    title: "घोर्मुमा स्वागत छ",
    lead: "हाम्रो गाउँको इतिहास, संस्कृति र समुदायलाई एकै ठाउँमा जोगाउने र बाँड्ने डिजिटल घर।",
    primaryCta: "घोर्मुको परिचय",
    secondaryCta: "घुमफिर गर्नुहोस्",
  },

  placeholder: {
    status: "तयार हुँदै",
    body: "यो पृष्ठको सामग्री छिट्टै थपिनेछ। त्यतिन्जेल गृहपृष्ठबाट अन्य जानकारी हेर्नुहोस्।",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
  },

  notFound: {
    code: "४०४ · पृष्ठ भेटिएन",
    title: "यो बाटो कतै पुग्दैन",
    body: "तपाईंले खोज्नुभएको पृष्ठ सरेको वा हटेको हुन सक्छ। यहाँबाट फेरि सुरु गर्नुहोस्।",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
    elsewhere: "अरू ठाउँ",
  },

  offline: {
    notice: "इन्टरनेट छैन। पहिले खोलेका पृष्ठहरू अझै हेर्न सकिन्छ।",
    eyebrow: "अफलाइन",
    title: "अहिले इन्टरनेट जोडिएको छैन",
    body: "पहाडमा नेटवर्क आउँछ, जान्छ। तपाईंले पहिले खोलेका पृष्ठहरू यो उपकरणमा सुरक्षित छन्, ती तल छन्। नेटवर्क फर्केपछि फेरि प्रयास गर्नुहोस्।",
    retry: "फेरि प्रयास गर्नुहोस्",
    savedTitle: "इन्टरनेट बिना पनि खुल्ने पृष्ठहरू",
    savedNone: "अहिलेसम्म कुनै पृष्ठ सुरक्षित छैन। इन्टरनेट हुँदा खोलेका पृष्ठहरू पछि यहाँ देखिनेछन्।",
  },

  share: {
    label: "यो पृष्ठ साझा गर्नुहोस्",
    prompt: "यो पृष्ठ साथीहरूसँग साझा गर्नुहोस्",
    native: "साझा गर्नुहोस्",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    copy: "लिङ्क कपी गर्नुहोस्",
    copied: "लिङ्क कपी भयो",
  },

  error: {
    code: "अप्रत्याशित त्रुटि",
    title: "केही गडबड भयो",
    body: "समस्या हाम्रो तर्फबाट आयो, तपाईंको होइन। एकछिनपछि फेरि प्रयास गर्नुहोस्।",
    retry: "फेरि प्रयास गर्नुहोस्",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
    reference: "सन्दर्भ",
  },
}

export type Dictionary = typeof ne

export default ne
