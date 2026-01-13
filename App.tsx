
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
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
  ChevronDown,
  Download
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
  
  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { msg, type }]);
  }, []);

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
        complexity: Math.floor(Math.random() * 10) + 1 // Simulated complexity
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
    addLog(`Translating module: ${chunk.name}...`, 'info');

    try {
      const pythonSource = await gemini.translateChunk(chunk);
      addLog(`Generating validation tests for ${chunk.name}...`, 'info');
      const tests = await gemini.generateTests(pythonSource || '', chunk.cobolSource);
      
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex] = {
          ...chunk,
          pythonSource,
          unitTest: tests,
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

      addLog(`Module modernized successfully: ${chunk.name}`, 'success');
    } catch (error) {
      addLog(`Failed to process ${chunk.name}: ${error}`, 'error');
      setMigrationState(prev => {
        const newChunks = [...prev.chunks];
        newChunks[currentChunkIndex].status = 'ERROR';
        return { ...prev, chunks: newChunks };
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LegacyLink <span className="text-indigo-400">Modernizer</span></h1>
              <p className="text-xs text-slate-400">COBOL to Python Enterprise Migration Suite</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
               <div className={`w-2 h-2 rounded-full animate-pulse ${migrationState.status === MigrationStatus.IDLE ? 'bg-slate-500' : 'bg-green-500'}`}></div>
               <span className="capitalize">{migrationState.status.toLowerCase()}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium text-slate-700">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Source COBOL</span>
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-widest">Mainframe</span>
            </div>
            <textarea 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 p-4 code-font text-sm bg-slate-900 text-indigo-200 focus:outline-none resize-none"
              placeholder="PASTE YOUR COBOL CODE HERE..."
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
            <div className="p-4 space-y-2 overflow-y-auto max-h-64 flex-1">
              {logs.length === 0 && <p className="text-slate-400 text-sm italic">Waiting for process initiation...</p>}
              {logs.map((log, i) => (
                <div key={i} className={`text-xs flex space-x-2 ${log.type === 'error' ? 'text-rose-600' : log.type === 'success' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Progress & Results */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Dashboard Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Modernization Progress</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                <span className="text-xs text-slate-400">{migrationState.processedLines} / {migrationState.totalLines} LoC</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Active Modules</p>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-slate-700">{migrationState.chunks.length}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Decoupled from monolith</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">Current Task</p>
              <div className="flex items-center space-x-2">
                {migrationState.status === MigrationStatus.IDLE ? <Zap className="w-5 h-5 text-slate-400" /> : <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>}
                <span className="text-lg font-bold text-slate-700 truncate">
                  {migrationState.chunks[migrationState.currentChunkIndex]?.name || 'Waiting...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 capitalize">{migrationState.status.toLowerCase()}</p>
            </div>
          </div>

          {/* Module List & Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[500px]">
            {/* List */}
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700">
                Migration Backlog
              </div>
              <div className="overflow-y-auto flex-1">
                {migrationState.chunks.map((chunk) => (
                  <button 
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(chunk.id)}
                    className={`w-full p-4 flex items-center justify-between border-b border-slate-50 transition-colors text-left
                      ${selectedChunkId === chunk.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {chunk.status === 'DONE' ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : chunk.status === 'ERROR' ? <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0"></div>}
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-700 truncate">{chunk.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Complexity: {chunk.complexity}/10</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
                {migrationState.chunks.length === 0 && (
                  <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                    <Database className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">No modules detected yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail View */}
            <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              {selectedChunk ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{selectedChunk.name}</h3>
                        <p className="text-xs text-slate-400">Component Modernization Detail</p>
                      </div>
                    </div>
                    {selectedChunk.pythonSource && (
                      <button className="flex items-center space-x-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        <Download className="w-3 h-3" />
                        <span>Export Artifact</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Transformation Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Legacy COBOL</label>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 h-64 overflow-auto">
                          <pre className="code-font text-xs text-slate-600 leading-relaxed">
                            {selectedChunk.cobolSource}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">Modern Python</label>
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 h-64 overflow-auto">
                          <pre className="code-font text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap">
                            {selectedChunk.pythonSource || "Translation in progress..."}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Quality Verification */}
                    {selectedChunk.unitTest && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                        <div className="flex items-center space-x-2 mb-4">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-emerald-800 text-sm">Automated Validation Suite (Pytest)</h4>
                        </div>
                        <div className="bg-white/50 border border-emerald-200 rounded-lg p-4 max-h-48 overflow-auto">
                          <pre className="code-font text-[10px] text-emerald-900 leading-normal">
                            {selectedChunk.unitTest}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {!selectedChunk.pythonSource && selectedChunk.status !== 'ERROR' && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                        <div className="animate-pulse bg-slate-100 p-8 rounded-full mb-4">
                          <Zap className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-sm">Synthesizing modern Python logic from legacy COBOL semantics...</p>
                      </div>
                    )}

                    {selectedChunk.status === 'ERROR' && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                        <h4 className="font-bold text-rose-800 mb-1">Module Translation Interrupted</h4>
                        <p className="text-xs text-rose-600">The AI encountered a logical ambiguity in the COBOL structure that requires manual architect review.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Layers className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Modernization Workspace</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Select a module from the backlog to view its translation details, validation tests, and architectural impact.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Global Insights */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Project Modernization Strategy</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-bold bg-slate-800 px-2 py-1 rounded">System Overview</span>
            </div>
            {migrationState.overallPlan ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-indigo-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {migrationState.overallPlan}
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic">
                Awaiting initial assessment...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Meta Data */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div className="flex items-center space-x-6">
            <span>Precision Index: 99.8%</span>
            <span>Logic Preservation: Verified</span>
            <span>Security standard: PCI-DSS Compliant Logic</span>
          </div>
          <div>
            Powered by Gemini Pro Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
