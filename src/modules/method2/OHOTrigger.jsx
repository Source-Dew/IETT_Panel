import React, { useState, useEffect } from 'react';
import { Activity, FileSpreadsheet, X, Play, CheckCircle2, Users, FileText } from 'lucide-react';
import Terminal from '../../ui/Terminal';

const OHOTrigger = () => {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState(["ÖHO Tetik Veri Modu Hazır."]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [cars2, setCars2] = useState('');
    const [cars3, setCars3] = useState('');
    const [detailedCars, setDetailedCars] = useState('');
    const [isDetailed, setIsDetailed] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSelectingFile, setIsSelectingFile] = useState(false);
    const [reportPath, setReportPath] = useState(null);

    const activeMode = 'oho_trigger';
    const config = {
        title: 'ÖHO Tetik Veri',
        desc: "ÖHO Tetik ayarlarını filtrelemek için kullanılır.",
        icon: Activity,
        color: 'text-orange-400',
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    };

    const checkExistingReport = async () => {
        if (window.electronAPI && window.electronAPI.checkReportExists) {
            const filename = "ÖHO Tetik Veri Analizi.xlsx";
            const path = await window.electronAPI.checkReportExists(filename);
            setReportPath(path);
        }
    };

    useEffect(() => {
        checkExistingReport();

        // Load saved vehicle lists
        const loadSettings = async () => {
            if (window.electronAPI && window.electronAPI.getSettings) {
                const settings = await window.electronAPI.getSettings();
                if (settings.oho_trigger_cars2) setCars2(settings.oho_trigger_cars2);
                if (settings.oho_trigger_cars3) setCars3(settings.oho_trigger_cars3);
                setIsInitialized(true);
            }
        };
        loadSettings();

        window.addEventListener('cleanup-done', checkExistingReport);
        return () => window.removeEventListener('cleanup-done', checkExistingReport);
    }, []);

    // Auto-save vehicle lists
    useEffect(() => {
        if (!isInitialized) return;

        const saveSettings = async () => {
            if (window.electronAPI && window.electronAPI.getSettings && window.electronAPI.saveSettings) {
                const settings = await window.electronAPI.getSettings();
                const newSettings = {
                    ...settings,
                    oho_trigger_cars2: cars2,
                    oho_trigger_cars3: cars3
                };
                await window.electronAPI.saveSettings(newSettings);
            }
        };

        const timer = setTimeout(saveSettings, 1000); // 1 second debounce
        return () => clearTimeout(timer);
    }, [cars2, cars3, isInitialized]);

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

    const handleSelectFiles = async () => {
        if (isSelectingFile) return;
        setIsSelectingFile(true);
        try {
            if (window.electronAPI && window.electronAPI.selectFiles) {
                const paths = await window.electronAPI.selectFiles();
                if (paths && paths.length > 0) {
                    setSelectedFiles(paths);
                    setLogs(prev => [...prev, `${paths.length} dosya seçildi.`]);
                }
            }
        } finally {
            setIsSelectingFile(false);
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleStart = async () => {
        if (selectedFiles.length === 0) {
            setLogs(prev => [...prev, "[WARN] Lütfen işlemi başlatmak için kaynak dosyaları seçin."]);
            return;
        }
        setStatus('running');
        setLogs([`İşlem başlatılıyor...`]);
        try {
            if (window.electronAPI) {
                const args = {
                    mode: 'oho_trigger',
                    files: selectedFiles,
                    cars2: cars2.trim(),
                    cars3: cars3.trim(),
                    detailed_cars: detailedCars.trim(),
                    is_detailed: isDetailed
                };

                await window.electronAPI.runPythonScript(args);
            }
        } catch (error) {
            setLogs(prev => [...prev, `[ERROR] Başlatılamadı: ${error.message}`]);
            setStatus('idle');
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
        <div className="flex flex-col gap-6 h-full font-inter">
            <div className={`flex justify-between items-center p-6 rounded-2xl border transition-colors duration-300 ${config.bg} ${config.border}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-slate-950/50 border border-slate-800 ${config.color}`}>
                        <config.icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{config.title}</h2>
                        <p className="text-slate-400 text-sm mt-1">{config.desc}</p>
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
                        onClick={() => setIsDetailed(!isDetailed)}
                        className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all font-semibold text-sm no-drag ${status === 'running' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} ${isDetailed
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/50'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                            }`}
                    >
                        <Users size={16} />
                        Detaylı Analiz
                    </button>
                    <button
                        onClick={handleSelectFiles}
                        className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl border transition-all duration-300 font-semibold text-sm no-drag ${status === 'running' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} 
                            ${selectedFiles.length > 0
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-[1.02]'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                    >
                        {selectedFiles.length > 0 ? <CheckCircle2 size={16} /> : <FileSpreadsheet size={16} />}
                        <span>{selectedFiles.length > 0 ? `${selectedFiles.length} Dosya Seçildi` : 'Tetik Veri'}</span>
                    </button>
                    {status === 'running' ? (
                        <button onClick={handleStop} className="flex items-center justify-center gap-2 px-5 h-10 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-red-500/50 text-sm group">
                            <X size={16} className="group-hover:rotate-90 transition-transform" /> <span>DURDUR</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={selectedFiles.length === 0}
                            className={`flex items-center justify-center gap-2 px-6 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-blue-500/50 text-sm group ${selectedFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /> <span>BAŞLAT</span>
                        </button>
                    )}
                </div>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex justify-between">
                        <span>Seçilen Dosyalar ({selectedFiles.length})</span>
                        <button onClick={() => setSelectedFiles([])} className="hover:text-red-400 transition-colors">TÜMÜNÜ TEMİZLE</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="group flex items-center justify-between gap-2 bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all text-sm text-slate-300">
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileSpreadsheet size={14} className="text-blue-400 shrink-0" />
                                    <span className="truncate" title={file}>{file.split(/[\\/]/).pop()}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(idx)}
                                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    title="Dosyayı Kaldır"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {/* Vehicle Lists */}
            <div className={`grid gap-6 transition-all duration-300 ${isDetailed ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 font-bold text-blue-400 text-sm tracking-wider uppercase">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            2 Kapılı Araç Listesi
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.electronAPI && window.electronAPI.openTextContent(cars2, "2_Kapili_Araclar")}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                title="Listeyi Not Defterinde Aç"
                            >
                                <FileText size={14} />
                            </button>
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">OPSİYONEL</span>
                        </div>
                    </div>
                    <textarea
                        value={cars2}
                        onChange={(e) => setCars2(e.target.value)}
                        placeholder="A-1040&#10;A-1041..."
                        className="w-full h-24 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-mono text-sm"
                    />
                </div>

                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 font-bold text-orange-400 text-sm tracking-wider uppercase">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                            3 Kapılı Araç Listesi
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.electronAPI && window.electronAPI.openTextContent(cars3, "3_Kapili_Araclar")}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-orange-400 transition-colors"
                                title="Listeyi Not Defterinde Aç"
                            >
                                <FileText size={14} />
                            </button>
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">OPSİYONEL</span>
                        </div>
                    </div>
                    <textarea
                        value={cars3}
                        onChange={(e) => setCars3(e.target.value)}
                        placeholder="A-001&#10;A-002..."
                        className="w-full h-24 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-orange-500/50 transition-colors resize-none font-mono text-sm"
                    />
                </div>

                {isDetailed && (
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="flex items-center gap-2 font-bold text-purple-400 text-sm tracking-wider uppercase">
                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                Detaylı Analiz Araçları
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.electronAPI && window.electronAPI.openTextContent(detailedCars, "Detayli_Analiz_Araclari")}
                                    className="p-1.5 hover:bg-purple-900/40 rounded-lg text-purple-300 hover:text-white transition-colors border border-transparent hover:border-purple-500/30"
                                    title="Listeyi Not Defterinde Aç"
                                >
                                    <FileText size={14} />
                                </button>
                                <span className="text-[10px] font-bold bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30">AKTİF</span>
                            </div>
                        </div>
                        <textarea
                            value={detailedCars}
                            onChange={(e) => setDetailedCars(e.target.value)}
                            placeholder="Örn: A-1676..."
                            className="w-full h-24 bg-slate-950/50 border border-purple-500/20 rounded-xl p-3 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 transition-colors resize-none font-mono text-sm"
                        />
                    </div>
                )}
            </div>

            <Terminal logs={logs} />
        </div>
    );
};

export default OHOTrigger;
