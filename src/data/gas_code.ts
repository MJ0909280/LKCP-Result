export const GAS_CODE_GS = `/**
 * Google Apps Script for Karate Dojo Belt Exam Results
 * Save this file as 'Code.gs' in your Google Apps Script project.
 */

// Configure your Admin Password here
const ADMIN_PASSWORD = "MJ2027";

/**
 * Handles Web App GET requests.
 * Routes to Admin Panel or Public lookup.
 */
function doGet(e) {
  const mode = e.parameter.mode || "";
  const pass = e.parameter.pass || "";
  const exam = e.parameter.exam || "";
  
  if (mode === "admin" && pass === ADMIN_PASSWORD) {
    const template = HtmlService.createTemplateFromFile("Admin");
    template.password = pass;
    return template.evaluate()
      .setTitle("Karate Dojo - Admin Panel")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    const template = HtmlService.createTemplateFromFile("Index");
    template.examParam = exam;
    return template.evaluate()
      .setTitle("Karate Dojo - Exam Results Lookup")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Helper to get the active spreadsheet.
 * Automatically creates the 'Config' sheet if it doesn't exist.
 */
function getSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName("Config");
  if (!configSheet) {
    configSheet = ss.insertSheet("Config");
    configSheet.appendRow(["EXAM_NAME", "EXAM_DATE"]);
  }
  return ss;
}

/**
 * Returns a list of all examinations from the Config sheet.
 */
function getExamList() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("Config");
    const data = sheet.getDataRange().getValues();
    
    // Skip headers
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        list.push({
          EXAM_NAME: String(data[i][0]).toUpperCase().trim(),
          EXAM_DATE: String(data[i][1]).trim()
        });
      }
    }
    return list;
  } catch (err) {
    Logger.log("Error in getExamList: " + err.toString());
    return [];
  }
}

/**
 * Creates a new examination.
 * Creates a new sheet named examName and appends to Config.
 */
function createExam(examName, examDate) {
  try {
    const normalizedExamName = String(examName).toUpperCase().replace(/\\s+/g, "").trim();
    if (!normalizedExamName) throw new Error("Invalid Exam Name.");
    
    const ss = getSpreadsheet();
    
    // Check if sheet already exists
    if (ss.getSheetByName(normalizedExamName)) {
      throw new Error("An exam named " + normalizedExamName + " already exists!");
    }
    
    // Insert new sheet and set headers
    const newSheet = ss.insertSheet(normalizedExamName);
    newSheet.appendRow([
      "STUDENT_NAME", 
      "EXAM_ID", 
      "CURRENT_BELT", 
      "ACHIEVED_BELT", 
      "GRADE", 
      "RESULT", 
      "CONGRATULATION_MSG", 
      "EXAM_DATE"
    ]);
    
    // Append to Config sheet
    const configSheet = ss.getSheetByName("Config");
    configSheet.appendRow([normalizedExamName, examDate]);
    
    return { success: true, examName: normalizedExamName };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Appends a student result row to a specific exam sheet.
 */
function addStudentToExam(examName, student) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(examName);
    if (!sheet) {
      throw new Error("Exam sheet '" + examName + "' does not exist!");
    }
    
    // Ensure all values are in uppercase (results logic requires uppercase)
    const row = [
      String(student.STUDENT_NAME).toUpperCase().trim(),
      String(student.EXAM_ID).toUpperCase().trim(),
      String(student.CURRENT_BELT).toUpperCase().trim(),
      String(student.ACHIEVED_BELT).toUpperCase().trim(),
      String(student.GRADE).toUpperCase().trim(),
      String(student.RESULT).toUpperCase().trim(), // "PASS" or "FAIL"
      String(student.CONGRATULATION_MSG).toUpperCase().trim(),
      String(student.EXAM_DATE).trim()
    ];
    
    sheet.appendRow(row);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Searches for a student result in the specified exam sheet.
 * Inputs matched case-insensitively (uppercase compared).
 */
function lookupResult(examName, studentName, examId) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(examName);
    if (!sheet) {
      return { found: false, error: "Exam '" + examName + "' sheet was not found." };
    }
    
    const data = sheet.getDataRange().getValues();
    const targetName = String(studentName).toUpperCase().trim();
    const targetId = String(examId).toUpperCase().trim();
    
    // Columns: STUDENT_NAME (0), EXAM_ID (1), CURRENT_BELT (2), ACHIEVED_BELT (3), GRADE (4), RESULT (5), CONGRATULATION_MSG (6), EXAM_DATE (7)
    for (let i = 1; i < data.length; i++) {
      const studentNameCol = String(data[i][0]).toUpperCase().trim();
      const examIdCol = String(data[i][1]).toUpperCase().trim();
      
      if (studentNameCol === targetName && examIdCol === targetId) {
        return {
          found: true,
          data: {
            STUDENT_NAME: data[i][0],
            EXAM_ID: data[i][1],
            CURRENT_BELT: data[i][2],
            ACHIEVED_BELT: data[i][3],
            GRADE: data[i][4],
            RESULT: data[i][5],
            CONGRATULATION_MSG: data[i][6],
            EXAM_DATE: data[i][7]
          }
        };
      }
    }
    
    return { found: false };
  } catch (err) {
    return { found: false, error: err.toString() };
  }
}

/**
 * Generates the public link for a specific exam.
 */
function getPublicLink(examName) {
  const url = ScriptApp.getService().getUrl();
  return url + "?exam=" + encodeURIComponent(examName);
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Karate Dojo - Belt Examination Results</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      width: 90%;
      margin: 40px auto;
      background: #1e293b;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5);
      border-top: 5px solid #ef4444;
    }
    .header-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 25px;
    }
    .logo-img {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
      border: 3px solid #f8fafc;
    }
    .logo-img svg {
      width: 50px;
      height: 50px;
      fill: #ffffff;
    }
    h1 {
      font-size: 24px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #f8fafc;
      text-align: center;
    }
    p.subtitle {
      color: #94a3b8;
      text-align: center;
      margin-top: 6px;
      font-size: 15px;
    }
    .badge {
      background-color: #ef4444;
      color: #fff;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
      display: inline-block;
    }
    .form-group {
      margin-bottom: 18px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #cbd5e1;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #fff;
      font-size: 15px;
      text-transform: uppercase;
    }
    input:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
    }
    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary {
      background-color: #ef4444;
      color: white;
    }
    .btn-primary:hover {
      background-color: #dc2626;
    }
    .btn-pdf {
      background-color: #10b981;
      color: white;
      margin-top: 15px;
    }
    .btn-pdf:hover {
      background-color: #059669;
    }
    .result-card {
      margin-top: 30px;
      background-color: #0f172a;
      border-radius: 8px;
      padding: 20px;
      border-left: 5px solid #ef4444;
      display: none;
    }
    .result-card.pass {
      border-left-color: #10b981;
    }
    .result-card.fail {
      border-left-color: #ef4444;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding: 10px 0;
    }
    .result-row:last-child {
      border-bottom: none;
    }
    .result-label {
      color: #94a3b8;
      font-size: 14px;
    }
    .result-val {
      font-weight: bold;
      color: #f8fafc;
    }
    .msg-congrats {
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px dashed #10b981;
      color: #34d399;
      padding: 12px;
      border-radius: 6px;
      margin-top: 15px;
      text-align: center;
      font-size: 14px;
    }
    .msg-try-again {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px dashed #ef4444;
      color: #fca5a5;
      padding: 12px;
      border-radius: 6px;
      margin-top: 15px;
      text-align: center;
      font-size: 14px;
    }
    .text-center {
      text-align: center;
    }
    .loader {
      display: none;
      text-align: center;
      margin: 20px 0;
      color: #64748b;
    }
    .error-box {
      background-color: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 12px;
      border-radius: 6px;
      margin-top: 20px;
      display: none;
      text-align: center;
    }
  </style>

  <!-- jsPDF CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>

  <div class="container">
    <div class="header-logo">
      <div class="logo-img">
        <!-- Minimal Karate Belt SVG Logo -->
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="6"/>
          <path d="M 30 50 Q 50 35 70 50 M 30 55 Q 50 40 70 55" stroke="white" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M 45 48 H 55 M 42 53 H 58" stroke="red" stroke-width="4"/>
        </svg>
      </div>
      <h1 id="club-title">SHOTO-RYU KARATE ACADEMY</h1>
      <p class="subtitle">Official Examination Verification Center</p>
      <div class="badge" id="exam-badge">Loading...</div>
    </div>

    <div class="form-group">
      <label for="studentName">Student Name</label>
      <input type="text" id="studentName" placeholder="ENTER FULL STUDENT NAME">
    </div>

    <div class="form-group">
      <label for="examId">Exam ID (e.g., LKC01)</label>
      <input type="text" id="examId" placeholder="ENTER UNIQUE EXAM ID">
    </div>

    <button class="btn-primary" onclick="checkStudentResult()">Check Result</button>

    <div class="loader" id="loader">Searching record, please wait...</div>
    <div class="error-box" id="errorBox"></div>

    <!-- Student Result Presentation -->
    <div class="result-card" id="resultCard">
      <div class="result-row">
        <span class="result-label">STUDENT NAME</span>
        <span class="result-val" id="rName">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">EXAM ID</span>
        <span class="result-val" id="rId">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">EXAM DATE</span>
        <span class="result-val" id="rDate">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">CURRENT BELT</span>
        <span class="result-val" id="rCurrentBelt">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">ACHIEVED BELT</span>
        <span class="result-val" id="rAchievedBelt">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">GRADE / STATUS</span>
        <span class="result-val" id="rGrade">-</span>
      </div>
      <div class="result-row">
        <span class="result-label">RESULT</span>
        <span class="result-val" id="rStatus">-</span>
      </div>
      <div id="resultMessage"></div>

      <button class="btn-pdf" id="downloadBtn" onclick="generatePDF()">Download PDF Certificate</button>
    </div>
  </div>

  <script>
    // Extract query parameter from template injection or window location
    const EXAM_NAME = "<?= examParam ?>".toUpperCase() || getQueryParam("exam").toUpperCase();
    
    document.getElementById("exam-badge").innerText = "EXAM: " + (EXAM_NAME || "NOT SPECIFIED");

    // Live inputs auto-uppercase
    const nameInput = document.getElementById("studentName");
    const idInput = document.getElementById("examId");

    nameInput.addEventListener("input", function() {
      this.value = this.value.toUpperCase();
    });
    idInput.addEventListener("input", function() {
      this.value = this.value.toUpperCase();
    });

    function getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name) || "";
    }

    let activeStudentData = null;

    function checkStudentResult() {
      const studentName = nameInput.value.trim().toUpperCase();
      const examId = idInput.value.trim().toUpperCase();
      const errorBox = document.getElementById("errorBox");
      const resultCard = document.getElementById("resultCard");
      const loader = document.getElementById("loader");

      errorBox.style.display = "none";
      resultCard.style.display = "none";
      
      if (!EXAM_NAME) {
        errorBox.innerText = "ERROR: NO EXAMINATION SPECIFIED IN THE URL. (?exam=EXAMNAME REQUIRED)";
        errorBox.style.display = "block";
        return;
      }
      if (!studentName || !examId) {
        errorBox.innerText = "ERROR: BOTH STUDENT NAME AND EXAM ID ARE REQUIRED.";
        errorBox.style.display = "block";
        return;
      }

      loader.style.display = "block";

      // Call Google Apps Script backend lookupResult
      google.script.run
        .withSuccessHandler(function(response) {
          loader.style.display = "none";
          if (response.found) {
            const data = response.data;
            activeStudentData = data;
            
            // Fill card
            document.getElementById("rName").innerText = data.STUDENT_NAME.toUpperCase();
            document.getElementById("rId").innerText = data.EXAM_ID.toUpperCase();
            document.getElementById("rDate").innerText = data.EXAM_DATE;
            document.getElementById("rCurrentBelt").innerText = data.CURRENT_BELT.toUpperCase();
            document.getElementById("rAchievedBelt").innerText = data.ACHIEVED_BELT.toUpperCase();
            document.getElementById("rGrade").innerText = data.GRADE.toUpperCase();
            
            const statusEl = document.getElementById("rStatus");
            statusEl.innerText = data.RESULT.toUpperCase();
            
            const msgBox = document.getElementById("resultMessage");
            msgBox.innerHTML = "";
            
            if (data.RESULT.toUpperCase() === "PASS") {
              resultCard.className = "result-card pass";
              statusEl.style.color = "#10b981";
              msgBox.innerHTML = '<div class="msg-congrats">' + data.CONGRATULATION_MSG.toUpperCase() + '</div>';
            } else {
              resultCard.className = "result-card fail";
              statusEl.style.color = "#ef4444";
              msgBox.innerHTML = '<div class="msg-try-again">RESULT: NOT PROMOTED AT THIS TIME. KEEP TRAINING HARD!</div>';
            }
            
            resultCard.style.display = "block";
          } else {
            errorBox.innerText = "RECORD NOT FOUND. PLEASE CHECK STUDENT NAME AND EXAM ID CARD.";
            errorBox.style.display = "block";
          }
        })
        .withFailureHandler(function(err) {
          loader.style.display = "none";
          errorBox.innerText = "SERVER ERROR: " + err.message;
          errorBox.style.display = "block";
        })
        .lookupResult(EXAM_NAME, studentName, examId);
    }

    function generatePDF() {
      if (!activeStudentData) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const sName = activeStudentData.STUDENT_NAME.toUpperCase();
      const sId = activeStudentData.EXAM_ID.toUpperCase();
      const currentBelt = activeStudentData.CURRENT_BELT.toUpperCase();
      const achievedBelt = activeStudentData.ACHIEVED_BELT.toUpperCase();
      const grade = activeStudentData.GRADE.toUpperCase();
      const result = activeStudentData.RESULT.toUpperCase();
      const date = activeStudentData.EXAM_DATE;
      const message = activeStudentData.CONGRATULATION_MSG.toUpperCase();

      // Border Design
      doc.setDrawColor(239, 68, 68); // Red
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 194, 281);
      doc.setDrawColor(15, 23, 42); // Navy
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);

      // Certificate Title / Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text("SHOTO-RYU KARATE ACADEMY", 105, 35, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("OFFICIAL BELT PROMOTION CERTIFICATE", 105, 42, { align: "center" });

      // Graphic line
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(1);
      doc.line(40, 48, 170, 48);

      // Body Section
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "italic");
      doc.text("This is to certify that", 105, 65, { align: "center" });

      // Student Name Display
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(239, 68, 68);
      doc.text(sName, 105, 80, { align: "center" });

      // ID
      doc.setFontSize(11);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("EXAMINATION IDENTIFICATION NUMBER: " + sId, 105, 88, { align: "center" });

      // Paragraph
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "italic");
      doc.text("has successfully completed all requirements and tests on", 105, 106, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(date, 105, 116, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "italic");
      doc.text("and is hereby promoted to the rank of", 105, 128, { align: "center" });

      // Belt Promoted
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(30, 41, 59);
      doc.text(achievedBelt, 105, 148, { align: "center" });

      // Result details grid
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(30, 165, 150, 45, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("EXAMINATION SPECIFICATIONS", 35, 172);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text("PREVIOUS RANK / BELT:", 35, 182);
      doc.text("PROMOTED RANK / BELT:", 35, 189);
      doc.text("EVALUATION GRADE:", 35, 196);
      doc.text("PROMOTION STATUS:", 35, 203);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(currentBelt, 95, 182);
      doc.text(achievedBelt, 95, 189);
      doc.text(grade, 95, 196);
      
      if (result === "PASS") {
        doc.setTextColor(16, 185, 129); // Green
        doc.text("PASS / PROMOTED", 95, 203);
      } else {
        doc.setTextColor(239, 68, 68); // Red
        doc.text("FAIL / KEEP TRAINING", 95, 203);
      }

      // Congratulation Message
      if (result === "PASS" && message) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text('"' + message + '"', 105, 227, { align: "center", maxWidth: 140 });
      }

      // Signatures
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);

      doc.line(35, 260, 85, 260);
      doc.text("EXAMINING SENSEI", 60, 265, { align: "center" });

      doc.line(125, 260, 175, 260);
      doc.text("CLUB PRESIDENT", 150, 265, { align: "center" });

      // Save PDF
      doc.save(sName.replace(/\\s+/g, "_") + "_" + EXAM_NAME + "_Result.pdf");
    }
  </script>
</body>
</html>
`;

export const GAS_ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Karate Dojo - Admin Portal</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f172a;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .header {
      background-color: #1e293b;
      padding: 20px;
      border-bottom: 5px solid #ef4444;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .wrapper {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }
    @media (min-width: 768px) {
      .wrapper {
        grid-template-columns: 1fr 1fr;
      }
      .full-span {
        grid-column: span 2;
      }
    }
    .card {
      background: #1e293b;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
    }
    .card h2 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 18px;
      text-transform: uppercase;
      color: #cbd5e1;
      border-bottom: 2px solid #334155;
      padding-bottom: 10px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    input, select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 5px;
      color: #fff;
      font-size: 14px;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #ef4444;
    }
    input[type="text"], textarea {
      text-transform: uppercase;
    }
    button {
      padding: 12px 20px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn-create {
      background-color: #ef4444;
      color: white;
    }
    .btn-create:hover {
      background-color: #dc2626;
    }
    .btn-submit {
      background-color: #3b82f6;
      color: white;
    }
    .btn-submit:hover {
      background-color: #2563eb;
    }
    .btn-link {
      background-color: #10b981;
      color: white;
    }
    .btn-link:hover {
      background-color: #059669;
    }
    .status-msg {
      margin-top: 15px;
      padding: 10px;
      border-radius: 5px;
      font-size: 13px;
      display: none;
    }
    .status-success {
      background-color: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
    }
    .status-error {
      background-color: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #fca5a5;
    }
    .link-out {
      margin-top: 15px;
      background-color: #0f172a;
      padding: 12px;
      border-radius: 5px;
      border: 1px solid #334155;
      word-break: break-all;
      font-family: monospace;
      font-size: 13px;
      display: none;
    }
    .link-out a {
      color: #3b82f6;
      text-decoration: none;
    }
    .link-out a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>KARATE EXAM PORTAL - ADMINISTRATIVE CABINET</h1>
    <span style="font-size:12px; background:#475569; padding:4px 8px; border-radius:4px; font-weight:bold;">SECURE SESS</span>
  </div>

  <div class="wrapper">
    
    <!-- CARD 1: CREATE EXAM -->
    <div class="card">
      <h2>1. Create New Exam</h2>
      <div class="form-group">
        <label for="examName">Exam Name (e.g. MAY2026)</label>
        <input type="text" id="examName" placeholder="NO SPACES. E.G., MAY2026" oninput="this.value=this.value.toUpperCase().replace(/\\s+/g,'')">
      </div>
      <div class="form-group">
        <label for="examDate">Exam Date</label>
        <input type="date" id="examDate">
      </div>
      <button class="btn-create" onclick="submitCreateExam()">Create Exam Sheet</button>
      <div id="createStatus" class="status-msg"></div>
    </div>

    <!-- CARD 2: PUBLIC LINK GENERATOR -->
    <div class="card">
      <h2>2. Get Public Lookup Link</h2>
      <div class="form-group">
        <label for="linkExamSelect">Select Examination</label>
        <select id="linkExamSelect">
          <option value="">-- SELECT EXAM --</option>
        </select>
      </div>
      <button class="btn-link" onclick="generatePublicLink()">Generate Access URL</button>
      <div id="linkOut" class="link-out"></div>
    </div>

    <!-- CARD 3: ADD RESULT (FULL WIDTH) -->
    <div class="card full-span">
      <h2>3. Add Student Performance Record</h2>
      <form id="studentForm" onsubmit="event.preventDefault(); submitStudentRecord();">
        <div style="display:grid; grid-template-columns:1fr; gap:15px;" id="formGrid">
          
          <div class="form-group">
            <label for="studentExamSelect">Select Exam Target</label>
            <select id="studentExamSelect" onchange="onStudentExamChanged(this.value)">
              <option value="">-- SELECT EXAM --</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div class="form-group">
              <label for="studentName">Student Full Name</label>
              <input type="text" id="studentName" placeholder="E.G., JOHN DOE" required oninput="this.value=this.value.toUpperCase()">
            </div>
            <div class="form-group">
              <label for="studentExamId">Exam ID Card Target</label>
              <input type="text" id="studentExamId" placeholder="E.G., LKC01" required oninput="this.value=this.value.toUpperCase()">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px;">
            <div class="form-group">
              <label for="currentBelt">Current Belt Rank</label>
              <input type="text" id="currentBelt" placeholder="E.G., WHITE BELT" required oninput="this.value=this.value.toUpperCase()">
            </div>
            <div class="form-group">
              <label for="achievedBelt">Achieved Belt Promotion</label>
              <input type="text" id="achievedBelt" placeholder="E.G., YELLOW BELT" required oninput="this.value=this.value.toUpperCase()">
            </div>
            <div class="form-group">
              <label for="studentGrade">Evaluation Grade</label>
              <input type="text" id="studentGrade" placeholder="E.G., A, B+, EXCELLENT" required oninput="this.value=this.value.toUpperCase()">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div class="form-group">
              <label for="studentResult">Promotion Verdict</label>
              <select id="studentResult" required>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>
            <div class="form-group">
              <label for="resultExamDate">Record Exam Date</label>
              <input type="date" id="resultExamDate" required>
            </div>
          </div>

          <div class="form-group">
            <label for="congratsMsg">Congratulation Message / Comments</label>
            <textarea id="congratsMsg" rows="3" placeholder="CONGRATULATIONS ON PASSING! EXPERT KATA AND SPARRING EFFORT." oninput="this.value=this.value.toUpperCase()"></textarea>
          </div>

        </div>

        <button type="submit" class="btn-submit" style="margin-top:15px;">Append Student Performance Row</button>
      </form>
      <div id="studentStatus" class="status-msg"></div>
    </div>

  </div>

  <script>
    // Injected admin password from Code.gs doGet
    const currentPass = "<?= password ?>";

    // Global exams array
    let examListGlobal = [];

    // On Load
    window.onload = function() {
      refreshExams();
    };

    function refreshExams() {
      google.script.run
        .withSuccessHandler(function(exams) {
          examListGlobal = exams;
          populateDropdowns(exams);
        })
        .withFailureHandler(function(err) {
          alert("Failed to load examinations from Config: " + err.message);
        })
        .getExamList();
    }

    function populateDropdowns(exams) {
      const selectLink = document.getElementById("linkExamSelect");
      const selectStudent = document.getElementById("studentExamSelect");

      // Reset options keep first
      selectLink.innerHTML = '<option value="">-- SELECT EXAM --</option>';
      selectStudent.innerHTML = '<option value="">-- SELECT EXAM --</option>';

      exams.forEach(function(exam) {
        const opt1 = document.createElement("option");
        opt1.value = exam.EXAM_NAME;
        opt1.innerText = exam.EXAM_NAME + " (" + exam.EXAM_DATE + ")";
        selectLink.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = exam.EXAM_NAME;
        opt2.innerText = exam.EXAM_NAME + " (" + exam.EXAM_DATE + ")";
        selectStudent.appendChild(opt2);
      });
    }

    function onStudentExamChanged(selectedExamName) {
      const exam = examListGlobal.find(e => e.EXAM_NAME === selectedExamName);
      if (exam) {
        document.getElementById("resultExamDate").value = exam.EXAM_DATE;
      }
    }

    function submitCreateExam() {
      const examName = document.getElementById("examName").value.trim().toUpperCase().replace(/\\s+/g,"");
      const examDate = document.getElementById("examDate").value;
      const statusBox = document.getElementById("createStatus");

      statusBox.style.display = "none";

      if (!examName || !examDate) {
        showStatus(statusBox, "ERROR: EXAM NAME AND DATE ARE REQUIRED.", false);
        return;
      }

      google.script.run
        .withSuccessHandler(function(res) {
          if (res.success) {
            showStatus(statusBox, "SUCCESSFULLY CREATED EXAMINATIONS SHEET: " + res.examName, true);
            document.getElementById("examName").value = "";
            document.getElementById("examDate").value = "";
            refreshExams();
          } else {
            showStatus(statusBox, "ERROR: " + res.error, false);
          }
        })
        .withFailureHandler(function(err) {
          showStatus(statusBox, "SERVER ERROR: " + err.message, false);
        })
        .createExam(examName, examDate);
    }

    function submitStudentRecord() {
      const examSelect = document.getElementById("studentExamSelect").value;
      const statusBox = document.getElementById("studentStatus");

      statusBox.style.display = "none";

      if (!examSelect) {
        showStatus(statusBox, "ERROR: PLEASE SELECT AN EXAM FIRST.", false);
        return;
      }

      const student = {
        STUDENT_NAME: document.getElementById("studentName").value.trim().toUpperCase(),
        EXAM_ID: document.getElementById("studentExamId").value.trim().toUpperCase(),
        CURRENT_BELT: document.getElementById("currentBelt").value.trim().toUpperCase(),
        ACHIEVED_BELT: document.getElementById("achievedBelt").value.trim().toUpperCase(),
        GRADE: document.getElementById("studentGrade").value.trim().toUpperCase(),
        RESULT: document.getElementById("studentResult").value,
        CONGRATULATION_MSG: document.getElementById("congratsMsg").value.trim().toUpperCase(),
        EXAM_DATE: document.getElementById("resultExamDate").value
      };

      google.script.run
        .withSuccessHandler(function(res) {
          if (res.success) {
            showStatus(statusBox, "RECORD SUCCESSFULY STORED IN EXAM " + examSelect + " SHEET!", true);
            document.getElementById("studentForm").reset();
          } else {
            showStatus(statusBox, "ERROR: " + res.error, false);
          }
        })
        .withFailureHandler(function(err) {
          showStatus(statusBox, "SERVER FAILED: " + err.message, false);
        })
        .addStudentToExam(examSelect, student);
    }

    function generatePublicLink() {
      const examSelect = document.getElementById("linkExamSelect").value;
      const linkBox = document.getElementById("linkOut");

      linkBox.style.display = "none";

      if (!examSelect) {
        alert("Please select an exam first!");
        return;
      }

      google.script.run
        .withSuccessHandler(function(link) {
          // Fallback if URL is empty (e.g. running outside deployed Web App state)
          let finalLink = link;
          if (!finalLink || finalLink.indexOf("undefined") > -1) {
            finalLink = "https://script.google.com/macros/s/AKfycb.../exec?exam=" + examSelect;
          }
          linkBox.innerHTML = '<strong>PUBLIC ACCESS LINK:</strong><br><a href="' + finalLink + '" target="_blank">' + finalLink + '</a>';
          linkBox.style.display = "block";
        })
        .withFailureHandler(function(err) {
          alert("Error generating public link: " + err.message);
        })
        .getPublicLink(examSelect);
    }

    function showStatus(element, text, isSuccess) {
      element.innerText = text;
      element.className = "status-msg " + (isSuccess ? "status-success" : "status-error");
      element.style.display = "block";
    }
  </script>
</body>
</html>
`;
