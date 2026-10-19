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
    lead: "घोर्मु रिसोर्ट होइन, गाउँलेहरू बस्ने र काम गर्ने गाउँ हो। यहाँ आउने पाहुनाले पैदल बाटो हिँड्न, आँगनमा बस्न र गाउँको जीवन नजिकबाट हेर्न पाउँछन्।",
    whyTitle: "किन घोर्मु?",
    why: [
      { title: "प्रकृति", body: "डाँडाकाँडा, वन र खोलानालाको शान्त वातावरण।" },
      { title: "संस्कृति", body: "चाडपर्व र संस्कार देखाउनका लागि होइन, गाउँलेकै जीवनको हिस्सा हुन्।" },
      { title: "पदयात्रा", body: "गाउँ वरपरका पैदल मार्ग र दृश्यस्थल।" },
      { title: "आतिथ्य", body: "पाहुनालाई खादा ओढाएर स्वागत गरिन्छ।" },
    ],
    seasonsTitle: "घुम्ने उपयुक्त समय",
    seasonsLead: "हरेक ऋतुको आफ्नै सौन्दर्य छ। यात्रा अघि मौसम र बाटोको अवस्था बुझ्नुहोस्।",
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
      { title: "धार्मिक र ऐतिहासिक स्थल", body: "गाउँको आस्था र इतिहाससँग जोडिएका ठाउँ घुम्नुहोस्।" },
      { title: "स्थानीय खाना", body: "गाउँघरमा पाकेका परम्परागत परिकार चाख्नुहोस्।" },
      { title: "चाडपर्व", body: "ल्होसार वा दशैँजस्ता चाडमा गाउँको रमझम अनुभव गर्नुहोस्।" },
      { title: "फोटोग्राफी", body: "बिहान-बेलुकाको उज्यालोमा डाँडा र गाउँको दृश्य कैद गर्नुहोस्।" },
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
      { title: "मुख्य आकर्षण", href: "/explore/attractions", body: "हेर्नैपर्ने ठाउँहरू।" },
      { title: "तस्बिर संग्रह", href: "/explore/gallery", body: "घोर्मुका दृश्य र क्षणहरू।" },
      { title: "स्थानीय अनुभव", href: "/explore/experiences", body: "गाउँलेसँगै बिताउने समय।" },
      { title: "यात्रा निर्देशिका", href: "/explore/travel-guide", body: "पुग्ने बाटो, बस्ने ठाउँ र तयारी।" },
    ],
  },
  en: {
    eyebrow: "Explore",
    title: "Tourism",
    lead: "Ghormu is not a resort. It is a working village, where visitors can walk the trails, sit in a courtyard and see how life goes here.",
    whyTitle: "Why Ghormu?",
    why: [
      { title: "Nature", body: "The calm of hills, forests and streams." },
      { title: "Culture", body: "Festivals and rites here are not a show; they are part of village life." },
      { title: "Hiking", body: "Walking trails and viewpoints around the village." },
      { title: "Hospitality", body: "Guests are welcomed with a khata, the white scarf of greeting." },
    ],
    seasonsTitle: "When to visit",
    seasonsLead: "Every season has its own beauty. Check the weather and trail conditions before you travel.",
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
      { title: "Religious & historic sites", body: "Visit places tied to the village's faith and history." },
      { title: "Local food", body: "Taste traditional dishes cooked in village homes." },
      { title: "Festivals", body: "Experience the village in celebration at Lhosar or Dashain." },
      { title: "Photography", body: "Capture the hills and village in morning and evening light." },
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
      { title: "Attractions", href: "/explore/attractions", body: "Places you shouldn't miss." },
      { title: "Gallery", href: "/explore/gallery", body: "Views and moments from Ghormu." },
      { title: "Local Experiences", href: "/explore/experiences", body: "Time spent with the villagers." },
      { title: "Travel Guide", href: "/explore/travel-guide", body: "Getting there, where to stay and what to bring." },
    ],
  },
})
