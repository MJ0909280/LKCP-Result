import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  Search, 
  Award, 
  Calendar, 
  FileText, 
  ChevronRight, 
  MapPin, 
  Compass, 
  User, 
  Hash, 
  AlertCircle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ClipboardList
} from "lucide-react";
import { ExamConfig, StudentResult } from "../types";
import { getClubLogoBase64 } from "./LogoGenerator";

interface PublicLookupProps {
  initialExamParam: string;
  initialTabParam?: "search" | "register";
}

const BELT_STRUCTURE = [
  "WHITE", "YELLOW", "ORANGE", "GREEN", "BLUE", "PURPLE", "RED", "BROWN", "BROWN 2+1", "BROWN 3+4", "BLACK BELT"
];

export default function PublicLookup({ initialExamParam, initialTabParam }: PublicLookupProps) {
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [studentName, setStudentName] = useState("");
  const [examId, setExamId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeResult, setActiveResult] = useState<StudentResult | null>(null);

  // Client-side quick cache for instant repeated searches
  const [clientCache, setClientCache] = useState<Record<string, { found: boolean; data?: StudentResult }>>({});

  // Online Registration states
  const [activeTab, setActiveTab] = useState<"search" | "register">(initialTabParam || "search");

  // Keep active tab reactive to url param shifts
  useEffect(() => {
    if (initialTabParam) {
      setActiveTab(initialTabParam);
    }
  }, [initialTabParam]);
  const [regStudentName, setRegStudentName] = useState("");
  const [regCurrentBelt, setRegCurrentBelt] = useState("WHITE");
  const [regAppearingBelt, setRegAppearingBelt] = useState("YELLOW");
  const [regBranchName, setRegBranchName] = useState("");
  const [regCoachName, setRegCoachName] = useState("");
  const [regFeesStatus, setRegFeesStatus] = useState("NOT PAID");
  const [regSchoolName, setRegSchoolName] = useState("");
  
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState("");

  // Load available exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("/api/getExamList");
        if (response.ok) {
          const list: ExamConfig[] = await response.json();
          setExams(list);
          
          // Use search query param or fallback to first exam
          if (initialExamParam) {
            const matches = list.find(e => e.EXAM_NAME.toUpperCase() === initialExamParam.toUpperCase());
            if (matches) {
              setSelectedExam(matches.EXAM_NAME);
            } else {
              setSelectedExam(initialExamParam.toUpperCase());
            }
          } else if (list.length > 0) {
            setSelectedExam(list[0].EXAM_NAME);
          }
        }
      } catch (error) {
        console.error("Failed to load exams", error);
      }
    };
    fetchExams();
  }, [initialExamParam]);

  // Handle student search results
  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setActiveResult(null);

    const cleanName = studentName.toUpperCase().trim();
    const cleanId = examId.toUpperCase().trim();

    if (!selectedExam) {
      setSearchError("Please select a specific examination event first.");
      return;
    }
    if (!cleanName || !cleanId) {
      setSearchError("Both Student Full Name and Exam ID card number are required.");
      return;
    }

    const cacheKey = `${selectedExam}_${cleanId}_${cleanName}`;
    if (clientCache[cacheKey]) {
      const cached = clientCache[cacheKey];
      if (cached.found && cached.data) {
        setActiveResult(cached.data);
      } else {
        setSearchError("No verification matching those parameters was found. Please check spelling or ID case.");
      }
      return;
    }

    setLoading(true);
    try {
      const url = `/api/lookupResult?exam=${encodeURIComponent(selectedExam)}&student=${encodeURIComponent(cleanName)}&id=${encodeURIComponent(cleanId)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.found) {
        setActiveResult(data.data);
        setClientCache(prev => ({ ...prev, [cacheKey]: { found: true, data: data.data } }));
      } else {
        setSearchError("No verification matching those parameters was found. Please check spelling or ID case.");
        setClientCache(prev => ({ ...prev, [cacheKey]: { found: false } }));
      }
    } catch (error) {
      setSearchError("Service connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle online registration request
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(null);

    if (!selectedExam) {
      setRegError("Please select an active examination cycle event first.");
      return;
    }
    if (!regStudentName.trim()) {
      setRegError("Student name is required.");
      return;
    }

    setRegLoading(true);
    try {
      const payload = {
        student: {
          STUDENT_NAME: regStudentName.toUpperCase().trim(),
          CURRENT_BELT: regCurrentBelt,
          APPEARING_BELT: regAppearingBelt,
          BRANCH_NAME: regBranchName.trim(),
          COACH_NAME: regCoachName.trim(),
          FEES_STATUS: regFeesStatus,
          SCHOOL_NAME: regSchoolName.trim(),
          EXAM_NAME: selectedExam,
          REGISTRATION_DATE: new Date().toISOString().split('T')[0]
        }
      };

      const response = await fetch("/api/registerStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setRegSuccess(data.registrationId);
        // Clear input form fields
        setRegStudentName("");
        setRegBranchName("");
        setRegCoachName("");
        setRegSchoolName("");
      } else {
        setRegError(data.error || "Could not register candidate. Please check parameters.");
      }
    } catch (error) {
      setRegError("Server connection failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  // Maps belt name to modern CSS colors
  const getBeltColorStyle = (beltName: string) => {
    const lBelt = beltName.toLowerCase();
    if (lBelt.includes("white")) return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
    if (lBelt.includes("yellow")) return { bg: "bg-yellow-400 text-slate-900 border-yellow-500", text: "text-yellow-400", border: "border-yellow-500" };
    if (lBelt.includes("orange")) return { bg: "bg-orange-500 text-white border-orange-600", text: "text-orange-500", border: "border-orange-600" };
    if (lBelt.includes("green")) return { bg: "bg-emerald-600 text-white border-emerald-700", text: "text-emerald-500", border: "border-emerald-500" };
    if (lBelt.includes("blue")) return { bg: "bg-blue-600 text-white border-blue-700", text: "text-blue-500", border: "border-blue-500" };
    if (lBelt.includes("purple")) return { bg: "bg-purple-600 text-white border-purple-700", text: "text-purple-400", border: "border-purple-500" };
    if (lBelt.includes("brown")) return { bg: "bg-amber-800 text-white border-amber-900", text: "text-amber-700", border: "border-amber-800" };
    if (lBelt.includes("black")) return { bg: "bg-stone-950 text-white border-stone-800", text: "text-amber-400", border: "border-stone-900 shadow-lg shadow-amber-500/10" };
    return { bg: "bg-rose-600 text-white border-rose-700", text: "text-rose-500", border: "border-rose-600" };
  };

  // Generate real PDF utilizing jsPDF and Base64 Logo
  const generatePDFCertificate = () => {
    if (!activeResult) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const studentNameClean = activeResult.STUDENT_NAME.toUpperCase();
    const studentIdClean = activeResult.EXAM_ID.toUpperCase();
    const currentBeltClean = activeResult.CURRENT_BELT.toUpperCase();
    const achievedBeltClean = activeResult.ACHIEVED_BELT.toUpperCase();
    const gradeClean = activeResult.GRADE.toUpperCase();
    const resultClean = activeResult.RESULT.toUpperCase();
    const dateClean = activeResult.EXAM_DATE;
    const congratsClean = activeResult.CONGRATULATION_MSG.toUpperCase();

    // 1. Draw elegant, formal borders around certificate
    doc.setDrawColor(220, 38, 38); // Crimson red
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 281); // External border
    doc.setDrawColor(15, 23, 42); // Deep navy Slate-900
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277); // Internal border

    // 2. Fetch the Base64 dynamic crest logo from LogoGenerator
    const logoBase = getClubLogoBase64();
    if (logoBase) {
      // Draw centered high-dpi dojo crest
      doc.addImage(logoBase, "PNG", 82, 16, 45, 45);
    }

    // 3. Header Texts
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(21);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("LIONS KARATE CLUB PUNE", 105, 74, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("武道 • OFFICIAL BELT PROMOTION REGISTERED DOCUMENT", 105, 80, { align: "center" });

    // Dividers
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(45, 85, 165, 85);

    // 4. Student Affirmation
    doc.setFontSize(13);
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text("This is to certify and officially announce that", 105, 96, { align: "center" });

    // Big Bold Name
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(220, 38, 38); // Crimson
    doc.text(studentNameClean, 105, 110, { align: "center" });

    // Student ID subtitle
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("EXAMINATION IDENTIFICATION NUMBER: " + studentIdClean, 105, 117, { align: "center" });

    // Body specs
    doc.setFontSize(13);
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    doc.text("has successfully completed all strict curriculum criteria on Date", 105, 131, { align: "center" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(dateClean, 105, 140, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    doc.text("and is officially promoted and elevated to the rank of", 105, 151, { align: "center" });

    // Achieved belt Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate-850
    doc.text(achievedBeltClean, 105, 168, { align: "center" });

    // 5. Spec table/grid
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(25, 185, 160, 44, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    doc.text("ACADEMY VERIFICATION LOGS", 30, 192);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("FORMER GRADE / BELT:", 30, 201);
    doc.text("PROMOTED TO RANK:", 30, 208);
    doc.text("EVALUATION GRADE RATE:", 30, 215);
    doc.text("EXECUTIVE RESOLUTION:", 30, 222);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(currentBeltClean, 95, 201);
    doc.text(achievedBeltClean, 95, 208);
    doc.text(gradeClean, 95, 215);

    if (resultClean === "PASS") {
      doc.setTextColor(16, 185, 129); // Green Pass
      doc.text("PROMOTED - OFFICIAL PASS STATUS", 95, 222);
    } else {
      doc.setTextColor(220, 38, 38); // Red Fail
      doc.text("CONTINUED EVALUATION STATUS", 95, 222);
    }

    // 6. Sensi Comment Quote
    if (resultClean === "PASS" && congratsClean) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(100, 116, 139);
      doc.text('"' + congratsClean + '"', 105, 244, { align: "center", maxWidth: 145 });
    }

    // 7. Signature lines at bottom
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);

    doc.line(32, 269, 82, 269);
    doc.text("EXAMINING SENSEI", 57, 274, { align: "center" });

    doc.line(128, 269, 178, 269);
    doc.text("CHIEF REGISTRAR", 153, 274, { align: "center" });

    // Output Save
    const filename = `${studentNameClean.replace(/\s+/g, "_")}_${selectedExam}_Result.pdf`;
    doc.save(filename);
  };

  const activeBeltStyles = activeResult ? getBeltColorStyle(activeResult.ACHIEVED_BELT) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 animate-fadeIn">
      {/* Container Box conforming to Geometric Balance card-shadow styling */}
      <div className="bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] flex flex-col lg:flex-row overflow-hidden min-h-[580px]">
        
        {/* Left Column: Form & Brand Area */}
        <section className="w-full lg:w-5/12 border-b-4 lg:border-b-0 lg:border-r-4 border-slate-900 p-8 sm:p-10 flex flex-col justify-between bg-white relative">
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-16 w-16 bg-white border-2 border-slate-900 flex items-center justify-center overflow-hidden shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] shrink-0 p-1">
                <img 
                  src={getClubLogoBase64()} 
                  alt="Lions Karate Club Pune Logo" 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="text-xl font-black mb-0.5 leading-tight uppercase font-space text-slate-900">STUDENT PORTAL</h2>
                <p className="text-red-700 text-[10px] font-black uppercase tracking-widest">OFFICIAL EXAM SERVICES & REGISTRATION</p>
              </div>
            </div>

            {/* Custom Interactive Tab Selectors */}
            <div className="flex border-2 border-slate-900 mb-6 font-space">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all rounded-none ${
                  activeTab === "search"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Check Result
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setRegSuccess(null);
                  setRegError("");
                }}
                className={`flex-1 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all border-l-2 border-slate-900 rounded-none ${
                  activeTab === "register"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Register Online
              </button>
            </div>

            {activeTab === "search" ? (
              /* TAB 1: Search student results */
              <form onSubmit={handleCheckResult} className="space-y-4">
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">Active exam cycle</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => {
                      setSelectedExam(e.target.value);
                      setActiveResult(null);
                      setSearchError("");
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-black tracking-wide text-slate-900 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase cursor-pointer"
                  >
                    <option value="">-- CHOOSE EXAMINATION --</option>
                    {exams.map((ex) => (
                      <option key={ex.EXAM_NAME} value={ex.EXAM_NAME}>
                        {ex.EXAM_NAME} ({ex.EXAM_DATE})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">STUDENT FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. HIROSHI TANAKA"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-black text-slate-950 placeholder-slate-400 outline-none focus:bg-white focus:border-red-650 transition rounded-none uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">EXAM ID CODE</label>
                  <input
                    type="text"
                    required
                    placeholder="LKC-4022"
                    value={examId}
                    onChange={(e) => setExamId(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-bold text-slate-950 placeholder-slate-400 outline-none focus:bg-white focus:border-red-650 transition rounded-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedExam}
                  className="w-full py-3.5 bg-slate-900 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black tracking-widest text-[11px] hover:text-white transition-colors uppercase cursor-pointer rounded-none border-2 border-slate-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white/50 border-t-white rounded-full inline-block" />
                      SEARCHING CODES...
                    </span>
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> CHECK RESULT
                    </>
                  )}
                </button>

                {searchError && (
                  <div className="mt-3 p-3.5 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-bold uppercase flex items-start gap-2.5 rounded-none animate-shake">
                    <AlertCircle className="h-4 w-4 text-red-650 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}
              </form>
            ) : (
              /* TAB 2: Register Online Form */
              <div className="space-y-4 animate-fadeIn">
                {regSuccess ? (
                  <div className="p-5 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 rounded-none space-y-3 shadow-[3px_3px_0px_0px_rgba(5,150,105,0.1)]">
                    <div className="flex items-center gap-2 text-emerald-705 font-black">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span className="text-xs uppercase tracking-wider font-space">ONLINE REGISTRATION LOGGED</span>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed uppercase text-slate-700">
                      The online exam application has been recorded successfully!
                    </p>
                    <div className="p-2.5 bg-white border border-emerald-300 font-mono text-[11px] font-black break-all text-emerald-900">
                      ID: {regSuccess}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase leading-normal">
                      Provide this Registration identifier to your Instructor. Once graded at the exam, search your result using the Lookup Result tab with your name.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRegSuccess(null)}
                      className="w-full mt-2 py-2 border border-slate-900 text-[10px] text-slate-900 font-black tracking-widest bg-white hover:bg-slate-50 uppercase transition"
                    >
                      REGISTER ANOTHER STUDENT
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">ACTIVE EXAM CYCLE</label>
                      <select
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                        required
                      >
                        <option value="">-- CHOOSE EXAMINATION EVENT --</option>
                        {exams.map((ex) => (
                          <option key={ex.EXAM_NAME} value={ex.EXAM_NAME}>
                            {ex.EXAM_NAME} ({ex.EXAM_DATE})
                          </option>
                        ))}
                      </select>
                      {selectedExam && (
                        <div className="text-[10px] font-black uppercase text-slate-500 mt-1 flex justify-between items-center bg-slate-100 p-1.5 border border-slate-350">
                          <span>📅 Scheduled Date: <strong className="text-slate-900 font-mono font-bold">{exams.find(e => e.EXAM_NAME === selectedExam)?.EXAM_DATE || "N/A"}</strong></span>
                          {initialExamParam && selectedExam.toUpperCase() === initialExamParam.toUpperCase() && (
                            <span className="text-emerald-700 font-black tracking-wider animate-pulse">● PRE-SELECTED</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">STUDENT WORKSPACE NAME</label>
                      <input
                        type="text"
                        required
                        placeholder="FULL NAME IN CAPITAL LETTERS"
                        value={regStudentName}
                        onChange={(e) => setRegStudentName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black placeholder-slate-400 outline-none text-slate-950 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">CURRENT RANK</label>
                        <select
                          value={regCurrentBelt}
                          onChange={(e) => setRegCurrentBelt(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                        >
                          {BELT_STRUCTURE.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">APPLYING RANK</label>
                        <select
                          value={regAppearingBelt}
                          onChange={(e) => setRegAppearingBelt(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                        >
                          {BELT_STRUCTURE.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">BRANCH NAME</label>
                        <input
                          type="text"
                          required
                          placeholder="E.G. CAMP / KOTHRUD"
                          value={regBranchName}
                          onChange={(e) => setRegBranchName(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black placeholder-slate-400 outline-none text-slate-950 uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">COACH NAME</label>
                        <input
                          type="text"
                          required
                          placeholder="SENSEI IN CHARGE"
                          value={regCoachName}
                          onChange={(e) => setRegCoachName(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black placeholder-slate-400 outline-none text-slate-950 uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">FEES STATUS</label>
                        <select
                          value={regFeesStatus}
                          onChange={(e) => setRegFeesStatus(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black text-slate-900 outline-none rounded-none uppercase cursor-pointer"
                        >
                          <option value="PAID">PAID</option>
                          <option value="NOT PAID">NOT PAID / PENDING</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">SCHOOL NAME</label>
                        <input
                          type="text"
                          placeholder="E.G. ST. VINCENT SCHOOL"
                          value={regSchoolName}
                          onChange={(e) => setRegSchoolName(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-900 p-2 text-xs font-black placeholder-slate-450 outline-none text-slate-950 uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading || !selectedExam}
                      className="w-full mt-1.5 py-3.5 bg-red-650 hover:bg-slate-900 text-white font-black tracking-widest text-[11px] transition duration-200 uppercase cursor-pointer rounded-none border-2 border-slate-900 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                    >
                      {regLoading ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white/50 border-t-white rounded-full inline-block" />
                          SUBMITTING REQUEST...
                        </span>
                      ) : (
                        <>
                          <ClipboardList className="h-4 w-4" /> SUBMIT ONLINE REGISTRATION
                        </>
                      )}
                    </button>

                    {regError && (
                      <div className="mt-2 p-3 bg-red-50 border-2 border-red-600 text-red-700 text-[11px] font-bold uppercase flex items-start gap-2 rounded-none animate-shake">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight leading-relaxed">
              Note: Ensure your credentials match your digital karate membership profile. Results are permanently stored inside our primary promotion catalog.
            </p>
          </div>
        </section>

        {/* Right Column: Result Render Area / Dynamic Registration Guidelines */}
        <section className="flex-1 bg-slate-100 p-6 sm:p-10 flex items-center justify-center">
          
          {activeTab === "register" ? (
            /* Belt progression guidelines & visualizer when registering */
            <div className="w-full max-w-md bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-8">
              <h3 className="text-sm font-black text-slate-900 uppercase font-space border-b-2 border-slate-950 pb-3 mb-5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-700 block"></span> ONLINE REGISTRATION WORKFLOW
              </h3>
              <p className="text-[11px] font-black text-slate-600 uppercase tracking-wide leading-relaxed mb-6">
                Lions Karate Club Pune utilizes an automated digital promotion system. Registering online helps Senseis track roster records securely:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-black bg-red-650 text-white w-6 h-6 flex items-center justify-center shrink-0 border border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">1</span>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Submit Application</h4>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase leading-normal">Parents or students fill core parameters including branch, school name and selected belt levels.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-black bg-red-650 text-white w-6 h-6 flex items-center justify-center shrink-0 border border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">2</span>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Evaluation & Grading</h4>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase leading-normal">On exam day, Chief Coach compiles notes, validates fees, and approves/grades the roster manually.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-black bg-red-650 text-white w-6 h-6 flex items-center justify-center shrink-0 border border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">3</span>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Result Published</h4>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase leading-normal">Once graded, student can query with their assigned ID code instantly to claim and download the official PDF certificate.</p>
                  </div>
                </div>
              </div>

              {/* Belt Progression Roster */}
              <div className="mt-8 border-t-2 border-slate-100 pt-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">OFFICIAL RANK SEQUENCES</h4>
                <div className="flex flex-wrap gap-1.5">
                  {BELT_STRUCTURE.map((b) => {
                    const style = getBeltColorStyle(b);
                    return (
                      <span key={b} className={`text-[8px] font-black px-2 py-1 uppercase border border-slate-900/60 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] ${style.bg}`}>
                        {b}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeResult && activeBeltStyles ? (
            /* Result Card conforming to exact Geometric Balance certificate guidelines */
            <div className="w-full max-w-lg bg-white border-2 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] flex flex-col relative rounded-none animate-slideUp">
              
              {/* Dynamic stamp/watermark based on result */}
              {activeResult.RESULT.toUpperCase() === "PASS" ? (
                <div className="absolute top-6 right-6 border-4 border-emerald-500 px-4 py-1.5 text-emerald-500 font-black text-lg md:text-xl rotate-12 opacity-85 select-none bg-white/90 shadow-[2px_2px_0px_0px_rgba(16,185,129,0.15)]">
                  PASSED
                </div>
              ) : (
                <div className="absolute top-6 right-6 border-4 border-red-500 px-4 py-1.5 text-red-500 font-black text-lg md:text-xl -rotate-12 opacity-85 select-none bg-white/90 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.15)]">
                  RETRY
                </div>
              )}

              <div className="p-8 border-b-2 border-slate-900">
                <h3 className="text-[10px] font-black text-red-700 tracking-[0.3em] mb-4 uppercase font-space">
                  BELT EXAMINATION CERTIFICATE
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-2xl sm:text-3xl font-black uppercase text-slate-950 font-space leading-tight">
                    {activeResult.STUDENT_NAME}
                  </span>
                  <span className="text-slate-400 font-mono text-xs font-bold uppercase tracking-wider">
                    STUDENT ID: {activeResult.EXAM_ID}
                  </span>
                </div>
              </div>

              {/* Specification split table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-slate-900 border-b-2 border-slate-900">
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Current Rank</span>
                    <span className="text-sm sm:text-base font-black uppercase text-slate-900">{activeResult.CURRENT_BELT}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Achieved Rank</span>
                    <span className="text-sm sm:text-base font-black text-red-700 uppercase">{activeResult.ACHIEVED_BELT}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-4 bg-slate-50/50">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Grade Achieved</span>
                    <span className="text-sm sm:text-base font-black uppercase text-slate-900">RATE {activeResult.GRADE}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Exam Date</span>
                    <span className="text-sm sm:text-base font-black uppercase text-slate-900">{activeResult.EXAM_DATE}</span>
                  </div>
                </div>
              </div>

              {/* Message Box and Action Button */}
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="flex flex-col max-w-[70%] sm:max-w-[65%]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Instructor assessment</span>
                  <span className="text-xs italic font-semibold text-slate-250 mt-1 uppercase leading-relaxed font-sans text-stone-200">
                    "{activeResult.CONGRATULATION_MSG || (activeResult.RESULT.toUpperCase() === "PASS" ? "OUTSTANDING FORM IN KATA. CONTINUE WITH DISCIPLINE CORRECTION." : "RECOMMEND FOCUSING ON BASICS AND BALANCE. PRACTICE DAI-NI KATA.")}"
                  </span>
                </div>
                <button 
                  onClick={generatePDFCertificate}
                  className="bg-white text-slate-900 border-2 border-slate-900 px-4 py-2.5 font-black text-[10px] tracking-widest flex items-center justify-center gap-1.5 hover:bg-red-700 hover:text-white transition-all uppercase rounded-none cursor-pointer self-start sm:self-auto shrink-0 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  PDF Download
                </button>
              </div>

            </div>
          ) : (
            /* Standby Placeholder block */
            <div className="text-center p-8 border-4 border-dashed border-slate-350 bg-white/70 w-full max-w-sm flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(15,23,42,0.05)]">
              <div className="w-14 h-14 bg-red-700 flex items-center justify-center rotate-45 mb-6 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]">
                <Award className="h-5 w-5 text-white -rotate-45" />
              </div>
              <h3 className="text-xs font-black tracking-widest uppercase text-slate-900 mb-1.5 font-space">VERIFICATION ACCESS</h3>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide max-w-[220px] mx-auto leading-relaxed">
                Type the student full name & Exam identification case code to unveil belt certificates instantly.
              </p>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
