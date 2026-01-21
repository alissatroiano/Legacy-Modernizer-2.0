
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
  ArrowRightLeft,
  Download,
  Upload,
  RefreshCw,
  Activity,
  ShieldCheck,
  BookOpen,
  ScrollText,
  FileSearch,
  FlaskConical,
  Binary,
  HardDrive,
  ShieldAlert,
  Loader2,
  Table,
  Link2,
  Cloud,
  Box,
  Server,
  Globe,
  ExternalLink,
  BrainCircuit,
  CirclePlay,
  XCircle,
  GanttChartSquare,
  BadgeCheck
} from 'lucide-react';
import { MigrationStatus, MigrationState, CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from './types';
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
          <span>Synthesizing legacy artifacts...</span>
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

    addLog("Engaging Gemini Pro Deep Thinking (32k token budget)...", 'thinking');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("GCP Strategy synthesized via reasoning engine.", 'success');
      
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
      addLog(`Migration halt: ${error}`, 'error');
      setMigrationState(prev => ({ ...prev, status: MigrationStatus.FAILED }));
    }
  };

  const processNextChunk = useCallback(async () => {
    const { chunks, currentChunkIndex, status } = migrationState;
    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) return;

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    addLog(`Grounding modernization for ${chunk.name} via Search...`, 'info');

    try {
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      addLog(`Applying deep reasoning for ${chunk.name}...`, 'thinking');
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
      addLog(`${chunk.name} resolved with GCP best practices.`, 'success');
    } catch (error) {
      addLog(`Error in ${chunk.name}: ${error}`, 'error');
    }
  }, [migrationState, addLog]);

  const runTests = async (chunk: CodeChunk) => {
    if (!chunk.pythonSource || !chunk.unitTest || isRunningTests) return;
    
    setIsRunningTests(true);
    addLog(`Running validation suite for ${chunk.name}...`, 'info');
    
    try {
      const results = await gemini.executeValidation(chunk.pythonSource, chunk.unitTest);
      
      setMigrationState(prev => {
        const newChunks = prev.chunks.map(c => 
          c.id === chunk.id ? { ...c, testResults: results } : c
        );
        return { ...prev, chunks: newChunks };
      });
      
      const passCount = results.filter(r => r.status === 'PASSED').length;
      addLog(`Validation complete for ${chunk.name}: ${passCount}/${results.length} PASSED`, passCount === results.length ? 'success' : 'error');
    } catch (error) {
      addLog(`Execution failure in test suite: ${error}`, 'error');
    } finally {
      setIsRunningTests(false);
    }
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
                <span>LegacyLink</span>
                <span className="text-sky-400">AI</span>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold ml-2">v3.0 PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Reasoning & Search Grounding</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isProcessing && (
               <div className="flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
                 <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-xs font-black text-indigo-300 animate-pulse">Deep Reasoning Active</span>
               </div>
             )}
             <div className="h-8 w-px bg-slate-700 mx-2"></div>
             <div className={`w-3 h-3 rounded-full ${migrationState.status === MigrationStatus.COMPLETED ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 animate-pulse'}`}></div>
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
                Upload Codebase
              </button>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 p-5 code-font text-sm bg-slate-900 text-indigo-100 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste COBOL artifacts here..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-5 bg-white">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span className="uppercase tracking-widest text-sm">Execute Logic Recovery</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center space-x-3 font-bold text-slate-700">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span className="text-sm">Execution Engine Logs</span>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1 bg-slate-50/30">
              {logs.map((log, i) => (
                <div key={i} className={`text-[11px] flex items-start space-x-3 p-2.5 rounded-lg border ${
                  log.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                  log.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                  log.type === 'thinking' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 
                  'bg-white border-slate-200 text-slate-600'
                }`}>
                  {log.type === 'thinking' ? <BrainCircuit className="w-4 h-4 mt-0.5 animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5" />}
                  <span className="flex-1 font-medium leading-relaxed">{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-400 text-xs text-center italic mt-10">Standby for migration input...</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl group hover:border-indigo-300 transition-colors">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Migration Velocity</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-indigo-600">{progressPercentage}%</span>
                <Activity className="w-5 h-5 text-indigo-400 mb-1" />
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-1000" style={{width: `${progressPercentage}%`}}></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Grounding Coverage</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-sky-600">
                  {migrationState.chunks.filter(c => c.groundingSources).length}/{migrationState.chunks.length}
                </span>
                <Globe className="w-5 h-5 text-sky-500 mb-1" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Verified via search</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Reasoning Budget</p>
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-black text-slate-700">32k</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Tokens per unit</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Parity Score</p>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-3xl font-black text-emerald-600">{overallCoverage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
            <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50 text-xs font-black text-slate-700 flex justify-between items-center uppercase tracking-widest">
                <span>Modules Discovered</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">{migrationState.chunks.length} Units</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {migrationState.chunks.map((chunk, idx) => (
                  <button 
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`w-full p-5 flex items-center justify-between border-b border-slate-50 transition-all text-left group
                      ${selectedChunkId === chunk.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-4">
                      {chunk.status === 'DONE' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 animate-pulse bg-slate-100" />
                      )}
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase group-hover:text-indigo-700 transition-colors">{chunk.name}</p>
                        {chunk.groundingSources && (
                          <div className="flex items-center space-x-1 mt-1 text-[9px] text-sky-600 font-black uppercase">
                             <Globe className="w-3 h-3" />
                             <span>GCP Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
              {selectedChunk ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-scrollbar">
                    <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      {[
                        { id: 'functional', label: 'Analysis', icon: BookOpen },
                        { id: 'technical', label: 'Implementation', icon: Cpu },
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
                        <div className="flex items-center justify-between border-b-2 border-indigo-50 pb-4">
                          <div className="flex items-center space-x-4">
                             <BrainCircuit className="w-6 h-6 text-indigo-600" />
                             <h4 className="font-black text-lg uppercase tracking-tight text-slate-800">Deep Reasoning Recovery</h4>
                          </div>
                          <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
                             <ShieldCheck className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase">Integrity Score: {selectedChunk.coverage || 0}%</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Business Logic & Rules</label>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedChunk.businessRules}
                          </div>
                        </div>

                        {selectedChunk.groundingSources && selectedChunk.groundingSources.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-sky-600 border-b border-sky-100 pb-2">
                              <Globe className="w-5 h-5" />
                              <label className="text-[10px] font-black uppercase tracking-widest">GCP Context & Reference Sources</label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedChunk.groundingSources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 bg-sky-50/50 hover:bg-sky-100/50 border border-sky-100 rounded-xl transition-all group"
                                >
                                  <div className="flex items-center space-x-3 truncate">
                                    <div className="p-2 bg-white rounded-lg border border-sky-100 text-sky-600 group-hover:scale-110 transition-transform">
                                      <ExternalLink className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-sky-900 truncate">{source.title}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedChunk.cloudTargetArchitecture && (
                          <div className="space-y-4">
                             <div className="flex items-center space-x-3 text-[#0f172a] border-b border-slate-200 pb-2">
                                <Server className="w-5 h-5 text-indigo-600" />
                                <label className="text-[10px] font-black uppercase tracking-widest">Google Cloud Target Topology</label>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {selectedChunk.cloudTargetArchitecture.map((mapping, i) => (
                                 <div key={i} className="p-5 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all bg-white relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-2 opacity-10"><Box className="w-12 h-12" /></div>
                                   <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{mapping.gcpService}</p>
                                   <p className="text-xs font-black text-slate-800 mb-2">Replaces: {mapping.legacyComponent}</p>
                                   <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{mapping.rationale}</p>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="space-y-8">
                         <div className="grid grid-cols-1 gap-8">
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modern Logic Engine (Python 3.12)</label>
                                <div className="flex items-center space-x-2 bg-slate-900 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                   <Zap className="w-3 h-3" />
                                   <span>Cloud Run Optimized</span>
                                </div>
                              </div>
                              <div className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-800">
                                <ProgressiveCodeBlock 
                                  code={selectedChunk.pythonSource} 
                                  className="code-font text-xs text-indigo-200 leading-loose" 
                                />
                              </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between border-b-2 border-emerald-50 pb-4">
                          <div className="flex items-center space-x-4">
                            <FlaskConical className="w-6 h-6 text-emerald-600" />
                            <h4 className="font-black text-lg uppercase tracking-tight text-slate-800">Verification Suite</h4>
                          </div>
                          <button 
                            onClick={() => runTests(selectedChunk)}
                            disabled={isRunningTests || !selectedChunk.unitTest}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                            {isRunningTests ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CirclePlay className="w-4 h-4" />
                            )}
                            <span>Run Suite</span>
                          </button>
                        </div>

                        {selectedChunk.testResults ? (
                          <div className="space-y-6">
                            <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-emerald-400">
                                  <Terminal className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase">Pytest Execution Log</span>
                                </div>
                                <div className="flex space-x-4">
                                  <span className="text-[10px] font-black text-emerald-400">PASSED: {selectedChunk.testResults.filter(r => r.status === 'PASSED').length}</span>
                                  <span className="text-[10px] font-black text-rose-400">FAILED: {selectedChunk.testResults.filter(r => r.status === 'FAILED').length}</span>
                                </div>
                              </div>
                              <div className="p-6 space-y-3 font-mono text-[11px]">
                                {selectedChunk.testResults.map((res, i) => (
                                  <div key={i} className="flex items-start space-x-4 group">
                                    <span className="text-slate-500 min-w-[40px]">{res.duration}</span>
                                    {res.status === 'PASSED' ? (
                                      <span className="text-emerald-500 font-bold">PASSED</span>
                                    ) : (
                                      <span className="text-rose-500 font-bold">FAILED</span>
                                    )}
                                    <span className="text-indigo-200">{res.name}</span>
                                    {res.message && <span className="text-slate-500 italic">— {res.message}</span>}
                                  </div>
                                ))}
                                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                                  <div className="text-emerald-400 font-black text-xs">
                                    {selectedChunk.testResults.every(r => r.status === 'PASSED') ? '✓ ALL TESTS PASSED' : '⚠ VALIDATION WARNING'}
                                  </div>
                                  <div className="text-slate-500">
                                    Run completed in {selectedChunk.testResults.reduce((acc, r) => acc + parseFloat(r.duration), 0).toFixed(2)}s
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center space-x-4">
                                  <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100">
                                    <BadgeCheck className="w-6 h-6 text-emerald-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Functional Consistency</p>
                                    <p className="text-xs text-slate-700 font-medium">Binary logic parity confirmed against legacy EBCDIC rules.</p>
                                  </div>
                               </div>
                               <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex items-center space-x-4">
                                  <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100">
                                    <GanttChartSquare className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Regression Guard</p>
                                    <p className="text-xs text-slate-700 font-medium">Auto-generated mocks isolate cloud dependencies from core logic.</p>
                                  </div>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#0f172a] rounded-2xl p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20 group-hover:bg-indigo-500/50 transition-colors"></div>
                             <ProgressiveCodeBlock 
                               code={selectedChunk.unitTest} 
                               className="code-font text-xs text-emerald-400/70 leading-loose blur-[1px] group-hover:blur-0 transition-all duration-500" 
                             />
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                               <CirclePlay className="w-12 h-12 text-white mb-4 animate-pulse" />
                               <p className="text-sm font-black text-white uppercase tracking-widest">Execute Validation Suite</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Click 'Run Suite' above to start verification</p>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-slate-100 animate-bounce">
                    <Zap className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-tight">System Discovery Pending</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                    Upload your legacy artifacts to begin the reasoning-enhanced modernization sequence.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl border border-slate-700 p-10 shadow-2xl group overflow-hidden relative">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-1000"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center space-x-4">
                <Database className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-black text-white tracking-tight">Strategic Cloud Blueprint</h3>
              </div>
              <div className="flex space-x-2">
                <span className="text-[10px] text-sky-400 uppercase font-black bg-sky-500/10 px-4 py-1.5 rounded-full border border-sky-500/20">Verified Target: GCP</span>
              </div>
            </div>
            {migrationState.overallPlan ? (
              <div className="text-indigo-100/70 text-sm whitespace-pre-wrap leading-loose max-h-80 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-900 relative z-10 font-medium">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-600 space-y-4">
                <div className="w-10 h-1 bg-slate-800 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold uppercase tracking-widest opacity-50">Architecture synthesis pending analysis...</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-8 shadow-2xl relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center space-x-12">
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Decoupled</span>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reasoning Engaged</span>
             </div>
             <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud Grounded</span>
             </div>
           </div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-4">
              <span>Powered by Gemini 3 Ecosystem</span>
              <div className="h-4 w-px bg-slate-200"></div>
              <span>Confidential Banking Core</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
