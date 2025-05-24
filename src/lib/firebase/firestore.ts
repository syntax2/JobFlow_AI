
"use client"; 

import type { Firestore, DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, Timestamp } from 'firebase/firestore';
import type { JobApplication, Resume } from '../context/types'; 

// This file provides utility functions for interacting with Firebase Firestore.
// While many Firestore operations in this project are co-located with their respective
// components or providers (especially those using `onSnapshot` for real-time updates),
// this file can house more generic, reusable Firestore helper functions.

/**
 * Fetches a single document from Firestore.
 * @param db - The Firestore instance.
 * @param path - The collection path (e.g., 'users').
 * @param id - The ID of the document to fetch.
 * @returns A promise that resolves to the document data (typed as T) or null if not found.
 */
export async function getDocument<T>(db: Firestore, path: string, id: string): Promise<T | null> {
  const docRef = doc(db, path, id); // Creates a reference to the document.
  const docSnap = await getDoc(docRef); // Fetches the document snapshot.
  if (docSnap.exists()) {
    // If the document exists, return its data along with its ID.
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  // If the document does not exist, return null.
  return null;
}

/**
 * Adds a new document to a Firestore collection.
 * Automatically adds `createdAt` and `updatedAt` Timestamps.
 * @param db - The Firestore instance.
 * @param collectionPath - The path to the collection where the document will be added.
 * @param data - The data for the new document.
 * @returns A promise that resolves to the ID of the newly created document.
 */
export async function addDocument<T extends DocumentData>(db: Firestore, collectionPath: string, data: T): Promise<string> {
  // Enrich data with server timestamps for creation and update times.
  const enrichedData = {
    ...data,
    createdAt: Timestamp.now(), // Firestore server timestamp.
    updatedAt: Timestamp.now(), // Firestore server timestamp.
  };
  // Add the document to the specified collection.
  const docRef = await addDoc(collection(db, collectionPath), enrichedData);
  return docRef.id; // Return the ID of the new document.
}

/**
 * Updates an existing document in Firestore.
 * Automatically updates the `updatedAt` Timestamp.
 * @param db - The Firestore instance.
 * @param docPath - The full path to the document to be updated (e.g., 'users/userId123').
 * @param data - An object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateDocument<T extends DocumentData>(db: Firestore, docPath: string, data: Partial<T>): Promise<void> {
   // Enrich data with an updated server timestamp.
   const enrichedData = {
    ...data,
    updatedAt: Timestamp.now(), // Firestore server timestamp.
  };
  // Update the document at the specified path.
  await updateDoc(doc(db, docPath), enrichedData);
}

/**
 * Deletes a document from Firestore.
 * @param db - The Firestore instance.
 * @param docPath - The full path to the document to be deleted.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteDocument(db: Firestore, docPath: string): Promise<void> {
  // Delete the document at the specified path.
  await deleteDoc(doc(db, docPath));
}

// Firestore Data Converters:
// Converters are useful for type safety and transforming data between
// its Firebase representation and your application's TypeScript types.
// Especially helpful when dealing with Timestamps, GeoPoints, or complex nested objects.

/**
 * Example Firestore data converter for JobApplication type.
 * Converts between JobApplication TypeScript objects and Firestore document data.
 */
export const jobApplicationConverter = {
  /**
   * Converts a JobApplication object to a Firestore document data object.
   * Handles Date to Timestamp conversion for date fields.
   */
  toFirestore: (application: Omit<JobApplication, 'id'>): DocumentData => {
    return { 
        ...application,
        // Convert date strings back to Firestore Timestamps if they are stored as such.
        // In this project, dates are stored as ISO strings, so direct conversion on write might
        // only be needed if Firestore expects Timestamp objects for specific query/indexing features.
        // For ISO strings, direct storage is fine. This is an example if Timestamps were used.
        dateApplied: application.dateApplied ? Timestamp.fromDate(new Date(application.dateApplied)) : null,
        lastUpdated: Timestamp.fromDate(new Date(application.lastUpdated)), // Always update lastUpdated timestamp
     };
  },
  /**
   * Converts a Firestore document snapshot to a JobApplication object.
   * Handles Timestamp to ISO string conversion for date fields.
   */
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions // Options for how data is read (e.g. serverTimestamps behavior)
  ): JobApplication => {
    const data = snapshot.data(options)!; // Get data using provided options.
    return {
      id: snapshot.id, // Document ID
      title: data.title,
      company: data.company,
      platform: data.platform,
      link: data.link,
      status: data.status,
      // Convert Firestore Timestamps to ISO date strings for use in the application.
      dateApplied: (data.dateApplied as FirestoreTimestamp | null)?.toDate().toISOString(),
      lastUpdated: (data.lastUpdated as FirestoreTimestamp).toDate().toISOString(),
      notes: data.notes,
      jobDescription: data.jobDescription,
      userId: data.userId,
    } as JobApplication; // Cast to JobApplication type.
  }
};

// You can add more converters for other data types (e.g., Resume) in a similar fashion if needed.
// For instance, if Resume objects had complex date fields or other Firebase-specific types,
// a resumeConverter would be beneficial.
