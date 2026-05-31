import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  UserPlus, 
  Link2, 
  Copy, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  BookOpen, 
  Download,
  Terminal,
  Grid,
  Share2,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ExamConfig, StudentResult } from "../types";
import { getClubLogoBase64 } from "./LogoGenerator";

interface AdminPanelProps {
  onSignOut: () => void;
}

export default function AdminPanel({ onSignOut }: AdminPanelProps) {
  // Database status state
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; mode: string; statusText: string } | null>(null);

  // Exam creation states
  const [newExamDate, setNewExamDate] = useState("");
  const [newExamYear, setNewExamYear] = useState("2026");
  const [newExamName, setNewExamName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createStatus, setCreateStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Student creation states
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [studentName, setStudentName] = useState("");
  const [examId, setExamId] = useState("");
  const [currentBelt, setCurrentBelt] = useState("");
  const [achievedBelt, setAchievedBelt] = useState("");
  const [grade, setGrade] = useState("");
  const [verdict, setVerdict] = useState<"PASS" | "FAIL">("PASS");
  const [resultDate, setResultDate] = useState("");
  const [congratsMsg, setCongratsMsg] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentStatus, setStudentStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Link generation states
  const [linkExam, setLinkExam] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkType, setLinkType] = useState<"search" | "register">("search");

  // WhatsApp sharer states
  const [waExam, setWaExam] = useState("");
  const [waStudentName, setWaStudentName] = useState("");
  const [waStudentId, setWaStudentId] = useState("");
  const [waMessageType, setWaMessageType] = useState<"universal" | "individual">("universal");
  const [waMode, setWaMode] = useState<"results" | "register">("results");
  const [waClipboardSuccess, setWaClipboardSuccess] = useState(false);

  // Administration Tab System
  const [activeAdminTab, setActiveAdminTab] = useState<"manual" | "registry">("manual");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regListLoading, setRegListLoading] = useState(false);

  // Selected registration for active grading workflow
  const [selectedRegForGrading, setSelectedRegForGrading] = useState<any | null>(null);
  const [gradeExamId, setGradeExamId] = useState("");
  const [gradeAchievedBelt, setGradeAchievedBelt] = useState("");
  const [gradeRate, setGradeRate] = useState("");
  const [gradeVerdict, setGradeVerdict] = useState<"PASS" | "FAIL font-bold">("PASS");
  const [gradeCongratsMsg, setGradeCongratsMsg] = useState("");
  const [gradeSubmitLoading, setGradeSubmitLoading] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const BELT_STRUCTURE = [
    "WHITE", "YELLOW", "ORANGE", "GREEN", "BLUE", "PURPLE", "RED", "BROWN", "BROWN 2+1", "BROWN 3+4", "BLACK BELT"
  ];

  // Load registrations from DB
  const fetchRegistrations = async () => {
    setRegListLoading(true);
    try {
      const response = await fetch("/api/getRegistrations");
      if (response.ok) {
        const data = await response.json();
        // Sort by date descending
        data.sort((a: any, b: any) => {
          return String(b.REGISTRATION_DATE || "").localeCompare(String(a.REGISTRATION_DATE || ""));
        });
        setRegistrations(data);
      }
    } catch (error) {
      console.error("Failed to load registrations", error);
    } finally {
      setRegListLoading(false);
    }
  };

  // Generate WhatsApp message string dynamically
  const getWhatsAppMessageText = () => {
    const examCode = waExam || (exams.length > 0 ? exams[0].EXAM_NAME : "[EXAM_NAME]");
    
    // Always fallback to the public portal URL if on developer platforms, localhost, or any dev app context
    const defaultOrigin = window.location.origin.includes("aistudio.google.com") || 
                          window.location.origin.includes("localhost") || 
                          window.location.origin.includes("0.0.0.0") ||
                          window.location.origin.includes("ais-dev-")
      ? "https://ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app"
      : window.location.origin;

    // Use selected exam and append the correct tab path
    let portalUrl = "";
    if (waMode === "register") {
      portalUrl = `${defaultOrigin}/?exam=${encodeURIComponent(examCode)}&tab=register`;
    } else {
      portalUrl = generatedLink && waExam === linkExam
        ? generatedLink 
        : `${defaultOrigin}/?exam=${encodeURIComponent(examCode)}&tab=search`;
    }
    
    if (waMode === "register") {
      return `🥋 *LIONS KARATE CLUB PUNE* 🥋\n\nDear Parents & Students,\n\nWe are pleased to open online pre-registration and student roster registration for our upcoming *Belt Examination ${examCode}*! 🏆🎖️\n\n📌 *How to fill out your details online:*\n1️⃣ Tap the direct online register link below:\n\n${portalUrl}\n\nNote: The target examination cycle will be predefined and prefilled on your form!\n\n2️⃣ Supply the requested student details (Student Name, Current Rank, Applying Rank, Dojo Branch, Coach Name, School name, etc.).\n\n3️⃣ Submit the registration form! Hand over the printed or noted Registration ID to your Sensei. Results and digital certificates can be queried instantly on this portal after evaluation.\n\nOSS! 🙏🥋🔥`;
    }

    if (waMessageType === "universal") {
      return `🥋 *LIONS KARATE CLUB PUNE* 🥋\n\nDear Parents & Students,\n\nWe are pleased to announce that the official results for the *Belt Examination ${examCode}* are now officially live on the portal! 🏆🎖️\n\n📌 *How to instantly check your result:*\n1️⃣ Tap the direct portal link below (type it exactly into your browser address bar as shown, with no extra characters/backslashes/asterisks):\n\n${portalUrl}\n\n2️⃣ Enter student credentials:\n• Select Exam: *${examCode}*\n• Enter exact registered Student Name\n• Enter your Student ID (e.g., LKC01)\n\n3️⃣ View results and download your formal PDF digital certificate!\n\nOSS! 🙏🥋🔥`;
    } else {
      const studentNameUpper = waStudentName.trim() || "[STUDENT_NAME]";
      const idUpper = waStudentId.trim() || "[EXAM_ID]";
      return `🥋 *LIONS KARATE CLUB PUNE* 🥋\n\nDear Parent/Student,\n\nCONGRATULATIONS! The official promotion results for *${studentNameUpper}* (ID: *${idUpper}*) for our *Belt Examination ${examCode}* are out! 🎉🥋⭐\n\nKindly check your grade & download your elegant PDF certificate from the link below (type it exactly into your browser address bar as shown, with no extra characters/backslashes/asterisks):\n\n${portalUrl}\n\n*Credentials to enter on site:*\n• Select Exam: *${examCode}*\n• Student Name: *${studentNameUpper}*\n• Student ID: *${idUpper}*\n\nGreat job on your dedication and spirit! Keep practicing! 🔥\n\nOss! 🙏🥋`;
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/dbStatus");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else {
        setDbStatus({ connected: false, mode: "offline", statusText: "API backend server unreachable" });
      }
    } catch (_) {
      setDbStatus({ connected: false, mode: "offline", statusText: "Database connection failed" });
    }
  };

  // Load exams and registrations on mount
  useEffect(() => {
    fetchExams();
    fetchRegistrations();
    fetchDbStatus();
  }, []);

  // Derive target registry exam name automatically whenever date or year changes
  useEffect(() => {
    if (newExamDate) {
      const parts = newExamDate.split("-");
      if (parts.length === 3) {
        const monthNum = parseInt(parts[1], 10);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = monthNames[monthNum - 1] || "EXAM";
        const year = newExamYear.trim() || parts[0];
        setNewExamName(`${month}${year}`);
      }
    } else {
      setNewExamName("");
    }
  }, [newExamDate, newExamYear]);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/getExamList");
      if (response.ok) {
        const data = await response.json();
        setExams(data);
        if (data.length > 0 && !selectedExam) {
          setSelectedExam(data[0].EXAM_NAME);
          setResultDate(data[0].EXAM_DATE);
        }
      }
    } catch (error) {
      console.error("Error loading exams", error);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus(null);
    const cleanName = newExamName.toUpperCase().replace(/\s+/g, "").trim();
    if (!cleanName || !newExamDate) {
      setCreateStatus({ success: false, message: "Please provide an Exam Date and a Valid Year." });
      return;
    }
    
    setCreateLoading(true);
    try {
      const response = await fetch("/api/createExam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examName: cleanName, examDate: newExamDate })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setCreateStatus({ success: true, message: `Exam '${result.examName}' successfully registered and database recording started!` });
        setNewExamDate("");
        await fetchExams();
      } else {
        setCreateStatus({ success: false, message: result.error || "Failed to create exam." });
      }
    } catch (error) {
      setCreateStatus({ success: false, message: "Server connection failed." });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExamChangeForStudent = (examName: string) => {
    setSelectedExam(examName);
    const target = exams.find(e => e.EXAM_NAME === examName);
    if (target) {
      setResultDate(target.EXAM_DATE);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentStatus(null);
    if (!selectedExam) {
      setStudentStatus({ success: false, message: "Please select an active examination target name." });
      return;
    }

    setStudentLoading(true);
    try {
      const studentData: StudentResult = {
        STUDENT_NAME: studentName.toUpperCase().trim(),
        EXAM_ID: examId.toUpperCase().trim(),
        CURRENT_BELT: currentBelt.toUpperCase().trim(),
        ACHIEVED_BELT: achievedBelt.toUpperCase().trim(),
        GRADE: grade.toUpperCase().trim(),
        RESULT: verdict,
        CONGRATULATION_MSG: congratsMsg.toUpperCase().trim(),
        EXAM_DATE: resultDate
      };

      const response = await fetch("/api/addStudentToExam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examName: selectedExam, student: studentData })
      });
      const r = await response.json();
      if (response.ok && r.success) {
        setStudentStatus({ success: true, message: `Performance record for "${studentData.STUDENT_NAME}" appended successfully!` });
        setStudentName("");
        setExamId("");
        setCurrentBelt("");
        setAchievedBelt("");
        setGrade("");
        setCongratsMsg("");
      } else {
        setStudentStatus({ success: false, message: r.error || "Failed to add student record." });
      }
    } catch (error) {
      setStudentStatus({ success: false, message: "Network connection timeout." });
    } finally {
      setStudentLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!linkExam) return;
    try {
      const response = await fetch(`/api/getPublicLink?examName=${encodeURIComponent(linkExam)}`);
      const r = await response.json();
      
      // Determine clean base URL pointing strictly to the public shared portal URL
      let cleanBase = window.location.origin;
      if (cleanBase.includes("aistudio.google.com") || cleanBase.includes("localhost") || cleanBase.includes("0.0.0.0") || cleanBase.includes("ais-dev-")) {
        // Fallback to the real public shared deployment URL
        cleanBase = "https://ais-pre-v7edj3kbk73xoblxzmtdoi-683048240716.asia-southeast1.run.app";
      }

      // If backend gave localhost or relative URL, map it to the cleanly resolved base URL
      let targetUrl = r.url;
      if (targetUrl.includes("localhost:3000") || targetUrl.includes("0.0.0.0:3000") || targetUrl.includes("127.0.0.1:3000") || targetUrl.includes("ais-dev-")) {
        targetUrl = targetUrl.replace(/https?:\/\/[^\/]+/, cleanBase);
      } else {
        // If it returns any address, double check if it mistakenly points to an editor context
        if (targetUrl.includes("aistudio.google.com") || targetUrl.includes("ais-dev-")) {
          targetUrl = targetUrl.replace(/https?:\/\/[^\/]+/, cleanBase);
        }
      }

      // Append selected tab path option
      if (linkType === "register") {
        targetUrl = `${targetUrl}&tab=register`;
      } else {
        targetUrl = `${targetUrl}&tab=search`;
      }

      setGeneratedLink(targetUrl);
    } catch (error) {
      console.error(error);
    }
  };

  // Initiate grading workflow on registered record helper
  const handleStartGrading = (reg: any) => {
    setSelectedRegForGrading(reg);
    // Presets grading form defaults
    setGradeExamId("");
    setGradeAchievedBelt(reg.APPEARING_BELT);
    setGradeRate("EXCELLENT");
    setGradeVerdict("PASS");
    setGradeCongratsMsg("CONGRATULATIONS ON PASSING! OUTSTANDING FORM IN KATA BASICS.");
    setGradeError("");
  };

  // Grade registration submission and push result
  const handlePublishRegGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setGradeError("");
    if (!selectedRegForGrading) return;
    if (!gradeExamId.trim()) {
      setGradeError("Assigned Exam ID credential is required.");
      return;
    }

    setGradeSubmitLoading(true);
    try {
      const payload = {
        registrationId: selectedRegForGrading.id,
        examId: gradeExamId.toUpperCase().trim(),
        grade: gradeRate.toUpperCase().trim(),
        result: gradeVerdict.includes("PASS") ? "PASS" : "FAIL",
        achievedBelt: gradeAchievedBelt.toUpperCase().trim(),
        congratulationMsg: gradeCongratsMsg.toUpperCase().trim()
      };

      const response = await fetch("/api/gradeRegistration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedRegForGrading(null);
        await fetchRegistrations();
        setStudentStatus({
          success: true,
          message: `Roster candidate "${data.studentName}" graded successfully! Official digital certificate published with exam ID "${data.examId}".`
        });
      } else {
        setGradeError(data.error || "Failed to publish exam grade. ID may already exist.");
      }
    } catch (error) {
      setGradeError("Failed to communicate with registrar. Check connection.");
    } finally {
      setGradeSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 animate-fadeIn text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-2 border-slate-900 bg-white p-6 pb-6 mb-8 gap-4 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 bg-red-700 inline-block rotate-45 shrink-0" />
            <span className="font-mono text-[10px] md:text-xs text-red-700 font-extrabold tracking-widest uppercase">
              Authenticated Administrator Terminal
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 font-space">
            Dojo Belt Examiner Console
          </h2>
          <div className="mt-2 flex items-center gap-2">
            {dbStatus ? (
              dbStatus.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-600 text-emerald-800 rounded-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {dbStatus.statusText}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 border border-amber-600 text-amber-800 rounded-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-605" />
                  Fallback Mode Active
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-450 text-slate-550 rounded-none">
                Checking Database Connection...
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (exams.length > 0) {
                const searchParam = exams[0].EXAM_NAME;
                window.location.search = `?exam=${searchParam}`;
              } else {
                window.location.search = "";
              }
            }}
            className="px-4 py-2 border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-black uppercase tracking-wider rounded-none bg-white transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            Go to Public Portal
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-slate-900 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-none transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            Lock Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Side: Create Exam Form & Generate Link Form */}
        <div className="space-y-8 lg:col-span-1">
          {/* Create Exam */}
          <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b-2 border-slate-900">
              <PlusCircle className="text-red-700 h-5 w-5" />
              <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                1. Register New Exam
              </h3>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={newExamDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewExamDate(val);
                    if (val) {
                      const parts = val.split("-");
                      if (parts.length === 3) {
                        setNewExamYear(parts[0]);
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Exam Year
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="E.G. 2026"
                  value={newExamYear}
                  onChange={(e) => setNewExamYear(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Exam Code / Sheet Name (Customizable)
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.G. MAY2026"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value.toUpperCase().replace(/\s+/g, "").trim())}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black font-mono text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none"
                />
                <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase leading-normal">
                  Auto-calculated from date as <strong>{newExamName || "N/A"}</strong>, but you can type any code manually here.
                </p>
              </div>

              <button
                type="submit"
                disabled={createLoading || !newExamDate || !newExamYear}
                className="w-full py-3 bg-slate-900 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black tracking-widest text-xs uppercase cursor-pointer rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
              >
                {createLoading ? "CREATING SHEET..." : "CREATE EXAM SHEET"}
              </button>
            </form>

            {createStatus && (
              <div
                className={`mt-4 p-4 border-2 text-xs font-bold uppercase rounded-none animate-fadeIn ${
                  createStatus.success
                    ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                    : "bg-red-50 border-red-600 text-red-700"
                }`}
              >
                {createStatus.message}
              </div>
            )}
          </div>

          {/* Public Access Link */}
          <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b-2 border-slate-900">
              <Link2 className="text-emerald-600 h-5 w-5" />
              <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                2. Get Public Link
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Choose Examination Target
                </label>
                <select
                  value={linkExam}
                  onChange={(e) => {
                    setLinkExam(e.target.value);
                    setGeneratedLink("");
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase cursor-pointer"
                >
                  <option value="">-- SELECT EXAM --</option>
                  {exams.map((ex) => (
                    <option key={ex.EXAM_NAME} value={ex.EXAM_NAME}>
                      {ex.EXAM_NAME} ({ex.EXAM_DATE})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Link Destination Tab Page
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 border-2 border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType("search");
                      setGeneratedLink("");
                    }}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      linkType === "search" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                    }`}
                  >
                    Result Lookup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType("register");
                      setGeneratedLink("");
                    }}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      linkType === "register" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                    }`}
                  >
                    Online Register Form
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateLink}
                disabled={!linkExam}
                className="w-full py-3 bg-slate-900 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black tracking-widest text-xs uppercase cursor-pointer rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
              >
                GENERATE ACCESS URL
              </button>

              {generatedLink && (
                <div className="mt-4 space-y-2 text-slate-900">
                  <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-none text-xs font-mono font-bold break-all text-slate-800">
                    {generatedLink}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="flex-1 py-2 border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 bg-white rounded-none text-[10px] font-black tracking-widest uppercase transition cursor-pointer"
                    >
                      {linkCopied ? "COPIED!" : "Copy URL"}
                    </button>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-none text-[10px] font-black tracking-widest uppercase transition-colors"
                    >
                      Open Portal
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Message & Share Generator */}
          <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b-2 border-slate-900">
              <Share2 className="text-emerald-700 h-5 w-5" />
              <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                3. WhatsApp Share Tool
              </h3>
            </div>

            <div className="space-y-4 text-slate-900">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  WhatsApp Message Purpose
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 border-2 border-slate-900">
                  <button
                    type="button"
                    onClick={() => setWaMode("results")}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      waMode === "results" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                    }`}
                  >
                    Publish Results
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaMode("register")}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      waMode === "register" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                    }`}
                  >
                    Invite Registrations
                  </button>
                </div>
              </div>

              {waMode === "results" && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Message Scope / Target
                  </label>
                  <div className="flex gap-2 p-1 bg-slate-100 border-2 border-slate-900">
                    <button
                      type="button"
                      onClick={() => setWaMessageType("universal")}
                      className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        waMessageType === "universal" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                      }`}
                    >
                      All Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaMessageType("individual")}
                      className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                        waMessageType === "individual" ? "bg-slate-900 text-white" : "bg-transparent text-slate-700"
                      }`}
                    >
                      Single Student
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Select Exam Event
                </label>
                <select
                  value={waExam}
                  onChange={(e) => setWaExam(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-black text-slate-950 outline-none focus:bg-white transition rounded-none uppercase cursor-pointer"
                >
                  <option value="">-- DEFAULT / ACTIVE --</option>
                  {exams.map((ex) => (
                    <option key={ex.EXAM_NAME} value={ex.EXAM_NAME}>
                      {ex.EXAM_NAME} ({ex.EXAM_DATE})
                    </option>
                  ))}
                </select>
              </div>

              {waMode === "results" && waMessageType === "individual" && (
                <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      placeholder="E.G. LIAM JIRO"
                      value={waStudentName}
                      onChange={(e) => setWaStudentName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-extrabold text-slate-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      placeholder="E.G. LKC01"
                      value={waStudentId}
                      onChange={(e) => setWaStudentId(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-mono font-bold text-slate-950 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Message Text Preview
                </label>
                <textarea
                  readOnly
                  value={getWhatsAppMessageText()}
                  rows={6}
                  className="w-full bg-slate-100 border-2 border-slate-900 p-2.5 text-[10px] font-semibold text-slate-800 leading-relaxed outline-none font-sans select-all resize-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getWhatsAppMessageText());
                    setWaClipboardSuccess(true);
                    setTimeout(() => setWaClipboardSuccess(false), 2000);
                  }}
                  className="w-full py-2 border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 bg-white font-black tracking-widest text-[10px] uppercase transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {waClipboardSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      COPIED TO PHONE CLIPBOARD!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-600" />
                      COPY MESSAGE TEXT
                    </>
                  )}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getWhatsAppMessageText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest text-[10px] uppercase transition cursor-pointer flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none duration-155 text-center"
                >
                  <MessageSquare className="h-4 w-4 fill-white shrink-0" />
                  SHARE TO WHATSAPP
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Columns with tab layout */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-100 border-2 border-slate-900 p-1 flex font-space shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <button
              onClick={() => {
                setActiveAdminTab("manual");
                setSelectedRegForGrading(null);
              }}
              className={`flex-1 py-1.5 md:py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition rounded-none ${
                activeAdminTab === "manual"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Manual Result Entry
            </button>
            <button
              onClick={() => {
                setActiveAdminTab("registry");
                fetchRegistrations();
              }}
              className={`flex-1 py-1.5 md:py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition rounded-none border-l-2 border-slate-900 ${
                activeAdminTab === "registry"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Online Candidates Ledger ({registrations.filter(r => r.STATUS !== "GRADED").length})
            </button>
          </div>

          {activeAdminTab === "manual" ? (
            /* TAB A: Manual performance Row Record */
            <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b-2 border-slate-900">
                <UserPlus className="text-red-700 h-5 w-5" />
                <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                  A. Add Student Performance Record (Manual backup)
                </h3>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Target Examination Folder
                    </label>
                    <select
                      value={selectedExam}
                      onChange={(e) => handleExamChangeForStudent(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase cursor-pointer"
                    >
                      <option value="">-- SELECT EXAM SOURCE --</option>
                      {exams.map((ex) => (
                        <option key={ex.EXAM_NAME} value={ex.EXAM_NAME}>
                          {ex.EXAM_NAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      required
                      value={resultDate}
                      onChange={(e) => setResultDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-red-650 transition rounded-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      student name <span className="text-red-700 lowercase font-bold">[auto-uppercase]</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. LIAM JIRO"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 placeholder-slate-400 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      exam ID <span className="text-red-705 lowercase font-bold">[e.g. LKC01]</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. LKC01"
                      value={examId}
                      onChange={(e) => setExamId(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs sm:text-sm font-black text-slate-950 placeholder-slate-400 outline-none focus:bg-white focus:border-red-650 transition rounded-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      current belt rank
                    </label>
                    <select
                      value={currentBelt}
                      onChange={(e) => setCurrentBelt(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                    >
                      <option value="">-- CHOOSE RANK --</option>
                      {BELT_STRUCTURE.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      achieved belt rank
                    </label>
                    <select
                      value={achievedBelt}
                      onChange={(e) => setAchievedBelt(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                    >
                      <option value="">-- CHOOSE RANK --</option>
                      {BELT_STRUCTURE.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Evaluation Grade
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. A+, EXCELLENT"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-black text-slate-950 placeholder-slate-400 focus:bg-white rounded-none uppercase outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Verdict status
                    </label>
                    <select
                      value={verdict}
                      onChange={(e) => setVerdict(e.target.value as "PASS" | "FAIL")}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs font-black text-slate-950 outline-none focus:bg-white rounded-none transition cursor-pointer"
                    >
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      congratulation message / comments
                    </label>
                    <input
                      type="text"
                      placeholder="E.G. KIHON DEPTHS AND SHARP TECHNIQUE!"
                      value={congratsMsg}
                      onChange={(e) => setCongratsMsg(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-2 border-slate-900 p-3 text-xs font-bold text-slate-950 placeholder-slate-400 focus:bg-white rounded-none uppercase outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={studentLoading}
                  className="w-full mt-2 py-3 bg-slate-900 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black tracking-widest text-xs uppercase cursor-pointer rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
                >
                  {studentLoading ? "APPENDING LOG RECORD..." : "APPEND STUDENT RESULT ROW"}
                </button>
              </form>
            </div>
          ) : (
            /* TAB B: Pending Online Applications list & Grading workflow */
            <div className="space-y-6">
              
              {/* Grading Box visible inline when actively clicked */}
              {selectedRegForGrading && (
                <div className="bg-slate-950 border-4 border-red-700 text-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-none space-y-4 animate-slideDown">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-650 block animate-pulse"></span>
                      <h4 className="text-xs font-black tracking-widest text-red-500 uppercase font-space">
                        GRADING CANDIDATE: {selectedRegForGrading.STUDENT_NAME}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRegForGrading(null)}
                      className="text-stone-400 hover:text-white font-black text-[10px] uppercase font-mono tracking-widest cursor-pointer hover:underline"
                    >
                      [ CLOSE PANEL ]
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold p-3 bg-slate-900/60 border border-slate-800 text-stone-200 uppercase tracking-wide">
                    <div>
                      <span className="text-[9px] text-slate-500 block">CURRENT RANK</span>
                      <span className="font-extrabold">{selectedRegForGrading.CURRENT_BELT}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">APPLYING LEVEL</span>
                      <span className="text-amber-400 font-extrabold">{selectedRegForGrading.APPEARING_BELT}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">BRANCH / DOJO</span>
                      <span>{selectedRegForGrading.BRANCH_NAME}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">SCHOOL NAME</span>
                      <span className="truncate block">{selectedRegForGrading.SCHOOL_NAME || "NONE"}</span>
                    </div>
                  </div>

                  <form onSubmit={handlePublishRegGrade} className="space-y-4 text-slate-950 pt-2 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                          Assign Exam ID Numbers <span className="text-red-500 text-xs font-bold lowercase">* required</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ASSIGN MANUAL CODE CARD, REGULAR E.G. LKC01"
                          value={gradeExamId}
                          onChange={(e) => setGradeExamId(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                          className="w-full bg-white border-2 border-slate-950 p-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none uppercase font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                          Promoted Belt (Achieved belt)
                        </label>
                        <select
                          value={gradeAchievedBelt}
                          onChange={(e) => setGradeAchievedBelt(e.target.value)}
                          className="w-full bg-white border-2 border-slate-950 p-2.5 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                        >
                          {BELT_STRUCTURE.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                          Evaluation Grade Roster
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="E.G. A+, EXCELLENT"
                          value={gradeRate}
                          onChange={(e) => setGradeRate(e.target.value.toUpperCase())}
                          className="w-full bg-white border-2 border-slate-950 p-2.5 text-xs font-black text-slate-900 outline-none uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                          Examination Verdict
                        </label>
                        <select
                          value={gradeVerdict}
                          onChange={(e) => setGradeVerdict(e.target.value as "PASS" | "FAIL font-bold")}
                          className="w-full bg-white border-2 border-slate-950 p-2.5 text-xs font-black text-slate-900 outline-none rounded-none cursor-pointer"
                        >
                          <option value="PASS">PASS (AWARD PROMOTION)</option>
                          <option value="FAIL">FAIL (SUGGEST REVAL)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                          Payment Verification Status
                        </label>
                        <div className={`p-2.5 border-2 text-[11px] font-black text-center uppercase tracking-wide ${selectedRegForGrading.FEES_STATUS === "PAID" ? "bg-emerald-950 border-emerald-600 text-emerald-400" : "bg-red-950 border-red-700 text-red-400"}`}>
                          {selectedRegForGrading.FEES_STATUS}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 font-space">
                        CONGRATULATION MESSAGE / INSTRUCTOR ASSESSMENT COMMENTS
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.G. EXCELLENT FORMS OF HEIAN SHODAN"
                        value={gradeCongratsMsg}
                        onChange={(e) => setGradeCongratsMsg(e.target.value.toUpperCase())}
                        className="w-full bg-white border-2 border-slate-950 p-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none uppercase"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRegForGrading(null)}
                        className="flex-1 py-3 bg-slate-800 text-white border border-slate-700 hover:bg-slate-705 font-black uppercase text-xs tracking-widest cursor-pointer rounded-none transition"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={gradeSubmitLoading}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest cursor-pointer rounded-none border border-emerald-700 transition"
                      >
                        {gradeSubmitLoading ? "PUBLISHING CERTIFICATE..." : "GRADE & REGISTER CERTIFICATE"}
                      </button>
                    </div>

                    {gradeError && (
                      <div className="mt-3 p-3 bg-red-950 border border-red-700 text-red-200 text-xs font-black uppercase rounded-none animate-shake flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                        <span>{gradeError}</span>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Roster / Table of registrations */}
              <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-3 border-b-2 border-slate-900">
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="text-red-700 h-5 w-5" />
                    <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                      B. Active Online Submitted Registrations ({registrations.filter(r => r.STATUS !== "GRADED").length} PENDING)
                    </h3>
                  </div>
                  <button
                    onClick={fetchRegistrations}
                    className="text-[10px] font-black tracking-widest font-space uppercase py-1 px-2.5 bg-slate-50 border border-slate-900 hover:bg-slate-100 cursor-pointer"
                  >
                    Refresh List
                  </button>
                </div>

                {regListLoading ? (
                  <div className="text-center py-12 text-xs font-black tracking-widest uppercase text-slate-400">
                    <span className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full inline-block mb-2"></span>
                    <br />FETCHING RECENT WORKSPACE SUBMISSIONS...
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-10 text-xs font-black tracking-widest uppercase text-slate-450 border border-dashed border-slate-200">
                    No online candidate registrations found in public database log.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-900 border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[9px] font-black tracking-widest uppercase border border-slate-900">
                          <th className="p-3">STUDENT NAME</th>
                          <th className="p-3">RANKS (CURR &rarr; TARGET)</th>
                          <th className="p-3">BRANCH / SCHOOL</th>
                          <th className="p-3">FEES</th>
                          <th className="p-3">EXAM CYCLE</th>
                          <th className="p-3">STATUS / ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200 text-xs font-bold">
                        {registrations.map((reg) => {
                          const isGraded = reg.STATUS === "GRADED";
                          return (
                            <tr key={reg.id} className={`hover:bg-slate-50/55 ${isGraded ? "opacity-60 bg-slate-50/20" : ""}`}>
                              <td className="p-3 uppercase">
                                <div className="font-black text-slate-900">{reg.STUDENT_NAME}</div>
                                <div className="text-[9px] text-slate-400 font-mono italic">Submitted: {reg.REGISTRATION_DATE}</div>
                              </td>
                              <td className="p-3 uppercase">
                                <span className="text-stone-500">{reg.CURRENT_BELT}</span>
                                <span className="mx-2 text-red-600 font-black">&rarr;</span>
                                <span className="text-slate-900">{reg.APPEARING_BELT}</span>
                              </td>
                              <td className="p-3 uppercase text-[10px]">
                                <div>Dojo: {reg.BRANCH_NAME}</div>
                                <div className="text-slate-500 font-semibold text-[9px]">{reg.SCHOOL_NAME || "NO School Defined"}</div>
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 border ${
                                  reg.FEES_STATUS === "PAID" 
                                    ? "bg-emerald-50 border-emerald-450 text-emerald-700" 
                                    : "bg-red-50 border-red-400 text-red-600"
                                }`}>
                                  {reg.FEES_STATUS}
                                </span>
                              </td>
                              <td className="p-3 uppercase font-mono tracking-wider font-bold text-[10px]">
                                {reg.EXAM_NAME}
                              </td>
                              <td className="p-3">
                                {isGraded ? (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                    <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0" /> GRADED
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStartGrading(reg)}
                                    type="button"
                                    className="px-3 py-1.5 bg-red-650 hover:bg-slate-950 text-white font-black text-[10px] tracking-widest uppercase transition rounded-none cursor-pointer border border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                  >
                                    GRADE CANDIDATE
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {studentStatus && (
            <div
              className={`mt-4 p-4 border-2 text-xs font-bold uppercase rounded-none animate-fadeIn ${
                studentStatus.success
                  ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                  : "bg-red-50 border-red-600 text-red-700"
              }`}
            >
              {studentStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
