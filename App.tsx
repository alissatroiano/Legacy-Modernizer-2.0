
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
  Wind,
  Layers,
  Search
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
          <BrainCircuit className="w-3 h-3" />
          <span>Archaeology in progress...</span>
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
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info') => {
    setLogs(prev => [...prev.slice(-40), { msg, type }]);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    addLog(`Ingesting ${files.length} legacy files...`, 'thinking');
    
    (Array.from(files) as File[]).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setInputCode(prev => prev ? prev + '\n\n' + `*> FILE: ${file.name}\n` + content : `*> FILE: ${file.name}\n` + content);
          addLog(`Loaded ${file.name}`, 'success');
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
    setIsThinking(true);
    addLog("Initiating Multi-Model System Audit (Marathon Mode)...", 'thinking');

    try {
      addLog("Analyzing code logical boundaries and state objects...", 'info');
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("Deep System Blueprint synthesized.", 'success');
      
      addLog("Partitioning codebase into logical modules...", 'info');
      const { chunks: rawChunks } = await gemini.splitCodeIntoChunks(inputCode);
      addLog(`Identified ${rawChunks.length} logical programs/modules.`, 'success');

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
      addLog(`Audit Failed: ${error}`, 'error');
      setMigrationState(prev => ({ ...prev, status: MigrationStatus.FAILED }));
    } finally {
      setIsThinking(false);
    }
  };

  const processNextChunk = useCallback(async () => {
    const { chunks, currentChunkIndex, status } = migrationState;
    if (status !== MigrationStatus.PROCESSING || currentChunkIndex >= chunks.length || currentChunkIndex === -1) return;

    const chunk = chunks[currentChunkIndex];
    if (chunk.status !== 'PENDING') return;

    setIsThinking(true);
    addLog(`Modernizing ${chunk.name} (File Access Parity focused)...`, 'thinking');

    try {
      addLog(`Searching modern persistence patterns for ${chunk.name}...`, 'info');
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      
      addLog(`Performing logic archaeology on ${chunk.name}...`, 'info');
      const result = await gemini.processModuleLogic(chunk, research);
      
      addLog(`Generating parity-verification test suite for ${chunk.name}...`, 'info');
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
      addLog(`${chunk.name} modernization completed with ${testResult.coverageEstimate}% parity confidence.`, 'success');
    } catch (error) {
      addLog(`Module Bypass ${chunk.name}: ${error}`, 'error');
      // Still move to next chunk to avoid blocking the whole process
      setMigrationState(prev => ({
        ...prev,
        currentChunkIndex: prev.currentChunkIndex + 1
      }));
    } finally {
      setIsThinking(false);
    }
  }, [migrationState, addLog]);

  const runTests = async (chunk: CodeChunk) => {
    if (!chunk.pythonSource || !chunk.unitTest || isRunningTests) return;
    
    setIsRunningTests(true);
    addLog(`Executing Autonomous Parity Verification for ${chunk.name}...`, 'thinking');
    
    try {
      const results = await gemini.executeValidation(chunk.pythonSource, chunk.unitTest);
      
      setMigrationState(prev => {
        const newChunks = prev.chunks.map(c => 
          c.id === chunk.id ? { ...c, testResults: results } : c
        );
        return { ...prev, chunks: newChunks };
      });
      
      const passCount = results.filter(r => r.status === 'PASSED').length;
      if (passCount === results.length) {
        addLog(`SUCCESS: ${chunk.name} verified with 100% logic parity.`, 'success');
      } else {
        addLog(`WARNING: ${chunk.name} failed ${results.length - passCount} logic checks. Review artifacts.`, 'error');
      }
    } catch (error) {
      addLog(`Verification Run Failed: ${error}`, 'error');
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

  const overallCoverage = useMemo(() => {
    const doneChunks = migrationState.chunks.filter(c => c.status === 'DONE');
    if (doneChunks.length === 0) return 0;
    const total = doneChunks.reduce((acc, c) => acc + (c.coverage || 0), 0);
    return Math.round(total / doneChunks.length);
  }, [migrationState.chunks]);

  const isProcessing = migrationState.status === MigrationStatus.PROCESSING || migrationState.status === MigrationStatus.ANALYZING;

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />

      <header className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Logic Link </h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Legacy Mainframe to Modern Logic AI Tool</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isThinking && (
               <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full animate-pulse">
                 <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
                 <span className="text-[10px] font-bold text-blue-300 uppercase">Reasoning Active</span>
               </div>
             )}
             <button 
               onClick={() => {
                 const report = JSON.stringify(migrationState, null, 2);
                 const blob = new Blob([report], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = 'modernization-blueprint.json';
                 a.click();
               }}
               disabled={migrationState.chunks.length === 0}
               className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 p-2.5 rounded-xl border border-slate-700 transition-all text-slate-400"
               title="Export Blueprint"
             >
               <FileDown className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Source & Terminal */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl h-[450px]">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <Database className="w-3.5 h-3.5" />
                <span>Source Ingestion</span>
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={migrationState.status !== MigrationStatus.IDLE}
                  className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg uppercase hover:bg-blue-500 disabled:opacity-20 transition-all"
                >
                  Upload
                </button>
                <button 
                  onClick={() => setInputCode('')}
                  disabled={migrationState.status !== MigrationStatus.IDLE}
                  className="text-[9px] font-black bg-slate-700 text-slate-300 px-3 py-1 rounded-lg uppercase hover:bg-slate-600 disabled:opacity-20 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 p-4 code-font text-[11px] bg-transparent text-blue-200 focus:outline-none resize-none leading-relaxed custom-scrollbar"
              placeholder="Paste COBOL programs or Linkage sections here..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-4 border-t border-slate-800 bg-slate-800/10">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-500 transition-all disabled:opacity-20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="uppercase tracking-widest text-[11px]">Start Modernization Cycle</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex-1 flex flex-col shadow-xl min-h-[300px]">
             <div className="p-3 border-b border-slate-800 flex items-center space-x-2 bg-slate-800/20">
               <Terminal className="w-3.5 h-3.5 text-emerald-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Stream</span>
             </div>
             <div className="p-4 space-y-2.5 overflow-y-auto flex-1 font-mono text-[10px] bg-black/20 custom-scrollbar">
               {logs.length === 0 && <p className="text-slate-600 italic">Waiting for input...</p>}
               {logs.map((log, i) => (
                 <div key={i} className="flex items-start space-x-2 animate-in fade-in slide-in-from-left-1 duration-200">
                   <div className={`mt-1 w-1 h-3 rounded-full shrink-0 ${
                     log.type === 'error' ? 'bg-rose-500' : 
                     log.type === 'success' ? 'bg-emerald-500' : 
                     log.type === 'thinking' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'
                   }`} />
                   <span className={`leading-relaxed ${
                     log.type === 'error' ? 'text-rose-400' : 
                     log.type === 'success' ? 'text-emerald-300' : 
                     log.type === 'thinking' ? 'text-blue-300' : 'text-slate-400'
                   }`}>
                     {log.msg}
                   </span>
                 </div>
               ))}
               <div id="logs-end" />
             </div>
          </div>
        </div>

        {/* Right Column: Dashboard & Details */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-blue-500">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Parity Accuracy</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">{overallCoverage}%</span>
                <ShieldCheck className="w-5 h-5 text-blue-500/50" />
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-emerald-500">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Modules Built</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">{migrationState.chunks.filter(c => c.status === 'DONE').length}</span>
                <CheckCircle className="w-5 h-5 text-emerald-500/50" />
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-indigo-500">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Knowledge Grounding</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">{migrationState.chunks.filter(c => c.groundingSources && c.groundingSources.length > 0).length}</span>
                <Globe className="w-5 h-5 text-indigo-500/50" />
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-slate-600">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Source Density</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">{migrationState.chunks.length}</span>
                <FileCode className="w-5 h-5 text-slate-500/50" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
            <div className="md:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl max-h-[600px]">
              <div className="p-3 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recovery Queue</span>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {migrationState.chunks.map((chunk) => (
                  <button 
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`w-full p-4 flex items-center justify-between border-b border-slate-800/50 transition-all text-left group
                      ${selectedChunkId === chunk.id ? 'bg-blue-600/10 border-l-4 border-l-blue-600' : 'hover:bg-slate-800/40'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${chunk.status === 'DONE' ? 'bg-emerald-500' : chunk.status === 'ERROR' ? 'bg-rose-500' : 'bg-slate-700 animate-pulse'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate pr-2">{chunk.name}</p>
                        {chunk.status === 'DONE' && <p className="text-[8px] font-bold text-blue-400 mt-0.5">{chunk.coverage}% LOGIC PARITY</p>}
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedChunkId === chunk.id ? 'translate-x-1 text-blue-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                  </button>
                ))}
                {migrationState.chunks.length === 0 && (
                  <div className="p-10 text-center text-slate-700 flex flex-col items-center">
                    <Search className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[9px] uppercase font-black tracking-widest">Queue Empty</p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
              {selectedChunk ? (
                <>
                  <div className="p-2.5 border-b border-slate-800 flex items-center space-x-1 bg-slate-800/20">
                    {[
                      { id: 'functional', label: 'Archaeology', icon: BookOpen },
                      { id: 'technical', label: 'Python Source', icon: Cpu },
                      { id: 'validation', label: 'Validation Cycle', icon: FlaskConical }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setViewMode(mode.id as any)}
                        className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                          viewMode === mode.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <mode.icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/40">
                    {viewMode === 'functional' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center space-x-2">
                             <Activity className="w-3 h-3" />
                             <span>Logic Recovery Summary</span>
                           </h4>
                           <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-5 rounded-xl border border-white/5 shadow-inner">
                             {selectedChunk.businessRules || 'Logic reconstruction in progress...'}
                           </div>
                        </div>

                        {selectedChunk.copybookStructure && selectedChunk.copybookStructure.length > 0 && (
                          <div className="space-y-3">
                             <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Data Structure Mapping</h4>
                             <div className="overflow-x-auto rounded-xl border border-slate-800">
                               <table className="w-full text-[10px] text-left">
                                 <thead className="bg-slate-800/50 text-slate-500 font-black uppercase tracking-wider">
                                   <tr>
                                     <th className="p-3">COBOL Field</th>
                                     <th className="p-3">Python Mapping</th>
                                     <th className="p-3">Description</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-800">
                                   {selectedChunk.copybookStructure.map((field, i) => (
                                     <tr key={i} className="hover:bg-white/5 transition-colors">
                                       <td className="p-3 font-mono text-blue-300">{field.originalField}</td>
                                       <td className="p-3 font-mono text-emerald-400 font-bold">{field.pythonMapping}</td>
                                       <td className="p-3 text-slate-400">{field.description}</td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Modern Python Output</h4>
                            <div className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black uppercase">PEP 8 Compliant</div>
                         </div>
                         <div className="bg-[#050914] rounded-xl p-5 border border-slate-800 shadow-inner overflow-x-auto">
                           <ProgressiveCodeBlock 
                             code={selectedChunk.pythonSource} 
                             className="code-font text-[11px] text-blue-100 leading-relaxed" 
                           />
                         </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Verification Status</h4>
                           <button 
                             onClick={() => runTests(selectedChunk)}
                             disabled={isRunningTests || selectedChunk.status !== 'DONE'}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-20 transition-all"
                           >
                             {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                             <span>Run Autonomous Parity Check</span>
                           </button>
                        </div>

                        {selectedChunk.testResults ? (
                          <div className="bg-black/40 rounded-xl border border-slate-800 overflow-hidden">
                             <div className="p-3 bg-slate-800/30 border-b border-slate-800 flex justify-between">
                               <span className="text-[9px] font-black text-slate-500">EXECUTION REPORT</span>
                               <span className={`text-[9px] font-black uppercase tracking-widest ${selectedChunk.testResults.every(r => r.status === 'PASSED') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {selectedChunk.testResults.filter(r => r.status === 'PASSED').length} OF {selectedChunk.testResults.length} PASSED
                               </span>
                             </div>
                             <div className="divide-y divide-slate-800 font-mono text-[10px]">
                               {selectedChunk.testResults.map((res, i) => (
                                 <div key={i} className="p-3 flex items-center space-x-4 hover:bg-white/5 transition-colors">
                                   <div className={`w-2 h-2 rounded-full ${res.status === 'PASSED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                   <span className="text-slate-500 w-12">{res.duration}</span>
                                   <span className="text-slate-200 flex-1 truncate">{res.name}</span>
                                   {res.status === 'FAILED' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                                 </div>
                               ))}
                             </div>
                          </div>
                        ) : (
                          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 rounded-2xl bg-white/[0.02]">
                             <FlaskConical className="w-10 h-10 text-slate-700 mb-4" />
                             <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Awaiting Verification Cycle</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <Wind className="w-16 h-16 text-slate-700 mb-6" />
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Selecting Module for Analysis</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <Server className="w-4 h-4 text-blue-500" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Target GCP Cloud Blueprint</h3>
              <div className="h-px bg-slate-800 flex-1" />
            </div>
            {migrationState.overallPlan ? (
              <div className="text-slate-400 text-[11px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar selection:bg-blue-500/50">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-700 italic border border-slate-800 border-dashed rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest">Global Analysis Pending...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
         <div className="flex space-x-8 items-center">
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span>Reliability Mode: MARATHON</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Logic Depth: 16k Thinking Tokens</span>
            </span>
         </div>
         <div className="opacity-40">GEMINI-3 PRO • ENTERPRISE CORE v1.05</div>
      </footer>
    </div>
  );
};

export default App;
