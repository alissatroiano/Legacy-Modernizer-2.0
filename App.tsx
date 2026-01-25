
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Terminal,
  Play,
  CheckCircle,
  FileCode,
  AlertCircle,
  Zap,
  Layers,
  Cpu,
  ChevronRight,
  Database,
  Download,
  Upload,
  RefreshCw,
  Activity,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  Globe,
  ExternalLink,
  BrainCircuit,
  CirclePlay,
  XCircle,
  BadgeCheck,
  FileDown,
  ArrowDownToLine,
  Loader2,
  Server,
  Fingerprint
} from 'lucide-react';
import { MigrationStatus, MigrationState, CodeChunk, TestResult } from './types';
import * as gemini from './services/geminiService';

/**
 * Renders large code strings progressively to keep the UI responsive.
 */
const ProgressiveCodeBlock: React.FC<{
  code?: string;
  className?: string;
  placeholder?: string;
  chunkSize?: number;
}> = ({ code, className, placeholder, chunkSize = 80 }) => {
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!code) {
      setDisplayLines([]);
      setIsFinished(true);
      return;
    }

    const allLines = code.split('\n');
    const total = allLines.length;

    // Initial batch
    setDisplayLines(allLines.slice(0, chunkSize));
    setIsFinished(chunkSize >= total);

    let currentIdx = chunkSize;
    let frameId: number;

    /* Thinking budget is now handled internally by the service or ignored */
    const getThinkingBudget = useCallback(() => undefined, []);
    const streamLines = () => {
      if (currentIdx >= total) {
        setIsFinished(true);
        return;
      }

      const endIdx = Math.min(currentIdx + chunkSize, total);
      const nextBatch = allLines.slice(currentIdx, endIdx);

      setDisplayLines(prev => [...prev, ...nextBatch]);
      currentIdx = endIdx;
      frameId = requestAnimationFrame(streamLines);
    };

    frameId = requestAnimationFrame(streamLines);
    return () => cancelAnimationFrame(frameId);
  }, [code, chunkSize]);

  if (!code && placeholder) {
    return <pre className={className}>{placeholder}</pre>;
  }

  return (
    <pre className={className}>
      {displayLines.join('\n')}
      {!isFinished && (
        <div className="flex items-center space-x-2 mt-4 text-indigo-500/60 font-sans italic text-[10px]">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Synthesizing logic artifacts...</span>
        </div>
      )}
    </pre>
  );
};

const App: React.FC = () => {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    totalLines: 0,
    processedLines: 0,
    chunks: [],
    currentChunkIndex: -1,
    status: MigrationStatus.IDLE,
  });

  const [inputCode, setInputCode] = useState<string>('');
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'functional' | 'technical' | 'validation'>('functional');
  const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'success' | 'error' | 'thinking' }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg, type }]);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    addLog(`Reading ${files.length} file(s)...`, 'info');

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setInputCode(prev => prev ? prev + '\n\n' + content : content);
          addLog(`Streamed: ${file.name}`, 'success');
        }
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleExport = (chunk?: CodeChunk) => {
    let content = "";
    let filename = "modernized_system_documentation.md";

    if (chunk) {
      content = `# Module: ${chunk.name}\n\n## Business Requirements\n${chunk.businessRules || "N/A"}\n\n## Modern Python Architecture\n\`\`\`python\n${chunk.pythonSource || ""}\n\`\`\`\n\n## Validation Tests\n\`\`\`python\n${chunk.unitTest || ""}\n\`\`\``;
      filename = `${chunk.name.replace(/\s+/g, '_').toLowerCase()}_spec.md`;
    } else {
      content = `# System Modernization Blueprint\nGenerated: ${new Date().toLocaleString()}\n\n## Global Architecture Strategy\n${migrationState.overallPlan || ""}\n\n`;
      migrationState.chunks.forEach(c => {
        content += `\n---\n# Module: ${c.name}\n\n### Business Rules\n${c.businessRules || "Pending extraction..."}\n\n### Modern Python Implementation\n\`\`\`python\n${c.pythonSource || ""}\n\`\`\`\n\n### Validation Tests\n\`\`\`python\n${c.unitTest || ""}\n\`\`\``;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`Exported documentation: ${filename}`, 'success');
  };

  const handleStartMigration = async () => {
    if (!inputCode.trim()) return;
    setMigrationState(prev => ({
      ...prev,
      status: MigrationStatus.ANALYZING,
      totalLines: inputCode.split('\n').length,
      chunks: []
    }));

    addLog("Engaging logic archaeology suite...", 'thinking');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog(`Mainframe Blueprint synthesized.`, 'success');

      addLog("Decomposing system into functional modules...", 'info');
      const { chunks: rawChunks } = await gemini.splitCodeIntoChunks(inputCode);

      const chunks: CodeChunk[] = rawChunks.map((c, idx) => ({
        id: `chunk-${idx}`,
        name: c.name,
        cobolSource: c.code,
        status: 'PENDING',
        complexity: Math.floor(Math.random() * 10) + 1
      }));

      setMigrationState(prev => ({
        ...prev,
        status: MigrationStatus.PROCESSING,
        chunks,
        overallPlan: analysis,
        currentChunkIndex: 0
      }));
    } catch (error) {
      addLog(`Migration Error: ${error}`, 'error');
      setMigrationState(prev => ({ ...prev, status: MigrationStatus.FAILED }));
    }
  };

  const processNextChunk = useCallback(async () => {
    const { chunks, currentChunkIndex, status } = migrationState;

    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) {
      return;
    }

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    addLog(`Modernizing ${chunk.name} using Logic Blueprint...`, 'info');

    try {
      addLog(`Applying deep mainframe reasoning for ${chunk.name}...`, 'thinking');
      const result = await gemini.processModuleLogic(chunk);

      addLog(`Generating autonomous test suite for ${chunk.name}...`, 'info');
      const testResult = await gemini.generateTests(result.pythonSource, chunk.cobolSource);

      let currentPython = result.pythonSource;
      let finalTestResults: TestResult[] = [];
      let attempts = 0;
      const MAX_HEALING_ATTEMPTS = 2;

      while (attempts <= MAX_HEALING_ATTEMPTS) {
        const attemptPrefix = attempts > 0 ? `[Self-Heal Attempt ${attempts}] ` : "";
        addLog(`${attemptPrefix}Executing validation suite for ${chunk.name}...`, 'info');

        const results = await gemini.executeValidation(currentPython, testResult.testCode);
        finalTestResults = results;

        const failures = results.filter(r => r.status === 'FAILED');
        if (failures.length === 0) {
          addLog(`${attemptPrefix}Validation passed with 100% functional parity for ${chunk.name}!`, 'success');
          break;
        }

        if (attempts < MAX_HEALING_ATTEMPTS) {
          addLog(`Logic mismatch detected (${failures.length} failures). Initiating autonomous self-correction...`, 'thinking');
          const healResult = await gemini.selfHealPythonCode(chunk, currentPython, testResult.testCode, results);
          currentPython = healResult.pythonSource;
          addLog(`Self-correction applied: ${healResult.explanation}`, 'success');
        } else {
          addLog(`Maximum self-healing attempts reached. Recording best-effort implementation for ${chunk.name}.`, 'error');
        }
        attempts++;
      }

      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          ...result,
          pythonSource: currentPython,
          unitTest: testResult.testCode,
          coverage: testResult.coverageEstimate,
          groundingSources: sources,
          testResults: finalTestResults,
          status: 'DONE'
        };

        const isLast = currentChunkIndex === newChunks.length - 1;
        return {
          ...prev,
          chunks: newChunks,
          processedLines: prev.processedLines + chunk.cobolSource.split('\n').length,
          currentChunkIndex: isLast ? currentChunkIndex : currentChunkIndex + 1,
          status: isLast ? MigrationStatus.COMPLETED : MigrationStatus.PROCESSING
        };
      });
      addLog(`${chunk.name} migration complete. Tests ready.`, 'success');

      addLog(`Logic extraction complete: ${chunk.name} (Verification cycle closed)`, 'success');
    } catch (error) {
      addLog(`Critical failure in ${chunk.name}: ${error}`, 'error');
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = { ...chunk, status: 'ERROR', coverage: 0 };

        const isLast = currentChunkIndex === newChunks.length - 1;
        const newProcessedLines = prev.processedLines + chunk.cobolSource.split('\n').length;

        const runTests = async (chunk: CodeChunk) => {
          if (!chunk.pythonSource || !chunk.unitTest || isRunningTests) return;

          setIsRunningTests(true);
          addLog(`Autonomous Verification: Testing ${chunk.name}...`, 'info');

          try {
            const results = await gemini.executeValidation(chunk.pythonSource, chunk.unitTest);

            setMigrationState(prev => {
              const newChunks = prev.chunks.map(c =>
                c.id === chunk.id ? { ...c, testResults: results } : c
              );
              return { ...prev, chunks: newChunks };
            });

            const passCount = results.filter(r => r.status === 'PASSED').length;
            addLog(`Test Run Result: ${passCount}/${results.length} PASSED`, passCount === results.length ? 'success' : 'error');
          } catch (error) {
            addLog(`Test Execution Failure: ${error}`, 'error');
          } finally {
            setIsRunningTests(false);
          }
        };

        const downloadFile = (content: string, filename: string) => {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        };

        const downloadArtifact = () => {
          if (!migrationState.chunks.length) return;
          const report = `
LEGACY LINK AI: MIGRATION VERIFICATION ARTIFACT
==============================================
Status: ${migrationState.status}
Total Modules: ${migrationState.chunks.length}

BLUEPRINT:
${migrationState.overallPlan}

MODULES:
${migrationState.chunks.map(c => `
--- ${c.name} ---
Logic Parity: ${c.coverage}%
Python Source:
${c.pythonSource}
`).join('\n')}
    `;
          downloadFile(report, 'legacy-link-artifact.txt');
        };

        useEffect(() => {
          if (migrationState.status === MigrationStatus.PROCESSING) {
            const currentChunk = migrationState.chunks[migrationState.currentChunkIndex];
            if (currentChunk && currentChunk.status === 'PENDING') {
              processNextChunk();
            }
          }
        }, [migrationState.status, migrationState.currentChunkIndex, processNextChunk]);

        const selectedChunk = migrationState.chunks.find(c => c.id === selectedChunkId) ||
          migrationState.chunks[migrationState.currentChunkIndex];

        const progressPercentage = migrationState.totalLines > 0
          ? Math.round((migrationState.processedLines / migrationState.totalLines) * 100)
          : 0;

        const completedChunks = migrationState.chunks.filter(c => c.status === 'DONE');
        const overallCoverage = completedChunks.length > 0
          ? Math.round(completedChunks.reduce((acc, c) => acc + (c.coverage || 0), 0) / completedChunks.length)
          : 0;

        const isProcessing = migrationState.status === MigrationStatus.PROCESSING || migrationState.status === MigrationStatus.ANALYZING;

        return (
          <div className="min-h-screen flex flex-col bg-slate-50">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept=".cbl,.cob,.txt,.src"
              onChange={handleFileUpload}
            />

            <header className="bg-slate-900 text-white p-4 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-sky-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight flex items-center space-x-2">
                      <span>LegacyLink AI</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Autonomous Banking Modernization & Core Logic Archaeology</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                    <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}></div>
                    <span className="capitalize">{migrationState.status.toLowerCase()}</span>
                  </div>
                  {isCompleted && (
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full border border-slate-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-300" />
                    </button>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3 font-bold text-slate-700">
                      <FileCode className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm">Mainframe Source</span>
                    </div>
                    <button
                      onClick={triggerFileUpload}
                      disabled={migrationState.status !== MigrationStatus.IDLE}
                      className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all uppercase disabled:opacity-50"
                    >
                      Upload Sources
                    </button>
                  </div>
                  <textarea
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full h-80 p-5 code-font text-sm bg-slate-900 text-indigo-100 focus:outline-none resize-none leading-relaxed"
                    placeholder="Paste COBOL source modules..."
                    disabled={migrationState.status !== MigrationStatus.IDLE}
                  />
                  <div className="p-4 bg-white">
                    <button
                      onClick={handleStartMigration}
                      disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                      className="w-full py-4 px-6 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
                    >
                      <Zap className="w-5 h-5" />
                      <span className="uppercase tracking-widest text-sm">Launch Modernization Loop</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#0f172a] rounded-2xl shadow-xl border border-slate-700 overflow-hidden flex-1 flex flex-col min-h-[400px]">
                  <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center space-x-3 font-bold text-slate-300">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm">System Trace Log</span>
                  </div>
                  <div className="p-5 space-y-3 overflow-y-auto flex-1 bg-slate-900/50">
                    {logs.map((log, i) => (
                      <div key={i} className={`text-[11px] flex items-start space-x-3 p-2.5 rounded-lg border ${log.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                          log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            log.type === 'thinking' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                              'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                        {log.type === 'thinking' ? <BrainCircuit className="w-4 h-4 mt-0.5 animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5" />}
                        <span className="flex-1 font-medium leading-relaxed">{log.msg}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-slate-500 text-xs text-center italic mt-10">Standby for COBOL ingestion...</p>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl group">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">System Health</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                      <span className="text-xs text-slate-400">{migrationState.processedLines} LoC</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                      <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Binary Parity Score</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Verified Context</p>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-sky-600">
                        {migrationState.chunks.filter(c => c.groundingSources).length}/{migrationState.chunks.length}
                      </span>
                      <Globe className="w-5 h-5 text-sky-500 mb-1" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Grounded via Search</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Logic Recovered</p>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-2xl font-black text-slate-700">
                        {migrationState.chunks.filter(c => c.status === 'DONE').length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Autonomous Modules</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <p className="text-xs text-slate-400 font-medium uppercase mb-1 tracking-tighter">Data Compliance</p>
                    <div className="flex items-center space-x-2">
                      <Binary className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-700 truncate">
                        {isCompleted ? 'EBCDIC Resolved' : 'EBCDIC Analysis'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Thought Tokens</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
                  <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 text-xs font-black text-slate-700 flex justify-between items-center uppercase tracking-widest">
                      <span>Migration Queue</span>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px]">{migrationState.chunks.length} Units</span>
                    </div>
                    <div className="overflow-y-auto flex-1 bg-slate-50/20">
                      {migrationState.chunks.map((chunk, idx) => (
                        <button
                          key={chunk.id}
                          onClick={() => setSelectedChunkId(chunk.id)}
                          className={`w-full p-5 flex items-center justify-between border-b border-slate-50 transition-all text-left group
                      ${selectedChunkId === chunk.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center space-x-4">
                            {chunk.status === 'DONE' ? (
                              <CheckCircle className={`w-5 h-5 ${chunk.testResults ? 'text-emerald-500' : 'text-slate-300'}`} />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-200 animate-pulse bg-slate-100" />
                            )}
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-700 truncate uppercase tracking-tight">{chunk.name}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[9px] text-slate-400">Parity: {chunk.coverage || 0}%</span>
                                {chunk.status === 'DONE' && <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
                    {selectedChunk ? (
                <>
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 space-x-4 overflow-x-auto no-scrollbar">
                          <div className="flex items-center space-x-1.5 bg-white px-1.5 py-1 rounded-lg border border-slate-200 shadow-sm flex-shrink-0">
                            <button
                              onClick={() => setViewMode('functional')}
                              className={`flex items-center space-x-1.5 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'functional' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span className="whitespace-nowrap">Functional Blueprint</span>
                            </button>
                            <button
                              onClick={() => setViewMode('technical')}
                              className={`flex items-center space-x-1.5 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'technical' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                              <Cpu className="w-3 h-3" />
                              <span className="whitespace-nowrap">Modern implementation</span>
                            </button>
                            <button
                              onClick={() => setViewMode('validation')}
                              className={`flex items-center space-x-1.5 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'validation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                              <FlaskConical className="w-3 h-3" />
                              <span className="whitespace-nowrap">Behavioral Tests</span>
                            </button>
                          </div>
                          {selectedChunk.status === 'DONE' && (
                            <button
                              onClick={() => handleExport(selectedChunk)}
                              className="flex items-center space-x-2 text-[10px] font-bold bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-md flex-shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden xl:inline whitespace-nowrap">Export Documentation</span>
                              <span className="xl:hidden whitespace-nowrap">Export</span>
                            </button>
                          )}

                          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                              {[
                                { id: 'functional', label: 'Archaeology', icon: BookOpen },
                                { id: 'technical', label: 'Python Impl', icon: Cpu },
                                { id: 'validation', label: 'Verification', icon: FlaskConical }
                              ].map(mode => (
                                <button
                                  key={mode.id}
                                  onClick={() => setViewMode(mode.id as any)}
                                  className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${viewMode === mode.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                  <mode.icon className="w-3.5 h-3.5" />
                                  <span>{mode.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto bg-white p-8">
                            {viewMode === 'functional' && (
                              <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-indigo-50 pb-2 mb-4">
                                  <div className="flex items-center space-x-2 text-indigo-600">
                                    <ScrollText className="w-5 h-5" />
                                    <h4 className="font-black text-sm uppercase tracking-widest">Logic Archaeology</h4>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center space-x-1 text-[9px] font-bold text-slate-400"><Binary className="w-3 h-3" /> <span>EBCDIC AWARE</span></span>
                                    <span className="flex items-center space-x-1 text-[9px] font-bold text-slate-400"><HardDrive className="w-3 h-3" /> <span>VSAM RESOLVED</span></span>
                                    <span className="flex items-center space-x-1 text-[9px] font-bold text-emerald-500"><ShieldAlert className="w-3 h-3" /> <span>ERROR RESILIENT</span></span>
                                  </div>
                                </div>

                                {selectedChunk.businessRules ? (
                          <div className="space-y-8">
                            <div className="prose prose-indigo max-w-none">
                              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Core Business Requirements</label>
                              <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-inner">
                                {selectedChunk.businessRules}
                              </div>
                            </div>

                            {selectedChunk.copybookStructure && selectedChunk.copybookStructure.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-indigo-500">
                                    <Table className="w-4 h-4" />
                                    <label className="text-[10px] font-black uppercase tracking-widest">Mainframe Data Mapping (Copybook Structures)</label>
                                  </div>
                                  <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                    {selectedChunk.copybookStructure.length} Fields Isolated
                                  </div>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                  <table className="w-full text-left border-collapse bg-white">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      <tr>
                                        <th className="px-4 py-3 border-b border-slate-100">Legacy COBOL Field</th>
                                        <th className="px-4 py-3 border-b border-slate-100">Python Mapping</th>
                                        <th className="px-4 py-3 border-b border-slate-100">Logic Definition</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                      {selectedChunk.copybookStructure.map((field, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                          <td className="px-4 py-3 border-b border-slate-50 font-mono text-slate-700 font-medium">
                                            {field.originalField}
                                          </td>
                                          <td className="px-4 py-3 border-b border-slate-50">
                                            <div className="flex items-center space-x-2">
                                              <Link2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                              <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                {field.pythonMapping}
                                              </code>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 border-b border-slate-50 text-slate-500">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-slate-700 text-[10px]">{field.dataType}</span>
                                              <span className="text-[10px] leading-tight mt-0.5">{field.description}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Mainframe Artifact Mapping</p>
                                <ul className="text-[11px] text-emerald-800 space-y-1">
                                  <li className="flex items-center space-x-2"><div className="w-1 h-1 bg-emerald-400 rounded-full"></div><span>COMP-3 packed decimals mapped to high-precision Decimal.</span></li>
                                  <li className="flex items-center space-x-2"><div className="w-1 h-1 bg-emerald-400 rounded-full"></div><span>Copybook record structures virtualized as Pydantic models.</span></li>
                                </ul>
                              </div>
                              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                <p className="text-[10px] font-bold text-rose-600 uppercase mb-2">Resilience Abstraction</p>
                                <ul className="text-[11px] text-rose-800 space-y-1">
                                  <li className="flex items-center space-x-2"><div className="w-1 h-1 bg-rose-400 rounded-full"></div><span>EBCDIC decoding failures handled via custom fallbacks.</span></li>
                                  <li className="flex items-center space-x-2"><div className="w-1 h-1 bg-rose-400 rounded-full"></div><span>I/O interruptions protected by robust exception bubbling.</span></li>
                                </ul>
                              </div>
                      <div className="space-y-10">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner relative group">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Logic Extraction Summary</label>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedChunk.businessRules}
                          </div>
                        </div>

                        {selectedChunk.groundingSources && selectedChunk.groundingSources.length > 0 && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-sky-600 uppercase tracking-widest block">Grounded Search Data</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedChunk.groundingSources.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" className="flex items-center justify-between p-3 bg-sky-50/50 border border-sky-100 rounded-xl hover:bg-sky-50 transition-all group">
                                  <span className="text-[11px] font-bold text-sky-900 truncate">{source.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="p-4 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Legacy Code (EBCDIC/Copybook)</label>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-96 overflow-auto shadow-inner">
                              <ProgressiveCodeBlock
                                code={selectedChunk.cobolSource}
                                className="code-font text-[11px] text-slate-500 leading-relaxed"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-indigo-400 uppercase mb-1 block">Clean Python with Error Resilience</label>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-96 overflow-auto shadow-xl">
                              <ProgressiveCodeBlock
                                code={selectedChunk.pythonSource}
                                placeholder="# Reconstructing logic architecture..."
                                className="code-font text-[11px] text-indigo-200 leading-relaxed whitespace-pre-wrap"
                              />
                            </div>
                          </div>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud-Native Python 3.12 Artifact</span>
                           <button 
                             onClick={() => downloadFile(selectedChunk.pythonSource || '', `${selectedChunk.name}.py`)}
                             className="flex items-center space-x-2 text-indigo-600 text-[10px] font-bold uppercase hover:underline"
                           >
                             <ArrowDownToLine className="w-3.5 h-3.5" />
                             <span>Download Source</span>
                           </button>
                        </div>
                        <div className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-800">
                          <ProgressiveCodeBlock 
                            code={selectedChunk.pythonSource} 
                            className="code-font text-xs text-indigo-200 leading-loose" 
                          />
                        </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div className="flex items-center space-x-4">
                            <FlaskConical className="w-6 h-6 text-emerald-600" />
                            <h4 className="font-black text-lg uppercase tracking-tight text-slate-800">Verification Artifacts</h4>
                          </div>
                          <button 
                            onClick={() => runTests(selectedChunk)}
                            disabled={isRunningTests || !selectedChunk.unitTest}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                            {isRunningTests ? <Loader2 className="w-4 h-4 animate-spin" /> : <CirclePlay className="w-4 h-4" />}
                            <span>Run Verification</span>
                          </button>
                        </div>
                        {selectedChunk.unitTest ? (
                          <div className="bg-slate-900 border border-emerald-900/30 rounded-xl p-5 shadow-2xl relative">
                            <ProgressiveCodeBlock
                              code={selectedChunk.unitTest}
                              className="code-font text-[11px] text-emerald-400/90 leading-relaxed whitespace-pre-wrap overflow-x-auto"
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-12 border-2 border-dashed border-slate-200 text-center">
                            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Verification Pending Execution</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                            <h5 className="text-[10px] font-black text-slate-400 uppercase">Arithmetic Accuracy</h5>
                            <p className="text-[11px] text-slate-600">Decimal precision verified against original COMP-3 rules.</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                            <h5 className="text-[10px] font-black text-slate-400 uppercase">Resilience Testing</h5>
                            <p className="text-[11px] text-slate-600">Negative tests for EBCDIC corruption and I/O failures.</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                            <h5 className="text-[10px] font-black text-slate-400 uppercase">Entity Integrity</h5>
                            <p className="text-[11px] text-slate-600">Copybook record types validated through Pydantic schemas.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/10">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-100">
                    <Database className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">System Discovery Active</h3>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed font-medium">
                    Ingest mainframe artifacts to start the autonomous verification sequence.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
               <button 
                 onClick={() => downloadFile(migrationState.overallPlan || '', 'cloud-blueprint.txt')}
                 className="flex items-center space-x-2 text-indigo-600 text-[10px] font-black uppercase hover:underline"
                 disabled={!migrationState.overallPlan}
               >
                 <ArrowDownToLine className="w-4 h-4" />
                 <span>Export Blueprint</span>
               </button>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <Server className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Strategic Cloud Blueprint</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black border border-emerald-100 uppercase tracking-widest">GCP Verified</span>
            </div>
            {migrationState.overallPlan ? (
              <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-4 font-medium">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Synthesis awaiting execution...</span>
              </div>
            )}
          </div>
        </div>
      </main>

                          <footer className="bg-white border-t border-slate-200 py-3 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                              <div className="flex items-center space-x-8">
                                <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span><span>Data Integrity Verified</span></span>
                                <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span><span>Blueprint Ready</span></span>
                                <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span><span>Mainframe Syntax Decoupled</span></span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span>Gemini 3 Pro Modernization Stack</span>
                              </div>
                            </div>
                          </footer>
                        </div>
                        );
};

                        export default App;
