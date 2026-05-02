import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const uploadToImgBB = async (imageFile: File, providedApiKey?: string): Promise<string> => {
    let apiKey = providedApiKey;
    
    if (!apiKey) {
        // Try fetching from Firestore settings
        try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                if (data.imgbb?.apiKey) {
                    apiKey = data.imgbb.apiKey;
                }
            }
        } catch (error) {
            console.error("Error fetching ImgBB settings from Firestore:", error);
        }
    }

    // Fallback to env
    if (!apiKey) {
        apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    }

    if (!apiKey) {
        throw new Error("ImgBB API key is missing. Please configure it in SuperAdmin settings or .env file.");
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload image to ImgBB');
    }

    return data.data.url;
};
