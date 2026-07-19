import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, Firestore } from "firebase/firestore";
import appletConfig from "../../firebase-applet-config.json";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  databaseId?: string;
}

// Default/mock config or config from env or applet json config
export const getEnvFirebaseConfig = (): FirebaseConfig | null => {
  // Try to use newly provisioned applet configuration first
  if (appletConfig && appletConfig.apiKey && appletConfig.authDomain && appletConfig.projectId) {
    // Check if placeholder values from a default or template
    if (
      appletConfig.apiKey.includes("remixed") ||
      appletConfig.projectId.includes("remixed") ||
      appletConfig.apiKey === ""
    ) {
      // Return null so the app knows it is not configured yet with a real Firebase project
      return null;
    }
    return {
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket || "",
      messagingSenderId: appletConfig.messagingSenderId || "",
      appId: appletConfig.appId || "",
      databaseId: appletConfig.firestoreDatabaseId || "",
    };
  }

  const metaEnv = (import.meta as any).env || {};
  const apiKey = metaEnv.VITE_FIREBASE_API_KEY;
  const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = metaEnv.VITE_FIREBASE_APP_ID;
  const databaseId = metaEnv.VITE_FIREBASE_DATABASE_ID;

  if (apiKey && authDomain && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: storageBucket || "",
      messagingSenderId: messagingSenderId || "",
      appId: appId || "",
      databaseId: databaseId || "",
    };
  }
  return null;
};

export const getSavedFirebaseConfig = (): FirebaseConfig | null => {
  const saved = localStorage.getItem("cyber_firebase_config");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem("cyber_firebase_config", JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem("cyber_firebase_config");
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: FirebaseConfig): { app: FirebaseApp; auth: Auth; db: Firestore } => {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Delete the existing default app to avoid duplicate initialization errors
      for (const existingApp of existingApps) {
        deleteApp(existingApp).catch(() => {});
      }
    }
    app = initializeApp(config);
    auth = getAuth(app);
    // Initialize Firestore with custom databaseId if configured
    db = config.databaseId ? getFirestore(app, config.databaseId) : getFirestore(app);
    return { app, auth, db };
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    throw e;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  if (auth) return auth;
  const config = getSavedFirebaseConfig() || getEnvFirebaseConfig();
  if (config) {
    try {
      const initialized = initFirebase(config);
      return initialized.auth;
    } catch (e) {
      console.error("Firebase lazy init failed:", e);
      return null;
    }
  }
  return null;
};

export const getFirebaseDb = (): Firestore | null => {
  if (db) return db;
  const config = getSavedFirebaseConfig() || getEnvFirebaseConfig();
  if (config) {
    try {
      const initialized = initFirebase(config);
      return initialized.db;
    } catch (e) {
      console.error("Firebase lazy DB init failed:", e);
      return null;
    }
  }
  return null;
};

export const getGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  // Request profile and email scopes
  provider.addScope("profile");
  provider.addScope("email");
  return provider;
};

/**
 * Checks if a user email is present in the authorized whitelist (strictly Firestore database)
 */
export const checkEmailWhitelist = async (email: string): Promise<boolean> => {
  const normalized = email.trim().toLowerCase();
  
  // Permanent system admins
  const hardcodedAdmins = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
  if (hardcodedAdmins.includes(normalized)) {
    return true;
  }

  // Check Firestore (No local storage fallback for strict security)
  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      const docRef = doc(dbInstance, "whitelist_emails", normalized);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().allowed !== false) {
        return true;
      }
    } catch (err) {
      console.error("Firestore whitelist check failed:", err);
    }
  }

  return false;
};

/**
 * Fetches all allowed email addresses
 */
export const getWhitelistedEmails = async (): Promise<string[]> => {
  const dbInstance = getFirebaseDb();
  const defaultList = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
  
  let firestoreList: string[] = [];
  if (dbInstance) {
    try {
      const querySnapshot = await getDocs(collection(dbInstance, "whitelist_emails"));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.email && data.allowed !== false) {
          firestoreList.push(data.email.trim().toLowerCase());
        }
      });
    } catch (err) {
      console.error("Failed to fetch from Firestore:", err);
    }
  }

  // Combine lists and de-duplicate
  const combined = Array.from(new Set([
    ...defaultList,
    ...firestoreList
  ])).filter(Boolean);

  return combined;
};

/**
 * Adds an email to the allowed list (Firestore strictly)
 */
export const addWhitelistedEmail = async (email: string): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  // Add to Firestore
  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, "whitelist_emails", normalized), {
        email: normalized,
        allowed: true,
        addedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save to Firestore:", err);
      throw err;
    }
  } else {
    throw new Error("Firestore database connection is inactive.");
  }
};

/**
 * Removes an email from the allowed list (Firestore strictly)
 */
export const removeWhitelistedEmail = async (email: string): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  if (normalized === "s.a.ghozi@gmail.com" || normalized === "sulthanalighozi@gmail.com") {
    throw new Error("Cannot remove primary administrator account from whitelist.");
  }

  // Remove from Firestore
  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "whitelist_emails", normalized));
    } catch (err) {
      console.error("Failed to delete from Firestore:", err);
      throw err;
    }
  } else {
    throw new Error("Firestore database connection is inactive.");
  }
};
