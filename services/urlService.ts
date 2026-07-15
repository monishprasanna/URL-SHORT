import { getFirestoreDb, isFirebaseConfigured } from '../firebaseClient';
import { ShortenedUrl, ServiceResponse } from '../types';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';

const MOCK_DELAY = 600;
const COLLECTION_NAME = 'urls';

// In-memory storage for when Firebase is not connected
let mockStorage: ShortenedUrl[] = [];

/**
 * Creates a shortened URL.
 * If Firebase is connected, it saves to Firestore.
 * Otherwise, it saves to local memory.
 */
export const createShortUrl = async (
  originalUrl: string,
  customAlias?: string
): Promise<ServiceResponse<ShortenedUrl>> => {
  // Simple validation
  if (!originalUrl) {
    return { data: null, error: 'URL is required' };
  }

  // Basic URL validation
  try {
    new URL(originalUrl);
  } catch (e) {
    return { data: null, error: 'Invalid URL format. Please include http:// or https://' };
  }

  // Generate short code if not provided
  const shortCode = customAlias?.trim() || Math.random().toString(36).substring(2, 8);

  if (isFirebaseConfigured()) {
    const db = getFirestoreDb();
    if (!db) return { data: null, error: 'Firebase initialization failed' };

    try {
      // Check for collision first if custom alias
      if (customAlias) {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('short_code', '==', shortCode)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return { data: null, error: 'Alias already taken. Try another one.' };
        }
      }

      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        id: crypto.randomUUID(),
        original_url: originalUrl,
        short_code: shortCode,
        created_at: Timestamp.fromDate(now),
        clicks: 0,
        title: null,
      });

      const newUrl: ShortenedUrl = {
        id: docRef.id,
        original_url: originalUrl,
        short_code: shortCode,
        created_at: now.toISOString(),
        clicks: 0,
        title: null,
      };

      return { data: newUrl, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Unknown error occurred' };
    }
  } else {
    // MOCK MODE
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

    if (mockStorage.some((u) => u.short_code === shortCode)) {
      return { data: null, error: 'Alias already taken (Mock Mode).' };
    }

    const newUrl: ShortenedUrl = {
      id: crypto.randomUUID(),
      original_url: originalUrl,
      short_code: shortCode,
      created_at: new Date().toISOString(),
      clicks: 0,
      title: null,
    };

    mockStorage.unshift(newUrl);
    return { data: newUrl, error: null };
  }
};

/**
 * Retrieves the list of recently created URLs.
 */
export const getRecentUrls = async (): Promise<ServiceResponse<ShortenedUrl[]>> => {
  if (isFirebaseConfigured()) {
    const db = getFirestoreDb();
    if (!db) return { data: [], error: 'Firebase initialization failed' };

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);

      const urls: ShortenedUrl[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          original_url: data.original_url,
          short_code: data.short_code,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          clicks: data.clicks || 0,
          title: data.title || null,
        };
      });

      return { data: urls, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  } else {
    return { data: [...mockStorage], error: null };
  }
};

/**
 * Retrieves a single URL by its short code.
 */
export const getUrlByCode = async (code: string): Promise<ServiceResponse<ShortenedUrl>> => {
  if (isFirebaseConfigured()) {
    const db = getFirestoreDb();
    if (!db) return { data: null, error: 'Firebase initialization failed' };

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('short_code', '==', code)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { data: null, error: 'Not found' };
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      const url: ShortenedUrl = {
        id: doc.id,
        original_url: data.original_url,
        short_code: data.short_code,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        clicks: data.clicks || 0,
        title: data.title || null,
      };

      return { data: url, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  } else {
    const found = mockStorage.find((u) => u.short_code === code);
    return { data: found || null, error: found ? null : 'Not found' };
  }
};

/**
 * Increments the click count for a specific URL.
 */
export const incrementClicks = async (id: string): Promise<void> => {
  if (isFirebaseConfigured()) {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const urlDoc = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(urlDoc);
      
      if (!docSnap.exists()) {
        console.warn(`Document with id ${id} does not exist`);
        return;
      }

      const currentClicks = docSnap.data()?.clicks || 0;
      
      await updateDoc(urlDoc, {
        clicks: currentClicks + 1,
      });
    } catch (err) {
      console.error('Error incrementing clicks:', err);
    }
  } else {
    const found = mockStorage.find((u) => u.id === id);
    if (found) found.clicks++;
  }
};
