/**
 * Agent 集群系统类型定义
 */

export interface Task {
  id: string;
  iterationId?: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'design' | 'test' | 'docs';
  priority: 'high' | 'medium' | 'low';
  description: string;
  requirements: string[];
  context: ContextSnapshot;
  agent: AgentType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'reviewing';
  worktree?: string;
  tmuxSession?: string;
  prUrl?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retries: number;
  learning?: LearningRecord;
}

export interface ContextSnapshot {
  iterationId: string;
  customerNotes?: string;
  meetingNotes?: string;
  previousDecisions?: string[];
  codeContext?: string;
  relevantDocs?: string[];
}

export type AgentType = 'claude-code' | 'codex' | 'gemini';

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LearningRecord {
  successPatterns: string[];
  failurePatterns: string[];
  promptImprovements: string[];
  lastUpdated: number;
}

export interface OrchestratorConfig {
  repoPath: string;
  worktreesDir: string;
  tasksDir: string;
  contextDir: string;
  monitorInterval: number;
  maxRetries: number;
  defaultAgent: AgentType;
}

export interface Iteration {
  id: string;
  content: string;
  type: 'text' | 'image' | 'meeting';
  timestamp: number;
  processed: boolean;
}

export interface AgentResult {
  taskId: string;
  success: boolean;
  prUrl?: string;
  commitCount?: number;
  testResults?: TestResults;
  error?: string;
  errors?: string[];
  uiScreenshot?: string;
  codeReviews?: any[];
}

export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
  lint?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  typescript?: {
    passed: boolean;
    errors: string[];
  };
  e2eTests?: {
    passed: number;
    failed: number;
    skipped: number;
  };
  uiScreenshot?: {
    path?: string;
    hasChanges: boolean;
  };
  overall?: {
    passed: boolean;
    score: number;
  };
}

export interface TaskCompletionRecord {
  taskId: string;
  type: string;
  description: string;
  status: 'completed' | 'failed';
  filesChanged: string[];
  commitCount: number;
  prUrl: string;
  branchName: string;
  testResults: TestResults;
  testCoverage: number;
  uiChanges?: {
    beforeScreenshot?: string;
    afterScreenshot?: string;
    description: string;
  };
  codeReviews: {
    agent: string;
    status: 'approved' | 'changes_requested' | 'commented';
    comments: string[];
  }[];
  agent: string;
  duration: number;
  retries: number;
  startedAt: number;
  completedAt: number;
  learningData: {
    prompt: string;
    successfulPatterns: string[];
    failedPatterns: string[];
    contextUsed: string[];
    decisions: string[];
  };
  metrics: {
    codeQualityScore: number;
    testPassRate: number;
    reviewApprovalRate: number;
    timeEfficiency: number;
  };
}
