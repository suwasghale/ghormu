import { bilingual } from "./bilingual"

/**
 * Contact, feedback and emergency pages.
 *
 * National emergency numbers (checked October 2026): police 100, fire 101,
 * ambulance 102 and tourist police 1144 from the UK and Canadian
 * governments' Nepal travel advice; child helpline 1098 and women
 * helpline 1145 from Ncell's emergency services list. Re-check yearly.
 *
 * `local` is for the village's own contacts (ward office, health post,
 * community leaders). Add only numbers people have agreed to publish.
 */
export const emergencyNumbers = [
  { key: "police", number: "100" },
  { key: "fire", number: "101" },
  { key: "ambulance", number: "102" },
  { key: "touristPolice", number: "1144" },
  { key: "child", number: "1098" },
  { key: "women", number: "1145" },
] as const

export default bilingual({
  ne: {
    eyebrow: "सम्पर्क",
    contact: {
      title: "सम्पर्क गर्नुहोस्",
      lead: "प्रश्न, सुझाव, पुराना तस्बिर वा यात्राबारे जिज्ञासा—जे भए पनि हामीलाई लेख्नुहोस्।",
      formTitle: "सन्देश पठाउनुहोस्",
      reply: "हामी सकेसम्म छिटो जवाफ दिनेछौँ। जवाफ दिन तपाईंको इमेल वा फोन मात्र प्रयोग गरिन्छ।",
      otherTitle: "अन्य जानकारी",
      other: [
        { href: "/contact/feedback", title: "सुझाव तथा प्रतिक्रिया", body: "वेबसाइट वा गाउँबारे सुझाव र सच्याउनुपर्ने कुरा।" },
        { href: "/contact/emergency", title: "आपत्कालीन सम्पर्क", body: "प्रहरी, एम्बुलेन्स र अन्य आपत्कालीन नम्बर।" },
        { href: "/explore/travel-guide", title: "यात्रा निर्देशिका", body: "घोर्मु आउने बाटो र अहिलेको मौसम।" },
      ],
    },
    feedback: {
      title: "सुझाव तथा प्रतिक्रिया",
      lead: "यो वेबसाइट गाउँकै हो। के राम्रो छ, के सुधार्नुपर्छ, वा कहाँ गल्ती छ—हामीलाई भन्नुहोस्।",
      helpsTitle: "यस्ता कुराले धेरै सहयोग गर्छ",
      helps: [
        "गलत वा अपुरो जानकारी सच्याउन",
        "नाम, मिति वा स्थानको सही हिज्जे",
        "थप्नुपर्ने विषय वा पृष्ठ",
        "मोबाइलमा प्रयोग गर्दा आएको समस्या",
      ],
    },
    emergency: {
      title: "आपत्कालीन सम्पर्क",
      lead: "आपत्कालमा यी नम्बरमा तुरुन्त फोन गर्नुहोस्। यी नम्बर नेपालभर निःशुल्क चल्छन्।",
      nationalTitle: "राष्ट्रिय आपत्कालीन नम्बर",
      call: "फोन गर्नुहोस्",
      numbers: {
        police: "प्रहरी",
        fire: "दमकल",
        ambulance: "एम्बुलेन्स",
        touristPolice: "पर्यटक प्रहरी",
        child: "बाल हेल्पलाइन",
        women: "महिला हेल्पलाइन",
      },
      localTitle: "गाउँका सम्पर्क",
      local: [] as { name: string; role: string; phone: string }[],
      localPending: "वडा कार्यालय, स्वास्थ्य चौकी र गाउँका जिम्मेवार व्यक्तिका नम्बर उहाँहरूको सहमतिपछि यहाँ थपिनेछन्।",
      tipsTitle: "फोन गर्दा",
      tips: [
        "शान्त रहनुहोस् र आफू कहाँ हुनुहुन्छ—गाउँ, वडा र नजिकको चिनिने ठाउँ—स्पष्ट भन्नुहोस्।",
        "के भएको हो र कति जना घाइते वा जोखिममा छन् भन्नुहोस्।",
        "उताबाट नभनेसम्म फोन नराख्नुहोस्।",
        "यात्रा अघि यी नम्बर फोनमा सेभ गर्नुहोस्; पहाडमा नेटवर्क कमजोर हुन सक्छ।",
      ],
      sources: "स्रोत: बेलायत र क्यानडा सरकारका नेपाल यात्रा सल्लाह, र एनसेलको आपत्कालीन सेवा सूची (अक्टोबर २०२६)।",
    },
    form: {
      name: "तपाईंको नाम",
      email: "इमेल",
      phone: "फोन",
      replyNote: "इमेल वा फोनमध्ये कम्तीमा एउटा दिनुहोस्।",
      topic: "विषय",
      message: "सन्देश",
      messagePlaceholder: "यहाँ लेख्नुहोस्…",
      submit: "पठाउनुहोस्",
      sending: "पठाउँदै…",
      successTitle: "धन्यवाद!",
      successBody: "तपाईंको सन्देश हामीलाई प्राप्त भयो। हामी छिट्टै सम्पर्क गर्नेछौँ।",
      another: "अर्को सन्देश पठाउनुहोस्",
      privacy: "तपाईंको विवरण जवाफ दिन मात्र प्रयोग गरिन्छ।",
      privacyLink: "गोपनीयता नीति",
      topics: {
        general: "सामान्य प्रश्न",
        feedback: "सुझाव वा प्रतिक्रिया",
        correction: "वेबसाइटमा सच्याउनुपर्ने कुरा",
        archive: "तस्बिर, कथा वा कागजात साझा गर्न",
        travel: "घोर्मु घुम्न आउने बारे",
      },
      errors: {
        name: "आफ्नो नाम लेख्नुहोस्।",
        contact: "जवाफ दिन इमेल वा फोन दिनुहोस्।",
        email: "इमेल ठेगाना मिलेन।",
        phone: "फोन नम्बर मिलेन।",
        message: "सन्देश कम्तीमा १० अक्षरको हुनुपर्छ।",
        tooMany: "धेरै पटक प्रयास भयो। केही समयपछि फेरि पठाउनुहोस्।",
        failed: "सन्देश पठाउन सकिएन। केही समयपछि फेरि प्रयास गर्नुहोस्।",
      },
    },
  },
  en: {
    eyebrow: "Contact",
    contact: {
      title: "Contact Us",
      lead: "Questions, suggestions, old photos or plans to visit: whatever it is, write to us.",
      formTitle: "Send a message",
      reply: "We'll reply as soon as we can. Your email or phone is used only to reply.",
      otherTitle: "More information",
      other: [
        { href: "/contact/feedback", title: "Feedback", body: "Suggestions about the website or the village, and things to correct." },
        { href: "/contact/emergency", title: "Emergency Contacts", body: "Police, ambulance and other emergency numbers." },
        { href: "/explore/travel-guide", title: "Travel Guide", body: "How to reach Ghormu, and the weather now." },
      ],
    },
    feedback: {
      title: "Feedback",
      lead: "This website belongs to the village. Tell us what works, what to improve, or where something is wrong.",
      helpsTitle: "These help the most",
      helps: [
        "Correcting wrong or incomplete information",
        "The right spelling of names, dates or places",
        "Topics or pages we should add",
        "Problems using the site on a phone",
      ],
    },
    emergency: {
      title: "Emergency Contacts",
      lead: "In an emergency, call these numbers right away. They are free to call anywhere in Nepal.",
      nationalTitle: "National emergency numbers",
      call: "Call",
      numbers: {
        police: "Police",
        fire: "Fire brigade",
        ambulance: "Ambulance",
        touristPolice: "Tourist police",
        child: "Child helpline",
        women: "Women's helpline",
      },
      localTitle: "Village contacts",
      local: [] as { name: string; role: string; phone: string }[],
      localPending: "Numbers for the ward office, health post and village contacts will be added here once they agree to publication.",
      tipsTitle: "When you call",
      tips: [
        "Stay calm and say clearly where you are: the village, the ward and a nearby landmark.",
        "Say what happened and how many people are hurt or at risk.",
        "Don't hang up until you are told to.",
        "Save these numbers before you travel; the network can be weak in the hills.",
      ],
      sources: "Sources: UK and Canadian government travel advice for Nepal, and Ncell's emergency services list (October 2026).",
    },
    form: {
      name: "Your name",
      email: "Email",
      phone: "Phone",
      replyNote: "Give at least an email or a phone number.",
      topic: "Topic",
      message: "Message",
      messagePlaceholder: "Write here…",
      submit: "Send",
      sending: "Sending…",
      successTitle: "Thank you!",
      successBody: "We've received your message and will be in touch soon.",
      another: "Send another message",
      privacy: "Your details are used only to reply to you.",
      privacyLink: "Privacy Policy",
      topics: {
        general: "General question",
        feedback: "Feedback or suggestion",
        correction: "Something to correct on the website",
        archive: "Sharing photos, stories or documents",
        travel: "Visiting Ghormu",
      },
      errors: {
        name: "Please write your name.",
        contact: "Give an email or a phone number so we can reply.",
        email: "That email address doesn't look right.",
        phone: "That phone number doesn't look right.",
        message: "Your message needs at least 10 characters.",
        tooMany: "Too many attempts. Please try again later.",
        failed: "The message couldn't be sent. Please try again shortly.",
      },
    },
  },
})
