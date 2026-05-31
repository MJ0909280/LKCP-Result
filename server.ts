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
  where 
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure JSON parsing is enabled
app.use(express.json());

// Initialize Firebase securely server-side using the local applet configurations
let db: any;

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
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
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

// API: Get Exam List from live Firestore DB
app.get("/api/getExamList", async (req, res) => {
  try {
    const examsCol = collection(db, "exams");
    const snapshot = await getDocs(examsCol);
    const list = snapshot.docs.map(doc => doc.data());
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

    // Check if duplicate inside 'exams' collection
    const examDocRef = doc(db, "exams", normalizedExamName);
    const examSnapshot = await getDoc(examDocRef);
    if (examSnapshot.exists()) {
      return res.status(400).json({ error: `An exam named '${normalizedExamName}' already exists!` });
    }

    // Write Exam payload
    await setDoc(examDocRef, {
      EXAM_NAME: normalizedExamName,
      EXAM_DATE: examDate
    });

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

    // Verify if that exam actually exists first
    const examDocRef = doc(db, "exams", normalizedExamName);
    const examSnapshot = await getDoc(examDocRef);
    if (!examSnapshot.exists()) {
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

    // Store student result log securely
    // Keying by `EXAM_NAME_STUDENT_ID` avoids overlapping duplicates
    const resultDocId = `${normalizedExamName}_${newStudent.EXAM_ID}`;
    const resultDocRef = doc(db, "results", resultDocId);

    await setDoc(resultDocRef, newStudent);

    res.json({ success: true });
  } catch (error: any) {
    const err = handleFirestoreError(error, OperationType.WRITE, "results");
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

    // Query on results collection
    const resultsCol = collection(db, "results");
    const q = query(
      resultsCol, 
      where("EXAM_NAME", "==", examName),
      where("EXAM_ID", "==", examId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.json({ found: false });
    }

    const docs = snapshot.docs.map(d => d.data());
    // Robust search match on student name
    const foundRecord = docs.find((s: any) => s.STUDENT_NAME.toUpperCase().trim() === studentName);

    if (foundRecord) {
      res.json({ found: true, data: foundRecord });
    } else {
      res.json({ found: false });
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
async function setupViteOrStatic() {
  // Initialize connection to Firestore
  await initFirebase();

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
