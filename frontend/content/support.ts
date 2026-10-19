import { bilingual } from "./bilingual"

/**
 * Support Ghormu: the page to send a potential donor to.
 *
 * The promises under `promises` are commitments made in the village's name.
 * Keep them true: if one stops being true, change it here first.
 *
 * Payment details are deliberately not published. People write in and are
 * told how to give, so account numbers are never scraped or faked.
 */
export default bilingual({
  ne: {
    eyebrow: "सहयोग",
    title: "घोर्मुलाई सहयोग गर्नुहोस्",
    lead: "गाउँका धेरै काम गाउँलेकै श्रमदान र टाढाका साथीहरूको सहयोगले सम्भव हुन्छन्। तपाईंको सानो सहयोगले पनि फरक पार्छ।",
    why: {
      title: "किन सहयोग?",
      paragraphs: [
        "घोर्मुमा परिवारहरू एकअर्काको काममा साथ दिन्छन्। विवाहमा, छेवरमा, घर बनाउँदा। गाउँको विकास पनि यसरी नै हुँदै आएको छ: सबैले आ-आफ्नो गर्छन्, र साथीहरूले थप्छन्।",
        "तपाईं गाउँकै हुनुहुन्छ वा कहिल्यै घोर्मु आउनुभएको छैन, दुवैको सहयोगको उत्तिकै मूल्य छ। पैसा मात्र होइन, सीप, समय र गाउँको कथा फैलाउनु पनि सहयोग हो।",
      ],
    },
    needs: {
      title: "अहिले सहयोग चाहिएका ठाउँ",
      lead: "यी गाउँका चलिरहेका र योजनामा रहेका आयोजना हुन्। प्रगति र खर्च विकास पृष्ठमा खुला रूपमा राखिन्छ।",
      empty: "आयोजनाहरूको विवरण तयार हुँदैछ। अहिले कहाँ सहयोग चाहिन्छ भनेर जान्न हामीलाई सम्पर्क गर्नुहोस्।",
      budget: "बजेट",
      progress: "प्रगति",
      all: "सबै आयोजना हेर्नुहोस्",
    },
    ways: {
      title: "सहयोग गर्ने तरिका",
      items: [
        {
          title: "आर्थिक सहयोग",
          body: "कुनै आयोजना वा गाउँको सामान्य कोषमा सहयोग गर्न तलको फारमबाट लेख्नुहोस्। हामी पैसा पठाउने सुरक्षित तरिका बताउनेछौँ।",
        },
        {
          title: "सीप र समय",
          body: "अनुवाद, फोटोग्राफी, पढाउने काम, स्वास्थ्य वा प्राविधिक सीप। तपाईंले जानेको कुरा गाउँका लागि ठूलो सहयोग हुन सक्छ।",
        },
        {
          title: "कथा र तस्बिर",
          body: "घोर्मुका पुराना तस्बिर, कागजात वा बुढापाकाका कथा भए डिजिटल अभिलेखमा थप्न सघाउनुहोस्।",
        },
        {
          title: "कुरा फैलाउनुहोस्",
          body: "यो वेबसाइट साथीभाइ, परिवार र संस्थाहरूसँग साझा गर्नुहोस्। धेरै मानिसले घोर्मु चिने भने धेरै ढोका खुल्छन्।",
        },
      ],
    },
    promises: {
      title: "हाम्रो वाचा",
      items: [
        "प्राप्त हरेक आर्थिक सहयोग र त्यसको खर्च विकास आयोजनाको पृष्ठमा सार्वजनिक गरिनेछ।",
        "आयोजनाको प्रगति तस्बिर र विवरणसहित समाचारमा राखिनेछ।",
        "हरेक सन्देशको जवाफ दिइनेछ।",
      ],
    },
    form: {
      title: "तपाईं कसरी सहयोग गर्न चाहनुहुन्छ?",
      lead: "छोटकरीमा लेख्नुहोस्। हामी इमेल वा फोनबाट सम्पर्क गर्नेछौँ।",
    },
  },
  en: {
    eyebrow: "Support",
    title: "Support Ghormu",
    lead: "Much of what gets done in the village is done by the villagers' own labour and the help of friends far away. Even a small contribution makes a difference.",
    why: {
      title: "Why help?",
      paragraphs: [
        "In Ghormu, families help each other: at weddings, at a Chhewar, when a house goes up. The village has always moved forward the same way: everyone does their part, and friends add to it.",
        "Whether you are from the village or have never been to Ghormu, your help counts the same. Not only money: skills, time and telling others about the village all help too.",
      ],
    },
    needs: {
      title: "Where help is needed now",
      lead: "These are the village's ongoing and planned projects. Progress and spending are published openly on the development page.",
      empty: "Project details are being prepared. Get in touch to hear where help is needed right now.",
      budget: "Budget",
      progress: "Progress",
      all: "See all projects",
    },
    ways: {
      title: "Ways to help",
      items: [
        {
          title: "Give",
          body: "To support a project or the village's general fund, write to us with the form below. We'll tell you a safe way to send money.",
        },
        {
          title: "Skills and time",
          body: "Translation, photography, teaching, health or technical skills. What you know could be a real help to the village.",
        },
        {
          title: "Stories and photos",
          body: "If you have old photos, documents or elders' stories from Ghormu, help us add them to the digital archive.",
        },
        {
          title: "Spread the word",
          body: "Share this website with friends, family and organisations. The more people know Ghormu, the more doors open.",
        },
      ],
    },
    promises: {
      title: "Our promise",
      items: [
        "Every financial contribution we receive, and how it is spent, will be published on the development projects page.",
        "Project progress will be posted in the news, with photos.",
        "Every message gets a reply.",
      ],
    },
    form: {
      title: "How would you like to help?",
      lead: "Write a few lines. We'll get back to you by email or phone.",
    },
  },
})
