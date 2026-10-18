import { bilingual } from "./bilingual"

/**
 * FAQ, privacy, terms, accessibility and the sitemap page.
 *
 * The privacy policy describes what the code actually does. If you add
 * analytics, embeds, a newsletter or any other new data flow, update it in
 * the same change. `updated` is the date shown on the policy pages.
 */
export default bilingual({
  ne: {
    updated: "अन्तिम पटक अद्यावधिक: २०२६ अक्टोबर १८",
    faq: {
      eyebrow: "सहायता",
      title: "बारम्बार सोधिने प्रश्न",
      lead: "ghormu.com, घोर्मु घुम्न आउने र समुदाय पोर्टलबारे प्रायः सोधिने प्रश्नहरू।",
      groups: [
        {
          title: "वेबसाइटबारे",
          items: [
            {
              q: "ghormu.com किन बनाइएको हो?",
              a: "घोर्मुको इतिहास र संस्कृति जोगाउन, गाउँ र विदेशमा रहेका घोर्मुवासीलाई जोड्न, र समुदायका कार्यक्रम तथा सहयोगको अभिलेख सुरक्षित राख्न।",
            },
            { q: "वेबसाइट कुन-कुन भाषामा छ?", a: "अहिले नेपाली र अंग्रेजीमा। पछि अन्य भाषा पनि थपिनेछन्।" },
            {
              q: "वेबसाइटले मेरो जानकारी राख्छ?",
              a: "सामान्य रूपमा घुम्दा केही राखिँदैन; कुनै विज्ञापन वा ट्र्याकिङ छैन। सम्पर्क फारम भर्नुभयो भने जवाफ दिन मात्र विवरण राखिन्छ। विस्तृत जानकारी गोपनीयता नीतिमा छ।",
            },
          ],
        },
        {
          title: "योगदान",
          items: [
            {
              q: "म कसरी योगदान दिन सक्छु?",
              a: "पुराना तस्बिर, कथा, कागजात, सुधारका सुझाव वा अनुवादमा सहयोग गर्न सक्नुहुन्छ। सम्पर्क पृष्ठबाट हामीलाई लेख्नुहोस्।",
            },
            {
              q: "मैले पठाएको तस्बिर कसरी प्रकाशित हुन्छ?",
              a: "तस्बिरमा देखिने व्यक्ति वा परिवारको अनुमति पक्का भएपछि मात्र प्रकाशित गरिन्छ, र योगदानकर्ताको नाम उल्लेख गरिन्छ।",
            },
            {
              q: "मेरो तस्बिर हटाउन मिल्छ?",
              a: "मिल्छ। तस्बिरको पृष्ठमा रहेको 'हटाउन वा सच्याउन अनुरोध' लिंकबाट वा सम्पर्क फारमबाट भन्नुहोस्।",
            },
          ],
        },
        {
          title: "घुमफिर",
          items: [
            {
              q: "घोर्मु घुम्न कहिले जाँदा राम्रो?",
              a: "सामान्यतया शरद (असोज–मंसिर) र वसन्त (चैत–जेठ) सबैभन्दा उपयुक्त मानिन्छन्। यात्रा निर्देशिकामा अहिलेको मौसम पनि हेर्न सकिन्छ।",
            },
            { q: "गाउँमा पैसा निकाल्न सकिन्छ?", a: "गाउँमा एटीएम नहुन सक्छ। आवश्यक नगद साथमा लिएर आउनुहोस्।" },
          ],
        },
        {
          title: "समुदाय पोर्टल",
          items: [
            {
              q: "समुदाय पोर्टल के हो?",
              a: "समुदायहरूले आफ्ना परिवार, कार्यक्रम र सहयोगको हिसाब राख्ने सुरक्षित प्रणाली हो।",
            },
            {
              q: "पोर्टल कसले प्रयोग गर्न सक्छ?",
              a: "हरेक समुदायका अधिकृत व्यवस्थापक र आफ्नो परिवारको विवरण हेर्न पाउने सदस्यले मात्र। एउटा समुदायको विवरण अर्को समुदायले हेर्न पाउँदैन।",
            },
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "सहायता",
      title: "गोपनीयता नीति",
      lead: "ghormu.com ले कुन जानकारी राख्छ, किन राख्छ, र तपाईंका अधिकार के-के हुन्।",
      sections: [
        {
          title: "छोटकरीमा",
          body: [
            "यो वेबसाइट घुम्दा तपाईंको व्यक्तिगत जानकारी लिइँदैन। यहाँ कुनै विज्ञापन, एनालिटिक्स वा ट्र्याकिङ छैन। तपाईंले आफैँ पठाउनुभएको जानकारी मात्र राखिन्छ, र त्यो पनि तोकिएको कामका लागि मात्र प्रयोग गरिन्छ।",
          ],
        },
        {
          title: "सम्पर्क र प्रतिक्रिया फारम",
          body: [
            "फारमबाट पठाउनुभएको नाम, इमेल वा फोन, विषय र सन्देश तपाईंलाई जवाफ दिन राखिन्छ। सन्देश वेबसाइट व्यवस्थापकको इमेलमा पनि पठाइन्छ। यो जानकारी अधिकृत व्यवस्थापकले मात्र हेर्छन्, र कहिल्यै बेचिँदैन वा अरूलाई दिइँदैन।",
            "सन्देश आवश्यक रहेसम्म मात्र राखिन्छ। तपाईं आफ्नो सन्देश मेटाउन अनुरोध गर्न सक्नुहुन्छ।",
          ],
        },
        {
          title: "कुकी",
          body: [
            "भाषा छनोट सम्झन एउटा कुकी (locale) राखिन्छ, जसले तपाईंले रोजेको भाषा मात्र सम्झन्छ। समुदाय पोर्टलमा साइन इन गर्दा सुरक्षित रूपमा साइन इन राख्न आवश्यक कुकीहरू राखिन्छन्। ट्र्याकिङ वा विज्ञापन कुकी प्रयोग गरिँदैन।",
          ],
        },
        {
          title: "प्राविधिक जानकारी",
          body: [
            "सुरक्षा र दुरुपयोग रोक्न सर्भरले आईपी ठेगाना र ब्राउजरजस्ता प्राविधिक जानकारी छोटो समयका लागि राख्छ। मौसमको जानकारी हाम्रो सर्भरले आफैँ ल्याउँछ, र फन्टहरू यही वेबसाइटबाट आउँछन्; त्यसैले तपाईंको ब्राउजर ती सेवासँग सिधै जोडिँदैन।",
          ],
        },
        {
          title: "समुदाय पोर्टल",
          body: [
            "पोर्टलमा परिवार र सहयोगसम्बन्धी विवरण अधिकृत व्यक्तिले मात्र हेर्न पाउँछन्। एउटा समुदायको विवरण अर्को समुदायलाई देखिँदैन, र परिवारले आफ्नो मात्र विवरण हेर्छ।",
          ],
        },
        {
          title: "अभिलेखका तस्बिर",
          body: [
            "पुराना तस्बिर र कागजात अनुमति पक्का भएपछि मात्र प्रकाशित गरिन्छ। तस्बिरमा आफू वा आफ्नो परिवार भएमा हटाउन वा सच्याउन अनुरोध गर्न सक्नुहुन्छ।",
          ],
        },
        {
          title: "बाहिरी लिंक",
          body: [
            "Google Maps वा OpenStreetMap जस्ता बाहिरी वेबसाइटको लिंक थिच्दा ती वेबसाइटका आफ्नै गोपनीयता नीति लागू हुन्छन्।",
          ],
        },
        {
          title: "तपाईंका अधिकार",
          body: [
            "तपाईंको बारेमा राखिएको जानकारी हेर्न, सच्याउन वा मेटाउन अनुरोध गर्न सक्नुहुन्छ। हामी नेपालको वैयक्तिक गोपनीयतासम्बन्धी ऐन, २०७५ को सम्मान गर्छौँ। अनुरोधका लागि सम्पर्क फारम प्रयोग गर्नुहोस्।",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "सहायता",
      title: "प्रयोगका सर्तहरू",
      lead: "ghormu.com प्रयोग गर्दा लागू हुने सर्तहरू।",
      sections: [
        {
          title: "सामग्रीको स्वामित्व",
          body: [
            "यस वेबसाइटका लेख, तस्बिर र अन्य सामग्री घोर्मु समुदाय र योगदानकर्ताहरूका हुन्। व्यक्तिगत र गैर-व्यावसायिक प्रयोगका लागि स्रोत उल्लेख गरी लेख साझा गर्न सकिन्छ। तस्बिर अनुमतिबिना पुनः प्रयोग नगर्नुहोस्।",
          ],
        },
        {
          title: "जानकारीको शुद्धता",
          body: [
            "हामी सही जानकारी दिने प्रयास गर्छौँ, तर बाटो, मौसम र यात्रासम्बन्धी जानकारी छिट्टै फेरिन सक्छ। मौसम पूर्वानुमान मात्र हो। यात्रा अघि स्थानीयसँग पक्का गर्नुहोस्।",
          ],
        },
        {
          title: "तपाईंले पठाउने सामग्री",
          body: [
            "तस्बिर, कथा वा कागजात पठाउँदा त्यो साझा गर्ने अधिकार तपाईंसँग छ भनी पुष्टि गर्नुहुन्छ, र तपाईंको नामसहित यहाँ प्रकाशित गर्न अनुमति दिनुहुन्छ। तपाईं जुनसुकै बेला अनुमति फिर्ता लिन सक्नुहुन्छ।",
          ],
        },
        {
          title: "उचित प्रयोग",
          body: [
            "वेबसाइट वा फारमको दुरुपयोग, स्प्याम, वा प्रणालीमा अनधिकृत पहुँचको प्रयास गर्न पाइँदैन।",
          ],
        },
        {
          title: "समुदाय पोर्टल",
          body: [
            "पोर्टल अधिकृत प्रयोगकर्ताका लागि मात्र हो। आफ्नो पासवर्ड गोप्य राख्नुहोस्, र देखेको विवरण आफ्नो जिम्मेवारीमा मात्र प्रयोग गर्नुहोस्।",
          ],
        },
        {
          title: "परिवर्तन",
          body: ["यी सर्तहरू समयसँगै अद्यावधिक हुन सक्छन्। अद्यावधिक मिति यही पृष्ठमा देखिन्छ।"],
        },
      ],
    },
    accessibility: {
      eyebrow: "सहायता",
      title: "पहुँचयोग्यता",
      lead: "ghormu.com सबैका लागि—बुढापाका, दृष्टिविहीन, र कमजोर इन्टरनेट भएका प्रयोगकर्तासमेत—सजिलो होस् भन्ने हाम्रो लक्ष्य हो।",
      goal: "हामी WCAG 2.2 को AA स्तर पूरा गर्ने लक्ष्य राख्छौँ।",
      doneTitle: "हामीले गरेका कुरा",
      done: [
        "नेपाली र अंग्रेजी दुवैमा सामग्री, र हरेक पृष्ठमा सही भाषा जनाइएको",
        "किबोर्डबाट मात्र पनि चलाउन मिल्ने, र फोकस स्पष्ट देखिने",
        "मुख्य सामग्रीमा सिधै जाने लिंक",
        "स्क्रिन रिडरका लागि लेबल र तस्बिरको वर्णन",
        "कम गति चाहनेका लागि एनिमेसन बन्द हुने",
        "मोबाइल र ठूलो अक्षर (२००% सम्म जुम) मा पनि मिल्ने",
        "कमजोर इन्टरनेटमा पनि छिटो खुल्ने हलुका पृष्ठ",
      ],
      limitsTitle: "थाहा भएका सीमाहरू",
      limits: [
        "केही पुराना स्क्यान गरिएका कागजातको पूरा पाठ छैन।",
        "समाचारसँग जोडिएका केही PDF कागजात स्क्रिन रिडरमा राम्रोसँग नपढिन सक्छन्।",
      ],
      feedbackTitle: "समस्या भेट्नुभयो?",
      feedbackBody: "कुनै पृष्ठ प्रयोग गर्न गाह्रो भयो भने हामीलाई भन्नुहोस्। हामी सच्याउने प्रयास गर्नेछौँ।",
      feedbackCta: "प्रतिक्रिया दिनुहोस्",
    },
    sitemap: {
      eyebrow: "सहायता",
      title: "साइट नक्सा",
      lead: "ghormu.com का सबै पृष्ठहरू एकै ठाउँमा।",
      other: "अन्य",
    },
  },
  en: {
    updated: "Last updated: 18 October 2026",
    faq: {
      eyebrow: "Help",
      title: "Frequently Asked Questions",
      lead: "Common questions about ghormu.com, visiting Ghormu and the community portal.",
      groups: [
        {
          title: "About the website",
          items: [
            {
              q: "Why was ghormu.com created?",
              a: "To preserve Ghormu's history and culture, to connect people from Ghormu in the village and abroad, and to keep a safe record of community events and contributions.",
            },
            { q: "Which languages is the website in?", a: "Nepali and English for now. More languages will be added later." },
            {
              q: "Does the website keep my information?",
              a: "Not when you simply browse: there are no ads and no tracking. If you use the contact form, your details are kept only to reply. The Privacy Policy has the details.",
            },
          ],
        },
        {
          title: "Contributing",
          items: [
            {
              q: "How can I contribute?",
              a: "Share old photos, stories or documents, suggest corrections, or help with translation. Write to us from the contact page.",
            },
            {
              q: "How are the photos I send published?",
              a: "Only once the people in them, or their families, have agreed, and always with the contributor credited.",
            },
            {
              q: "Can my photo be removed?",
              a: "Yes. Use the 'Request removal or a correction' link on the photo's page, or the contact form.",
            },
          ],
        },
        {
          title: "Visiting",
          items: [
            {
              q: "When is the best time to visit Ghormu?",
              a: "Autumn (September–November) and spring (March–May) are generally the best. The Travel Guide also shows the weather right now.",
            },
            { q: "Can I withdraw cash in the village?", a: "There may be no ATM in the village. Bring the cash you need." },
          ],
        },
        {
          title: "Community portal",
          items: [
            {
              q: "What is the community portal?",
              a: "A secure system where communities keep records of their families, events and contributions.",
            },
            {
              q: "Who can use the portal?",
              a: "Only each community's authorised administrators, and members who can see their own family's records. No community can see another's.",
            },
          ],
        },
      ],
    },
    privacy: {
      eyebrow: "Help",
      title: "Privacy Policy",
      lead: "What ghormu.com keeps, why it keeps it, and your rights.",
      sections: [
        {
          title: "In short",
          body: [
            "Browsing this website collects no personal information about you. There are no ads, no analytics and no tracking. We keep only what you choose to send us, and use it only for the purpose you sent it.",
          ],
        },
        {
          title: "Contact and feedback forms",
          body: [
            "The name, email or phone, topic and message you send through a form are kept so we can reply. The message is also emailed to the site's administrators. Only authorised administrators see it, and it is never sold or passed on.",
            "Messages are kept only as long as they are needed. You can ask for your message to be deleted.",
          ],
        },
        {
          title: "Cookies",
          body: [
            "One cookie (locale) remembers the language you chose, and nothing else. Signing in to the community portal sets the cookies needed to keep you signed in securely. No tracking or advertising cookies are used.",
          ],
        },
        {
          title: "Technical information",
          body: [
            "For security and to prevent abuse, the server briefly keeps technical information such as IP addresses and browser type. Our server fetches the weather itself, and fonts are served from this website, so your browser does not connect to those services directly.",
          ],
        },
        {
          title: "Community portal",
          body: [
            "Family and contribution records in the portal are visible only to authorised people. One community's records are never shown to another, and a family sees only its own.",
          ],
        },
        {
          title: "Archive photographs",
          body: [
            "Old photos and documents are published only once permission is confirmed. If you or your family appear in one, you can ask for it to be removed or corrected.",
          ],
        },
        {
          title: "External links",
          body: [
            "When you follow a link to another website, such as Google Maps or OpenStreetMap, that website's own privacy policy applies.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "You can ask to see, correct or delete information we hold about you. We respect Nepal's Individual Privacy Act, 2075 (2018). Use the contact form for any request.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Help",
      title: "Terms of Use",
      lead: "The terms that apply when you use ghormu.com.",
      sections: [
        {
          title: "Ownership of content",
          body: [
            "Articles, photos and other content on this website belong to the Ghormu community and its contributors. You may share articles for personal, non-commercial purposes with credit. Please don't reuse photos without permission.",
          ],
        },
        {
          title: "Accuracy",
          body: [
            "We try to keep information accurate, but roads, weather and travel details can change quickly. The weather is a forecast only. Check with locals before you travel.",
          ],
        },
        {
          title: "What you send us",
          body: [
            "When you send photos, stories or documents, you confirm you have the right to share them and allow us to publish them here with your name. You can withdraw that permission at any time.",
          ],
        },
        {
          title: "Fair use",
          body: ["Misusing the website or its forms, spamming, or attempting unauthorised access is not allowed."],
        },
        {
          title: "Community portal",
          body: [
            "The portal is for authorised users only. Keep your password private, and use the records you see responsibly.",
          ],
        },
        {
          title: "Changes",
          body: ["These terms may be updated over time. The date of the latest update is shown on this page."],
        },
      ],
    },
    accessibility: {
      eyebrow: "Help",
      title: "Accessibility",
      lead: "We want ghormu.com to work for everyone, including elders, people using screen readers, and people on slow internet.",
      goal: "We aim to meet WCAG 2.2 at level AA.",
      doneTitle: "What we've done",
      done: [
        "Content in Nepali and English, with each page's language declared",
        "Fully usable with a keyboard, with clearly visible focus",
        "A link to skip straight to the main content",
        "Labels for screen readers and descriptions for images",
        "Animations switched off for people who prefer reduced motion",
        "Works on phones and with large text (zoom up to 200%)",
        "Lightweight pages that load quickly on slow connections",
      ],
      limitsTitle: "Known limitations",
      limits: [
        "Some older scanned documents don't yet have their full text.",
        "Some PDF documents attached to notices may not read well with screen readers.",
      ],
      feedbackTitle: "Found a problem?",
      feedbackBody: "If any page is hard to use, please tell us. We'll do our best to fix it.",
      feedbackCta: "Send feedback",
    },
    sitemap: {
      eyebrow: "Help",
      title: "Sitemap",
      lead: "Every page on ghormu.com in one place.",
      other: "More",
    },
  },
})
