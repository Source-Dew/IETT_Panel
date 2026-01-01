import React, { useState, useEffect } from 'react';
import { WifiOff, FileSpreadsheet, X, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import Terminal from '../../ui/Terminal';

const PCOffline = () => {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState(["PC Offline Modu Hazır."]);
    const [selectedFile1, setSelectedFile1] = useState(null);
    const [selectedFile2, setSelectedFile2] = useState(null);
    const [isSelectingFile, setIsSelectingFile] = useState(false);
    const [reportPath, setReportPath] = useState(null);

    const activeMode = 'pc_offline';
    const config = {
        title: 'PC Offline Veri',
        desc: "Excel'deki İETT araçlarının sefer durumlarını kontrol eder.",
        icon: WifiOff,
        color: 'text-indigo-400',
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20"
    };

    const checkExistingReport = async () => {
        if (window.electronAPI && window.electronAPI.checkReportExists) {
            const filename = "Hıkvısıon PC Offline Veri (2.Yöntem).xlsx";
            const path = await window.electronAPI.checkReportExists(filename);
            setReportPath(path);
        }
    };

    useEffect(() => {
        checkExistingReport();
        window.addEventListener('cleanup-done', checkExistingReport);
        return () => window.removeEventListener('cleanup-done', checkExistingReport);
    }, []);

    useEffect(() => {
        const handleFilesDrop = (e) => {
            const { results } = e.detail;
            if (status === 'running') return;

            const paths = Object.keys(results || {});
            if (paths.length > 0) {
                if (!selectedFile1) {
                    setSelectedFile1(paths[0]);
                    setLogs(prev => [...prev, `Dosya seçildi: ${paths[0].split(/[\\/]/).pop()}`]);
                    if (paths.length > 1 && !selectedFile2) {
                        setSelectedFile2(paths[1]);
                        setLogs(prev => [...prev, `Dosya seçildi: ${paths[1].split(/[\\/]/).pop()}`]);
                    }
                } else if (!selectedFile2) {
                    setSelectedFile2(paths[0]);
                    setLogs(prev => [...prev, `Dosya seçildi: ${paths[0].split(/[\\/]/).pop()}`]);
                }
            }
        };
        window.addEventListener('files-dropped', handleFilesDrop);
        return () => window.removeEventListener('files-dropped', handleFilesDrop);
    }, [status]);

    useEffect(() => {
        let cleanup;
        if (window.electronAPI && window.electronAPI.onLog) {
            cleanup = window.electronAPI.onLog((data) => {
                if (data.type === 'log') {
                    setLogs(prev => [...prev, data.data.message]);
                } else if (data.type === 'progress') {
                    setProgress(data.data.percentage);
                } else if (data.type === 'finish') {
                    setStatus('idle');
                    setProgress(100);
                    setLogs(prev => [...prev, `İşlem tamamlandı.`]);
                    if (data.data.output_path) {
                        setReportPath(data.data.output_path);
                    }
                }
            });
        }
        return () => { if (cleanup) cleanup(); };
    }, []);

    const handleSelectFile = async (index) => {
        if (isSelectingFile) return;
        setIsSelectingFile(true);
        try {
            if (window.electronAPI) {
                const path = await window.electronAPI.selectFile();
                if (path) {
                    if (index === 1) setSelectedFile1(path);
                    else setSelectedFile2(path);
                    setLogs(prev => [...prev, `${index}. Dosya seçildi: ${path.split(/[\\/]/).pop()}`]);
                }
            }
        } finally {
            setIsSelectingFile(false);
        }
    };

    const handleStart = async () => {
        if (!selectedFile1 || !selectedFile2) {
            setLogs(prev => [...prev, "[WARN] Lütfen işlemi başlatmak için her iki dosyayı da seçin."]);
            return;
        }
        setStatus('running');
        setLogs([`İşlem başlatılıyor...`]);
        if (window.electronAPI) {
            await window.electronAPI.runPythonScript([
                'process',
                '--file1', selectedFile1,
                '--file2', selectedFile2,
                '--mode', activeMode,
                '--method', '2'
            ]);
        }
    };

    const handleStop = async () => {
        if (window.electronAPI) {
            await window.electronAPI.stopPythonScript();
            setStatus('idle');
            setProgress(0);
            setLogs(prev => [...prev, "İşlem kullanıcı tarafından durduruldu."]);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div className={`flex justify-between items-center p-6 rounded-2xl border transition-colors duration-300 ${config.bg} ${config.border}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-slate-950/50 border border-slate-800 ${config.color}`}>
                        <config.icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{config.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 no-drag">
                    {reportPath && (
                        <button
                            onClick={() => window.electronAPI && window.electronAPI.openFile(reportPath)}
                            className="flex items-center justify-center gap-2 px-4 h-10 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-all font-medium whitespace-nowrap"
                        >
                            <FileSpreadsheet size={18} />
                            <span>Raporu Aç</span>
                        </button>
                    )}
                    <button
                        onClick={() => handleSelectFile(1)}
                        className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl border transition-all duration-300 font-semibold text-sm no-drag ${status === 'running' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} 
                            ${selectedFile1
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-[1.02]'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                    >
                        {selectedFile1 ? <CheckCircle2 size={16} /> : <FileSpreadsheet size={16} />}
                        <span>{selectedFile1 ? 'Atayol Seçildi' : 'Atayol Veri'}</span>
                    </button>

                    <button
                        onClick={() => handleSelectFile(2)}
                        className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl border transition-all duration-300 font-semibold text-sm no-drag ${status === 'running' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} 
                            ${selectedFile2
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-[1.02]'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                    >
                        {selectedFile2 ? <CheckCircle2 size={16} /> : <FileSpreadsheet size={16} />}
                        <span>{selectedFile2 ? 'PC Veri Seçildi' : 'PC Veri'}</span>
                    </button>
                    {status === 'running' ? (
                        <button onClick={handleStop} className="flex items-center justify-center gap-2 px-5 h-10 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-red-500/50 text-sm group">
                            <X size={16} className="group-hover:rotate-90 transition-transform" /> <span>DURDUR</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            className={`flex items-center justify-center gap-2 px-6 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-blue-500/50 text-sm group`}
                        >
                            <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /> <span>BAŞLAT</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className="text-slate-400 font-medium">{status === 'running' ? 'İşlem sürüyor...' : 'Sistem hazır'}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Terminal */}
            <Terminal logs={logs} />
        </div>
    );
};

export default PCOffline;
