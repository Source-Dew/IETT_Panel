import React from 'react';
import { Play, Square, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

const Header = ({ modeInfo, status, onStart, onStop, onSelectFile, selectedFile, reportPath, onOpenFile, isSelectingFile }) => {
    return (
        <div className={`flex justify-between items-center p-6 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${modeInfo.bg} ${modeInfo.border}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-950/50 border border-slate-800 ${modeInfo.color}`}>
                    <modeInfo.icon size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{modeInfo.title}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">{modeInfo.desc}</p>
                </div>
            </div>

            <div className="flex gap-3 items-center">
                {reportPath && (
                    <button
                        onClick={() => onOpenFile(reportPath)}
                        className="flex items-center justify-center gap-2 px-4 h-11 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-all font-medium whitespace-nowrap"
                    >
                        <FileText size={18} />
                        <span>Raporu Aç</span>
                    </button>
                )}

                <button
                    onClick={onSelectFile}
                    disabled={isSelectingFile || status === 'running'}
                    className={`flex items-center justify-center gap-2 px-4 h-10 rounded-xl border transition-all duration-300 font-semibold text-sm no-drag 
                        ${isSelectingFile || status === 'running' ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'} 
                        ${selectedFile
                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-[1.02]'
                            : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'}`}
                >
                    {isSelectingFile ? null : (selectedFile ? <CheckCircle2 size={16} /> : <FileSpreadsheet size={16} />)}
                    <span>{isSelectingFile ? 'Seçiliyor...' : selectedFile ? 'Dosya Seçildi' : 'Dosya Seç'}</span>
                </button>

                {status === 'running' ? (
                    <button
                        onClick={onStop}
                        className="flex items-center justify-center gap-2 px-5 h-10 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-red-500/50 text-sm group"
                    >
                        <Square size={16} fill="currentColor" className="group-hover:animate-pulse" />
                        <span>DURDUR</span>
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        className="flex items-center justify-center gap-2 px-6 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all font-bold whitespace-nowrap active:scale-95 border border-blue-500/50 text-sm group"
                    >
                        <Play size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />
                        <span>BAŞLAT</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
