/**
 * Nepali — the source language.
 *
 * Every other dictionary is typed against this one, so a key added here
 * fails the build until it is translated.
 */
const ne = {
  site: {
    name: "घोर्मु",
    tagline: "घोर्मु गाउँको डिजिटल घर",
    description:
      "रसुवाको घोर्मु गाउँको इतिहास, संस्कृति, पर्यटन र समुदायबारे जानकारी।",
    location: "रसुवा, नेपाल",
  },

  header: {
    skipToContent: "मुख्य सामग्रीमा जानुहोस्",
    mainNavigation: "मुख्य नेभिगेसन",
    homeLink: "घोर्मु गृहपृष्ठ",
    openMenu: "मेनु खोल्नुहोस्",
    closeMenu: "मेनु बन्द गर्नुहोस्",
    switchLanguage: "यो पृष्ठ अंग्रेजीमा हेर्नुहोस्",
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
  },

  footer: {
    discover: "जान्नुहोस्",
    community: "समुदाय",
    help: "सहायता",
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
    code: "त्रुटि ४०४",
    title: "पृष्ठ भेटिएन",
    body: "तपाईंले खोज्नुभएको पृष्ठ सारिएको वा हटाइएको हुन सक्छ।",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
  },

  error: {
    code: "अप्रत्याशित त्रुटि",
    title: "केही गडबड भयो",
    body: "यो पृष्ठ लोड गर्दा समस्या आयो। फेरि प्रयास गर्नुहोस् वा गृहपृष्ठमा फर्कनुहोस्।",
    retry: "फेरि प्रयास गर्नुहोस्",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
    reference: "सन्दर्भ",
  },
}

export type Dictionary = typeof ne

export default ne
