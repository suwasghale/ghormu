import { bilingual } from "./bilingual"

/**
 * Culture & Heritage. Draft from the project plan; descriptions are kept
 * general on purpose. Elders and community members should deepen each one
 * with Ghormu's own practice before launch.
 */
export default bilingual({
  ne: {
    eyebrow: "परिचय",
    title: "संस्कृति र सम्पदा",
    lead: "हाम्रो संस्कृति संग्रहालयमा होइन, घरघरमा छ: बोलीमा, लुगामा, गीतमा, र जन्मदेखि मृत्युसम्मका संस्कारमा।",
    communitiesTitle: "समुदाय र परम्परा",
    communitiesLead: "घोर्मुमा घले, तामाङ, गुरुङ र अरू परिवार छिमेकी भएर बस्छन्। हरेकको आफ्नै चलन छ, तर एकअर्काको ठूलो दिनमा सबै आइपुग्छन्।",
    communities: [
      {
        name: "घले संस्कृति",
        body: "घले समुदायका चलन, थर र कथाहरू बुढापाकासँग बसेर लेख्दैछौँ। तपाईंलाई थाहा छ भने हामीलाई सुनाउनुहोस्।",
      },
      {
        name: "तामाङ संस्कृति",
        body: "तामाङ भाषा, ताम्बा गीत, डम्फुको तालमा नाच र बौद्ध चलन यहाँको दैनिक जीवनकै हिस्सा हुन्।",
      },
    ],
    ritesTitle: "जीवन संस्कार",
    ritesLead: "जीवनका महत्त्वपूर्ण चरणमा गरिने संस्कारमा पूरै समुदाय जुट्छ, र सबैले आ-आफ्नो सहयोग पुर्‍याउँछन्।",
    rites: [
      {
        name: "छेवर",
        body: "बालकको पहिलो पटक कपाल काट्ने संस्कार। आफन्त र गाउँलेहरू बालकलाई आशीर्वाद दिन जम्मा हुन्छन्।",
      },
      {
        name: "गुफा बस्ने",
        body: "किशोरीको जीवनको नयाँ चरणलाई सम्मान गर्ने परम्परागत संस्कार, जसमा परिवार र समुदायको सहभागिता हुन्छ।",
      },
      {
        name: "विवाह",
        body: "दुई परिवार जोडिन्छन्, र गाउँभरका परिवार आ-आफ्नो सहयोग लिएर आइपुग्छन्।",
      },
    ],
    festivalsTitle: "चाडपर्व",
    festivals: [
      {
        name: "ल्होसार",
        body: "नयाँ वर्षको स्वागत गर्ने प्रमुख चाड। परम्परागत पहिरनमा सजिएर नाचगान, भेटघाट र मीठा परिकारसँग मनाइन्छ।",
      },
      {
        name: "दशैँ",
        body: "परिवार भेला हुने, ठूलाबडासँग आशीर्वाद लिने र खुसी साटासाट गर्ने चाड।",
      },
    ],
    heritageTitle: "जीवित सम्पदा",
    heritageLead: "यी विषयमा सामग्री संकलन भइरहेको छ। तपाईंसँग जानकारी, तस्बिर वा कथा छन् भने हामीलाई पठाउनुहोस्।",
    heritage: [
      { name: "भेषभूषा", body: "चाडपर्व र संस्कारमा लगाइने परम्परागत पहिरन र गरगहना।" },
      { name: "परिकार", body: "घरमा र चाडपर्वमा पकाइने खानेकुरा।" },
      { name: "गीत-संगीत", body: "चाडपर्व र जमघटमा गाइने गीत र बजाइने बाजा।" },
      { name: "नाच", body: "उत्सवमा सामूहिक रूपमा नाचिने परम्परागत नाच।" },
      { name: "घर र वास्तुकला", body: "स्थानीय ढुङ्गा, काठ र माटोबाट बनेका घर र संरचना।" },
      { name: "धर्म र आस्था", body: "धार्मिक स्थल र पूजाआजासँग जोडिएका आस्था र परम्परा।" },
      { name: "उखान-टुक्का", body: "बुढापाकाले अझै प्रयोग गर्ने उखान, भनाइ र कथा।" },
      { name: "मातृभाषा", body: "घरमा बोलिने भाषा, र त्यसलाई बोलीचालीमै राख्ने उपाय।" },
    ],
    cta: {
      title: "आफ्नो ज्ञान बाँड्नुहोस्",
      body: "यीमध्ये धेरै कुरा मानिसको सम्झनामा मात्र छन्। तपाईंलाई कुनै कथा, गीत वा चलन थाहा छ भने सुनाउनुहोस्, हामी लेखेर राख्छौँ।",
      button: "सम्पर्क गर्नुहोस्",
    },
  },
  en: {
    eyebrow: "About",
    title: "Culture & Heritage",
    lead: "Our culture is not in a museum. It is in every home: in how we speak and dress, in our songs, and in the rites that mark a life.",
    communitiesTitle: "Communities and traditions",
    communitiesLead: "Ghale, Tamang, Gurung and other families live next to each other here. Each keeps its own customs, and everyone turns up for each other's big days.",
    communities: [
      {
        name: "Ghale culture",
        body: "We are writing down the Ghale community's customs, clans and stories with the help of its elders. If you know them, tell us.",
      },
      {
        name: "Tamang culture",
        body: "The Tamang language, Tamba songs, dancing to the damphu drum and Buddhist practice are part of everyday life here.",
      },
    ],
    ritesTitle: "Rites of passage",
    ritesLead: "The whole community gathers for the rites that mark life's important stages, and everyone contributes their share.",
    rites: [
      {
        name: "Chhewar",
        body: "A boy's first haircut. Relatives and villagers gather to give the child their blessings.",
      },
      {
        name: "Gufa Basne",
        body: "A traditional rite honouring a girl's passage into a new stage of life, with the family and community taking part.",
      },
      {
        name: "Marriage",
        body: "Two families are joined, and families from across the village come with their share of help.",
      },
    ],
    festivalsTitle: "Festivals",
    festivals: [
      {
        name: "Lhosar",
        body: "The main festival welcoming the new year, celebrated in traditional dress with song and dance, visits and festive food.",
      },
      {
        name: "Dashain",
        body: "A festival when families gather, receive blessings from their elders and share their joy.",
      },
    ],
    heritageTitle: "Living heritage",
    heritageLead: "Content on these topics is being collected. If you have knowledge, photos or stories, please send them to us.",
    heritage: [
      { name: "Dress", body: "Traditional clothing and jewellery worn for festivals and rites." },
      { name: "Food", body: "What gets cooked at home, and for festivals." },
      { name: "Music", body: "Songs sung and instruments played at festivals and gatherings." },
      { name: "Dance", body: "Traditional dances performed together at celebrations." },
      { name: "Homes & architecture", body: "Houses and structures built from local stone, wood and earth." },
      { name: "Faith", body: "Beliefs and traditions tied to religious sites and worship." },
      { name: "Proverbs", body: "The sayings and stories our elders still use." },
      { name: "Mother tongue", body: "The languages spoken at home, and how to keep them spoken." },
    ],
    cta: {
      title: "Share what you know",
      body: "Much of this lives only in people's memories. If you know a story, a song or a custom, tell us and we'll write it down.",
      button: "Get in touch",
    },
  },
})
