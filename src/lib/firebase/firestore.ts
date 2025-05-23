"use client"; // Mark as client component if it uses hooks or client-side APIs, otherwise can be server

import type { Firestore, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, Timestamp } from 'firebase/firestore';
import type { JobApplication, Resume } from '../context/types'; // Adjust path as needed
// Note: This file is more of a placeholder for complex reusable Firestore logic.
// For this project, much of the Firestore logic is directly within providers or page components
// due to the use of onSnapshot for real-time updates which is often tied to component lifecycle.

// This is a basic example if you wanted to abstract a get operation.
export async function getDocument<T>(db: Firestore, path: string, id: string): Promise<T | null> {
  const docRef = doc(db, path, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

// Generic add document function
export async function addDocument<T extends DocumentData>(db: Firestore, collectionPath: string, data: T): Promise<string> {
  const enrichedData = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, collectionPath), enrichedData);
  return docRef.id;
}

// Generic update document function
export async function updateDocument<T extends DocumentData>(db: Firestore, docPath: string, data: Partial<T>): Promise<void> {
   const enrichedData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(doc(db, docPath), enrichedData);
}

// Generic delete document function
export async function deleteDocument(db: Firestore, docPath: string): Promise<void> {
  await deleteDoc(doc(db, docPath));
}

// Firestore Data Converters (Example for JobApplication)
// Not strictly necessary for this project given direct object mapping, but useful for complex cases.
export const jobApplicationConverter = {
  toFirestore: (application: Omit<JobApplication, 'id'>): DocumentData => {
    return { 
        ...application,
        // Convert date strings to Timestamps if stored as such
        dateApplied: application.dateApplied ? Timestamp.fromDate(new Date(application.dateApplied)) : null,
        lastUpdated: Timestamp.fromDate(new Date(application.lastUpdated)),
     };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): JobApplication => {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      title: data.title,
      company: data.company,
      platform: data.platform,
      link: data.link,
      status: data.status,
      dateApplied: (data.dateApplied as FirestoreTimestamp | null)?.toDate().toISOString(),
      lastUpdated: (data.lastUpdated as FirestoreTimestamp).toDate().toISOString(),
      notes: data.notes,
      jobDescription: data.jobDescription,
      userId: data.userId,
    } as JobApplication;
  }
};

// Add more converters or helper functions as needed.
// e.g., resumeConverter, etc.
