import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { Room } from "../types";

const COLLECTION_NAME = "rooms";

export const roomService = {
    async getAll(): Promise<Room[]> {
        console.log("roomService: Fetching all rooms...");
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        // Spread data first, then overwrite id with doc.id to ensure we use the actual Firestore Document ID
        const rooms = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Room));
        console.log(`roomService: Fetched ${rooms.length} rooms. IDs:`, rooms.map(r => r.id));
        return rooms;
    },

    async add(room: Room): Promise<Room> {
        // Destructure id out to prevent saving it inside the document data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...roomData } = room;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), roomData);
        return { id: docRef.id, ...roomData } as Room;
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
        console.log(`roomService: Deleting room with ID: "${id}"`);
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        console.log(`roomService: Deleted room "${id}"`);
    },

    // Batch-save the `order` field for all rooms after a drag-and-drop reorder
    async reorderRooms(orderedRooms: Room[]): Promise<void> {
        const batch = writeBatch(db);
        orderedRooms.forEach((room, index) => {
            const docRef = doc(db, COLLECTION_NAME, room.id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
    },
};
