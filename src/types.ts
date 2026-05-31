export interface ExamConfig {
  EXAM_NAME: string;
  EXAM_DATE: string;
}

export interface StudentResult {
  STUDENT_NAME: string;
  EXAM_ID: string;
  CURRENT_BELT: string;
  ACHIEVED_BELT: string;
  GRADE: string; // e.g., "A", "B", "PASS WITH DISTINCTION"
  RESULT: "PASS" | "FAIL";
  CONGRATULATION_MSG: string;
  EXAM_DATE: string;
}

export interface SheetsData {
  config: ExamConfig[];
  exams: Record<string, StudentResult[]>;
}
