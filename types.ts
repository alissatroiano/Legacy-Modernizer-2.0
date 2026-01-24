
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

export interface CodeChunk {
  id: string;
  name: string;
  cobolSource: string;
  pythonSource?: string;
  unitTest?: string;
  businessRules?: string; // Human-readable business logic extraction
  copybookStructure?: CopybookField[]; // Parsed field mappings
  coverage?: number; // Estimated unit test coverage percentage
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
}

export interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  message?: string;
  duration: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
