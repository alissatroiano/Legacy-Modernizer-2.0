
export enum MigrationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface CodeChunk {
  id: string;
  name: string;
  cobolSource: string;
  pythonSource?: string;
  unitTest?: string;
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
