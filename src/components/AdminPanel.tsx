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
  MessageSquare
} from "lucide-react";
import { ExamConfig, StudentResult } from "../types";
import { getClubLogoBase64 } from "./LogoGenerator";

interface AdminPanelProps {
  onSignOut: () => void;
}

export default function AdminPanel({ onSignOut }: AdminPanelProps) {
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

  // WhatsApp sharer states
  const [waExam, setWaExam] = useState("");
  const [waStudentName, setWaStudentName] = useState("");
  const [waStudentId, setWaStudentId] = useState("");
  const [waMessageType, setWaMessageType] = useState<"universal" | "individual">("universal");
  const [waClipboardSuccess, setWaClipboardSuccess] = useState(false);

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

    const portalUrl = generatedLink && waExam === linkExam
      ? generatedLink 
      : `${defaultOrigin}/?exam=${examCode}`;
    
    if (waMessageType === "universal") {
      return `🥋 *LIONS KARATE CLUB PUNE* 🥋\n\nDear Parents & Students,\n\nWe are pleased to announce that the official results for the *Belt Examination ${examCode}* are now officially live on the portal! 🏆🎖️\n\n📌 *How to instantly check your result:*\n1️⃣ Tap the direct portal link below (type it exactly into your browser address bar as shown, with no extra characters/backslashes/asterisks):\n\n${portalUrl}\n\n2️⃣ Enter student credentials:\n• Select Exam: *${examCode}*\n• Enter exact registered Student Name\n• Enter your Student ID (e.g., LKC01)\n\n3️⃣ View results and download your formal PDF digital certificate!\n\nOSS! 🙏🥋🔥`;
    } else {
      const studentNameUpper = waStudentName.trim() || "[STUDENT_NAME]";
      const idUpper = waStudentId.trim() || "[EXAM_ID]";
      return `🥋 *LIONS KARATE CLUB PUNE* 🥋\n\nDear Parent/Student,\n\nCONGRATULATIONS! The official promotion results for *${studentNameUpper}* (ID: *${idUpper}*) for our *Belt Examination ${examCode}* are out! 🎉🥋⭐\n\nKindly check your grade & download your elegant PDF certificate from the link below (type it exactly into your browser address bar as shown, with no extra characters/backslashes/asterisks):\n\n${portalUrl}\n\n*Credentials to enter on site:*\n• Select Exam: *${examCode}*\n• Student Name: *${studentNameUpper}*\n• Student ID: *${idUpper}*\n\nGreat job on your dedication and spirit! Keep practicing! 🔥\n\nOss! 🙏🥋`;
    }
  };

  // Load exams on mount
  useEffect(() => {
    fetchExams();
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
      setGeneratedLink(targetUrl);
    } catch (error) {
      console.error(error);
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Derived Sheet target info (Auto)
                </label>
                <div className="w-full bg-slate-100 border-2 border-dashed border-slate-900 p-3 text-xs font-mono font-bold text-slate-800 break-all">
                  {newExamName ? `${newExamName} (DATE: ${newExamDate})` : "CHOOSE EXAM DATE ABOVE"}
                </div>
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

              <button
                onClick={handleGenerateLink}
                disabled={!linkExam}
                className="w-full py-3 bg-slate-900 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black tracking-widest text-xs uppercase cursor-pointer rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] transition-colors"
              >
                GENERATE ACCESS URL
              </button>

              {generatedLink && (
                <div className="mt-4 space-y-2">
                  <div className="bg-amber-100 border-2 border-amber-600 p-3 text-[10px] md:text-[11px] font-black text-amber-950 leading-relaxed uppercase rounded-none shadow-[2px_2px_0px_0px_rgba(217,119,6,0.2)]">
                    ⚠️ <span className="underline text-red-700">Mobile Sharing rule:</span> This is the official public portal link. Copy ONLY this link below or click "Copy URL" to send to WhatsApp. DO NOT share the "aistudio.google.com" link from your browser address bar - that is a private workspace and will fail with a 403 error on other phones!
                  </div>
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

          {/* 3. WhatsApp Message & Share Generator */}
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
                      {ex.EXAM_NAME} ({(ex.EXAM_DATE)})
                    </option>
                  ))}
                </select>
              </div>

              {waMessageType === "individual" && (
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

                {/* Highly Informative Sharing Warning Card */}
                <div className="p-4 bg-amber-50 border-2 border-amber-500 font-bold text-[10px] text-amber-950 uppercase space-y-2 rounded-none animate-fadeIn leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-700 font-black">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>⚠️ PORTAL LINK SHARING SYSTEM GUIDE</span>
                  </div>
                  <p className="font-semibold normal-case text-slate-800">
                    To make sure students and parents access the portal correctly without receiving a "broken link" or Google Search error:
                  </p>
                  <ul className="list-disc list-inside space-y-1 normal-case text-slate-700 font-medium pl-1">
                    <li>Do <strong className="font-bold text-red-700">NOT</strong> wrap the link inside asterisks (<code className="font-bold font-mono text-slate-950 bg-amber-100 rounded px-1 inline-block">*link*</code>) inside chat, and don't add backslashes (<code className="font-bold font-mono text-slate-950 bg-amber-100 rounded px-1 inline-block">\</code>) at the end!</li>
                    <li><strong>Open in Address Bar directly:</strong> Parents must paste or type the link into the mobile browser's <strong className="font-bold text-slate-950">top address bar</strong> (Chrome/Safari), not into Google Search. Searching a private portal link on Google displays <span className="italic">"did not match any documents"</span> because dev portals are unindexed!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Add Student Result Form (Takes more space) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b-2 border-slate-900">
              <UserPlus className="text-red-700 h-5 w-5" />
              <h3 className="font-black text-xs tracking-widest text-slate-950 uppercase font-space">
                3. Add Student Performance Record
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
                  <input
                    type="text"
                    required
                    placeholder="E.G. WHITE BELT"
                    value={currentBelt}
                    onChange={(e) => setCurrentBelt(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-bold text-slate-950 placeholder-slate-400 focus:bg-white rounded-none uppercase outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    achieved belt rank
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. YELLOW BELT"
                    value={achievedBelt}
                    onChange={(e) => setAchievedBelt(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-900 p-2.5 text-xs font-bold text-slate-950 placeholder-slate-400 focus:bg-white rounded-none uppercase outline-none"
                  />
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

      {/* Exporter Removed successfully as requested */}
    </div>
  );
}
