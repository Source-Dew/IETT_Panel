import React from 'react';
import { Activity, WifiOff, HardDrive, Users, Settings as SettingsIcon, Trash2 } from 'lucide-react';

const Sidebar = ({ activeMode, onModeChange, disabled, onOpenSettings, onCleanOutputs, cleanSuccess, selectedMethod, onMethodSelect }) => {
    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 drag-region pt-6 relative">
            <div className="p-6 pb-0 pt-0 no-drag text-center">
                <div className="flex justify-center items-center gap-4 mb-6">
                    <img src="ibb_logo.png" alt="İBB" className="h-24 w-auto object-contain" />
                    <div className="h-16 w-px bg-slate-700"></div>
                    <img src="iett_logo.png" alt="İETT" className="h-20 w-auto object-contain" />
                </div>
                <h1 className="text-xl font-bold text-white mb-4">IETT Veri Panel</h1>
            </div>

            {/* Yöntem Seçici - Üst Kısım */}
            <div className="px-6 mb-4 no-drag">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
                    <button
                        onClick={() => onMethodSelect(1)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${selectedMethod === 1
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        1. YÖNTEM
                    </button>
                    <button
                        onClick={() => onMethodSelect(2)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${selectedMethod === 2
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        2. YÖNTEM
                    </button>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-drag [&::-webkit-scrollbar]:hidden">
                {/* HIKVISION */}
                <div className="flex items-center gap-3 mb-2 mt-2 opacity-90">
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">HIKVISION</span>
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                </div>

                {[
                    { id: 'offline', title: 'HK Offline Saat Veri', icon: WifiOff, color: 'text-slate-400' },
                    { id: 'hdd', title: 'HK HDD Veri', icon: HardDrive, color: 'text-purple-400' },
                    { id: 'firebox', title: 'HK Firebox Veri', icon: HardDrive, color: 'text-red-400' },
                    { id: 'yolcu', title: 'HK Yolcu Yükü Faktörü', icon: Users, color: 'text-green-400' }
                ].map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={disabled}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${activeMode === mode.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <mode.icon size={20} className={activeMode === mode.id ? 'text-white' : mode.color} />
                        <span className="font-medium text-sm">{mode.title}</span>
                    </button>
                ))}

                {/* PC OFFLINE */}
                <div className="flex items-center gap-3 mb-2 mt-6 opacity-90">
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">PC OFFLINE</span>
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                </div>
                <button
                    onClick={() => onModeChange('pc_offline')}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${activeMode === 'pc_offline'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <WifiOff size={20} className={activeMode === 'pc_offline' ? 'text-white' : 'text-indigo-400'} />
                    <span className="font-medium text-sm">PC Offline Veri</span>
                </button>

                {/* OHO */}
                <div className="flex items-center gap-3 mb-2 mt-6 opacity-90">
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">OHO</span>
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                </div>
                <button
                    onClick={() => onModeChange('oho_offline')}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${activeMode === 'oho_offline'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <WifiOff size={20} className={activeMode === 'oho_offline' ? 'text-white' : 'text-red-400'} />
                    <span className="font-medium text-sm">ÖHO Çevrimdışı Veri</span>
                </button>

                <button
                    onClick={() => onModeChange('oho_trigger')}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${activeMode === 'oho_trigger'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Activity size={20} className={activeMode === 'oho_trigger' ? 'text-white' : 'text-blue-400'} />
                    <span className="font-medium text-sm">ÖHO Tetik Veri</span>
                </button>

                {/* IETT */}
                <div className="flex items-center gap-3 mb-2 mt-6 opacity-90">
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">IETT</span>
                    <div className="h-1 bg-white flex-1 rounded-full"></div>
                </div>
                <button
                    onClick={() => onModeChange('iett_offline')}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group ${activeMode === 'iett_offline'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <WifiOff size={20} className={activeMode === 'iett_offline' ? 'text-white' : 'text-yellow-400'} />
                    <span className="font-medium text-sm">İETT Çevrimdışı Veri</span>
                </button>
            </nav>

            {/* Alt İkonlar */}
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-800/50 flex items-center justify-between no-drag">
                <button
                    onClick={onOpenSettings}
                    disabled={!selectedMethod}
                    className={`p-2.5 rounded-xl transition-all flex-1 flex justify-center border border-transparent ${!selectedMethod
                        ? 'text-slate-700 cursor-not-allowed opacity-50'
                        : 'text-slate-500 hover:text-white hover:bg-slate-800/80'
                        }`}
                    title={!selectedMethod ? "Lütfen önce bir yöntem seçin" : "Ayarlar"}
                >
                    <SettingsIcon size={18} />
                </button>
                <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
                <button
                    onClick={onCleanOutputs}
                    className={`p-2.5 rounded-xl transition-all flex-1 flex justify-center border border-transparent ${cleanSuccess
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/80'
                        }`}
                    title="Çıktı Klasörünü Temizle"
                >
                    {cleanSuccess ? <Activity size={18} /> : <Trash2 size={18} />}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
