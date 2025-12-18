import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { Booking } from "../types";

const COLLECTION_NAME = "bookings";

export const bookingService = {
    async getAll(): Promise<Booking[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    },

    async getByEmail(email: string): Promise<Booking[]> {
        const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    },

    async add(booking: Omit<Booking, 'id'>): Promise<Booking> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), booking);
        return { id: docRef.id, ...booking };
    },

    async update(id: string, data: Partial<Booking>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
