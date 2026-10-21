import type { MapPlaceCategory } from "@/lib/api/content"

import { bilingual } from "./bilingual"

/**
 * The 3D village map. Places themselves come from the admin; this is the
 * page's own copy, the map controls' labels and the honest note on how
 * accurate each layer is.
 */
export default bilingual({
  ne: {
    eyebrow: "घुमफिर",
    title: "घोर्मु ३D मा",
    lead: "डाँडा घुमाउनुहोस्, झुकाउनुहोस् र नजिक गएर हेर्नुहोस्। विद्यालय, बाटो र गाउँका सार्वजनिक ठाउँहरू नक्सामा छन्।",
    village: "घोर्मु",
    credits:
      "तस्बिर: Sentinel-2 cloudless २०२४, EOX IT Services GmbH (CC BY-NC-SA 4.0, परिमार्जित Copernicus Sentinel डेटा) · भू-आकृति: Mapzen, AWS Open Data",
    googleCredits: "३D तस्बिर र भू-आकृति: Google · उचाइ: SRTM (Mapzen, AWS Open Data)",
    placesTitle: "नक्साका ठाउँहरू",
    noPlaces: "अहिलेसम्म नक्सामा कुनै ठाउँ थपिएको छैन।",
    loading: "नक्सा खुल्दैछ…",
    unsupported:
      "यो ब्राउजरमा ३D नक्सा खुल्न सकेन। ठाउँहरू तलको सूचीबाट Google Maps मा हेर्न सक्नुहुन्छ।",
    hint: "घुमाउन वा झुकाउन दायाँ क्लिक गरेर तान्नुहोस्। फोनमा दुई औँलाले।",
    googleHint: "सार्न तान्नुहोस्, नजिक-टाढा गर्न स्क्रोल गर्नुहोस्, घुमाउन वा झुकाउन Ctrl थिचेर तान्नुहोस्।",
    close: "बन्द गर्नुहोस्",
    reset: "सुरुको दृश्य",
    showOnMap: "नक्सामा देखाउनुहोस्",
    directions: "Google Maps मा बाटो",
    altitude: "समुद्री सतहबाट करिब {m} मिटर",
    categories: {
      sacred: "धार्मिक स्थल",
      school: "विद्यालय",
      water: "पानीको मुहान",
      viewpoint: "दृश्यस्थल",
      trail: "बाटो",
      community: "सामुदायिक ठाउँ",
      health: "स्वास्थ्य",
      other: "अन्य",
    } satisfies Record<MapPlaceCategory, string>,
    controls: {
      "Map.Title": "घोर्मुको ३D नक्सा",
      "NavigationControl.ZoomIn": "नजिक",
      "NavigationControl.ZoomOut": "टाढा",
      "NavigationControl.ResetBearing": "उत्तरतर्फ फर्काउनुहोस्",
      "FullscreenControl.Enter": "पूरा स्क्रिन",
      "FullscreenControl.Exit": "पूरा स्क्रिनबाट निस्कनुहोस्",
      "TerrainControl.Enable": "३D भू-आकृति देखाउनुहोस्",
      "TerrainControl.Disable": "३D भू-आकृति लुकाउनुहोस्",
      "AttributionControl.ToggleAttribution": "नक्साको स्रोत",
      "Popup.Close": "बन्द गर्नुहोस्",
      "ScaleControl.Meters": "मि",
      "ScaleControl.Kilometers": "कि.मि.",
      "CooperativeGesturesHandler.WindowsHelpText": "नक्सा ठूलो-सानो गर्न Ctrl थिचेर स्क्रोल गर्नुहोस्",
      "CooperativeGesturesHandler.MacHelpText": "नक्सा ठूलो-सानो गर्न ⌘ थिचेर स्क्रोल गर्नुहोस्",
      "CooperativeGesturesHandler.MobileHelpText": "नक्सा सार्न दुई औँला प्रयोग गर्नुहोस्",
    },
    accuracy: {
      title: "यो नक्सा कति सही छ?",
      lead: "हरेक तह कहाँबाट आयो र त्यसको सीमा के हो, खुला रूपमा।",
      google: [
        {
          title: "तस्बिर र ३D",
          body: "यो ३D दृश्य Google को हो: Google Earth मा देखिने उही उपग्रह तस्बिर र जमिनको ३D नमुना। कुनै ठाउँको तस्बिर केही वर्ष पुरानो हुन सक्छ, त्यसैले भर्खर बनेका घर वा गएका पहिरो नदेखिन सक्छन्।",
        },
        {
          title: "उचाइ",
          body: "हरेक ठाउँको समुद्री सतहबाटको उचाइ उपग्रहले नापेको उचाइ (SRTM) बाट लिइएको हो र १० मिटरमा मिलाइएको छ। भिरालो ठाउँमा यो केही दशक मिटरसम्म फरक हुन सक्छ।",
        },
      ],
      basic: [
        {
          title: "भू-आकृति",
          body: "डाँडा र खोँचको आकार उपग्रहले नापेको उचाइबाट बनेको हो, जसमा हरेक करिब ३० मिटरमा एउटा नाप छ। त्यसैले डाँडाको आकार साँचो छ, तर गरा, घर र रूखजस्ता साना कुरा देखिँदैनन्।",
        },
        {
          title: "उपग्रह तस्बिर",
          body: "जमिनको तस्बिर सन् २०२४ को Sentinel-2 उपग्रहको हो, जसको एक पिक्सेल १० मिटर बराबर छ। त्यसैले धेरै नजिक जाँदा धमिलो देखिन्छ, र त्यसपछि बनेका कुरा नदेखिन सक्छन्।",
        },
      ],
      places: {
        title: "ठाउँहरू",
        body: "ठाउँहरू गाउँले आफैँ थप्छन्। निजी घरहरू नक्सामा राखिँदैनन्। कुनै ठाउँ गलत ठाउँमा छ वा छुटेको छ भने हामीलाई भन्नुहोस्।",
      },
      next: "गाउँको ड्रोन सर्वेक्षणले गाउँको आफ्नै तस्बिर दिनेछ: अझ स्पष्ट, कसैको सर्तमा नबाँधिएको, हरेक गरा, बाटो र छाना देखिने गरी।",
      cta: "ठाउँ सुझाव दिनुहोस्",
    },
  },
  en: {
    eyebrow: "Explore",
    title: "Ghormu in 3D",
    lead: "Turn the hills, tilt them and look closer. The school, the trails and the village's public places are on the map.",
    village: "Ghormu",
    credits:
      "Imagery: Sentinel-2 cloudless 2024 by EOX IT Services GmbH (CC BY-NC-SA 4.0, contains modified Copernicus Sentinel data) · Terrain: Mapzen, AWS Open Data",
    googleCredits: "3D imagery and terrain: Google · Altitudes: SRTM (Mapzen, AWS Open Data)",
    placesTitle: "Places on the map",
    noPlaces: "No places have been added to the map yet.",
    loading: "Opening the map…",
    unsupported:
      "The 3D map could not open in this browser. You can still open each place in Google Maps from the list below.",
    hint: "Right-click and drag to turn or tilt. On a phone, use two fingers.",
    googleHint: "Drag to move, scroll to zoom, and hold Ctrl while dragging to turn or tilt.",
    close: "Close",
    reset: "Starting view",
    showOnMap: "Show on the map",
    directions: "Directions in Google Maps",
    altitude: "About {m} m above sea level",
    categories: {
      sacred: "Sacred place",
      school: "School",
      water: "Water source",
      viewpoint: "Viewpoint",
      trail: "Trail",
      community: "Community place",
      health: "Health",
      other: "Other",
    },
    controls: {
      "Map.Title": "3D map of Ghormu",
      "NavigationControl.ZoomIn": "Zoom in",
      "NavigationControl.ZoomOut": "Zoom out",
      "NavigationControl.ResetBearing": "Face north",
      "FullscreenControl.Enter": "Full screen",
      "FullscreenControl.Exit": "Leave full screen",
      "TerrainControl.Enable": "Show 3D terrain",
      "TerrainControl.Disable": "Hide 3D terrain",
      "AttributionControl.ToggleAttribution": "Map sources",
      "Popup.Close": "Close",
      "ScaleControl.Meters": "m",
      "ScaleControl.Kilometers": "km",
      "CooperativeGesturesHandler.WindowsHelpText": "Hold Ctrl and scroll to zoom the map",
      "CooperativeGesturesHandler.MacHelpText": "Hold ⌘ and scroll to zoom the map",
      "CooperativeGesturesHandler.MobileHelpText": "Use two fingers to move the map",
    },
    accuracy: {
      title: "How accurate is this map?",
      lead: "Where each layer comes from, and where it falls short.",
      google: [
        {
          title: "Imagery and 3D",
          body: "The 3D view is Google's: the same satellite photos and 3D model of the ground as Google Earth. Google's photos of an area can be a few years old, so recent buildings or landslides may not show yet.",
        },
        {
          title: "Altitude",
          body: "Each place's height above sea level comes from satellite elevation data (SRTM), rounded to 10 metres. On steep slopes it can be off by a few tens of metres.",
        },
      ],
      basic: [
        {
          title: "Terrain",
          body: "The hills and valleys are built from heights measured by satellite, one every 30 metres or so. The shape of the ridges is true; terraces, houses and trees are too small to show.",
        },
        {
          title: "Satellite imagery",
          body: "The ground picture is from the Sentinel-2 satellite in 2024, at 10 metres a pixel. Close up it turns soft, and anything built since may not appear.",
        },
      ],
      places: {
        title: "Places",
        body: "Villagers add the places themselves. Private homes are never marked. If a place is in the wrong spot, or missing, tell us.",
      },
      next: "A drone survey of the village would give it imagery of its own, sharper still and free of anyone's terms, down to every terrace, path and roof.",
      cta: "Suggest a place",
    },
  },
})
