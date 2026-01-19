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
                    <Activity size={20} className={activeMode === 'oho_trigger' ? 'text-white' : 'text-orange-400'} />
                    <span className="font-medium text-sm">ÖHO Tetik Veri</span>
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
                    className="p-2.5 rounded-xl transition-all flex-1 flex justify-center border border-transparent text-slate-500 hover:text-white hover:bg-slate-800/80"
                    title="Ayarlar"
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
