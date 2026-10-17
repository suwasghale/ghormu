import { bilingual } from "./bilingual"

/**
 * Homepage copy. Draft: written from the project plan, to be checked and
 * enriched by people from Ghormu. No figures (population, altitude, dates)
 * appear until they are confirmed.
 */
export default bilingual({
  ne: {
    meta: {
      description: "घोर्मु गाउँको इतिहास, संस्कृति, पर्यटन र समुदायलाई एकै ठाउँमा जोड्ने डिजिटल घर।",
    },
    hero: {
      eyebrow: "हाम्रो गाउँ · हाम्रो पहिचान",
      title: "घोर्मु",
      lead: "हाम्रो गाउँको इतिहास, संस्कृति र समुदायलाई एकै ठाउँमा जोगाउने र संसारसँग बाँड्ने डिजिटल घर।",
      primary: "घोर्मुको परिचय",
      secondary: "घुमफिर गर्नुहोस्",
      index: ["परिचय", "संस्कृति", "घुमफिर", "समुदाय"],
      indexLabel: "यस पृष्ठमा",
    },
    intro: {
      eyebrow: "घोर्मुको बारेमा",
      title: "पुस्तौँदेखि सँगै बसेको समुदाय",
      body: "घोर्मु घले, तामाङ, गुरुङलगायत विभिन्न समुदायको साझा घर हो। यहाँका चाडपर्व, संस्कार र एकअर्कालाई सघाउने परम्पराले गाउँलाई एउटै परिवारझैँ जोडेर राखेको छ।",
      link: "पूरा परिचय पढ्नुहोस्",
    },
    pillars: {
      title: "ghormu.com मा के छ?",
      items: [
        { title: "जान्नुहोस्", body: "गाउँको इतिहास, संस्कृति र कथा।" },
        { title: "घुमफिर", body: "प्राकृतिक सौन्दर्य, पैदल मार्ग र स्थानीय आतिथ्य।" },
        { title: "समुदाय", body: "परिवार, कार्यक्रम र आपसी सहयोगको व्यवस्थित अभिलेख।" },
        { title: "अभिलेख", body: "पुराना तस्बिर, कथा र कागजातको सुरक्षित संग्रह।" },
      ],
    },
    culture: {
      eyebrow: "संस्कृति र सम्पदा",
      title: "हाम्रा संस्कार, हाम्रो पहिचान",
      lead: "जीवनका महत्त्वपूर्ण क्षणमा गरिने संस्कार र वर्षभरिका चाडपर्वले घोर्मुको जीवनलाई रङ्ग दिन्छन्।",
      items: [
        { title: "ल्होसार", body: "नयाँ वर्षको स्वागतमा नाचगान, भेटघाट र मीठा परिकारसहित मनाइने प्रमुख चाड।" },
        { title: "छेवर", body: "बालकको पहिलो पटक कपाल काट्ने परम्परागत संस्कार, जसमा आफन्त र समुदाय सँगै जुट्छन्।" },
        { title: "गुफा बस्ने", body: "किशोरीको जीवनको नयाँ चरणलाई सम्मान गर्ने परम्परागत संस्कार।" },
        { title: "विवाह", body: "दुई परिवार मात्र होइन, पूरै समुदायलाई जोड्ने उत्सव, जहाँ सबैले आ-आफ्नो सहयोग पुर्‍याउँछन्।" },
      ],
      link: "संस्कृति र सम्पदा हेर्नुहोस्",
    },
    explore: {
      eyebrow: "घुमफिर",
      title: "पहाड, वन र न्यानो आतिथ्य",
      lead: "पैदल मार्ग, दृश्यस्थल र गाउँको सरल जीवनशैलीलाई नजिकबाट अनुभव गर्नुहोस्।",
      highlights: ["प्रकृति", "पदयात्रा", "संस्कृति", "आतिथ्य"],
      cta: "यात्राको योजना बनाउनुहोस्",
    },
    map: {
      eyebrow: "छिट्टै आउँदै",
      title: "घोर्मुलाई ३D मा हेर्नुहोस्",
      body: "गाउँ, धार्मिक स्थल, पैदल मार्ग र दृश्यस्थलहरू एउटै अन्तरक्रियात्मक नक्सामा। पहाडको उचाइ र भूगोलसहित गाउँलाई नयाँ कोणबाट चिन्नुहोस्।",
      badge: "३D नक्सा",
      places: ["गाउँ", "धार्मिक स्थल", "पैदल मार्ग", "दृश्यस्थल"],
    },
    community: {
      eyebrow: "हाम्रो समुदाय",
      title: "थर-थरका समुदाय, एउटै गाउँ",
      lead: "घोर्मुका हरेक थर समुदायको आफ्नै इतिहास र परम्परा छ। समुदाय पोर्टलले परिवार, कार्यक्रम र सहयोगको अभिलेख सुरक्षित राख्नेछ।",
      surnames: ["घले", "गुरुङ", "लोप्चन", "थिङ", "मोक्तान"],
      primary: "समुदायको परिचय",
      secondary: "समुदाय पोर्टल",
      portal: "समुदाय पोर्टल",
      statusFirst: "पहिलो चरणमा",
      statusNext: "आगामी",
    },
    archive: {
      title: "घोर्मुको सम्झना जोगाउन सघाउनुहोस्",
      body: "तपाईंसँग पुराना तस्बिर, कथा वा कागजात छन्? गाउँमै हुनुहोस् वा विदेशमा, तपाईंको योगदानले आउँदा पुस्तालाई हाम्रो इतिहास चिनाउनेछ।",
      cta: "सम्पर्क गर्नुहोस्",
      eyebrow: "डिजिटल अभिलेख",
    },
  },
  en: {
    meta: {
      description: "The digital home that brings together the history, culture, tourism and community of Ghormu village.",
    },
    hero: {
      eyebrow: "Our village · Our identity",
      title: "Ghormu",
      lead: "A digital home that keeps our village's history, culture and community together, and shares them with the world.",
      primary: "About Ghormu",
      secondary: "Explore Ghormu",
      index: ["About", "Culture", "Explore", "Community"],
      indexLabel: "On this page",
    },
    intro: {
      eyebrow: "About Ghormu",
      title: "A community rooted together for generations",
      body: "Ghormu is a shared home for Ghale, Tamang, Gurung and other communities. Its festivals, rites and tradition of helping one another keep the village together like one family.",
      link: "Read the full story",
    },
    pillars: {
      title: "What you'll find on ghormu.com",
      items: [
        { title: "Discover", body: "The village's history, culture and stories." },
        { title: "Explore", body: "Natural beauty, walking trails and local hospitality." },
        { title: "Community", body: "Families, events and mutual support, properly recorded." },
        { title: "Archive", body: "A safe home for old photos, stories and documents." },
      ],
    },
    culture: {
      eyebrow: "Culture & Heritage",
      title: "Our traditions, our identity",
      lead: "Rites for life's important moments and festivals through the year give life in Ghormu its colour.",
      items: [
        { title: "Lhosar", body: "The new year festival, welcomed with song and dance, family visits and festive food." },
        { title: "Chhewar", body: "A boy's first haircut: a traditional rite that brings relatives and the community together." },
        { title: "Gufa Basne", body: "A traditional rite honouring a girl's passage into a new stage of life." },
        { title: "Marriage", body: "A celebration that joins not just two families but the whole community, with everyone contributing their share." },
      ],
      link: "Explore culture & heritage",
    },
    explore: {
      eyebrow: "Explore",
      title: "Hills, forests and a warm welcome",
      lead: "Walk the trails, find the viewpoints and experience simple village life up close.",
      highlights: ["Nature", "Hiking", "Culture", "Hospitality"],
      cta: "Plan your visit",
    },
    map: {
      eyebrow: "Coming soon",
      title: "See Ghormu in 3D",
      body: "The village, religious sites, trails and viewpoints on one interactive map. Get to know Ghormu from a new angle, with its real terrain and elevation.",
      badge: "3D map",
      places: ["Village", "Religious sites", "Trails", "Viewpoints"],
    },
    community: {
      eyebrow: "Our community",
      title: "Many clans, one village",
      lead: "Each of Ghormu's clan communities has its own history and traditions. The community portal will keep a safe record of families, events and contributions.",
      surnames: ["Ghale", "Gurung", "Lopchan", "Thing", "Moktan"],
      primary: "Community overview",
      secondary: "Community portal",
      portal: "Community portal",
      statusFirst: "First phase",
      statusNext: "Coming next",
    },
    archive: {
      title: "Help preserve Ghormu's memory",
      body: "Do you have old photos, stories or documents? Whether you live in the village or abroad, your contribution will help future generations know our history.",
      cta: "Get in touch",
      eyebrow: "Digital archive",
    },
  },
})
