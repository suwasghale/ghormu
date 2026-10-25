import { bilingual } from "./bilingual"

/**
 * Tourism. Seasons and travel advice are general to Nepal's hills; routes,
 * distances, accommodation and prices belong in the Travel Guide once they
 * are confirmed.
 */
export default bilingual({
  ne: {
    eyebrow: "घुमफिर",
    title: "पर्यटन",
    lead: "घोर्मु गाउँलेहरू बस्ने र काम गर्ने गाउँ हो। यहाँ आउने पाहुना पैदल बाटो हिँड्छन्, आँगनमा बसेर चिया खान्छन्, र गाउँको दिन कसरी बित्छ नजिकबाट देख्छन्।",
    whyTitle: "किन घोर्मु?",
    why: [
      { title: "शान्त डाँडा र वन", body: "वनको बाटो, खोलानाला र उपत्यकापारिको दृश्य।" },
      { title: "घरमै मनाइने चाड", body: "ल्होसार र दशैँ परिवार र छिमेकीसँग घरमै मनाइन्छ।" },
      { title: "डाँडासम्मका गोरेटा", body: "गाउँबाट दृश्यस्थलसम्म उक्लने पैदल बाटो।" },
      { title: "ढोकामै खादा", body: "पाहुनालाई खादा ओढाएर स्वागत गरिन्छ।" },
    ],
    seasonsTitle: "घुम्ने उपयुक्त समय",
    seasonsLead: "पहाडमा ऋतुअनुसार मौसम धेरै फरक हुन्छ। हिँड्नुअघि मौसम र बाटोको अवस्था बुझ्नुहोस्।",
    recommended: "उत्तम समय",
    seasons: [
      { name: "वसन्त", months: "चैत–जेठ · मार्च–मे", body: "न्यानो मौसम, फूल र हरियालीले भरिएका डाँडाकाँडा। पदयात्राका लागि राम्रो।", best: true },
      { name: "वर्षा", months: "असार–भदौ · जुन–अगस्ट", body: "चारैतिर हरियाली, तर बाटो चिप्लो हुन्छ र पहिरोको जोखिम रहन्छ।", best: false },
      { name: "शरद", months: "असोज–मंसिर · सेप्टेम्बर–नोभेम्बर", body: "सफा आकाश र खुला दृश्य। दशैँ-तिहारको रमझम पनि यही बेला।", best: true },
      { name: "हिउँद", months: "पुस–फागुन · डिसेम्बर–फेब्रुअरी", body: "चिसो तर प्रायः सफा मौसम। न्यानो लुगा अनिवार्य।", best: false },
    ],
    experiencesTitle: "के गर्ने?",
    experiences: [
      { title: "पैदल यात्रा", body: "गाउँका गोरेटो हुँदै दृश्यस्थलसम्म हिँड्नुहोस्।" },
      { title: "धार्मिक र ऐतिहासिक स्थल", body: "चोर्तेन, माने र प्रार्थना झण्डा।" },
      { title: "स्थानीय खाना", body: "गाउँका घरमा पाकेको खाना खानुहोस्।" },
      { title: "चाडपर्व", body: "ल्होसार वा दशैँमा आउनुहोस्, जब गाउँ सबैभन्दा रमाइलो हुन्छ।" },
      { title: "फोटोग्राफी", body: "डाँडामा उज्यालो बिहान सबेरै र साँझतिर सबैभन्दा राम्रो हुन्छ।" },
    ],
    tipsTitle: "जिम्मेवार पर्यटक बनौँ",
    tips: [
      "मानिसको तस्बिर खिच्नुअघि अनुमति लिनुहोस्।",
      "धार्मिक स्थलमा शालीन पहिरन लगाउनुहोस् र स्थानीय चलन मान्नुहोस्।",
      "माने र चोर्तेनलाई सधैँ दाहिने पारेर (घडीको सुईको दिशामा) परिक्रमा गर्नुहोस्।",
      "आफ्नो फोहोर आफैँसँग फर्काउनुहोस्।",
      "स्थानीय पसल, होमस्टे र उत्पादनलाई प्राथमिकता दिनुहोस्।",
      "नगद साथमा राख्नुहोस्; गाउँमा एटीएम नहुन सक्छ।",
    ],
    safetyTitle: "सुरक्षा",
    safety: [
      "आफ्नो यात्राको योजना कसैलाई जानकारी दिनुहोस्।",
      "वर्षायाममा एक्लै पदयात्रा नगर्नुहोस्।",
      "आपत्कालीन सम्पर्क नम्बर साथमा राख्नुहोस्।",
    ],
    emergencyLink: "आपत्कालीन सम्पर्क",
    moreTitle: "यात्राको योजना",
    more: [
      { title: "मुख्य आकर्षण", href: "/explore/attractions", body: "कहाँ हिँड्ने र के हेर्ने।" },
      { title: "तस्बिर संग्रह", href: "/explore/gallery", body: "गाउँ र यहाँका मानिसका तस्बिर।" },
      { title: "स्थानीय अनुभव", href: "/explore/experiences", body: "परिवारसँग खाना, चाड र हिँडाइ।" },
      { title: "यात्रा निर्देशिका", href: "/explore/travel-guide", body: "पुग्ने बाटो, बस्ने ठाउँ र तयारी।" },
    ],
  },
  en: {
    eyebrow: "Explore",
    title: "Tourism",
    lead: "Ghormu is a working village. Visitors walk the trails, have tea in a courtyard and see how the day goes here.",
    whyTitle: "Why Ghormu?",
    why: [
      { title: "Quiet hills and forest", body: "Forest paths, streams and long views across the valley." },
      { title: "Festivals kept at home", body: "Lhosar and Dashain are celebrated at home, with family and neighbours." },
      { title: "Paths up to the ridges", body: "Footpaths climb from the village to the viewpoints." },
      { title: "A khata at the door", body: "Guests are welcomed with a khata, the white scarf of greeting." },
    ],
    seasonsTitle: "When to visit",
    seasonsLead: "The weather in the hills changes a lot from season to season. Check it, and the trails, before you set out.",
    recommended: "Best time",
    seasons: [
      { name: "Spring", months: "March–May", body: "Warm weather and hillsides full of flowers and greenery. Good for hiking.", best: true },
      { name: "Monsoon", months: "June–August", body: "Lush and green everywhere, but trails get slippery and landslides are a risk.", best: false },
      { name: "Autumn", months: "September–November", body: "Clear skies and open views, and the festive season of Dashain and Tihar.", best: true },
      { name: "Winter", months: "December–February", body: "Cold but usually clear. Warm clothing is essential.", best: false },
    ],
    experiencesTitle: "Things to do",
    experiences: [
      { title: "Walking", body: "Follow the village footpaths up to the viewpoints." },
      { title: "Religious & historic sites", body: "Chortens, mani walls and prayer flags." },
      { title: "Local food", body: "Eat what's cooked in village homes." },
      { title: "Festivals", body: "Come at Lhosar or Dashain, when the village is at its liveliest." },
      { title: "Photography", body: "The light on the ridges is best early in the morning and towards evening." },
    ],
    tipsTitle: "Travel responsibly",
    tips: [
      "Ask before photographing people.",
      "Dress modestly at religious sites and follow local customs.",
      "Always walk clockwise around mani walls and chortens, keeping them on your right.",
      "Carry your rubbish back with you.",
      "Choose local shops, homestays and products.",
      "Carry cash; there may be no ATM in the village.",
    ],
    safetyTitle: "Safety",
    safety: [
      "Tell someone your travel plans.",
      "Don't hike alone during the monsoon.",
      "Keep emergency contact numbers with you.",
    ],
    emergencyLink: "Emergency contacts",
    moreTitle: "Plan your trip",
    more: [
      { title: "Attractions", href: "/explore/attractions", body: "Where to walk and what to see." },
      { title: "Gallery", href: "/explore/gallery", body: "Photographs of the village and its people." },
      { title: "Local Experiences", href: "/explore/experiences", body: "Meals, festivals and walks with families here." },
      { title: "Travel Guide", href: "/explore/travel-guide", body: "Getting there, where to stay and what to bring." },
    ],
  },
})
