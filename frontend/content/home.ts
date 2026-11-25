import { bilingual } from "./bilingual"

/**
 * Homepage copy. The page answers, in order: what this site is, where to
 * find what people come for, what is new, and then the village itself.
 * Plain sentences, things you can see in the photos, no slogans. No figures
 * (population, altitude, dates) until the village confirms them.
 */
export default bilingual({
  ne: {
    meta: {
      description: "घोर्मु गाउँको वेबसाइट: गाउँका सूचना र कार्यक्रम, इतिहास, गीत-नाच र तस्बिर।",
    },
    hero: {
      kicker: "घोर्मु गाउँको आफ्नै वेबसाइट",
      title: "घोर्मु",
      lead: "गाउँका सूचना र कार्यक्रम, हाम्रो इतिहास, गीत-नाच र तस्बिर एकै ठाउँमा। गाउँमै बस्ने, गाउँबाहिर पुगेका र घोर्मु चिन्न चाहने सबैका लागि।",
    },
    index: {
      title: "यस वेबसाइटमा",
      items: [
        { href: "/updates", title: "सूचना र समाचार", body: "गाउँका सूचना, बैठक र खबर।" },
        { href: "/community/events", title: "कार्यक्रम पात्रो", body: "आउँदै गरेका चाडपर्व, बैठक र जमघट, मितिसहित।" },
        { href: "/about/history", title: "गाउँको इतिहास", body: "पुर्खाका कथा, पुराना तस्बिर, र वर्षअनुसार माथिबाट खिचिएको गाउँ।" },
        { href: "#songs", title: "गीत र नाच", body: "घोर्मुका स्याब्रु र तामाङ गीत-नाचका भिडियो।" },
        { href: "/explore/travel-guide", title: "बाटो र मौसम", body: "घोर्मु आउने बाटो, अहिलेको अवस्था र मौसम।" },
        { href: "/contact/emergency", title: "आपतकालीन सम्पर्क", body: "बिरामी, दुर्घटना वा प्रकोप पर्दा कसलाई खबर गर्ने।" },
      ],
    },
    latest: {
      title: "गाउँका ताजा खबर",
      link: "सबै समाचार",
      events: "आगामी कार्यक्रम",
      eventsLink: "कार्यक्रम पात्रो",
    },
    songs: {
      title: "गीत र नाच",
      lead: "स्याब्रु र तामाङ गीत-नाच घोर्मुको पहिचान हो। आसपासका गाउँमा पनि घोर्मुका नाच्ने-गाउनेलाई सिपालु र अग्रज मानिन्छ।",
      link: "संस्कृतिबारे थप",
    },
    history: {
      title: "नयाँ पुस्ताका लागि गाउँको इतिहास",
      body: [
        "घोर्मु कसरी बस्यो, पहिलेको जीवन कस्तो थियो, कुन परिवार कहाँबाट आए: यी कुरा धेरैजसो बुढापाकाको सम्झनामा मात्र छन्।",
        "हामी ती कथा सोधेर, गाउँलेसँग जाँचेर यहाँ लेख्दैछौँ, ताकि गाउँबाहिर हुर्केका छोराछोरीले पनि आफ्नो गाउँ चिनून्।",
      ],
      read: "इतिहास पढ्नुहोस्",
      archive: "पुराना तस्बिर र कागजात",
      askTitle: "हजुरबा-हजुरआमालाई सोध्नुहोस्",
      questions: [
        "हाम्रो परिवार घोर्मुमा कहिलेदेखि बस्दै आएको हो?",
        "तपाईं सानो छँदा गाउँमा के-के थिए, के थिएनन्?",
        "पहिले ल्होसार र बिहे कसरी मनाइन्थ्यो?",
        "स्याब्रु गीत र नाच कसबाट सिक्नुभयो?",
        "गाउँमा विद्यालय, बाटो र खानेपानी कसरी आयो?",
      ],
      askNote: "जवाफ फोनमा रेकर्ड गरेर हामीलाई पठाउनुहोस्। उहाँहरूको अनुमतिमा, नामसहित इतिहास पृष्ठमा राख्छौँ।",
      send: "रेकर्डिङ पठाउनुहोस्",
    },
    day: {
      title: "घोर्मुको एक दिन",
      lead: [
        "बिहान डोकोमा घाँस बोकेर उकालो, दिउँसो गरामा गोरु, अनि खानाको बेला आँगनमा भेला हुने परिवार। हाम्रा दिन यस्तै बित्छन्।",
        "यहाँ घले, तामाङ, गुरुङलगायत समुदाय पुस्तौँदेखि सँगै बस्छन्। बिहे होस् वा छेवर, एउटा परिवारको काममा अर्को परिवार साथ दिन आइपुग्छ।",
      ],
      moments: [
        { label: "बिहान", caption: "दिनको पहिलो डोको उकालो लाग्छ।" },
        { label: "दिउँसो", caption: "गोरुले गरा जोत्छन्, घाँसको भारी घर फर्कन्छ।" },
        { label: "दिउँसोपछि", caption: "उपत्यकामाथिको चौरमा फुटबल।" },
        { label: "खानाको बेला", caption: "सबै सँगै बसेर खान्छन्।" },
      ],
      about: "गाउँबारे थप",
      photos: "थप तस्बिर",
    },
    visit: {
      title: "घोर्मु घुम्न आउँदा",
      body: "पैदल बाटो, खुला डाँडा र आँगनमा चिया। हामी पाहुनालाई खादा ओढाएर स्वागत गर्छौँ।",
      bestTime: "घुम्ने उत्तम समय",
      cta: "यात्राको तयारी",
    },
    support: {
      title: "गाउँलाई सहयोग",
      body: "गाउँका धेरैजसो काम हामी आफैँ गर्छौँ; टाढाका साथीहरूको सहयोगले त्यसलाई अझ अघि पुर्‍याउँछ। के आयो र कहाँ खर्च भयो, यहीँ राखिन्छ।",
      primary: "सहयोग गर्ने तरिका",
      secondary: "विकास आयोजनाहरू",
    },
  },
  en: {
    meta: {
      description: "Ghormu village's website: village notices and events, history, songs, dances and photos.",
    },
    hero: {
      kicker: "Ghormu village's own website",
      title: "Ghormu",
      lead: "Village notices and events, our history, songs, dances and photos, in one place. For people who live here, people who have moved away, and anyone who wants to know Ghormu.",
    },
    index: {
      title: "On this site",
      items: [
        { href: "/updates", title: "Notices and news", body: "Village notices, meetings and news." },
        { href: "/community/events", title: "Events calendar", body: "Festivals, meetings and gatherings coming up, with dates." },
        { href: "/about/history", title: "Village history", body: "Our ancestors' stories, old photos, and the village seen from above over the years." },
        { href: "#songs", title: "Songs and dances", body: "Videos of Ghormu's Syabru and Tamang songs and dances." },
        { href: "/explore/travel-guide", title: "Road and weather", body: "The way to Ghormu, how the road is now, and the weather." },
        { href: "/contact/emergency", title: "Emergency contacts", body: "Who to call for illness, an accident or a disaster." },
      ],
    },
    latest: {
      title: "News from the village",
      link: "All news",
      events: "Coming up",
      eventsLink: "Events calendar",
    },
    songs: {
      title: "Songs and dances",
      lead: "Syabru and Tamang songs and dances are part of what makes Ghormu Ghormu. In the villages around, Ghormu's singers and dancers are known for their skill, and the older ones are looked up to.",
      link: "More on our culture",
    },
    history: {
      title: "Village history, for the next generation",
      body: [
        "How Ghormu was settled, what life was like before, which families came from where: most of this lives only in our elders' memories.",
        "We are asking about it, checking it with the village and writing it down here, so that children growing up away from Ghormu still know where they come from.",
      ],
      read: "Read the history",
      archive: "Old photos and papers",
      askTitle: "Questions to ask your grandparents",
      questions: [
        "Since when has our family lived in Ghormu?",
        "What did the village have when you were small, and what didn't it have?",
        "How were Lhosar and weddings celebrated back then?",
        "Who taught you the Syabru songs and dances?",
        "How did the school, the road and the water supply come to the village?",
      ],
      askNote: "Record the answers on your phone and send them to us. With their permission, we'll add them to the history page under their name.",
      send: "Send a recording",
    },
    day: {
      title: "A day in Ghormu",
      lead: [
        "Mornings start with a doko of fodder carried uphill, the oxen work the terraces in the afternoon, and at mealtime families gather in the courtyard.",
        "Ghale, Tamang, Gurung and other families have lived here together for generations. For a wedding or a Chhewar, when one family has work to do, the others turn up to help.",
      ],
      moments: [
        { label: "Morning", caption: "The first doko of the day heads uphill." },
        { label: "Midday", caption: "Oxen plough the terraces; fodder comes home." },
        { label: "Afternoon", caption: "Football on the ground above the valley." },
        { label: "Mealtime", caption: "Everyone sits down to eat together." },
      ],
      about: "More about the village",
      photos: "More photos",
    },
    visit: {
      title: "Visiting Ghormu",
      body: "Footpaths, open ridges and tea in a courtyard. Guests are welcomed with a khata.",
      bestTime: "Best time to visit",
      cta: "Plan the trip",
    },
    support: {
      title: "Helping the village",
      body: "We do most of the work in the village ourselves, and help from friends far away takes it further. What comes in, and where it goes, is posted here.",
      primary: "Ways to help",
      secondary: "Development projects",
    },
  },
})
