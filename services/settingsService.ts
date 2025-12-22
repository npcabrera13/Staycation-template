import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings } from "../types";
import { COMPANY_INFO } from "../constants";

const SETTINGS_DOC_ID = "general";
const COLLECTION_NAME = "settings";

export const DEFAULT_SETTINGS: Settings = {
    siteName: "Serenity Staycation",
    logo: "/vite.svg", // Default logo
    description: "Experience the ultimate relaxation with our curated staycation packages.",
    heroImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    hero: {
        title: "Rediscover Serenity",
        subtitle: "Luxury staycations curated for your peace of mind. Experience comfort like never before.",
        ctaText: "Explore Rooms",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        images: [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            "https://images.unsplash.com/photo-1571896349842-6e53ce41e887?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        slideInterval: 5000,
        overlayOpacity: 50,
        imagePosition: 'center',
        textShadow: 'sm'
    },
    about: {
        title: "Why Choose",
        subtitle: "Serenity?",
        features: [
            { title: "Handpicked Locations", description: "Every house is verified for quality, view, and comfort to ensure a magical stay." },
            { title: "Seamless Booking", description: "Real-time availability calendar, instant confirmation, and secure payments." },
            { title: "24/7 Concierge", description: "Our AI concierge and support team are always here to help you plan your trip." }
        ],
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    features: {
        title: "Stay with us",
        description: "From beachfront villas to cozy mountain cabins, each property is designed to provide the ultimate relaxation experience.",
        image: "" // Placeholder if we want a specific feature image, currently unused in main layout but good to have.
    },
    map: {
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125181.43388055636!2d119.34637195647923!3d11.224378310234497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33b7accd159567c7%3A0x64464a2a15c2823!2sEl%20Nido%2C%20Palawan!5e0!3m2!1sen!2sph!4v1709536251859!5m2!1sen!2sph"
    },
    contact: {
        address: COMPANY_INFO.address,
        phone: COMPANY_INFO.phone,
        email: COMPANY_INFO.email,
        title: "Find Us in Paradise",
        description: "Located in the heart of the Philippines' most beautiful islands. Visit our main office or book a stay at one of our exclusive properties."
    },
    social: {
        facebook: COMPANY_INFO.facebook,
        instagram: COMPANY_INFO.instagram,
        twitter: "https://twitter.com",
        tiktok: "https://tiktok.com"
    },
    roomsSection: {
        title: "Our Exclusive Rooms"
    },
    footer: {
        copyrightText: "All rights reserved."
    },
    theme: {
        primaryColor: "#2563EB",
        primaryHoverColor: "#1d4ed8",
        secondaryColor: "#1E40AF"
    },
    paymentMethods: {
        gcash: {
            enabled: true,
            accountName: "",
            accountNumber: "",
            qrImage: ""
        },
        bankTransfer: {
            enabled: false,
            bankName: "",
            accountName: "",
            accountNumber: "",
            qrImage: ""
        },
        messengerLink: ""
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
