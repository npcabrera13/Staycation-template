import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings } from "../types";
import { COMPANY_INFO } from "../constants";

const SETTINGS_DOC_ID = "general";
const COLLECTION_NAME = "settings";

export const DEFAULT_SETTINGS: Settings = {
    siteName: "Serenity Staycation",
    description: "Experience the ultimate relaxation with our curated staycation packages.",
    heroImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    hero: {
        title: "Rediscover Serenity",
        subtitle: "Luxury staycations curated for your peace of mind. Experience comfort like never before.",
        ctaText: "Explore Rooms",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    },
    features: {
        title: "Stay with us",
        description: "From beachfront villas to cozy mountain cabins, each property is designed to provide the ultimate relaxation experience.",
        image: "" // Placeholder if we want a specific feature image, currently unused in main layout but good to have.
    },
    map: {
        address: COMPANY_INFO.address,
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.859663673369!2d121.0486333153676!3d14.550172989836376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c88a2a88372b%3A0x624831cc8d41fe03!2sBonifacio%20Global%20City%2C%20Taguig%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1647833534567!5m2!1sen!2sph"
    },
    contact: {
        address: COMPANY_INFO.address,
        phone: COMPANY_INFO.phone,
        email: COMPANY_INFO.email,
        socials: {
            facebook: COMPANY_INFO.facebook,
            instagram: COMPANY_INFO.instagram
        }
    },
    theme: {
        primaryColor: "#2563EB", // Blue-600
        secondaryColor: "#1E40AF" // Blue-800
    }
};

export const settingsService = {
    async getSettings(): Promise<Settings> {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        console.log("Fetching settings from:", COLLECTION_NAME, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as Settings;
        } else {
            // Return defaults if not found (and maybe create them lazily)
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(settings: Settings): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        await setDoc(docRef, settings, { merge: true });
    }
};
