import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc } from "firebase/firestore";
import { Booking } from "../types";

const COLLECTION_NAME = "bookings";

export const bookingService = {
    async getAll(): Promise<Booking[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
    },

    async getByEmail(email: string): Promise<Booking[]> {
        const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
    },

    // Use this to add a booking with a specific ID (preserves the ID from BookingModal)
    async set(booking: Booking): Promise<Booking> {
        const { id, ...bookingData } = booking;
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, bookingData);
        return booking;
    },

    async add(booking: Omit<Booking, 'id'>): Promise<Booking> {
        // Ensure we don't save the ID field if it somehow leaked into the object
        const { id, ...bookingData } = booking as any;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), bookingData);
        return { id: docRef.id, ...bookingData };
    },

    async update(id: string, data: Partial<Booking>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
