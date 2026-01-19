import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Settings from './Settings';
import Method2View from './Method2View';
import { X, Settings as SettingsIcon, Trash2 } from 'lucide-react';

const MainLayout = () => {
    const [activeMode, setActiveMode] = useState('offline');
    const [selectedMethod] = useState(2);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [cleanSuccess, setCleanSuccess] = useState(false);

    const handleModeChange = (mode) => {
        setActiveMode(mode);
    };

    const renderContent = () => {
        return <Method2View activeMode={activeMode} onModeChange={handleModeChange} />;
    };

    return (
        <div
            className="flex h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden"
        >
            <Sidebar
                activeMode={activeMode}
                onModeChange={handleModeChange}
                onOpenSettings={() => setShowSettings(true)}
                onCleanOutputs={() => setShowDeleteConfirm(true)}
                cleanSuccess={cleanSuccess}
                selectedMethod={selectedMethod}
            />

            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="h-10 w-full drag-region absolute top-0 left-0 z-50" />
                {renderContent()}
            </div>


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
