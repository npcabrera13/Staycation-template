import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings } from "../types";
import { COMPANY_INFO } from "../constants";

const SETTINGS_DOC_ID = "general";
const COLLECTION_NAME = "settings";

export const DEFAULT_SETTINGS: Settings = {
    siteName: "Serenity Staycation",
    logo: "", // Default empty to show anchor
    description: "Experience the ultimate relaxation with our curated staycation packages.",
    heroImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    hero: {
        tagline: "Welcome to Paradise",
        title: "Rediscover Serenity",
        subtitle: "Luxury staycations curated for your peace of mind. Experience comfort like never before.",
        ctaText: "Explore Rooms",
        buttonColor: "", // Inherit global accent by default
        buttonTextColor: "",
        buttonFontFamily: "sans",
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
        subtitle: "Us?",
        features: [
            { title: "Curated Destinations", description: "Each property is handpicked for its unique charm and absolute comfort to ensure a remarkable stay." },
            { title: "Effortless Booking", description: "Enjoy a seamless experience with real-time availability, instant confirmation, and secure payments." },
            { title: "Personalized Service", description: "Our dedicated support team and digital concierge are always available to help you plan the perfect trip." }
        ],
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        images: []
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
        x: "https://x.com",
        tiktok: "https://tiktok.com",
        airbnb: "",
        customUrl: "",
        customLabel: ""
    },
    roomsSection: {
        title: "Our Exclusive Rooms"
    },
    footer: {
        copyrightText: "All rights reserved."
    },
    theme: {
        primaryColor: "#0D9488", // Teal 600
        primaryHoverColor: "#0F766E", // Teal 700
        secondaryColor: "#000000",
        accentColor: "#E9C46A", // Soft gold
        fontFamily: "sans"
    },
    paymentMethods: {
        gcash: {
            enabled: true,
            label: "E-Wallet",
            accountName: "",
            accountNumber: "",
            qrImage: ""
        },
        bankTransfer: {
            enabled: false,
            label: "Bank Transfer",
            bankName: "",
            accountName: "",
            accountNumber: "",
            qrImage: ""
        }
    },
    reservationPolicy: {
        requireDeposit: true,
        depositType: 'percentage',
        depositPercentage: 50,
        fixedDepositAmount: 1000,
        autoConfirmOnDeposit: true,
        cancellationPolicy: "Deposits are non-refundable if cancelled within 24 hours of check-in. Full refund available for cancellations made 7 days or more before check-in.",
        paymentDeadlineHours: 24
    },
    notifications: {
        adminEmail: "",
        sendUserConfirmation: true,
        sendAdminAlert: true,
        sendCheckInReminder: true
    },
    searchBar: {
        buttonText: "Check Availability",
        buttonColor: "", // Uses accent by default, but allows override
        buttonTextColor: "",
        buttonFontFamily: "sans"
    }
};

// Shallow merge with nested object spread - preserves saved values while filling in missing defaults
export const settingsService = {
    async getSettings(): Promise<Settings> {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        console.log("Fetching settings from:", COLLECTION_NAME, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const saved = docSnap.data() as Partial<Settings>;
            // Spread merge: saved values override defaults
            return {
                ...DEFAULT_SETTINGS,
                ...saved,
                hero: { ...DEFAULT_SETTINGS.hero, ...saved.hero },
                about: { ...DEFAULT_SETTINGS.about, ...saved.about },
                features: { ...DEFAULT_SETTINGS.features, ...saved.features },
                contact: { ...DEFAULT_SETTINGS.contact, ...saved.contact },
                social: { ...DEFAULT_SETTINGS.social, ...saved.social },
                theme: { ...DEFAULT_SETTINGS.theme, ...saved.theme },
                paymentMethods: { ...DEFAULT_SETTINGS.paymentMethods, ...saved.paymentMethods },
                reservationPolicy: { ...DEFAULT_SETTINGS.reservationPolicy, ...saved.reservationPolicy },
                notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
            } as Settings;
        } else {
            // Return defaults if not found
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(settings: Settings): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        await setDoc(docRef, settings, { merge: true });
    }
};
