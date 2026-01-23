
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle, 
  FileCode, 
  AlertCircle, 
  Zap, 
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
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error' | 'thinking'}[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info') => {
    setLogs(prev => [...prev, { msg, type }]);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addLog(`Ingesting ${files.length} modules...`, 'info');
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
      addLog("GCP Strategy synthesized. Blueprint ready.", 'success');
      
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
    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) return;

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    addLog(`Modernizing ${chunk.name} with Search Grounding...`, 'info');

    try {
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      addLog(`Applying deep reasoning for ${chunk.name}...`, 'thinking');
      const result = await gemini.processModuleLogic(chunk, research);
      addLog(`Generating autonomous test suite for ${chunk.name}...`, 'info');
      const testResult = await gemini.generateTests(result.pythonSource, chunk.cobolSource);
      
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          ...result,
          unitTest: testResult.testCode,
          coverage: testResult.coverageEstimate,
          groundingSources: sources,
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
    } catch (error) {
      addLog(`Error in ${chunk.name}: ${error}`, 'error');
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

  const overallCoverage = useMemo(() => {
    const doneChunks = migrationState.chunks.filter(c => c.status === 'DONE');
    if (doneChunks.length === 0) return 0;
    const total = doneChunks.reduce((acc, c) => acc + (c.coverage || 0), 0);
    return Math.round(total / doneChunks.length);
  }, [migrationState.chunks]);

  const isProcessing = migrationState.status === MigrationStatus.PROCESSING || migrationState.status === MigrationStatus.ANALYZING;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".cbl,.cob,.txt" onChange={handleFileUpload} />

      <header className="bg-[#0f172a] text-white p-4 border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
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
          <div className="flex items-center space-x-6">
             {isProcessing && (
               <div className="flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
                 <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-xs font-black text-indigo-300 animate-pulse uppercase">Autonomous Reasoning Active</span>
               </div>
             )}
             <div className="flex items-center space-x-2">
                <button 
                  onClick={downloadArtifact}
                  disabled={migrationState.chunks.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition-all"
                  title="Download Verification Artifact"
                >
                  <FileDown className="w-5 h-5" />
                </button>
             </div>
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
                onClick={() => fileInputRef.current?.click()}
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
            <div className="p-5 bg-white">
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
                <div key={i} className={`text-[11px] flex items-start space-x-3 p-2.5 rounded-lg border ${
                  log.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
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
                <span className="text-3xl font-black text-indigo-600">{overallCoverage}%</span>
                <Activity className="w-5 h-5 text-indigo-400 mb-1" />
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
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Reasoning Layer</p>
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-black text-slate-700">16k</span>
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
              <div className="overflow-y-auto flex-1">
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
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase">{chunk.name}</p>
                        {chunk.coverage && (
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {chunk.coverage}% PARITY
                          </span>
                        )}
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
                          className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                            viewMode === mode.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
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

                        {selectedChunk.testResults ? (
                          <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Autonomous Verification Log</span>
                              <div className="flex space-x-4 text-[10px] font-black uppercase text-slate-400">
                                <span className="text-emerald-400">PASSED: {selectedChunk.testResults.filter(r => r.status === 'PASSED').length}</span>
                                <span className="text-rose-400">FAILED: {selectedChunk.testResults.filter(r => r.status === 'FAILED').length}</span>
                              </div>
                            </div>
                            <div className="p-6 space-y-4 font-mono text-[11px]">
                              {selectedChunk.testResults.map((res, i) => (
                                <div key={i} className="flex items-start space-x-4 border-b border-slate-800/50 pb-2">
                                  <span className="text-slate-500 min-w-[50px]">{res.duration}</span>
                                  {res.status === 'PASSED' ? (
                                    <span className="text-emerald-500 font-bold">PASS</span>
                                  ) : (
                                    <span className="text-rose-500 font-bold">FAIL</span>
                                  )}
                                  <span className="text-indigo-200">{res.name}</span>
                                  {res.message && <span className="text-slate-500 italic">— {res.message}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-12 border-2 border-dashed border-slate-200 text-center">
                            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Verification Pending Execution</p>
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

      <footer className="bg-white border-t border-slate-200 py-3 px-8 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
         <div className="flex space-x-8">
           <span className="flex items-center space-x-2 text-indigo-500"><div className="w-1.5 h-1.5 rounded-full bg-current"></div><span>Vibe Verification Active</span></span>
           <span className="flex items-center space-x-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span>GCP Best Practices Enforced</span></span>
         </div>
         <div className="flex items-center space-x-2">
            <span>Powered by Gemini 3 Reasoning Engine</span>
         </div>
      </footer>
    </div>
  );
};

export default App;
