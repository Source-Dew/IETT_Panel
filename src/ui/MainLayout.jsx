import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Settings from './Settings';
import Method1View from './Method1View';
import Method2View from './Method2View';
import { WifiOff, HardDrive, Users, X, AlertTriangle, Settings as SettingsIcon, Trash2, FileSpreadsheet } from 'lucide-react';

const MainLayout = () => {
    const [activeMode, setActiveMode] = useState('offline');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [cleanSuccess, setCleanSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleModeChange = (mode) => {
        setActiveMode(mode);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files && files.length > 0) {
            const filePaths = files.map(file => {
                let path = file.path;
                if (!path && window.electronAPI && window.electronAPI.getFilePath) {
                    try { path = window.electronAPI.getFilePath(file); } catch (err) { }
                }
                return path;
            }).filter(p => p);

            if (filePaths.length > 0) {
                console.log("Files dropped:", filePaths);

                // Smart sniffing
                if (window.electronAPI && window.electronAPI.sniffFiles) {
                    try {
                        const results = await window.electronAPI.sniffFiles(filePaths);
                        if (results && Object.keys(results).length > 0) {
                            window.dispatchEvent(new CustomEvent('files-dropped', { detail: { results } }));
                            return;
                        }
                    } catch (err) {
                        console.error("Sniff error:", err);
                    }
                }

                // Fallback: If sniffing fails or returns nothing, send files as unknown
                const fallbackResults = {};
                filePaths.forEach(p => fallbackResults[p] = 'unknown');
                window.dispatchEvent(new CustomEvent('files-dropped', { detail: { results: fallbackResults } }));
            }
        }
    };

    const renderContent = () => {
        if (!selectedMethod) {
            return (
                <div className="flex-1 flex items-center justify-center bg-slate-950/50 backdrop-blur-xl">
                    <div className="text-center p-12 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-2xl max-w-md">
                        <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                            <AlertTriangle className="text-blue-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Hoş Geldiniz</h2>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            Lütfen sol üst köşeden çalışmak istediğiniz <span className="text-blue-400 font-bold">Yöntem</span>'i seçerek başlayın.
                        </p>
                        <div className="space-y-3 text-left bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50">
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                <p className="text-sm text-slate-300"><span className="text-blue-400 font-bold">1. Yöntem:</span> Araç verileri İETT üzerinden veri çekilerek çalışmaktadır.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                <p className="text-sm text-slate-300"><span className="text-blue-400 font-bold">2. Yöntem:</span> Atayol Excel okutma yöntemiyle çalışmaktadır.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (selectedMethod === 1) {
            return <Method1View activeMode={activeMode} onModeChange={handleModeChange} />;
        }

        return <Method2View activeMode={activeMode} onModeChange={handleModeChange} />;
    };

    return (
        <div
            className="flex h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Sidebar
                activeMode={activeMode}
                onModeChange={handleModeChange}
                onOpenSettings={() => setShowSettings(true)}
                onCleanOutputs={() => setShowDeleteConfirm(true)}
                cleanSuccess={cleanSuccess}
                selectedMethod={selectedMethod}
                onMethodSelect={setSelectedMethod}
            />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="h-10 w-full drag-region absolute top-0 left-0 z-50" />
                {renderContent()}
            </div>

            {/* Drag and Drop Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-[100] bg-blue-600/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-3xl flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                    <div className="bg-slate-900/90 p-10 rounded-3xl border border-blue-500/50 shadow-2xl flex flex-col items-center gap-6">
                        <div className="p-5 bg-blue-500/20 rounded-full animate-bounce">
                            <FileSpreadsheet size={56} className="text-blue-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Dosyayı Buraya Bırak</h3>
                            <p className="text-blue-300 font-medium">İşlemek için Excel dosyasını bırakın</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Ayarlar Modalı */}
            {showSettings && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <SettingsIcon className="text-blue-400" size={24} />
                                Sistem Ayarları
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            <Settings onClose={() => setShowSettings(false)} selectedMethod={selectedMethod} />
                        </div>
                    </div>
                </div>
            )}

            {/* Silme Onay Modalı */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                                <Trash2 className="text-red-400" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Dosyaları Temizle?
                            </h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Çıktı klasöründeki (IETT Veri Panel Çıktı) tüm raporlar kalıcı olarak silinecektir.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all font-bold border border-slate-700"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowDeleteConfirm(false);
                                        if (window.electronAPI && window.electronAPI.cleanOutputs) {
                                            await window.electronAPI.cleanOutputs({ silent: true });
                                            window.dispatchEvent(new CustomEvent('cleanup-done'));
                                            setCleanSuccess(true);
                                            setTimeout(() => setCleanSuccess(false), 2000);
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all font-bold shadow-lg shadow-red-900/40 border border-red-500/50"
                                >
                                    Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;
