
export enum MigrationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface CopybookField {
  originalField: string;
  pythonMapping: string;
  dataType: string;
  description: string;
}

export interface CloudMapping {
  legacyComponent: string;
  gcpService: string;
  rationale: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  message?: string;
  duration: string;
}

export interface CodeChunk {
  id: string;
  name: string;
  cobolSource: string;
  pythonSource?: string;
  unitTest?: string;
  testResults?: TestResult[];
  businessRules?: string;
  copybookStructure?: CopybookField[];
  cloudTargetArchitecture?: CloudMapping[];
  groundingSources?: GroundingSource[];
  coverage?: number;
  status: 'PENDING' | 'DONE' | 'ERROR';
  analysis?: string;
  complexity: number;
}

export interface MigrationState {
  totalLines: number;
  processedLines: number;
  chunks: CodeChunk[];
  currentChunkIndex: number;
  status: MigrationStatus;
  overallPlan?: string;
  globalGroundingSources?: GroundingSource[];
}
