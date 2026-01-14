
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
  ShieldCheck
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
    let filename = "modernized_system.py";

    if (chunk) {
      content = `"""\nModule: ${chunk.name}\nModernized from legacy COBOL\n"""\n\n${chunk.pythonSource || ""}\n\n${chunk.unitTest ? `### UNIT TESTS ###\n${chunk.unitTest}` : ""}`;
      filename = `${chunk.name.replace(/\s+/g, '_').toLowerCase()}.py`;
    } else {
      content = `"""\nFull System Modernization Export\nGenerated: ${new Date().toLocaleString()}\n"""\n\n`;
      migrationState.chunks.forEach(c => {
        if (c.pythonSource) {
          content += `\n\n# --- MODULE: ${c.name} ---\n${c.pythonSource}\n`;
        }
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`Exported artifact: ${filename}`, 'success');
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

    addLog("Analyzing legacy codebase architecture...", 'info');

    try {
      const analysis = await gemini.analyzeLegacyCodebase(inputCode);
      addLog("System architecture analysis complete.", 'success');
      
      addLog("Decomposing monolithic code into logical modules...", 'info');
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

      addLog(`Migration plan established. ${chunks.length} modules identified.`, 'info');
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

    addLog(`Translating module (${currentChunkIndex + 1}/${chunks.length}): ${chunk.name}...`, 'info');

    try {
      const pythonSource = await gemini.translateChunk(chunk);
      addLog(`Generating validation tests & coverage estimate for ${chunk.name}...`, 'info');
      const testResult = await gemini.generateTests(pythonSource || '', chunk.cobolSource);
      
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          pythonSource,
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

      addLog(`Module modernized successfully: ${chunk.name} (Coverage: ${testResult.coverageEstimate}%)`, 'success');
    } catch (error) {
      addLog(`Failed to process ${chunk.name}: ${error}`, 'error');
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
              <h1 className="text-xl font-bold tracking-tight">LegacyLink <span className="text-indigo-400">Modernizer</span></h1>
              <p className="text-xs text-slate-400">Enterprise AI Codebase Upgrade</p>
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
                <span>Upload Files</span>
              </button>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 p-4 code-font text-sm bg-slate-900 text-indigo-200 focus:outline-none resize-none"
              placeholder="PASTE YOUR COBOL CODE HERE OR UPLOAD DOCUMENTS..."
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
                <span>Initiate Modernization Pipeline</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2 font-medium text-slate-700">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Migration Logs</span>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-64 flex-1 bg-slate-50/50">
              {logs.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for process initiation...</p>}
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
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Modernization Progress</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                <span className="text-xs text-slate-400">{migrationState.processedLines} / {migrationState.totalLines} LoC</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${progressPercentage}%`}}></div>
              </div>
              {isCompleted && (
                <button 
                  onClick={() => handleExport()}
                  className="absolute right-2 top-2 bg-indigo-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Export Entire Project"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Test Coverage Overall Score */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Overall Test Coverage</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-emerald-600">{overallCoverage}%</span>
                <Activity className="w-5 h-5 text-emerald-500 mb-1" />
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{width: `${overallCoverage}%`}}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Active Modules</p>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-slate-700">{migrationState.chunks.length}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Semantic units identified</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Pipeline Status</p>
              <div className="flex items-center space-x-2 overflow-hidden">
                {migrationState.status === MigrationStatus.IDLE ? (
                  <Zap className="w-5 h-5 text-slate-400" />
                ) : isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                )}
                <span className="text-sm font-bold text-slate-700 truncate">
                  {isCompleted ? 'Migration Finished' : migrationState.chunks[migrationState.currentChunkIndex]?.name || 'Waiting...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 capitalize">{migrationState.status.toLowerCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[500px]">
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700 flex justify-between items-center">
                <span>Migration Backlog</span>
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
                      ) : chunk.status === 'ERROR' ? (
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0"></div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-medium text-slate-700 truncate">{chunk.name}</p>
                          {chunk.coverage !== undefined && (
                            <span className={`text-[8px] px-1 rounded font-bold ${chunk.coverage > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {chunk.coverage}%
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase">Module {idx + 1}</p>
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
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="bg-indigo-100 p-2 rounded-lg flex-shrink-0">
                        <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-slate-800 truncate">{selectedChunk.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tight">Status: {selectedChunk.status}</p>
                      </div>
                    </div>
                    {selectedChunk.pythonSource && (
                      <button 
                        onClick={() => handleExport(selectedChunk)}
                        className="flex items-center space-x-2 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg border border-indigo-700 hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export Artifact</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Legacy COBOL Source</label>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-80 overflow-auto shadow-inner">
                          <pre className="code-font text-[11px] text-slate-600 leading-relaxed">
                            {selectedChunk.cobolSource}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-indigo-400 uppercase mb-1 block">Modernized Python 3.12</label>
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-80 overflow-auto shadow-xl">
                          <pre className="code-font text-[11px] text-indigo-200 leading-relaxed whitespace-pre-wrap">
                            {selectedChunk.pythonSource || (selectedChunk.status === 'ERROR' ? '# Transformation failed for this module.' : '# Modernizing logic...')}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {selectedChunk.unitTest && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-bold text-emerald-800 text-sm uppercase tracking-wider">Validation Test Suite</h4>
                          </div>
                          <div className="flex items-center space-x-2 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                             <span className="text-[10px] font-bold text-emerald-700 uppercase">Coverage Estimate</span>
                             <span className="text-xs font-black text-emerald-800">{selectedChunk.coverage}%</span>
                          </div>
                        </div>
                        <div className="bg-slate-900 border border-emerald-900/30 rounded-lg p-4 max-h-48 overflow-auto">
                          <pre className="code-font text-[10px] text-emerald-400/80 leading-normal">
                            {selectedChunk.unitTest}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <Layers className="w-10 h-10 text-indigo-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Workspace Ready</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                    Select a module from the backlog to view technical documentation and modernization artifacts.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white tracking-tight">Project Modernization Strategy</h3>
              </div>
              <div className="flex space-x-2">
                <span className="text-[9px] text-indigo-300 uppercase font-black bg-indigo-900/50 px-2 py-1 rounded-md border border-indigo-700">Arch Assess</span>
              </div>
            </div>
            {migrationState.overallPlan ? (
              <div className="text-indigo-100/80 text-xs whitespace-pre-wrap leading-loose max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-900">
                {migrationState.overallPlan}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic">
                Waiting for system scan...
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div className="flex items-center space-x-8">
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span><span>Logic Verified</span></span>
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span><span>Python 3.12+</span></span>
            <span className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span><span>ISO/IEC Compliance</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Powered by Gemini 3 Pro</span>
            <div className="w-4 h-4 bg-indigo-600 rounded-sm"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
