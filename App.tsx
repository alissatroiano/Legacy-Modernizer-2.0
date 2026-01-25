
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
  Search,
  Copy,
  ClipboardCheck,
  Archive,
  FileText
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
        <div className="flex items-center space-x-2 mt-4 text-blue-400 font-sans italic text-[10px] animate-pulse">
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info') => {
    setLogs(prev => [...prev.slice(-200), { msg, type }]);
  }, []);

  // Ensure logs are visible and scroll to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Welcome log
  useEffect(() => {
    addLog("LegacyLink Enterprise Core initialized.", "success");
    addLog("Ready for high-fidelity archaeology and system modernization.", "info");
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files);
    addLog(`Initiating ingestion for ${fileList.length} source artifacts...`, 'thinking');
    
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setInputCode(prev => prev ? prev + '\n\n' + `*> SOURCE_FILE: ${file.name}\n` + content : `*> SOURCE_FILE: ${file.name}\n` + content);
          addLog(`Successfully ingested: ${file.name} (${content.split('\n').length} lines)`, 'success');
        }
      };
      reader.onerror = () => addLog(`Failed to ingest artifact: ${file.name}`, 'error');
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
    addLog("Initiating Marathon Reasoning Audit cycle...", 'thinking');

    try {
      addLog("Sequencing system topology and file access patterns...", 'info');
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("System DNA successfully sequenced.", 'success');
      
      addLog("Deconstructing monolith into functional target modules...", 'info');
      const { chunks: rawChunks } = await gemini.splitCodeIntoChunks(inputCode);
      addLog(`Partitioned system into ${rawChunks.length} target modules.`, 'success');

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
      addLog(`Audit Interrupted: ${error}`, 'error');
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
    addLog(`Modernizing ${chunk.name} (Priority: Persistence Integrity)...`, 'thinking');

    try {
      const { research, sources } = await gemini.researchModernEquivalents(chunk.name);
      addLog(`Mapping legacy file access to modern patterns for ${chunk.name}...`, 'info');
      
      const result = await gemini.processModuleLogic(chunk, research);
      addLog(`Synthesizing verification artifacts for ${chunk.name}...`, 'info');
      
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
      addLog(`${chunk.name} logic recovery successful.`, 'success');
    } catch (error) {
      addLog(`Module Recovery Failure ${chunk.name}: ${error}`, 'error');
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
    addLog(`Running Autonomous Parity Run for ${chunk.name}...`, 'thinking');
    
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
        addLog(`LOGIC PARITY: ${chunk.name} implementation verified.`, 'success');
      } else {
        addLog(`PARITY FAULT: ${chunk.name} failed ${results.length - passCount} logic checks.`, 'error');
      }
    } catch (error) {
      addLog(`Verification Fault: ${error}`, 'error');
    } finally {
      setIsRunningTests(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addLog(`Source code copied to clipboard.`, 'info');
  };

  const downloadModule = (chunk: CodeChunk) => {
    if (!chunk.pythonSource) return;
    const content = `# MODULE: ${chunk.name}\n# RECOVERED BY LEGACY LINK AI\n# PARITY CONFIDENCE: ${chunk.coverage}%\n\n${chunk.pythonSource}\n\n# VERIFICATION ARTIFACTS\n${chunk.unitTest}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chunk.name.toLowerCase().replace(/\s+/g, '_')}.py`;
    a.click();
    addLog(`Exported Python source: ${a.download}`, 'success');
  };

  const bulkExport = () => {
    const completed = migrationState.chunks.filter(c => c.status === 'DONE');
    if (!completed.length) return;
    
    const combined = completed.map(c => `\n### MODULE: ${c.name} (Parity: ${c.coverage}%) ###\n\n${c.pythonSource}\n\n### TESTS ###\n${c.unitTest}`).join('\n\n');
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legacy_system_recovery_output.py`;
    a.click();
    addLog(`Bulk exported ${completed.length} modules to single master file.`, 'success');
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
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">LegacyLink Enterprise</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Autonomous Logic Archaeology</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {isThinking && (
               <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full animate-pulse">
                 <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
                 <span className="text-[10px] font-bold text-blue-300 uppercase">System reasoning active</span>
               </div>
             )}
             <div className="h-8 w-px bg-slate-800 mx-2" />
             <button 
               onClick={bulkExport}
               disabled={migrationState.chunks.filter(c => c.status === 'DONE').length === 0}
               className="bg-slate-800 hover:bg-slate-700 disabled:opacity-20 px-4 py-2 rounded-xl border border-slate-700 transition-all text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center space-x-2"
             >
               <Archive className="w-4 h-4" />
               <span className="hidden md:inline">Export Full Queue</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column: Source and System Stream */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl h-[450px]">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <Database className="w-3.5 h-3.5" />
                <span>Ingestion Terminal</span>
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={migrationState.status !== MigrationStatus.IDLE}
                  className="text-[9px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg uppercase hover:bg-blue-500 transition-all"
                >
                  Upload Files
                </button>
              </div>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 p-4 code-font text-[11px] bg-transparent text-blue-200 focus:outline-none resize-none leading-relaxed custom-scrollbar"
              placeholder="Load legacy programs (COBOL, Copybooks)..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-4 border-t border-slate-800 bg-slate-800/10">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-500 transition-all disabled:opacity-20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="uppercase tracking-widest text-[11px]">Deploy Modernization Cycle</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex-1 flex flex-col shadow-xl min-h-[300px]">
             <div className="p-3 border-b border-slate-800 flex items-center space-x-2 bg-slate-800/20">
               <Terminal className="w-3.5 h-3.5 text-emerald-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Stream</span>
             </div>
             <div className="p-4 space-y-2.5 overflow-y-auto flex-1 font-mono text-[10px] bg-black/40 custom-scrollbar">
               {logs.length === 0 && <p className="text-slate-600 italic">Awaiting source ingestion signal...</p>}
               {logs.map((log, i) => (
                 <div key={i} className="flex items-start space-x-2 animate-in fade-in slide-in-from-left-1 duration-200">
                   <div className={`mt-1.5 w-1 h-2 rounded-full shrink-0 ${
                     log.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                     log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                     log.type === 'thinking' ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
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
               <div ref={logEndRef} className="h-4" />
             </div>
          </div>
        </div>

        {/* Right column: Dashboard and module analysis */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Logic Parity', value: `${overallCoverage}%`, icon: ShieldCheck, color: 'blue' },
              { label: 'Modules Ready', value: migrationState.chunks.filter(c => c.status === 'DONE').length, icon: CheckCircle, color: 'emerald' },
              { label: 'Artifacts Count', value: migrationState.chunks.length, icon: FileText, color: 'indigo' },
              { label: 'Sources Cited', value: migrationState.chunks.filter(c => c.groundingSources?.length).length, icon: Globe, color: 'sky' }
            ].map((stat, i) => (
              <div key={i} className={`bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-${stat.color}-500 group transition-all hover:bg-slate-800/50`}>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white">{stat.value}</span>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500/30 group-hover:text-${stat.color}-500/60 transition-colors`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Module Selector */}
            <div className="md:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
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
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${chunk.status === 'DONE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : chunk.status === 'ERROR' ? 'bg-rose-500' : 'bg-slate-700 animate-pulse'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-200 uppercase truncate">{chunk.name}</p>
                        <p className={`text-[8px] font-bold mt-0.5 ${chunk.status === 'DONE' ? 'text-blue-400' : 'text-slate-500'}`}>
                          {chunk.status === 'DONE' ? `${chunk.coverage}% PARITY` : 'ANALYZING...'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedChunkId === chunk.id ? 'translate-x-1 text-blue-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Module Detail Viewer */}
            <div className="md:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
              {selectedChunk ? (
                <>
                  <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
                    <div className="flex items-center space-x-1">
                      {[
                        { id: 'functional', label: 'Archaeology', icon: BookOpen },
                        { id: 'technical', label: 'Source', icon: Cpu },
                        { id: 'validation', label: 'Verification', icon: FlaskConical }
                      ].map(mode => (
                        <button 
                          key={mode.id}
                          onClick={() => setViewMode(mode.id as any)}
                          className={`flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                            viewMode === mode.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <mode.icon className="w-3.5 h-3.5" />
                          <span>{mode.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Primary Module Export Button */}
                    <button 
                      onClick={() => downloadModule(selectedChunk)}
                      disabled={!selectedChunk.pythonSource}
                      className="flex items-center space-x-2 text-[9px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-20 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export Python</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative bg-slate-900/40">
                    {viewMode === 'functional' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center space-x-2">
                             <Activity className="w-3 h-3" />
                             <span>Business Rule Extraction</span>
                           </h4>
                           <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap bg-white/5 p-5 rounded-xl border border-white/5 font-mono shadow-inner">
                             {selectedChunk.businessRules || 'Synthesizing module behavior...'}
                           </div>
                        </div>

                        {selectedChunk.copybookStructure && (
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Persistence Data Mapping</h4>
                              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-black/20">
                                <table className="w-full text-[10px] text-left">
                                  <thead className="bg-slate-800 text-slate-500 font-black uppercase">
                                    <tr>
                                      <th className="p-3">Legacy Field</th>
                                      <th className="p-3">Modern Type</th>
                                      <th className="p-3">Integrity Rule</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800">
                                    {selectedChunk.copybookStructure.map((field, i) => (
                                      <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-mono text-blue-300">{field.originalField}</td>
                                        <td className="p-3 font-mono text-emerald-400 font-bold">{field.dataType}</td>
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
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Implementation: {selectedChunk.name}</h4>
                            <div className="flex space-x-2">
                               <button 
                                 onClick={() => copyToClipboard(selectedChunk.pythonSource || '', `copy-${selectedChunk.id}`)}
                                 className="flex items-center space-x-2 text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all text-slate-400 hover:text-slate-200"
                               >
                                 {copiedId === `copy-${selectedChunk.id}` ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                 <span>{copiedId === `copy-${selectedChunk.id}` ? 'Copied' : 'Copy Code'}</span>
                               </button>
                            </div>
                         </div>
                         <div className="bg-[#050914] rounded-xl p-5 border border-slate-800 shadow-inner overflow-x-auto min-h-[300px]">
                           <ProgressiveCodeBlock 
                             code={selectedChunk.pythonSource} 
                             className="code-font text-[11px] text-blue-100 leading-relaxed" 
                           />
                         </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Parity Verification Artifacts</h4>
                           <button 
                             onClick={() => runTests(selectedChunk)}
                             disabled={isRunningTests || selectedChunk.status !== 'DONE'}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-20 transition-all"
                           >
                             {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                             <span>Execute Parity Cycle</span>
                           </button>
                        </div>

                        {selectedChunk.testResults ? (
                          <div className="bg-black/40 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                             <div className="p-3 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logic Trace Report</span>
                               <div className="flex items-center space-x-3">
                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded ${selectedChunk.testResults.every(r => r.status === 'PASSED') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                   {selectedChunk.testResults.filter(r => r.status === 'PASSED').length} / {selectedChunk.testResults.length} PASSED
                                 </span>
                               </div>
                             </div>
                             <div className="divide-y divide-slate-800 font-mono text-[10px]">
                               {selectedChunk.testResults.map((res, i) => (
                                 <div key={i} className="p-4 flex items-center space-x-4 hover:bg-white/5 transition-colors">
                                   <div className={`w-2 h-2 rounded-full ${res.status === 'PASSED' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                   <span className="text-slate-500 w-16">{res.duration}</span>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-slate-200 font-bold truncate">{res.name}</p>
                                      {res.status === 'FAILED' && <p className="text-rose-400/70 text-[9px] mt-0.5">{res.message || 'Assertion Fault: Modern logic deviates from legacy trace.'}</p>}
                                   </div>
                                   {res.status === 'FAILED' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                                 </div>
                               ))}
                             </div>
                          </div>
                        ) : (
                          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 rounded-2xl bg-white/[0.01]">
                             <FlaskConical className="w-10 h-10 text-slate-700 mb-4 opacity-20" />
                             <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Awaiting execution of verification artifacts</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                  <Wind className="w-16 h-16 text-slate-600 mb-6" />
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Selecting module for archaeology</p>
                </div>
              )}
            </div>
          </div>

          {/* System Plan Viewer */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center space-x-3">
                 <Server className="w-4 h-4 text-blue-500" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Global System Topology</h3>
                 <div className="h-px bg-slate-800 w-24 hidden sm:block" />
               </div>
               {migrationState.overallPlan && (
                 <button 
                   onClick={() => copyToClipboard(migrationState.overallPlan || '', 'plan-copy')}
                   className="text-[9px] font-black text-slate-500 hover:text-slate-300 transition-colors uppercase"
                 >
                   {copiedId === 'plan-copy' ? 'Copied Blueprint' : 'Copy Blueprint'}
                 </button>
               )}
            </div>
            {migrationState.overallPlan ? (
              <div className="text-slate-400 text-[11px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar font-mono bg-black/20 p-4 rounded-xl border border-white/5">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-700 border border-slate-800 border-dashed rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest">System audit signal awaiting ingestion...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
         <div className="flex space-x-10 items-center">
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span>Reliability Mode: MARATHON</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span>Logic Depth: 16k Reasoning Budget</span>
            </span>
         </div>
         <div className="opacity-40 font-mono">GEMINI-3 PRO • ENTERPRISE CORE v1.12</div>
      </footer>
    </div>
  );
};

export default App;
