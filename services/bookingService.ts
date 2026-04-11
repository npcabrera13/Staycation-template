import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, orderBy } from "firebase/firestore";
import { Booking, BookingFilter } from "../types";

const COLLECTION_NAME = "bookings";

export const bookingService = {
    async getAll(): Promise<Booking[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
    },

    /**
     * Fetches bookings filtered by date range directly from Firestore.
     * This is the "smart" version that only downloads what's needed.
     * For 'all', falls back to getAll().
     */
    async getByFilter(filter: BookingFilter): Promise<Booking[]> {
        if (filter === 'all') {
            return this.getAll();
        }

        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(); // defaults to now

        switch (filter) {
            case 'this_month':
                // From the 1st of this month to now
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                // Entire previous calendar month
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); // last day of last month
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return this.getAll();
        }

        // Firestore query - only fetches documents within the date range
        // Uses checkIn because that's the most relevant date for a booking view
        const q = query(
            collection(db, COLLECTION_NAME),
            where("checkIn", ">=", startDate.toISOString()),
            where("checkIn", "<=", endDate.toISOString()),
            orderBy("checkIn", "desc")
        );

        const snapshot = await getDocs(q);
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
