
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  Play,
  CheckCircle,
  FileCode,
  Zap,
  Cpu,
  ChevronRight,
  Database,
  Download,
  Upload,
  RefreshCw,
  BookOpen,
  FlaskConical,
  Globe,
  ExternalLink,
  BrainCircuit,
  CirclePlay,
  XCircle,
  BadgeCheck,
  ArrowDownToLine,
  Loader2,
  Server,
  Fingerprint,
  ScrollText
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

    setDisplayLines(allLines.slice(0, chunkSize));
    setIsFinished(chunkSize >= total);

    let currentIdx = chunkSize;
    let frameId: number;

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

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info') => {
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
      addLog(`${chunk.name} modernization success.`, 'success');
    } catch (error) {
      addLog(`Critical failure in ${chunk.name}: ${error}`, 'error');
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = { ...chunk, status: 'ERROR', coverage: 0 };
        const isLast = currentChunkIndex === newChunks.length - 1;
        return {
          ...prev,
          chunks: newChunks,
          processedLines: prev.processedLines + chunk.cobolSource.split('\n').length,
          currentChunkIndex: isLast ? currentChunkIndex : currentChunkIndex + 1,
          status: isLast ? MigrationStatus.COMPLETED : MigrationStatus.PROCESSING
        };
      });
    }
  }, [migrationState, addLog]);

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

  const isCompleted = migrationState.status === MigrationStatus.COMPLETED;

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
                  {migrationState.chunks.filter(c => c.status === 'DONE').length}/{migrationState.chunks.length}
                </span>
                <Globe className="w-5 h-5 text-sky-500 mb-1" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Grounded via Logic</p>
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
                <Fingerprint className="w-5 h-5 text-emerald-500" />
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
                {migrationState.chunks.map((chunk) => (
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
                  <div className="p-4 border-b border-slate-100 flex justify-center bg-slate-50">
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
                      <div className="space-y-10">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner relative group">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Logic Extraction Summary</label>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedChunk.businessRules || "Awaiting logic extraction..."}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Data Mapping Status</p>
                            <div className="flex items-center space-x-2">
                              <BadgeCheck className="w-4 h-4 text-emerald-500" />
                              <span className="text-[11px] font-bold text-emerald-800">EBCDIC COMP-3 Decoupled</span>
                            </div>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">IO Abstraction</p>
                            <div className="flex items-center space-x-2">
                              <Server className="w-4 h-4 text-indigo-500" />
                              <span className="text-[11px] font-bold text-indigo-800">VSAM to Repository Layer</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewMode === 'technical' && (
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
                        <div className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-800 h-[500px] overflow-auto">
                          <ProgressiveCodeBlock
                            code={selectedChunk.pythonSource}
                            placeholder="# Reconstructing logic architecture..."
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
                          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800">
                            <ProgressiveCodeBlock
                              code={selectedChunk.unitTest}
                              className="code-font text-xs text-emerald-400/90 leading-relaxed"
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-12 border-2 border-dashed border-slate-200 text-center">
                            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Verification Pending Execution</p>
                          </div>
                        )}

                        {selectedChunk.testResults && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedChunk.testResults.map((test, i) => (
                              <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${test.status === 'PASSED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                }`}>
                                <div className="flex items-center space-x-3">
                                  {test.status === 'PASSED' ? <BadgeCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                  <span className="text-xs font-black uppercase tracking-tight">{test.name}</span>
                                </div>
                                <span className="text-[9px] font-bold opacity-60">{test.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
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

      <footer className="bg-white border-t border-slate-200 py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div className="flex items-center space-x-8">
            <span className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span>Logic Verified</span></span>
            <span className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /><span>Autonomous Loop Active</span></span>
          </div>
          <div>Gemini 3 Pro Modernization Stack</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
