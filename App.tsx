
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
  BadgeCheck,
  Wand2,
  ListRestart,
  History,
  Fingerprint,
  Route,
  Timer
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
  const [viewMode, setViewMode] = useState<'functional' | 'technical' | 'validation' | 'history'>('functional');
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error' | 'thinking'}[]>([]);
  const [correctionTrace, setCorrectionTrace] = useState<{id: string, log: string, level: number, signature: string}[]>([]);
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

    addLog("Engaging Marathon Agent: Global Thinking Layer 1...", 'thinking');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("GCP Strategy Blueprint established.", 'success');
      
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
      addLog(`Marathon interrupted: ${error}`, 'error');
      setMigrationState(prev => ({ ...prev, status: MigrationStatus.FAILED }));
    }
  };

  const processNextChunk = useCallback(async () => {
    const { chunks, currentChunkIndex, status } = migrationState;
    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) return;

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    addLog(`Modernization loop for ${chunk.name} initiated...`, 'info');

    try {
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      
      // Step 1: Initial Implementation
      addLog(`Thinking Level 2: Synthesis for ${chunk.name}...`, 'thinking');
      let currentResult = await gemini.processModuleLogic(chunk, research);
      let tests = await gemini.generateTests(currentResult.pythonSource, chunk.cobolSource);
      
      // Step 2: Vibe Engineering - Autonomous Testing Loop
      let iteration = 0;
      const MAX_PATCHES = 2;
      let validationResults: TestResult[] = [];
      let passRate = 0;

      while (iteration <= MAX_PATCHES) {
        addLog(`Vibe Verification: Testing ${chunk.name} [Iteration ${iteration + 1}]...`, 'info');
        validationResults = await gemini.executeValidation(currentResult.pythonSource, tests.testCode);
        passRate = validationResults.filter(r => r.status === 'PASSED').length / (validationResults.length || 1);

        if (passRate === 1) {
          addLog(`Verification Artifact verified for ${chunk.name}.`, 'success');
          break;
        }

        if (iteration < MAX_PATCHES) {
          addLog(`Parity mismatch. Engaging Self-Healing Loop Level ${iteration + 3}...`, 'thinking');
          const failed = validationResults.filter(r => r.status === 'FAILED');
          const patch = await gemini.selfCorrectModule(chunk, failed, currentResult.pythonSource);
          
          setCorrectionTrace(prev => [...prev, { 
            id: chunk.id, 
            log: patch.correctionLogic, 
            level: iteration + 3,
            signature: `THOUGHT-SIG-${Math.random().toString(36).substring(7).toUpperCase()}`
          }]);
          currentResult.pythonSource = patch.pythonSource;
          iteration++;
        } else {
          addLog(`Max healing cycles reached. Intervention Artifact required.`, 'error');
          break;
        }
      }

      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          ...currentResult,
          unitTest: tests.testCode,
          testResults: validationResults,
          coverage: Math.round(passRate * 100),
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
    } catch (error) {
      addLog(`Agent Error in ${chunk.name}: ${error}`, 'error');
    }
  }, [migrationState, addLog]);

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
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight">LegacyLink AI</h1>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest italic">Gemini 3 Hackathon</span>
              </div>
              <div className="flex space-x-3 mt-0.5">
                <span className="text-[9px] text-slate-400 font-bold flex items-center space-x-1 uppercase">
                   <Timer className="w-2.5 h-2.5" /> <span>Track: Marathon Agent</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold flex items-center space-x-1 uppercase">
                   <Fingerprint className="w-2.5 h-2.5" /> <span>Track: Vibe Engineering</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isProcessing && (
               <div className="flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
                 <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-xs font-black text-indigo-300 animate-pulse uppercase tracking-widest">Autonomous Thinking Active</span>
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
                <span className="text-sm">Mainframe Artifacts</span>
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
              placeholder="Paste COBOL core logic here..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-5 bg-white">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className="w-full py-4 px-6 rounded-xl bg-[#0f172a] text-white font-black flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
              >
                <Wand2 className="w-5 h-5" />
                <span className="uppercase tracking-widest text-sm">Launch Marathon Agent</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center space-x-3 font-bold text-slate-700">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span className="text-sm">Agent Activity Trace</span>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1 bg-slate-50/30">
              {logs.map((log, i) => (
                <div key={i} className={`text-[11px] flex items-start space-x-3 p-3 rounded-xl border ${
                  log.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                  log.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                  log.type === 'thinking' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 
                  'bg-white border-slate-200 text-slate-600'
                }`}>
                  {log.type === 'thinking' ? <BrainCircuit className="w-4 h-4 mt-0.5 animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5" />}
                  <span className="flex-1 font-medium leading-relaxed">{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-400 text-xs text-center italic mt-10">Agent idle. Awaiting mission parameters.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ListRestart className="w-12 h-12 text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Self-Healing cycles</p>
              <span className="text-3xl font-black text-white">{correctionTrace.length}</span>
              <p className="text-[10px] text-indigo-400 mt-2 font-bold uppercase tracking-widest">Thinking Budget Patches</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Grounding Coverage</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-indigo-600">
                  {migrationState.chunks.filter(c => c.groundingSources).length}/{migrationState.chunks.length}
                </span>
                <Globe className="w-5 h-5 text-indigo-400 mb-1" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Thinking Tokens</p>
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-black text-slate-700 uppercase tracking-tighter">32K MAX</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-tighter">Validation Parity</p>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-3xl font-black text-emerald-600">{overallCoverage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
            <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50 text-xs font-black text-slate-700 flex justify-between items-center uppercase tracking-widest">
                <span>Continuity Queue</span>
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
                        <CheckCircle className={`w-5 h-5 ${chunk.coverage === 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 animate-pulse bg-slate-100" />
                      )}
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase">{chunk.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${chunk.coverage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {chunk.coverage}% PARITY
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
              {selectedChunk ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      {[
                        { id: 'functional', label: 'Reasoning', icon: BookOpen },
                        { id: 'technical', label: 'Implementation', icon: Cpu },
                        { id: 'validation', label: 'Verification', icon: FlaskConical },
                        { id: 'history', label: 'Signatures', icon: Fingerprint }
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
                          <div className="absolute top-4 right-4 text-[9px] font-bold text-indigo-400 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">THINKING LEVEL 1</div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Business Logic Artifacts</label>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedChunk.businessRules}
                          </div>
                        </div>

                        {selectedChunk.groundingSources && selectedChunk.groundingSources.length > 0 && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Google Search Grounding</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedChunk.groundingSources.map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all group">
                                  <span className="text-xs font-bold text-slate-800 truncate">{source.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="space-y-8">
                        <div className="bg-[#0f172a] rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
                          <div className="absolute top-4 right-4 text-[9px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-1 rounded">THINKING LEVEL 2</div>
                          <ProgressiveCodeBlock 
                            code={selectedChunk.pythonSource} 
                            className="code-font text-xs text-indigo-200 leading-loose" 
                          />
                        </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-8">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                              <BadgeCheck className="w-5 h-5 text-emerald-600" />
                              <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">Autonomous Verification Loop Parity: {selectedChunk.coverage}%</span>
                           </div>
                           <button className="text-[10px] font-black text-emerald-700 underline underline-offset-4 uppercase tracking-widest">Download Verification Artifact</button>
                        </div>

                        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                          {selectedChunk.testResults?.map((res, i) => (
                            <div key={i} className="p-4 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-center space-x-3">
                                {res.status === 'PASSED' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                <span className="text-[11px] font-mono text-indigo-200">{res.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{res.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewMode === 'history' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           <div className="flex items-center space-x-3 text-indigo-600">
                              <Fingerprint className="w-5 h-5" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Thought Signatures & Thinking Levels</h4>
                           </div>
                        </div>
                        {correctionTrace.filter(t => t.id === selectedChunk.id).length > 0 ? (
                          correctionTrace.filter(t => t.id === selectedChunk.id).map((t, i) => (
                            <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-3 flex flex-col items-end">
                                  <span className="text-[8px] font-black text-indigo-400 mb-1">{t.signature}</span>
                                  <span className="text-[10px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded">LEVEL {t.level}</span>
                               </div>
                               <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                               <p className="text-[10px] font-black text-indigo-600 uppercase mb-3 flex items-center space-x-2">
                                  <BrainCircuit className="w-3.5 h-3.5" />
                                  <span>Agent Self-Correction Sequence</span>
                               </p>
                               <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-[80%]">{t.log}</p>
                            </div>
                          ))
                        ) : (
                          <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-4">
                             <CheckCircle className="w-10 h-10 opacity-20" />
                             <span className="text-[10px] font-black uppercase tracking-widest">No continuity breaks detected. Parity maintained.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                    <BrainCircuit className="w-6 h-6 text-indigo-600 absolute top-3 left-3 animate-pulse" />
                  </div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Marathon Agent: Syncing State...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl border border-slate-700 p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Route className="w-40 h-40 text-white" />
            </div>
            <div className="flex items-center space-x-4 mb-6 relative">
              <Database className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-black text-white tracking-tight">Autonomous System Blueprint</h3>
              <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-1 rounded">LEVEL 1 REASONING</span>
            </div>
            {migrationState.overallPlan ? (
              <div className="text-indigo-100/70 text-sm whitespace-pre-wrap leading-loose max-h-80 overflow-y-auto font-medium relative">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center space-y-4">
                <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className="w-1/2 h-full bg-indigo-500 animate-[loading_2s_infinite]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
         <div className="flex space-x-8">
           <span className="flex items-center space-x-2 text-indigo-500"><div className="w-1.5 h-1.5 rounded-full bg-current"></div><span>Thinking Signatures Active</span></span>
           <span className="flex items-center space-x-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div><span>Verification Artifacts Stored</span></span>
         </div>
         <div className="flex items-center space-x-2">
            <span>Powered by Gemini 3 reasoning engine</span>
         </div>
      </footer>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default App;
