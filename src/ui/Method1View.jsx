import React, { useState, useEffect } from 'react';
import Header from './Header';
import Terminal from './Terminal';
import { WifiOff, HardDrive, Users, FileSpreadsheet, X, AlertTriangle } from 'lucide-react';

// Method 1 specific modules
import HKOffline from '../modules/method1/HKOffline';
import HKHDD from '../modules/method1/HKHDD';
import HKFirebox from '../modules/method1/HKFirebox';
import HKPassenger from '../modules/method1/HKPassenger';
import PCOffline from '../modules/method1/PCOffline';
import OHOOffline from '../modules/method1/OHOOffline';
import IETTOffline from '../modules/method1/IETTOffline';

const Method1View = ({ activeMode, onModeChange }) => {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState(["Sistem hazır. Mod seçin ve başlatın..."]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSelectingFile, setIsSelectingFile] = useState(false);
    const [reportPaths, setReportPaths] = useState({});

    const checkExistingReport = async () => {
        if (window.electronAPI && window.electronAPI.checkReportExists) {
            let filename = "";
            switch (activeMode) {
                case 'offline': filename = "Hıkvısıon Offline Veri (1.Yöntem).xlsx"; break;
                case 'hdd': filename = "Hıkvısıon HDD Veri (1.Yöntem).xlsx"; break;
                case 'firebox': filename = "Hıkvısıon Firebox Veri (1.Yöntem).xlsx"; break;
                case 'yolcu': filename = "Hıkvısıon Yolcu Yükü Veri (1.Yöntem).xlsx"; break;
                case 'pc_offline': filename = "PC Offline Veri (1.Yöntem).xlsx"; break;
                case 'oho_offline': filename = "ÖHO Çevrimdışı Veri (1.Yöntem).xlsx"; break;
                case 'iett_offline': filename = "İETT Çevrimdışı Veri (1.Yöntem).xlsx"; break;
                default: return;
            }
            const path = await window.electronAPI.checkReportExists(filename);
            setReportPaths(prev => ({ ...prev, [activeMode]: path }));
        }
    };

    useEffect(() => {
        const labels = {
            offline: 'HK Offline',
            hdd: 'HK HDD',
            firebox: 'HK Firebox',
            yolcu: 'HK Yolcu',
            pc_offline: 'PC Offline',
            oho_offline: 'ÖHO Offline',
            iett_offline: 'İETT Offline'
        };
        const label = labels[activeMode] || activeMode.toUpperCase();
        setLogs([`${label} Modu Hazır.`]);
        setSelectedFile(null);
        setProgress(0);
        checkExistingReport();
    }, [activeMode]);

    useEffect(() => {
        window.addEventListener('cleanup-done', checkExistingReport);
        return () => window.removeEventListener('cleanup-done', checkExistingReport);
    }, [activeMode]);

    // Ayarları yükle ve logla
    const refreshSettingsLog = async (isUpdate = false) => {
        if (window.electronAPI && window.electronAPI.getSettings) {
            try {
                const settings = await window.electronAPI.getSettings();
                let thresholdInfo = "";

                switch (activeMode) {
                    case 'offline':
                        thresholdInfo = `HK Eşiği: ${settings.HK_OFFLINE_THRESHOLD || 360} dakika`;
                        break;
                    case 'oho_offline':
                        thresholdInfo = `Mevcut çevrimdışı eşiği: ${settings.OHO_OFFLINE_THRESHOLD || 10} saat`;
                        break;
                    case 'iett_offline':
                        thresholdInfo = `Mevcut çevrimdışı eşiği: ${settings.IETT_OFFLINE_THRESHOLD || 10} saat`;
                        break;
                    case 'yolcu':
                        thresholdInfo = `Yolcu Eşiği: %${settings.PASSENGER_THRESHOLD || 10}`;
                        break;
                    default:
                        thresholdInfo = "";
                }

                if (thresholdInfo) {
                    const logMsg = `${isUpdate ? '[GÜNCELLEME]' : '[BİLGİ]'} ${thresholdInfo}`;
                    setLogs(prev => {
                        if (prev.includes(logMsg)) return prev;
                        return [...prev, logMsg];
                    });
                }
            } catch (err) {
                console.error("Settings refresh error:", err);
            }
        }
    };

    useEffect(() => {
        refreshSettingsLog();
        const handleUpdate = () => refreshSettingsLog(true);
        window.addEventListener('settings-updated', handleUpdate);
        return () => window.removeEventListener('settings-updated', handleUpdate);
    }, [activeMode]);

    useEffect(() => {
        const handleFilesDrop = (e) => {
            const { results } = e.detail;
            if (!results || status === 'running') return;

            // Pick the best file for the current mode
            let targetType = 'hk'; // Default for offline, hdd_firebox, yolcu
            if (activeMode === 'pc_offline') targetType = 'pc';
            if (activeMode === 'oho_offline' || activeMode === 'iett_offline') targetType = 'portal';

            const bestFile = Object.entries(results).find(([_, type]) => type === targetType)
                || Object.entries(results)[0]; // Fallback to first if no match

            if (bestFile) {
                setSelectedFile(bestFile[0]);
                setLogs(prev => [...prev, `[SMART] ${activeMode.toUpperCase()} için uygun dosya otomatik tanındı.`]);
            }
        };
        window.addEventListener('files-dropped', handleFilesDrop);
        return () => window.removeEventListener('files-dropped', handleFilesDrop);
    }, [status, activeMode]);

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
                        setReportPaths(prev => ({ ...prev, [activeMode]: data.data.output_path }));
                    }
                }
            });
        }
        return () => { if (cleanup) cleanup(); };
    }, [activeMode]);

    const handleSelectFile = async () => {
        if (isSelectingFile) return;
        setIsSelectingFile(true);
        try {
            if (window.electronAPI) {
                const path = await window.electronAPI.selectFile();
                if (path) {
                    setSelectedFile(path);
                    setLogs(prev => [...prev, `[SYSTEM] Dosya seçildi: ${path}`]);
                }
            }
        } finally {
            setIsSelectingFile(false);
        }
    };

    const handleStart = async () => {
        if (!selectedFile) {
            setLogs(prev => [...prev, "[WARN] Lütfen işlem için bir dosya seçin."]);
            return;
        }

        setStatus('running');
        setLogs([`[SYSTEM] 1. Yöntem başlatılıyor...`]);

        try {
            let threshold = 360;
            if (window.electronAPI && window.electronAPI.getSettings) {
                const settings = await window.electronAPI.getSettings();
                switch (activeMode) {
                    case 'offline': threshold = settings.HK_OFFLINE_THRESHOLD || 360; break;
                    case 'iett_offline': threshold = settings.IETT_OFFLINE_THRESHOLD || 10; break;
                    case 'oho_offline': threshold = settings.OHO_OFFLINE_THRESHOLD || 10; break;
                    case 'yolcu': threshold = settings.PASSENGER_THRESHOLD || 10; break;
                }
            }

            if (window.electronAPI) {
                await window.electronAPI.runPythonScript([
                    'process',
                    '--file', selectedFile,
                    '--mode', activeMode,
                    '--method', '1',
                    '--threshold', threshold.toString()
                ]);
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
            setLogs(prev => [...prev, "[SYSTEM] İşlem durduruldu."]);
        }
    };

    const modeConfigs = {
        offline: { title: "HK Offline Saat Veri", desc: "", icon: WifiOff, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        hdd: { title: "HK HDD Veri", desc: "", icon: HardDrive, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        firebox: { title: "HK Firebox Veri", desc: "", icon: HardDrive, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
        yolcu: { title: "HK Yolcu Yükü Faktörü", desc: "", icon: Users, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
        pc_offline: { title: 'PC Offline Veri', desc: "", icon: WifiOff, color: 'text-indigo-400', bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        oho_offline: { title: 'ÖHO Çevrimdışı Veri', desc: "", icon: WifiOff, color: 'text-red-400', bg: "bg-red-500/10", border: "border-red-500/20" },
        iett_offline: { title: 'İETT Çevrimdışı Veri', desc: "", icon: WifiOff, color: 'text-yellow-400', bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    };

    const renderModule = () => {
        const props = { status, logs, progress, reportPath: reportPaths[activeMode] };
        switch (activeMode) {
            case 'offline': return <HKOffline {...props} />;
            case 'hdd': return <HKHDD {...props} />;
            case 'firebox': return <HKFirebox {...props} />;
            case 'yolcu': return <HKPassenger {...props} />;
            case 'pc_offline': return <PCOffline {...props} />;
            case 'oho_offline': return <OHOOffline {...props} />;
            case 'iett_offline': return <IETTOffline {...props} />;
            default: return null;
        }
    };

    const currentMode = modeConfigs[activeMode];

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden p-8 pt-12">
            <div className="mb-8 group">
                <Header
                    modeInfo={currentMode}
                    status={status}
                    selectedFile={selectedFile}
                    onSelectFile={handleSelectFile}
                    onStart={handleStart}
                    onStop={handleStop}
                    onOpenFile={(path) => window.electronAPI && window.electronAPI.openFile(path)}
                    reportPath={reportPaths[activeMode]}
                />
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 mb-6 shadow-xl">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className="text-slate-400 font-medium">
                            {status === 'running' ? 'İşlem sürüyor...' : 'Sistem hazır'}
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <Terminal logs={logs} />
        </div>
    );
};

export default Method1View;
