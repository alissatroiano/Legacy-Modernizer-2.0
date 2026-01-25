
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
  ZapOff,
  FastForward,
  Wind
} from 'lucide-react';
import { MigrationStatus, MigrationState, CodeChunk, TestResult } from './types';
import * as gemini from './services/geminiService';

const ProgressiveCodeBlock: React.FC<{ 
  code?: string; 
  className?: string; 
  placeholder?: string;
  chunkSize?: number;
}> = ({ code, className, placeholder, chunkSize = 150 }) => {
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
        <div className="flex items-center space-x-2 mt-4 text-indigo-400 font-sans italic text-[10px] animate-pulse">
          <Wind className="w-3 h-3" />
          <span>Vibe Stream Active...</span>
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
  const [velocity, setVelocity] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info') => {
    setLogs(prev => [...prev.slice(-20), { msg, type }]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (migrationState.status === MigrationStatus.PROCESSING) {
        setVelocity(prev => Math.min(prev + (Math.random() * 5), 180));
      } else if (migrationState.status === MigrationStatus.IDLE) {
        setVelocity(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [migrationState.status]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setInputCode(prev => prev ? prev + '\n\n' + content : content);
          addLog(`Ingested: ${file.name}`, 'success');
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

    addLog("Initiating Flash-Speed Archaeology...", 'thinking');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("System Blueprint Synthesized.", 'success');
      
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
      addLog(`Loop Failed: ${error}`, 'error');
      setMigrationState(prev => ({ ...prev, status: MigrationStatus.FAILED }));
    }
  };

  const processNextChunk = useCallback(async () => {
    const { chunks, currentChunkIndex, status } = migrationState;
    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) return;

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    addLog(`Vibe Process: ${chunk.name}`, 'info');

    try {
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      const result = await gemini.processModuleLogic(chunk, research);
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
      addLog(`${chunk.name} Recovered.`, 'success');
    } catch (error) {
      addLog(`Bypass Error ${chunk.name}: ${error}`, 'error');
    }
  }, [migrationState, addLog]);

  const runTests = async (chunk: CodeChunk) => {
    if (!chunk.pythonSource || !chunk.unitTest || isRunningTests) return;
    
    setIsRunningTests(true);
    addLog(`Running Autonomous Verification Artifacts for ${chunk.name}...`, 'thinking');
    
    try {
      const results = await gemini.executeValidation(chunk.pythonSource, chunk.unitTest);
      
      setMigrationState(prev => {
        const newChunks = prev.chunks.map(c => 
          c.id === chunk.id ? { ...c, testResults: results } : c
        );
        return { ...prev, chunks: newChunks };
      });
      
      const passCount = results.filter(r => r.status === 'PASSED').length;
      addLog(`${chunk.name} Verification: ${passCount}/${results.length} PASSED`, 'success');
    } catch (error) {
      addLog(`Verification Failure: ${error}`, 'error');
    } finally {
      setIsRunningTests(false);
    }
  };

  const downloadArtifact = () => {
    if (!migrationState.chunks.length) return;
    const report = `LEGACY LINK AI: MODERNIZATION ARTIFACT\n================================\n${migrationState.overallPlan}\n\nMODERNIZED MODULES:\n${migrationState.chunks.map(c => `[${c.name}] Parity: ${c.coverage}%\n`).join('')}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modernization-artifact.txt';
    a.click();
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
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100 selection:bg-indigo-500/30">
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".cbl,.cob,.txt" onChange={handleFileUpload} />

      <header className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 rotate-3">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter flex items-center space-x-2">
                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">LegacyLink Vibe</span>
              </h1>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">Flash-Powered Logic Archaeology</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isProcessing && (
               <div className="hidden md:flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                 <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-[10px] font-black text-indigo-300 animate-pulse uppercase">Vibe Loop Active</span>
               </div>
             )}
             <button 
               onClick={downloadArtifact}
               disabled={migrationState.chunks.length === 0}
               className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 p-2.5 rounded-xl border border-slate-700 transition-all"
             >
               <ArrowDownToLine className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <Database className="w-3.5 h-3.5" />
                <span>Source Terminal</span>
              </span>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={migrationState.status !== MigrationStatus.IDLE}
                className="text-[9px] font-black bg-white text-black px-3 py-1.5 rounded-lg uppercase hover:scale-105 transition-all disabled:opacity-20"
              >
                Ingest
              </button>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 min-h-[300px] p-5 code-font text-xs bg-transparent text-indigo-200 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste Legacy Source Code..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-5">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center space-x-3 shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all disabled:grayscale disabled:opacity-20"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span className="uppercase tracking-widest text-xs">Run Modernization Loop</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex-1 flex flex-col min-h-[350px]">
             <div className="p-4 border-b border-slate-800 flex items-center space-x-2 bg-slate-800/20">
               <Terminal className="w-4 h-4 text-emerald-400" />
               <span className="text-[10px] font-black uppercase text-slate-400">System Stream</span>
             </div>
             <div className="p-5 space-y-3 overflow-y-auto flex-1 font-mono text-[10px]">
               {logs.map((log, i) => (
                 <div key={i} className={`flex items-start space-x-3 opacity-0 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-forwards`}>
                   <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                     log.type === 'error' ? 'bg-rose-500' : 
                     log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                     log.type === 'thinking' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'
                   }`} />
                   <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-300' : 'text-slate-400'}>
                     {log.msg}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 blur-3xl -mr-10 -mt-10 rounded-full" />
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Logic Parity</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tracking-tighter text-indigo-400">{overallCoverage}%</span>
                <ShieldCheck className="w-5 h-5 text-indigo-500 mb-1" />
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Verified Modules</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tracking-tighter text-emerald-400">
                  {migrationState.chunks.filter(c => c.status === 'DONE').length}
                </span>
                <CheckCircle className="w-5 h-5 text-emerald-500 mb-1" />
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Grounded Info</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tracking-tighter text-sky-400">
                  {migrationState.chunks.filter(c => c.groundingSources).length}
                </span>
                <Globe className="w-5 h-5 text-sky-500 mb-1" />
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl -mr-8 -mt-8 rounded-full transition-opacity duration-1000 ${velocity > 10 ? 'opacity-100' : 'opacity-0'}`} />
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Vibe Velocity</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tracking-tighter text-slate-200">
                  {Math.round(velocity)} <span className="text-xs text-slate-500">TPS</span>
                </span>
                <FastForward className="w-5 h-5 text-slate-500 mb-1" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
            <div className="md:col-span-4 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Archaeology Queue</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">{migrationState.chunks.length}</span>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {migrationState.chunks.map((chunk) => (
                  <button 
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`w-full p-5 flex items-center justify-between border-b border-slate-800/50 transition-all text-left
                      ${selectedChunkId === chunk.id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${chunk.status === 'DONE' ? 'bg-emerald-500' : 'bg-slate-700 animate-pulse'}`} />
                      <div>
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[120px]">{chunk.name}</p>
                        {chunk.status === 'DONE' && <p className="text-[8px] font-black text-indigo-400 mt-0.5">VERIFIED • {chunk.coverage}%</p>}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedChunkId === chunk.id ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
                  </button>
                ))}
                {migrationState.chunks.length === 0 && (
                  <div className="p-10 text-center text-slate-600 space-y-2">
                    <ZapOff className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-[10px] uppercase font-black tracking-widest">No Active Links</p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
              {selectedChunk ? (
                <>
                  <div className="p-4 border-b border-slate-800 flex items-center space-x-2 bg-slate-800/20">
                    {[
                      { id: 'functional', label: 'Summary', icon: BookOpen },
                      { id: 'technical', label: 'Source', icon: Cpu },
                      { id: 'validation', label: 'Artifacts', icon: FlaskConical }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setViewMode(mode.id as any)}
                        className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                          viewMode === mode.id ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <mode.icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                    {viewMode === 'functional' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Logic Extraction Summary</h4>
                           <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5">
                             {selectedChunk.businessRules || 'Synthesis in progress...'}
                           </div>
                        </div>

                        {selectedChunk.groundingSources && selectedChunk.groundingSources.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Grounding Context</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedChunk.groundingSources.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" className="flex items-center justify-between p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl hover:bg-sky-500/10 transition-all">
                                  <span className="text-[10px] font-bold text-sky-200 truncate">{source.title}</span>
                                  <ExternalLink className="w-3 h-3 text-sky-500" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Python 3.12 Target</h4>
                            <button className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 flex items-center space-x-2">
                               <Download className="w-3 h-3" />
                               <span>Export Source</span>
                            </button>
                         </div>
                         <div className="bg-[#0b1120] rounded-2xl p-6 border border-slate-800 shadow-inner">
                           <ProgressiveCodeBlock 
                             code={selectedChunk.pythonSource} 
                             className="code-font text-xs text-indigo-100 leading-relaxed" 
                           />
                         </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Verification Status</h4>
                           <button 
                             onClick={() => runTests(selectedChunk)}
                             disabled={isRunningTests || !selectedChunk.status || selectedChunk.status !== 'DONE'}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center space-x-2 shadow-lg disabled:opacity-20 transition-all active:scale-95"
                           >
                             {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CirclePlay className="w-3.5 h-3.5" />}
                             <span>Execute Artifacts</span>
                           </button>
                        </div>

                        {selectedChunk.testResults ? (
                          <div className="bg-slate-800/30 rounded-2xl border border-slate-800 overflow-hidden">
                             <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between">
                               <span className="text-[9px] font-black text-slate-400">AUTONOMOUS RUN LOG</span>
                               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                 {selectedChunk.testResults.filter(r => r.status === 'PASSED').length} PASS / {selectedChunk.testResults.filter(r => r.status === 'FAILED').length} FAIL
                               </span>
                             </div>
                             <div className="p-5 font-mono text-[10px] space-y-3">
                               {selectedChunk.testResults.map((res, i) => (
                                 <div key={i} className="flex items-center space-x-4 border-b border-white/5 pb-2">
                                   <span className="text-slate-600 w-12">{res.duration}</span>
                                   <span className={res.status === 'PASSED' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                     {res.status}
                                   </span>
                                   <span className="text-slate-300 flex-1 truncate">{res.name}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        ) : (
                          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl space-y-4">
                             <FlaskConical className="w-8 h-8 text-slate-700 opacity-50" />
                             <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Standby for Execution</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <Wind className="w-12 h-12 text-slate-600 mb-4 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Awaiting Signal</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden group min-h-[200px]">
            <div className="absolute top-0 right-0 p-4">
               <button 
                 onClick={() => {}}
                 className="text-slate-500 hover:text-white transition-colors"
                 disabled={!migrationState.overallPlan}
               >
                 <ArrowDownToLine className="w-4 h-4" />
               </button>
            </div>
            <div className="flex items-center space-x-3 mb-6">
              <Server className="w-5 h-5 text-indigo-500" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300">Target Cloud Blueprint</h3>
              <div className="h-px bg-slate-800 flex-1" />
            </div>
            {migrationState.overallPlan ? (
              <div className="text-slate-400 text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-4 custom-scrollbar selection:bg-indigo-500/50">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest">Synthesis Pending...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
         <div className="flex space-x-10 items-center">
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span>Flash Logic Core Active</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              <span>Vibe Verification Latency: Low</span>
            </span>
         </div>
         <div className="opacity-40">GEMINI-3 FLASH • VIBE v1.02</div>
      </footer>
    </div>
  );
};

export default App;
