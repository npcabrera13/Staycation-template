import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Room } from "../types";

const COLLECTION_NAME = "rooms";

export const roomService = {
    async getAll(): Promise<Room[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    },

    async add(room: Omit<Room, 'id'>): Promise<Room> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), room);
        return { id: docRef.id, ...room };
    },

    // Used for seeding with specific IDs
    async set(room: Room): Promise<void> {
        await setDoc(doc(db, COLLECTION_NAME, room.id), room);
    },

    async update(id: string, data: Partial<Room>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    }
};
