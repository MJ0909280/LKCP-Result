import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  query, 
  where,
  terminate,
  setLogLevel
} from "firebase/firestore";

dotenv.config();

// Silence verbose internal Firestore SDK gRPC stream/connection retry warnings/errors in the console/stderr
try {
  setLogLevel("silent");
} catch (logErr) {
  console.warn("Failed to set Firestore log level to silent:", logErr);
}

const app = express();
const PORT = 3000;

// Ensure JSON parsing is enabled
app.use(express.json());

// Initialize Firebase securely server-side using the local applet configurations
let db: any;
let dbDefault: any;

async function initFirebase() {
  try {
    let firebaseConfig: any;
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    
    try {
      console.log(`Loading Firebase configurations from: ${configPath}`);
      const fileContent = await fs.readFile(configPath, "utf-8");
      firebaseConfig = JSON.parse(fileContent);
    } catch (e) {
      console.log("firebase-applet-config.json not found, attempting to read from environment variables...");
      if (process.env.FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      } else {
        // Fallback to individual environment variables
        firebaseConfig = {
          apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAnmwufw2XWibN1-kXA0ipm8gOH2UxsUtQ",
          authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0852121768.firebaseapp.com",
          projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0852121768",
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0852121768.firebasestorage.app",
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "427557354151",
          appId: process.env.FIREBASE_APP_ID || "1:427557354151:web:c4ecd823051003f6943982",
          measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
          firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-74adde1c-5f78-4165-bc31-730788215dd5"
        };
      }
    }

    if (!firebaseConfig.apiKey) {
      throw new Error("Missing Firebase API Key configuration.");
    }

    const firebaseApp = initializeApp(firebaseConfig);
    const hasCustomDbId = firebaseConfig.firestoreDatabaseId && 
                          firebaseConfig.firestoreDatabaseId !== "(default)" &&
                          firebaseConfig.firestoreDatabaseId !== "";

    let candidateDefault: any;
    try {
      candidateDefault = getFirestore(firebaseApp);
      console.log("Standard default '(default)' Firestore database instance created.");
    } catch (err) {
      console.error("Error creating default database instance:", err);
    }

    // Set fallback baseline: dbDefault always references candidateDefault so we never lose previous standard data fallback capabilities
    dbDefault = candidateDefault;
    db = candidateDefault;

    if (hasCustomDbId) {
      console.log(`Using custom database ID '${firebaseConfig.firestoreDatabaseId}' as primary database with automated default fallback.`);
      try {
        db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      } catch (err) {
        console.error("Error initializing custom Firestore database client instance:", err);
      }
    } else {
      console.log("No custom database ID defined or it is '(default)'. Using standard '(default)' database as primary.");
    }

    console.log("Firebase connection initialized successfully on server backend.");
  } catch (error) {
    console.error("WARNING: Failed to load firebase-applet-config.json or initialize Firebase. Server will continue to boot:", error);
  }
}

// Global Firestore Error Handler matching Security spec instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "SERVER_ADMIN_ROLE_BYPASS",
      email: "writingandreserching18@gmail.com"
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// Global Caches for super fast, sub-millisecond response times
let examListCache: any[] | null = null;
const lookupResultCache = new Map<string, any>();

// Invalidates and clears database caches to ensure real-time data accuracy
function clearServerCache() {
  examListCache = null;
  lookupResultCache.clear();
  console.log("Server-side live database cache cleared and invalidated.");
}

// API: Database Connection and Health Status Check
app.get("/api/dbStatus", (req, res) => {
  try {
    const isCustomActive = !!db && (db !== dbDefault) && dbDefault !== null;
    const isDefaultActive = !!db;
    
    res.json({
      connected: !!db,
      mode: isCustomActive ? "custom" : (isDefaultActive ? "default_fallback" : "offline"),
      customDbId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-74adde1c-5f78-4165-bc31-730788215dd5",
      statusText: isCustomActive 
        ? "Connected to Primary Custom Database" 
        : "Connected to Default Standard Database Fallback"
    });
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// API: Get Exam List from live Firestore DB or memory cache
app.get("/api/getExamList", async (req, res) => {
  try {
    if (examListCache) {
      return res.json(examListCache);
    }
    
    let list: any[] = [];
    
    // Try custom db first
    try {
      const examsCol = collection(db, "exams");
      const snapshot = await getDocs(examsCol);
      list = snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.warn("Failed fetching exams from custom db, falling back:", err);
    }

    // Try default db and merge unique exam names
    if (dbDefault) {
      try {
        const defaultCol = collection(dbDefault, "exams");
        const snapshotDefault = await getDocs(defaultCol);
        const listDefault = snapshotDefault.docs.map(doc => doc.data());
        
        // Merge unique ones
        const existingNames = new Set(list.map(e => String(e.EXAM_NAME).toUpperCase().trim()));
        for (const item of listDefault) {
          const itemExamName = String(item.EXAM_NAME).toUpperCase().trim();
          if (!existingNames.has(itemExamName)) {
            list.push(item);
            existingNames.add(itemExamName);
          }
        }
      } catch (err) {
        console.warn("Failed fetching exams from default db:", err);
      }
    }

    examListCache = list;
    res.json(list);
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.LIST, "exams");
    res.status(500).json({ error: err.message });
  }
});

// API: Create Exam in live Firestore DB
app.post("/api/createExam", async (req, res) => {
  try {
    const { examName, examDate } = req.body;
    if (!examName || !examDate) {
      return res.status(400).json({ error: "Exam Name and/or Exam Date is missing." });
    }

    const normalizedExamName = String(examName).toUpperCase().replace(/\s+/g, "").trim();

    // Check custom first
    const examDocRef = doc(db, "exams", normalizedExamName);
    let nameExists = false;
    try {
      const examSnapshot = await getDoc(examDocRef);
      if (examSnapshot.exists()) {
        nameExists = true;
      }
    } catch (e) {
      console.warn("Checking exam in custom db failed:", e);
    }

    // Check default if not found in custom
    if (!nameExists && dbDefault) {
      try {
        const fallbackRef = doc(dbDefault, "exams", normalizedExamName);
        const fallbackSnapshot = await getDoc(fallbackRef);
        if (fallbackSnapshot.exists()) {
          nameExists = true;
        }
      } catch (e) {
        console.warn("Checking exam in default db failed:", e);
      }
    }

    if (nameExists) {
      return res.status(400).json({ error: `An exam named '${normalizedExamName}' already exists!` });
    }

    const payload = {
      EXAM_NAME: normalizedExamName,
      EXAM_DATE: examDate
    };

    // Write to custom
    try {
      await setDoc(examDocRef, payload);
    } catch (e) {
      console.error("Failed writing exam to custom db:", e);
    }

    // Write to default / fallback
    if (dbDefault) {
      try {
        const fallbackRef = doc(dbDefault, "exams", normalizedExamName);
        await setDoc(fallbackRef, payload);
      } catch (e) {
        console.error("Failed writing exam to default db:", e);
      }
    }

    // Invalidate Cache for newly added data
    clearServerCache();

    res.json({ success: true, examName: normalizedExamName });
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.WRITE, "exams");
    res.status(500).json({ error: err.message });
  }
});

// API: Add Student Row to Exam in live Firestore DB
app.post("/api/addStudentToExam", async (req, res) => {
  try {
    const { examName, student } = req.body;
    if (!examName || !student) {
      return res.status(400).json({ error: "Exam Name or Student data missing." });
    }

    const normalizedExamName = String(examName).toUpperCase().trim();

    // Verify if that exam actually exists first in custom or default
    let examExists = false;
    try {
      const examDocRef = doc(db, "exams", normalizedExamName);
      const examSnapshot = await getDoc(examDocRef);
      if (examSnapshot.exists()) examExists = true;
    } catch (e) {
      console.warn("Exam exists check failed on custom db:", e);
    }

    if (!examExists && dbDefault) {
      try {
        const fallbackRef = doc(dbDefault, "exams", normalizedExamName);
        const fallbackSnapshot = await getDoc(fallbackRef);
        if (fallbackSnapshot.exists()) examExists = true;
      } catch (e) {
        console.warn("Exam exists check failed on default db:", e);
      }
    }

    if (!examExists) {
      return res.status(404).json({ error: `Exam Sheet '${normalizedExamName}' does not exist!` });
    }

    // Format new student output payload matching entity validation
    const newStudent = {
      STUDENT_NAME: String(student.STUDENT_NAME).toUpperCase().trim(),
      EXAM_ID: String(student.EXAM_ID).toUpperCase().trim(),
      CURRENT_BELT: String(student.CURRENT_BELT).toUpperCase().trim(),
      ACHIEVED_BELT: String(student.ACHIEVED_BELT).toUpperCase().trim(),
      GRADE: String(student.GRADE).toUpperCase().trim(),
      RESULT: String(student.RESULT).toUpperCase().trim(),
      CONGRATULATION_MSG: String(student.CONGRATULATION_MSG).toUpperCase().trim(),
      EXAM_DATE: student.EXAM_DATE,
      EXAM_NAME: normalizedExamName
    };

    const resultDocId = `${normalizedExamName}_${newStudent.EXAM_ID}`;

    // Store in custom
    try {
      const resultDocRef = doc(db, "results", resultDocId);
      await setDoc(resultDocRef, newStudent);
    } catch (e) {
      console.error("Failed storing student to custom db:", e);
    }

    // Store in default
    if (dbDefault) {
      try {
        const fallbackResultRef = doc(dbDefault, "results", resultDocId);
        await setDoc(fallbackResultRef, newStudent);
      } catch (e) {
        console.error("Failed storing student to default db:", e);
      }
    }

    // Invalidate Cache for newly added data
    clearServerCache();

    res.json({ success: true });
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.WRITE, "results");
    res.status(500).json({ error: err.message });
  }
});

// API: Register Student for Belt Exam online
app.post("/api/registerStudent", async (req, res) => {
  try {
    const { student } = req.body;
    if (!student || !student.STUDENT_NAME || !student.EXAM_NAME) {
      return res.status(400).json({ error: "Required registration details are missing." });
    }

    const registrationId = "REG-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    const newReg = {
      STUDENT_NAME: String(student.STUDENT_NAME).toUpperCase().trim(),
      CURRENT_BELT: String(student.CURRENT_BELT).toUpperCase().trim(),
      APPEARING_BELT: String(student.APPEARING_BELT).toUpperCase().trim(),
      BRANCH_NAME: String(student.BRANCH_NAME || "").trim(),
      COACH_NAME: String(student.COACH_NAME || "").trim(),
      FEES_STATUS: String(student.FEES_STATUS || "NOT PAID").toUpperCase().trim(),
      SCHOOL_NAME: String(student.SCHOOL_NAME || "").trim(),
      EXAM_NAME: String(student.EXAM_NAME).toUpperCase().trim(),
      REGISTRATION_DATE: student.REGISTRATION_DATE || new Date().toISOString().split('T')[0],
      STATUS: "PENDING"
    };

    // Write to custom
    try {
      const regDocRef = doc(db, "registrations", registrationId);
      await setDoc(regDocRef, newReg);
    } catch (e) {
      console.error("Failed registering student to custom db:", e);
    }

    // Write to default
    if (dbDefault) {
      try {
        const fallbackRegRef = doc(dbDefault, "registrations", registrationId);
        await setDoc(fallbackRegRef, newReg);
      } catch (e) {
        console.error("Failed registering student to default db:", e);
      }
    }

    res.json({ success: true, registrationId });
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.WRITE, "registrations");
    res.status(500).json({ error: err.message });
  }
});

// API: Get online registrations
app.get("/api/getRegistrations", async (req, res) => {
  try {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // Load from custom
    try {
      const regCol = collection(db, "registrations");
      const snapshot = await getDocs(regCol);
      for (const d of snapshot.docs) {
        list.push({ id: d.id, ...d.data() });
        seenIds.add(d.id);
      }
    } catch (err) {
      console.warn("Failed fetching registrations from custom db:", err);
    }

    // Load from default
    if (dbDefault) {
      try {
        const defaultRegCol = collection(dbDefault, "registrations");
        const defaultSnapshot = await getDocs(defaultRegCol);
        for (const d of defaultSnapshot.docs) {
          if (!seenIds.has(d.id)) {
            list.push({ id: d.id, ...d.data() });
            seenIds.add(d.id);
          }
        }
      } catch (err) {
        console.warn("Failed fetching registrations from default db:", err);
      }
    }

    res.json(list);
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.LIST, "registrations");
    res.status(500).json({ error: err.message });
  }
});

// API: Grade online registration draft and publish to official result ledger
app.post("/api/gradeRegistration", async (req, res) => {
  try {
    const { registrationId, examId, grade, result, achievedBelt, congratulationMsg } = req.body;
    if (!registrationId || !examId || !grade || !result || !achievedBelt) {
       return res.status(400).json({ error: "Missing required grading credentials." });
    }

    let regData: any = null;

    // Get registration from custom db
    try {
      const regDocRef = doc(db, "registrations", registrationId);
      const regSnapshot = await getDoc(regDocRef);
      if (regSnapshot.exists()) {
        regData = regSnapshot.data();
      }
    } catch (e) {
      console.warn("Could not find registration on custom db during grade:", e);
    }

    // Get from default if not found
    if (!regData && dbDefault) {
      try {
        const fallbackRegRef = doc(dbDefault, "registrations", registrationId);
        const fallbackRegSnapshot = await getDoc(fallbackRegRef);
        if (fallbackRegSnapshot.exists()) {
          regData = fallbackRegSnapshot.data();
        }
      } catch (e) {
        console.warn("Could not find registration on default db during grade:", e);
      }
    }

    if (!regData) {
      return res.status(404).json({ error: "Registration record does not exist." });
    }

    const normalizedExamName = String(regData.EXAM_NAME).toUpperCase().trim();
    const cleanExamId = String(examId).toUpperCase().trim();

    // Verify if duplicate inside 'results' collection already exists in custom or default
    const resultDocId = `${normalizedExamName}_${cleanExamId}`;
    let resultExists = false;
    
    try {
      const resultDocRef = doc(db, "results", resultDocId);
      const resultSnapshot = await getDoc(resultDocRef);
      if (resultSnapshot.exists()) resultExists = true;
    } catch (e) {
      console.warn("Failed checking duplicate result inside custom db:", e);
    }

    if (!resultExists && dbDefault) {
      try {
        const defaultResultDocRef = doc(dbDefault, "results", resultDocId);
        const defaultResultSnapshot = await getDoc(defaultResultDocRef);
        if (defaultResultSnapshot.exists()) resultExists = true;
      } catch (e) {
        console.warn("Failed checking duplicate result inside default db:", e);
      }
    }

    if (resultExists) {
      return res.status(400).json({ error: `A result record with Exam ID: '${cleanExamId}' already exists in this cycle!` });
    }

    const newStudentResult = {
      STUDENT_NAME: regData.STUDENT_NAME,
      EXAM_ID: cleanExamId,
      CURRENT_BELT: regData.CURRENT_BELT,
      ACHIEVED_BELT: String(achievedBelt).toUpperCase().trim(),
      GRADE: String(grade).toUpperCase().trim(),
      RESULT: String(result).toUpperCase().trim(),
      CONGRATULATION_MSG: String(congratulationMsg || "").toUpperCase().trim(),
      EXAM_DATE: regData.REGISTRATION_DATE,
      EXAM_NAME: normalizedExamName
    };

    // Store in custom
    try {
      const resultDocRef = doc(db, "results", resultDocId);
      await setDoc(resultDocRef, newStudentResult);
      const regDocRef = doc(db, "registrations", registrationId);
      await setDoc(regDocRef, { ...regData, STATUS: "GRADED" });
    } catch (e) {
      console.error("Failed grading on custom db:", e);
    }

    // Store in default
    if (dbDefault) {
      try {
        const defaultResultDocRef = doc(dbDefault, "results", resultDocId);
        await setDoc(defaultResultDocRef, newStudentResult);
        const defaultRegDocRef = doc(dbDefault, "registrations", registrationId);
        await setDoc(defaultRegDocRef, { ...regData, STATUS: "GRADED" });
      } catch (e) {
        console.error("Failed grading on default db:", e);
      }
    }

    clearServerCache();

    res.json({ success: true, studentName: regData.STUDENT_NAME, examId: cleanExamId });
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.WRITE, "registrations");
    res.status(500).json({ error: err.message });
  }
});

// API: Lookup Result for a student in an exam
app.get("/api/lookupResult", async (req, res) => {
  try {
    const examName = String(req.query.exam || "").toUpperCase().trim();
    const studentName = String(req.query.student || "").toUpperCase().trim();
    const examId = String(req.query.id || "").toUpperCase().trim();

    if (!examName || !studentName || !examId) {
      return res.status(400).json({ found: false, error: "Missing required lookup parameters." });
    }

    // Cache lookup key
    const cacheKey = `${examName}_${examId}_${studentName}`;
    if (lookupResultCache.has(cacheKey)) {
      console.log(`[Cache Hit] Serving cached result for: ${cacheKey}`);
      return res.json(lookupResultCache.get(cacheKey));
    }

    let snapshotDocs: any[] = [];

    // Query custom db first
    try {
      const resultsCol = collection(db, "results");
      const q = query(
        resultsCol, 
        where("EXAM_NAME", "==", examName),
        where("EXAM_ID", "==", examId)
      );
      const snapshot = await getDocs(q);
      snapshotDocs = snapshot.docs.map(d => d.data());
    } catch (err) {
      console.warn("Failed fetching results from custom db during lookup:", err);
    }

    // If we didn't find any documents, query default db as a fallback
    if (snapshotDocs.length === 0 && dbDefault) {
      try {
        const defaultResultsCol = collection(dbDefault, "results");
        const defaultQ = query(
          defaultResultsCol, 
          where("EXAM_NAME", "==", examName),
          where("EXAM_ID", "==", examId)
        );
        const defaultSnapshot = await getDocs(defaultQ);
        snapshotDocs = defaultSnapshot.docs.map(d => d.data());
      } catch (err) {
        console.warn("Failed fetching results from default db during lookup:", err);
      }
    }

    // Robust search match on student name
    const foundRecord = snapshotDocs.find((s: any) => s.STUDENT_NAME.toUpperCase().trim() === studentName);

    if (foundRecord) {
      const responsePayload = { found: true, data: foundRecord };
      lookupResultCache.set(cacheKey, responsePayload);
      return res.json(responsePayload);
    } else {
      const responsePayload = { found: false };
      lookupResultCache.set(cacheKey, responsePayload);
      return res.json(responsePayload);
    }
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.LIST, "results");
    res.status(500).json({ found: false, error: err.message });
  }
});

// API: Get Public Link (simulated for Localhost / Cloud Run routing)
app.get("/api/getPublicLink", (req, res) => {
  const examName = String(req.query.examName || "").trim();
  // Dynamically extract the hostname and protocol from the request
  let host = req.get("host") || "ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app";
  
  // Cleanly handle developer containers and internal sandboxes to point strictly to the public shared URL
  if (host.includes("ais-dev") || host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0") || host.includes("aistudio")) {
    host = "ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app";
  }
  
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  res.json({ url: `${baseUrl}?exam=${encodeURIComponent(examName)}` });
});

// Integrate Vite (Dev) or Static Server (Prod)
async function migrateDataFromDefaultToCustom() {
  if (!db || !dbDefault || db === dbDefault) {
    console.log("No data migration needed: custom database matches standard default or isn't active.");
    return;
  }

  console.log("-----------------------------------------------------------------");
  console.log("STARTING SEAMLESS BACKEND DATA MIGRATION TO NEW CUSTOM DATABASE...");
  console.log(`From default standard fallback database to custom database ID: ${process.env.FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-74adde1c-5f78-4165-bc31-730788215dd5"}`);
  console.log("-----------------------------------------------------------------");

  const collectionsToMigrate = ["exams", "registrations", "results"];

  for (const colName of collectionsToMigrate) {
    try {
      const sourceCol = collection(dbDefault, colName);
      const snapshot = await getDocs(sourceCol);
      if (snapshot.empty) {
        console.log(`Collection '${colName}' in the default fallback database is empty. Skipping.`);
        continue;
      }

      console.log(`Detecting previous data: Found ${snapshot.size} documents in default database's '${colName}'. Syncing...`);
      let migratedCount = 0;
      for (const docSnap of snapshot.docs) {
        const docId = docSnap.id;
        const docData = docSnap.data();

        // Write directly to the new custom database instance
        const destDocRef = doc(db, colName, docId);
        await setDoc(destDocRef, docData);
        migratedCount++;
      }
      console.log(`SUCCESS: Migrated ${migratedCount} documents for collection '${colName}' into custom database.`);
    } catch (err: any) {
      console.error(`Error migrating collection '${colName}':`, err);
    }
  }
  
  // Invalidate any local frontend lists so they grab the fresh migrated data
  examListCache = null;
  console.log("SEAMLESS BACKEND DATA MIGRATION TO CURRENT LIVE DATABASE COMPLETED.");
  console.log("-----------------------------------------------------------------");
}

async function setupViteOrStatic() {
  // Initialize connection to Firestore
  await initFirebase();

  // Run automatic database migration
  await migrateDataFromDefaultToCustom();

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    console.log("Setting up Vite Development Server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Karate Belt Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start server", err);
});
