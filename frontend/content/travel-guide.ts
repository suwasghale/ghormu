import { bilingual } from "./bilingual"

/**
 * Travel Guide copy.
 *
 * `route.steps` is empty on purpose: add the confirmed way to Ghormu (bus
 * or jeep from where, roughly how long, where to get off) and the section
 * shows it. Until then the page relies on live Google Maps directions.
 */
export default bilingual({
  ne: {
    eyebrow: "घुमफिर",
    title: "यात्रा निर्देशिका",
    lead: "घोर्मु आउने योजना बनाउँदै हुनुहुन्छ? यहाँ अहिलेको मौसम, बाटो, तयारी र उपयोगी सुझाव एकै ठाउँमा छन्।",

    weather: {
      eyebrow: "प्रत्यक्ष मौसम",
      title: "घोर्मुमा अहिलेको मौसम",
      feelsLike: "अनुभूति",
      humidity: "आर्द्रता",
      wind: "हावा",
      rain: "वर्षा",
      sunrise: "सूर्योदय",
      sunset: "सूर्यास्त",
      forecastTitle: "आगामी ७ दिन",
      today: "आज",
      rainChance: "वर्षाको सम्भावना",
      updated: "अपडेट",
      nepalTime: "नेपाल समय",
      elevation: "उचाइ",
      elevationValue: "समुद्र सतहदेखि करिब {m} मिटर",
      credit: "मौसम तथ्यांक",
      unavailable: "अहिले मौसमको जानकारी ल्याउन सकिएन। केही समयपछि फेरि हेर्नुहोस्।",
      note: "मौसम पूर्वानुमान हरेक ३० मिनेटमा अद्यावधिक हुन्छ। पहाडको मौसम छिट्टै फेरिन सक्छ, त्यसैले हिँड्नुअघि फेरि हेर्नुहोस्।",
      conditions: {
        clear: "सफा आकाश",
        partly: "आंशिक बादल",
        cloudy: "बादल लागेको",
        fog: "हुस्सु",
        drizzle: "सिमसिमे पानी",
        rain: "पानी पर्दै",
        snow: "हिउँ",
        showers: "झरी",
        thunder: "चट्याङसहित पानी",
      },
    },

    location: {
      title: "घोर्मु कहाँ छ?",
      body: "तपाईं जहाँ हुनुहुन्छ त्यहाँबाट घोर्मुसम्मको बाटो, दूरी र लाग्ने समय Google Maps ले हिसाब गरिदिन्छ।",
      directions: "Google Maps मा बाटो हेर्नुहोस्",
      openStreetMap: "OpenStreetMap मा हेर्नुहोस्",
      coordinates: "निर्देशांक",
    },

    road: {
      title: "सडक र बाटोको अवस्था",
      levels: {
        open: "बाटो खुला",
        caution: "सावधानीपूर्वक यात्रा गर्नुहोस्",
        closed: "बाटो अवरुद्ध",
        unknown: "जानकारी आउँदैछ",
      },
      unknownBody: "सडकको अवस्था अहिले अद्यावधिक गरिएको छैन। यात्रा अघि स्थानीयसँग सोधेर पक्का गर्नुहोस्।",
      checked: "जाँच गरिएको मिति",
    },

    route: {
      title: "कसरी पुग्ने",
      steps: [] as { title: string; body: string }[],
      pending: "बस, जीप, भाडा र बाटोको विस्तृत विवरण छिट्टै थपिनेछ। अहिलेलाई यात्रा अघि हामीलाई वा स्थानीयलाई सम्पर्क गरेर ताजा जानकारी लिनुहोस्।",
      tipsTitle: "बाटोमा ध्यान दिनुपर्ने कुरा",
      tips: [
        "बिहानै यात्रा सुरु गर्नुहोस्; पहाडी बाटोमा अनुमानभन्दा बढी समय लाग्न सक्छ।",
        "वर्षायाममा पहिरोले बाटो अवरुद्ध हुन सक्छ; हिँड्नुअघि अवस्था बुझ्नुहोस्।",
        "सवारी साधन र फर्किने व्यवस्था पहिल्यै मिलाउनुहोस्।",
      ],
      contact: "हामीलाई सम्पर्क गर्नुहोस्",
    },

    pack: {
      title: "के-के लैजाने",
      lead: "दिउँसो न्यानो भए पनि बिहान-बेलुका चिसो हुन सक्छ। मौसमअनुसार तयारी गर्नुहोस्।",
      items: [
        { title: "न्यानो लुगा", body: "बिहान-बेलुकाका लागि ज्याकेट र तहगत लुगा।" },
        { title: "बर्सादी वा छाता", body: "विशेषगरी वर्षायाममा अनिवार्य।" },
        { title: "बलियो जुत्ता", body: "उकालो-ओरालो र चिप्लो बाटोका लागि।" },
        { title: "टर्च वा हेडल्याम्प", body: "रातिको बाटो र बत्ती जाँदाका लागि।" },
        { title: "पावर बैंक", body: "फोन चार्ज गर्ने सुविधा सधैँ नहुन सक्छ।" },
        { title: "नगद", body: "गाउँमा एटीएम नहुन सक्छ।" },
        { title: "औषधि", body: "आफ्ना नियमित औषधि र प्राथमिक उपचार सामग्री।" },
        { title: "पानीको बोतल", body: "प्लास्टिक फोहोर घटाउन आफ्नै बोतल बोक्नुहोस्।" },
      ],
    },

    stay: {
      title: "बस्ने र खाने",
      body: "बस्ने र खाने ठाउँहरूको सूची तयार हुँदैछ। अहिलेलाई हामीलाई सम्पर्क गर्नुहोस्, हामी स्थानीयसँग जोडिदिन्छौँ।",
    },

    faqTitle: "प्रायः सोधिने प्रश्न",
    faq: [
      {
        q: "घोर्मु घुम्न कहिले जाँदा राम्रो?",
        a: "सामान्यतया शरद (असोज–मंसिर) र वसन्त (चैत–जेठ) सबैभन्दा उपयुक्त मानिन्छन्। ऋतुअनुसारको विवरण पर्यटन पृष्ठमा छ।",
      },
      {
        q: "यहाँको मौसम जानकारी कति भरपर्दो छ?",
        a: "यो खुला मौसम मोडेलमा आधारित यस क्षेत्रको पूर्वानुमान हो र हरेक ३० मिनेटमा अद्यावधिक हुन्छ। पहाडको मौसम छिट्टै फेरिन सक्ने भएकाले यसलाई अनुमानका रूपमा लिनुहोस्।",
      },
      {
        q: "गाउँमा पैसा निकाल्न सकिन्छ?",
        a: "गाउँमा एटीएम नहुन सक्छ। आवश्यक नगद साथमा लिएर आउनुहोस्।",
      },
      {
        q: "बाटो खुला छ कि छैन कसरी थाहा पाउने?",
        a: "यस पृष्ठको 'सडक र बाटोको अवस्था' खण्ड हेर्नुहोस्। अद्यावधिक नभएमा यात्रा अघि हामीलाई वा स्थानीयलाई सोध्नुहोस्।",
      },
    ],

    cta: {
      title: "यात्राको योजना बनाउँदै हुनुहुन्छ?",
      body: "प्रश्न छन् भने हामीलाई लेख्नुहोस्। हामी बाटो, बसाइ र गाउँका कार्यक्रमबारे जानकारी दिन सहयोग गर्नेछौँ।",
      button: "सम्पर्क गर्नुहोस्",
    },
  },
  en: {
    eyebrow: "Explore",
    title: "Travel Guide",
    lead: "Planning a trip to Ghormu? Current weather, directions, what to bring and practical tips, all in one place.",

    weather: {
      eyebrow: "Live weather",
      title: "Weather in Ghormu now",
      feelsLike: "Feels like",
      humidity: "Humidity",
      wind: "Wind",
      rain: "Rain",
      sunrise: "Sunrise",
      sunset: "Sunset",
      forecastTitle: "Next 7 days",
      today: "Today",
      rainChance: "Chance of rain",
      updated: "Updated",
      nepalTime: "Nepal time",
      elevation: "Elevation",
      elevationValue: "about {m} m above sea level",
      credit: "Weather data",
      unavailable: "The weather can't be loaded right now. Please check again shortly.",
      note: "The forecast updates every 30 minutes. Mountain weather can change quickly, so check again before you set off.",
      conditions: {
        clear: "Clear sky",
        partly: "Partly cloudy",
        cloudy: "Cloudy",
        fog: "Fog",
        drizzle: "Drizzle",
        rain: "Rain",
        snow: "Snow",
        showers: "Showers",
        thunder: "Thunderstorm",
      },
    },

    location: {
      title: "Where is Ghormu?",
      body: "Google Maps works out the route, distance and travel time to Ghormu from wherever you are.",
      directions: "Get directions in Google Maps",
      openStreetMap: "View on OpenStreetMap",
      coordinates: "Coordinates",
    },

    road: {
      title: "Road and trail conditions",
      levels: {
        open: "Road open",
        caution: "Travel with caution",
        closed: "Road blocked",
        unknown: "Update coming",
      },
      unknownBody: "Road conditions haven't been updated yet. Check with locals before you travel.",
      checked: "Checked on",
    },

    route: {
      title: "Getting there",
      steps: [] as { title: string; body: string }[],
      pending: "Details on buses, jeeps, fares and the route will be added soon. Until then, contact us or locals before you travel for current information.",
      tipsTitle: "Things to keep in mind on the way",
      tips: [
        "Start early; hill roads can take longer than expected.",
        "Landslides can block roads in the monsoon; check conditions before you leave.",
        "Arrange your transport and return trip in advance.",
      ],
      contact: "Contact us",
    },

    pack: {
      title: "What to bring",
      lead: "Even when days are warm, mornings and evenings can be cold. Pack for the season.",
      items: [
        { title: "Warm layers", body: "A jacket and layers for mornings and evenings." },
        { title: "Rain jacket or umbrella", body: "Essential, especially in the monsoon." },
        { title: "Sturdy shoes", body: "For steep, uneven and slippery paths." },
        { title: "Torch or headlamp", body: "For walking at night and power cuts." },
        { title: "Power bank", body: "Charging may not always be available." },
        { title: "Cash", body: "There may be no ATM in the village." },
        { title: "Medicines", body: "Your regular medicines and a basic first-aid kit." },
        { title: "Water bottle", body: "Bring your own to cut plastic waste." },
      ],
    },

    stay: {
      title: "Where to stay and eat",
      body: "A list of places to stay and eat is being prepared. For now, contact us and we'll put you in touch with locals.",
    },

    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "When is the best time to visit Ghormu?",
        a: "Autumn (September–November) and spring (March–May) are generally the best. The Tourism page has details for each season.",
      },
      {
        q: "How reliable is the weather shown here?",
        a: "It is a forecast for the area from an open weather model, updated every 30 minutes. Mountain weather changes quickly, so treat it as a guide.",
      },
      {
        q: "Can I withdraw cash in the village?",
        a: "There may be no ATM in the village. Bring the cash you need.",
      },
      {
        q: "How do I know if the road is open?",
        a: "See 'Road and trail conditions' on this page. If it hasn't been updated, ask us or locals before you travel.",
      },
    ],

    cta: {
      title: "Planning your trip?",
      body: "If you have questions, write to us. We'll help with information on the route, places to stay and village events.",
      button: "Contact us",
    },
  },
})
