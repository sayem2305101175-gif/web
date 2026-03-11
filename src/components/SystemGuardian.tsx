
import * as React from 'react';
import { analyzeRuntimeSession } from '../services/geminiService';

// --- Type Definitions ---
interface PerformanceMemory {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
}

declare global {
    interface Window {
        performance: Performance & {
            memory?: PerformanceMemory;
        };
    }
}

interface SystemLog {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM' | 'OPTIMIZATION' | 'NETWORK' | 'INTERACTION';
    message: string;
}

interface KnowledgeEntry {
    id: string;
    date: string;
    issue: string;
    fix: string;
}

const KNOWLEDGE_BASE_KEY = 'VELOSNAK_AI_KNOWLEDGE';

const SystemGuardian: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'MONITOR' | 'KNOWLEDGE'>('MONITOR');
    const [fps, setFps] = React.useState(60);
    const [memory, setMemory] = React.useState<{ used: number, limit: number } | null>(null);

    // Telemetry Stores
    const [logs, setLogs] = React.useState<SystemLog[]>([]);
    const [interactions, setInteractions] = React.useState<string[]>([]);
    const [networkLogs, setNetworkLogs] = React.useState<string[]>([]);
    const [knowledgeBase, setKnowledgeBase] = React.useState<KnowledgeEntry[]>(() => {
        try {
            const stored = localStorage.getItem(KNOWLEDGE_BASE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    // Refs for loop management
    // Fix: Initialized refs with undefined to satisfy TypeScript argument requirements
    const requestRef = React.useRef<number | undefined>(undefined);
    const lastTimeRef = React.useRef<number | undefined>(undefined);
    const frameCountRef = React.useRef<number>(0);
    const originalFetchRef = React.useRef<typeof fetch | null>(null);

    // --- Core Log Logic ---
    const addLog = React.useCallback((level: SystemLog['level'], message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev: SystemLog[]) => {
            // Dedup logic
            const lastLog = prev[prev.length - 1];
            if (lastLog && lastLog.message === message) return prev;
            return [...prev, { timestamp, level, message }].slice(-100);
        });

        if (level === 'INTERACTION') {
            setInteractions((prev: string[]) => [...prev, `[${timestamp}] ${message}`].slice(-20));
        }
        if (level === 'NETWORK') {
            setNetworkLogs((prev: string[]) => [...prev, `[${timestamp}] ${message}`].slice(-20));
        }
    }, []);

    // --- 1. Interaction Telemetry (Global Click Listener) ---
    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Use textContent instead of innerText for better SVG compatibility
            const text = target.textContent?.slice(0, 20) || target.tagName;
            const id = target.id ? `#${target.id}` : '';
            addLog('INTERACTION', `User Clicked: ${target.tagName}${id} ("${text.replace(/\n/g, ' ')}")`);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [addLog]);

    // --- 2. Network Telemetry (Fetch Interceptor) ---
    React.useEffect(() => {
        // Only attempt to patch if we haven't already captured the original
        if (!originalFetchRef.current) {
            originalFetchRef.current = window.fetch;

            const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = input.toString();
                // Ignore our own AI calls to prevent infinite loops
                if (url.includes('generativelanguage.googleapis.com')) {
                    return originalFetchRef.current!(input, init);
                }

                const startTime = performance.now();
                try {
                    const response = await originalFetchRef.current!(input, init);
                    const duration = Math.round(performance.now() - startTime);
                    addLog('NETWORK', `[${response.status}] ${url} (${duration}ms)`);
                    return response;
                } catch (error) {
                    addLog('ERROR', `Network Fail: ${url} - ${error}`);
                    throw error;
                }
            };

            try {
                window.fetch = patchedFetch;
            } catch {
                console.warn("SystemGuardian: Unable to intercept network calls (window.fetch is read-only or protected).");
            }
        }

        return () => {
            // Restore original fetch on unmount
            if (originalFetchRef.current) {
                try {
                    window.fetch = originalFetchRef.current;
                } catch {
                    console.warn("SystemGuardian: Unable to restore original fetch.");
                }
            }
        };
    }, [addLog]);

    // --- 3. FPS & Memory Loop ---
    React.useEffect(() => {
        const animate = (time: number) => {
            if (lastTimeRef.current != undefined) {
                const deltaTime = time - lastTimeRef.current;
                frameCountRef.current++;
                if (deltaTime >= 1000) {
                    setFps(frameCountRef.current);
                    frameCountRef.current = 0;
                    lastTimeRef.current = time;
                }
            } else {
                lastTimeRef.current = time;
            }
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        // Memory Interval
        const interval = setInterval(() => {
            if (window.performance && window.performance.memory) {
                const mem = window.performance.memory;
                setMemory({
                    used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
                    limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
                });
            }
        }, 2000);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            clearInterval(interval);
        };
    }, []);

    // --- AI Operations ---
    const runDeepScan = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        addLog('SYSTEM', 'Initiating Deep Runtime Analysis...');

        try {
            // Send the correlation data (Interactions + Network + Logs)
            const systemLogsText = logs.slice(-20).map(l => `${l.level}: ${l.message}`);
            const result = await analyzeRuntimeSession(interactions, networkLogs, systemLogsText);

            setAnalysisResult(result || "Analysis failed to return a result.");
            addLog('INFO', 'Analysis Complete. Correlation report generated.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addLog('ERROR', `AI Connection Failed. ${message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveToKnowledgeBase = () => {
        if (!analysisResult) return;
        const entry: KnowledgeEntry = {
            id: Math.random().toString(36).slice(2, 11),
            date: new Date().toLocaleDateString(),
            issue: `Session Analysis ${new Date().toLocaleTimeString()}`,
            fix: analysisResult // Store full result
        };
        const updated = [entry, ...knowledgeBase];
        setKnowledgeBase(updated);
        localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(updated));
        addLog('SYSTEM', 'Fix pattern learned and stored in Knowledge Base.');
    };

    const clearMemory = () => {
        setLogs([]);
        setInteractions([]);
        setNetworkLogs([]);
        setAnalysisResult(null);
        addLog('OPTIMIZATION', 'Runtime telemetry purged.');
    };

    // --- Render ---
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 bg-white border border-emerald-200 text-emerald-600 px-4 py-2 rounded-r-full font-mono text-xs flex items-center gap-3 hover:pl-6 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.05)]"
            >
                <div className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${fps < 30 ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${fps < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                </div>
                <span className="font-bold tracking-widest">DEV DEBUGGER</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 w-full max-w-lg animate-in slide-in-from-left-10 duration-300">
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xl font-mono text-xs flex flex-col h-[500px]">

                {/* Header */}
                <div className="bg-zinc-50 p-3 border-b border-zinc-200 flex justify-between items-center select-none">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="font-bold tracking-widest uppercase text-[10px]">Runtime Learning System</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setViewMode('MONITOR')} className={`${viewMode === 'MONITOR' ? 'text-black border-b-2 border-emerald-500' : 'text-zinc-400'}`}>LIVE</button>
                        <button onClick={() => setViewMode('KNOWLEDGE')} className={`${viewMode === 'KNOWLEDGE' ? 'text-black border-b-2 border-emerald-500' : 'text-zinc-400'}`}>KNOWLEDGE ({knowledgeBase.length})</button>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-black ml-2">X</button>
                    </div>
                </div>

                {viewMode === 'MONITOR' ? (
                    <>
                        {/* Real-time Visualizer */}
                        <div className="grid grid-cols-4 gap-px bg-zinc-100 border-b border-zinc-200">
                            <div className="p-3 text-center bg-white">
                                <div className="text-[9px] text-zinc-400 uppercase">FPS</div>
                                <div className={`text-lg font-bold ${fps < 45 ? 'text-red-500' : 'text-emerald-500'}`}>{fps}</div>
                            </div>
                            <div className="p-3 text-center bg-white">
                                <div className="text-[9px] text-zinc-400 uppercase">Events</div>
                                <div className="text-lg font-bold text-blue-500">{interactions.length}</div>
                            </div>
                            <div className="p-3 text-center bg-white">
                                <div className="text-[9px] text-zinc-400 uppercase">Net Calls</div>
                                <div className="text-lg font-bold text-orange-500">{networkLogs.length}</div>
                            </div>
                            <div className="p-3 text-center bg-white">
                                <div className="text-[9px] text-zinc-400 uppercase">Memory</div>
                                <div className="text-lg font-bold text-purple-500">{memory?.used || '-'}</div>
                            </div>
                        </div>

                        {/* Unified Log Stream */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-zinc-50 custom-scrollbar relative">
                            {logs.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-zinc-400 italic">System Idle. Waiting for input...</div>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 text-[10px] hover:bg-white p-0.5 rounded border border-transparent hover:border-zinc-200">
                                    <span className="text-zinc-400 font-mono select-none">[{log.timestamp}]</span>
                                    <span className={`w-16 font-bold text-right shrink-0 ${log.level === 'ERROR' ? 'text-red-500' :
                                        log.level === 'INTERACTION' ? 'text-blue-500' :
                                            log.level === 'NETWORK' ? 'text-orange-500' :
                                                'text-zinc-500'
                                        }`}>{log.level}</span>
                                    <span className="text-zinc-700 break-words">{log.message}</span>
                                </div>
                            ))}
                            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                        </div>

                        {/* Analysis Pane */}
                        <div className="border-t border-zinc-200 bg-white p-2">
                            {analysisResult ? (
                                <div className="animate-in slide-in-from-bottom-5">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-emerald-600 font-bold uppercase text-[10px]">Gemini Diagnostics</h3>
                                        <div className="flex gap-2">
                                            <button onClick={saveToKnowledgeBase} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[9px] hover:bg-emerald-500 hover:text-white transition-colors">LEARN FIX</button>
                                            <button onClick={() => setAnalysisResult(null)} className="text-zinc-400 hover:text-black px-2">DISMISS</button>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded border border-zinc-200 max-h-40 overflow-y-auto text-zinc-700 whitespace-pre-wrap">
                                        {analysisResult}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={runDeepScan}
                                        disabled={isAnalyzing}
                                        className="flex-1 bg-black hover:bg-zinc-800 text-white font-bold py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[10px]"
                                    >
                                        {isAnalyzing ? <span className="animate-spin">⟳</span> : '⚡'}
                                        {isAnalyzing ? 'CORRELATING LOGS...' : 'RUN DEEP SCAN'}
                                    </button>
                                    <button onClick={clearMemory} className="px-3 bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded transition-colors border border-zinc-200" title="Clear Logs">
                                        🗑
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-zinc-50 p-4 overflow-y-auto">
                        <h3 className="text-zinc-400 uppercase font-bold text-[10px] mb-4">Learned Fix Patterns</h3>
                        {knowledgeBase.length === 0 ? (
                            <div className="text-zinc-400 text-center mt-10">No patterns learned yet.<br />Run a scan and click "Learn Fix".</div>
                        ) : (
                            <div className="space-y-4">
                                {knowledgeBase.map(entry => (
                                    <div
                                        key={entry.id}
                                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                        className={`bg-white border border-zinc-200 p-3 rounded transition-all cursor-pointer ${expandedId === entry.id ? 'border-emerald-500 shadow-md' : 'hover:border-zinc-300'}`}
                                    >
                                        <div className="flex justify-between mb-2 items-start">
                                            <span className="text-emerald-600 font-bold">{entry.issue}</span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-zinc-400 text-[9px]">{entry.date}</span>
                                                {expandedId === entry.id && <span className="text-[9px] text-emerald-600 mt-1">OPEN</span>}
                                            </div>
                                        </div>
                                        <div className={`text-zinc-600 font-mono text-[10px] whitespace-pre-wrap ${expandedId === entry.id ? '' : 'line-clamp-3'}`}>
                                            {entry.fix}
                                        </div>
                                        {expandedId !== entry.id && <div className="mt-1 text-[9px] text-zinc-400 text-center uppercase tracking-wider">▼ Expand Fix ▼</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemGuardian;
