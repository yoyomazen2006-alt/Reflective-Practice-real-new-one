
export type RootCauseType = string;

export type Competency = string;

export interface AIResponse {
  situationSummary: string;
  clinicalAnalysis: string;
  rootCause: string;
  actionPlan: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ReflectionEntry {
  id: string;
  date: string;
  situation: string;
  emotion: string;
  
  // Structured Data
  rootCauseType: RootCauseType;
  competency: Competency;
  tags: string[]; // e.g., "Suturing", "Cards", "ER"
  
  cause: string; // The specific description
  learning: string;
  plan: string;
  stressLevel: number; // 1-10
  
  // AI Data
  aiFeedback?: AIResponse;
  chatHistory?: ChatMessage[];
  
  // Action Tracking
  actionTaken: boolean;
}

export type AppView = 'home' | 'wizard' | 'dashboard';
