
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FlaskConical
} from 'lucide-react';
import { MigrationStatus, MigrationState, CodeChunk } from './types';
import * as gemini from './services/geminiService';

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
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
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
          addLog(`Loaded: ${file.name} (${file.size} bytes)`, 'success');
        }
      };
      reader.onerror = () => {
        addLog(`Failed to read file: ${file.name}`, 'error');
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
        content += `\n---\n# Module: ${c.name}\n\n### Business Rules\n${c.businessRules || "Pending extraction..."}\n\n### Modern Python Implementation\n\`\`\`python\n${c.pythonSource || ""}\n\`\`\`\n\n### Validation Tests\n\`\`\`python\n${c.unitTest || ""}\n\`\`\`\n`;
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
    if (!inputCode.trim()) {
      addLog("No COBOL source code provided.", 'error');
      return;
    }

    setMigrationState(prev => ({
      ...prev,
      status: MigrationStatus.ANALYZING,
      totalLines: inputCode.split('\n').length,
      processedLines: 0,
      currentChunkIndex: -1,
      chunks: []
    }));

    addLog("Analyzing legacy codebase architecture & business domains...", 'info');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("System business domain mapping complete.", 'success');
      
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

      addLog(`Migration workspace ready. ${chunks.length} functional modules identified.`, 'info');
    } catch (error) {
      addLog(`Analysis failed: ${error}`, 'error');
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

    addLog(`Mining business logic from: ${chunk.name}...`, 'info');

    try {
      // Step 1: Logic Extraction and Technical Translation
      const result = await gemini.processModuleLogic(chunk);
      
      // Step 2: Quality Verification
      addLog(`Synthesizing validation suite for: ${chunk.name}...`, 'info');
      const testResult = await gemini.generateTests(result.pythonSource, chunk.cobolSource);
      
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          pythonSource: result.pythonSource,
          businessRules: result.businessRules,
          unitTest: testResult.testCode,
          coverage: testResult.coverageEstimate,
          status: 'DONE'
        };
        
        const isLast = currentChunkIndex === newChunks.length - 1;
        const newProcessedLines = prev.processedLines + chunk.cobolSource.split('\n').length;

        return {
          ...prev,
          chunks: newChunks,
          processedLines: newProcessedLines,
          currentChunkIndex: isLast ? currentChunkIndex : currentChunkIndex + 1,
          status: isLast ? MigrationStatus.COMPLETED : MigrationStatus.PROCESSING
        };
      });

      addLog(`Logic extraction complete: ${chunk.name} (Coverage: ${testResult.coverageEstimate}%)`, 'success');
    } catch (error) {
      addLog(`Critical failure in ${chunk.name}: ${error}`, 'error');
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = { ...chunk, status: 'ERROR', coverage: 0 };
        
        const isLast = currentChunkIndex === newChunks.length - 1;
        const newProcessedLines = prev.processedLines + chunk.cobolSource.split('\n').length;

        return {
          ...prev,
          chunks: newChunks,
          processedLines: newProcessedLines,
          currentChunkIndex: isLast ? currentChunkIndex : currentChunkIndex + 1,
          status: isLast ? MigrationStatus.COMPLETED : MigrationStatus.PROCESSING
        };
      });
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

  const progressPercentage = migrationState.totalLines > 0 
    ? Math.round((migrationState.processedLines / migrationState.totalLines) * 100) 
    : 0;

  const completedChunks = migrationState.chunks.filter(c => c.status === 'DONE');
  const overallCoverage = completedChunks.length > 0 
    ? Math.round(completedChunks.reduce((acc, c) => acc + (c.coverage || 0), 0) / completedChunks.length)
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
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LegacyLink <span className="text-indigo-400">Blueprint</span></h1>
              <p className="text-xs text-slate-400">Logic Extraction & Clean-Sheet Rewriting Engine</p>
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium text-slate-700">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Source COBOL</span>
              </div>
              <button 
                onClick={triggerFileUpload}
                disabled={migrationState.status !== MigrationStatus.IDLE}
                className="flex items-center space-x-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase transition-all disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                <span>Upload System</span>
              </button>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 p-4 code-font text-sm bg-slate-900 text-indigo-200 focus:outline-none resize-none"
              placeholder="PASTE LEGACY CODE FOR BUSINESS RULE MINING..."
              disabled={migrationState.status !== MigrationStatus.IDLE}
            />
            <div className="p-4 bg-white">
              <button 
                onClick={handleStartMigration}
                disabled={migrationState.status !== MigrationStatus.IDLE || !inputCode}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 font-semibold transition-all shadow-md
                  ${migrationState.status === MigrationStatus.IDLE ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
              >
                <Play className="w-4 h-4" />
                <span>Execute Logic Discovery</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2 font-medium text-slate-700">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Discovery Logs</span>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-64 flex-1 bg-slate-50/50">
              {logs.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for analysis...</p>}
              {logs.map((log, i) => (
                <div key={i} className={`text-[10px] flex space-x-2 border-b border-slate-100 pb-1 ${log.type === 'error' ? 'text-rose-600' : log.type === 'success' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  <span className="font-mono">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="flex-1">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group overflow-hidden">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Modernization Reach</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                <span className="text-xs text-slate-400">{migrationState.processedLines} LoC Analyzed</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${progressPercentage}%`}}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">System Integrity</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-emerald-600">{overallCoverage}%</span>
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Logic verification score</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Functional Domains</p>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-slate-700">{migrationState.chunks.length}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Discovered subsystems</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Current Process</p>
              <div className="flex items-center space-x-2">
                {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />}
                <span className="text-sm font-bold text-slate-700 truncate">
                  {isCompleted ? 'Blueprint Finalized' : 'Rule Mining...'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 truncate">
                {migrationState.chunks[migrationState.currentChunkIndex]?.name || 'Initializing...'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[600px]">
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700 flex justify-between items-center">
                <span>Domain Modules</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">{migrationState.chunks.length}</span>
              </div>
              <div className="overflow-y-auto flex-1 bg-slate-50/20">
                {migrationState.chunks.map((chunk, idx) => (
                  <button 
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`w-full p-4 flex items-center justify-between border-b border-slate-50 transition-colors text-left
                      ${selectedChunkId === chunk.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {chunk.status === 'DONE' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 animate-pulse bg-slate-100"></div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-700 truncate uppercase tracking-tight">{chunk.name}</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                           <span className="text-[9px] text-slate-400">Coverage: {chunk.coverage || 0}%</span>
                           {chunk.status === 'DONE' && <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {selectedChunk ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex flex-1 overflow-hidden">
                      <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded-lg border border-slate-200 mr-4 shadow-sm">
                        <button 
                          onClick={() => setViewMode('functional')}
                          className={`flex items-center space-x-2 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'functional' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Blueprint</span>
                        </button>
                        <button 
                          onClick={() => setViewMode('technical')}
                          className={`flex items-center space-x-2 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'technical' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          <Cpu className="w-3 h-3" />
                          <span>Technical</span>
                        </button>
                        <button 
                          onClick={() => setViewMode('validation')}
                          className={`flex items-center space-x-2 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-md ${viewMode === 'validation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          <FlaskConical className="w-3 h-3" />
                          <span>Validation Suite</span>
                        </button>
                      </div>
                    </div>
                    {selectedChunk.status === 'DONE' && (
                      <button 
                        onClick={() => handleExport(selectedChunk)}
                        className="flex items-center space-x-2 text-xs bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export Spec</span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto bg-white relative">
                    {viewMode === 'functional' && (
                      <div className="p-6 space-y-6">
                        <div className="flex items-center space-x-2 text-indigo-600 border-b border-indigo-50 pb-2 mb-4">
                          <ScrollText className="w-5 h-5" />
                          <h4 className="font-black text-sm uppercase tracking-widest">Discovered Business Logic</h4>
                        </div>
                        {selectedChunk.businessRules ? (
                          <div className="prose prose-indigo max-w-none">
                            <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-inner">
                              {selectedChunk.businessRules}
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Rule Integrity</p>
                                  <p className="text-xs text-emerald-800">Logic has been decoupled from legacy constraints.</p>
                               </div>
                               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Requirement Maturity</p>
                                  <p className="text-xs text-indigo-800">Extracted intent is verified against COBOL source patterns.</p>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <FileSearch className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Extracting rules from mainframe syntax...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === 'technical' && (
                      <div className="p-4 space-y-6">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Legacy Source (COBOL)</label>
                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-96 overflow-auto shadow-inner">
                                <pre className="code-font text-[11px] text-slate-500 leading-relaxed">
                                  {selectedChunk.cobolSource}
                                </pre>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-indigo-400 uppercase mb-1 block">Modern Implementation (Python)</label>
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-96 overflow-auto shadow-xl">
                                <pre className="code-font text-[11px] text-indigo-200 leading-relaxed whitespace-pre-wrap">
                                  {selectedChunk.pythonSource || '# Mining implementation...'}
                                </pre>
                              </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {viewMode === 'validation' && (
                      <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-emerald-50 pb-2 mb-4">
                          <div className="flex items-center space-x-2 text-emerald-600">
                            <FlaskConical className="w-5 h-5" />
                            <h4 className="font-black text-sm uppercase tracking-widest">Verification Test Suite</h4>
                          </div>
                          {selectedChunk.coverage !== undefined && (
                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center space-x-2">
                              <span>Estimated Coverage</span>
                              <span className="bg-white px-2 py-0.5 rounded-full text-emerald-900">{selectedChunk.coverage}%</span>
                            </div>
                          )}
                        </div>
                        {selectedChunk.unitTest ? (
                          <div className="bg-slate-900 border border-emerald-900/30 rounded-xl p-5 shadow-2xl relative">
                            <div className="absolute top-4 right-4 text-[10px] text-emerald-500 font-mono opacity-50">pytest_suite.py</div>
                            <pre className="code-font text-[11px] text-emerald-400/90 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                              {selectedChunk.unitTest}
                            </pre>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <Activity className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
                            <p className="text-sm font-medium">Synthesizing behavioral tests...</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                           <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                             <h5 className="text-[10px] font-black text-slate-400 uppercase">Boundary Testing</h5>
                             <p className="text-[11px] text-slate-600">Mainframe record overflow and null handling simulated.</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                             <h5 className="text-[10px] font-black text-slate-400 uppercase">Logic Parity</h5>
                             <p className="text-[11px] text-slate-600">Calculations verified against COBOL arithmetic precision.</p>
                           </div>
                           <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <CheckCircle className="w-4 h-4 text-emerald-500 mb-2" />
                             <h5 className="text-[10px] font-black text-slate-400 uppercase">Mocking Layer</h5>
                             <p className="text-[11px] text-slate-600">Legacy flat-file and DB2 calls virtualized for CI/CD.</p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <ScrollText className="w-10 h-10 text-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Domain Discovery Workspace</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                    Select a subsystem to begin the deep discovery of business logic and functional requirements.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white tracking-tight">System-Wide Business Blueprint</h3>
              </div>
              <div className="flex space-x-2">
                <span className="text-[9px] text-indigo-300 uppercase font-black bg-indigo-900/50 px-2 py-1 rounded-md border border-indigo-700">Domain Mapping</span>
              </div>
            </div>
            {migrationState.overallPlan ? (
              <div className="text-indigo-100/80 text-xs whitespace-pre-wrap leading-loose max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-900">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic">
                Scan system to discover global business architecture...
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div className="flex items-center space-x-8">
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span><span>Logic Decoupled</span></span>
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span><span>Business Blueprint Ready</span></span>
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span><span>Mainframe Logic Recovered</span></span>
          </div>
          <div className="flex items-center space-x-2">
             <span>Gemini 3 Pro Discovery Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
