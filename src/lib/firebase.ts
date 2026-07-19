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

export type UserRole = "pending" | "user premium" | "reseller" | "admin owner";

export interface UserData {
  email: string;
  role: UserRole;
  addedAt?: string;
  name?: string;
  location?: string;
  lastLoginAt?: string;
}

/**
 * Checks a user's role from Firestore, or assigns 'pending' if new.
 */
export const getUserRole = async (email: string, name?: string): Promise<UserRole> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return "pending";

  const hardcodedAdmins = ["s.a.ghozi@gmail.com", "sulthanalighozi@gmail.com"];
  
  const dbInstance = getFirebaseDb();
  if (!dbInstance) return "pending";

  try {
    const docRef = doc(dbInstance, "users", normalized);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserData;
      // Auto upgrade hardcoded admins if their role is less than admin owner
      if (hardcodedAdmins.includes(normalized) && data.role !== "admin owner") {
         await setDoc(docRef, { role: "admin owner" }, { merge: true });
         return "admin owner";
      }
      return data.role || "pending";
    } else {
      // Create new user with pending role, or admin owner if hardcoded
      const initialRole: UserRole = hardcodedAdmins.includes(normalized) ? "admin owner" : "pending";
      await setDoc(docRef, {
        email: normalized,
        name: name || "",
        role: initialRole,
        addedAt: new Date().toISOString(),
      });
      return initialRole;
    }
  } catch (err) {
    console.error("Firestore get role failed:", err);
    return "pending";
  }
};

/**
 * Logs the user's activity and location
 */
export const updateUserActivity = async (email: string, locationStr: string): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, "users", normalized), {
        location: locationStr,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }
};

/**
 * Fetches all users from Firestore
 */
export const getAllUsers = async (): Promise<UserData[]> => {
  const dbInstance = getFirebaseDb();
  let firestoreList: UserData[] = [];
  if (dbInstance) {
    try {
      const querySnapshot = await getDocs(collection(dbInstance, "users"));
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserData;
        if (data && data.email) {
          firestoreList.push({
            ...data,
            email: data.email.trim().toLowerCase(),
            role: data.role || "pending"
          });
        }
      });
    } catch (err) {
      console.error("Failed to fetch users from Firestore:", err);
    }
  }
  return firestoreList;
};

/**
 * Updates a user's role (Firestore strictly)
 */
export const updateUserRole = async (email: string, newRole: UserRole, executorRole: UserRole): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  if (normalized === "s.a.ghozi@gmail.com" || normalized === "sulthanalighozi@gmail.com") {
    throw new Error("Tidak dapat mengubah role milik Admin Utama (Owner).");
  }

  // Permission Checks
  if (executorRole !== "admin owner" && executorRole !== "reseller") {
     throw new Error("Anda tidak memiliki izin untuk mengubah role.");
  }
  
  if (executorRole === "reseller") {
     if (newRole === "reseller" || newRole === "admin owner") {
        throw new Error("Reseller hanya bisa memberikan role 'user premium'.");
     }
  }

  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, "users", normalized), {
        role: newRole,
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update user role:", err);
      throw err;
    }
  } else {
    throw new Error("Koneksi Firestore tidak aktif.");
  }
};

/**
 * Removes a user entirely (Firestore strictly)
 */
export const removeUser = async (email: string, executorRole: UserRole): Promise<void> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  if (normalized === "s.a.ghozi@gmail.com" || normalized === "sulthanalighozi@gmail.com") {
    throw new Error("Tidak dapat menghapus Admin Utama (Owner).");
  }

  if (executorRole !== "admin owner") {
     throw new Error("Hanya Admin Owner yang dapat menghapus user secara permanen.");
  }

  const dbInstance = getFirebaseDb();
  if (dbInstance) {
    try {
      await deleteDoc(doc(dbInstance, "users", normalized));
    } catch (err) {
      console.error("Failed to delete user:", err);
      throw err;
    }
  } else {
    throw new Error("Koneksi Firestore tidak aktif.");
  }
};
