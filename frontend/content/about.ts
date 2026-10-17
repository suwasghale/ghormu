import { bilingual } from "./bilingual"

/**
 * About Ghormu. Draft from the project plan.
 *
 * `facts` rows with an empty value are not shown: fill in confirmed figures
 * (location, population, households, languages) and they appear.
 */
export default bilingual({
  ne: {
    eyebrow: "परिचय",
    title: "घोर्मुको परिचय",
    lead: "घोर्मु केवल एउटा ठाउँ होइन। यो पुस्तौँदेखि सँगै बसेका परिवार, साझा परम्परा र एकअर्काप्रतिको भरोसाको नाम हो।",
    factsTitle: "एक नजरमा",
    facts: [
      { label: "देश", value: "नेपाल" },
      { label: "मुख्य समुदाय", value: "घले, तामाङ, गुरुङ र अन्य" },
      { label: "जनसंख्या", value: "" },
      { label: "घरधुरी", value: "" },
      { label: "बोलिने भाषा", value: "" },
    ],
    story: [
      {
        title: "हाम्रो गाउँ",
        body: [
          "घोर्मु नेपालको पहाडी भेगमा रहेको गाउँ हो, जहाँ घले, तामाङ, गुरुङलगायत विभिन्न समुदाय पुस्तौँदेखि सँगै बस्दै आएका छन्।",
          "साझा चाडपर्व, संस्कार र आपसी सहयोगले यहाँको जीवनलाई जोडेर राखेको छ। गाउँ सानो भए पनि यसको इतिहास, संस्कृति र सम्बन्धहरू गहिरा छन्।",
        ],
      },
      {
        title: "एकअर्काको साथ",
        body: [
          "विवाह, छेवर, गुफा बस्ने जस्ता संस्कारमा गाउँका परिवारहरू एकअर्काको घरमा सहयोग लिएर पुग्छन्।",
          "यो लेनदेन केवल हिसाब होइन; यो सम्बन्ध, सम्मान र भरोसाको अभिव्यक्ति हो, जसले घोर्मुलाई एउटै परिवारझैँ बाँधेर राखेको छ।",
        ],
      },
      {
        title: "डिजिटल घोर्मु",
        body: [
          "ghormu.com गाउँको डिजिटल पहिचान हो। यसले घोर्मुको कथा संसारसामु पुर्‍याउँछ र संस्कृति तथा इतिहासको अभिलेख राख्छ।",
          "साथै, समुदाय पोर्टलले परिवार, कार्यक्रम र सहयोगको हिसाब सुरक्षित र पारदर्शी रूपमा राख्न मद्दत गर्नेछ।",
        ],
      },
    ],
    moreTitle: "थप जान्नुहोस्",
    more: [
      { title: "इतिहास", href: "/about/history", body: "गाउँको उत्पत्तिदेखि आजसम्मको यात्रा।" },
      { title: "हाम्रो दृष्टि", href: "/about/vision", body: "ghormu.com किन बनाइयो र यसको लक्ष्य के हो।" },
      { title: "संस्कृति र सम्पदा", href: "/about/culture", body: "भाषा, भेषभूषा, गीत, नाच र संस्कार।" },
      { title: "डिजिटल अभिलेख", href: "/about/archive", body: "पुराना तस्बिर, कागजात र मौखिक इतिहास।" },
    ],
    faqTitle: "प्रायः सोधिने प्रश्न",
    faq: [
      {
        q: "ghormu.com किन बनाइएको हो?",
        a: "घोर्मुको इतिहास र संस्कृति जोगाउन, गाउँ र विदेशमा रहेका घोर्मुवासीलाई जोड्न, र समुदायका कार्यक्रम तथा सहयोगको अभिलेख सुरक्षित राख्न।",
      },
      {
        q: "वेबसाइट कुन-कुन भाषामा छ?",
        a: "अहिले नेपाली र अंग्रेजीमा। पछि अन्य भाषा पनि थपिनेछन्।",
      },
      {
        q: "समुदाय पोर्टल के हो?",
        a: "समुदायहरूले आफ्ना परिवार, कार्यक्रम र सहयोगको हिसाब राख्ने सुरक्षित प्रणाली हो। यसमा अधिकार पाएका सदस्यले मात्र पहुँच पाउँछन्।",
      },
      {
        q: "म कसरी योगदान दिन सक्छु?",
        a: "पुराना तस्बिर, कथा, कागजात वा सुधारका सुझाव पठाउनुहोस्। सम्पर्क पृष्ठबाट हामीलाई लेख्न सक्नुहुन्छ।",
      },
    ],
  },
  en: {
    eyebrow: "About",
    title: "About Ghormu",
    lead: "Ghormu is more than a place. It is generations of families living side by side, shared traditions, and trust in one another.",
    factsTitle: "At a glance",
    facts: [
      { label: "Country", value: "Nepal" },
      { label: "Main communities", value: "Ghale, Tamang, Gurung and others" },
      { label: "Population", value: "" },
      { label: "Households", value: "" },
      { label: "Languages spoken", value: "" },
    ],
    story: [
      {
        title: "Our village",
        body: [
          "Ghormu is a village in the hills of Nepal, where Ghale, Tamang, Gurung and other communities have lived together for generations.",
          "Shared festivals, rites and mutual support hold life here together. The village may be small, but its history, culture and relationships run deep.",
        ],
      },
      {
        title: "Standing by one another",
        body: [
          "At weddings, Chhewar, Gufa Basne and other rites, families arrive at each other's homes bringing their support.",
          "This exchange is not mere bookkeeping; it is an expression of relationship, respect and trust that binds Ghormu together like one family.",
        ],
      },
      {
        title: "Digital Ghormu",
        body: [
          "ghormu.com is the village's digital identity. It carries Ghormu's story to the world and keeps a record of its culture and history.",
          "The community portal will also help keep the records of families, events and contributions safe and transparent.",
        ],
      },
    ],
    moreTitle: "Learn more",
    more: [
      { title: "History", href: "/about/history", body: "The village's journey from its origins to today." },
      { title: "Our Vision", href: "/about/vision", body: "Why ghormu.com was built and what it aims for." },
      { title: "Culture & Heritage", href: "/about/culture", body: "Language, dress, songs, dances and rites." },
      { title: "Digital Archive", href: "/about/archive", body: "Old photos, documents and oral history." },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Why was ghormu.com created?",
        a: "To preserve Ghormu's history and culture, to connect people from Ghormu in the village and abroad, and to keep a safe record of community events and contributions.",
      },
      {
        q: "Which languages is the website in?",
        a: "Nepali and English for now. More languages will be added later.",
      },
      {
        q: "What is the community portal?",
        a: "A secure system where communities keep records of their families, events and contributions. Only authorised members can access it.",
      },
      {
        q: "How can I contribute?",
        a: "Send old photos, stories, documents or suggested corrections. You can write to us from the contact page.",
      },
    ],
  },
})
