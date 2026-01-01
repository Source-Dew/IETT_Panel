import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, AlertCircle } from 'lucide-react';

const Settings = ({ onClose, selectedMethod }) => {
    const [hkOfflineThreshold, setHkOfflineThreshold] = useState(360);
    const [iettOfflineThresholdHours, setIettOfflineThresholdHours] = useState(10);
    const [ohoOfflineThresholdHours, setOhoOfflineThresholdHours] = useState(10);
    const [passengerThreshold, setPassengerThreshold] = useState(10);
    const [loading, setLoading] = useState(true);
    const [showSavedMsg, setShowSavedMsg] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            if (window.electronAPI && window.electronAPI.getSettings) {
                try {
                    const settings = await window.electronAPI.getSettings();
                    if (settings.HK_OFFLINE_THRESHOLD) setHkOfflineThreshold(settings.HK_OFFLINE_THRESHOLD);
                    if (settings.IETT_OFFLINE_THRESHOLD) setIettOfflineThresholdHours(settings.IETT_OFFLINE_THRESHOLD);
                    if (settings.OHO_OFFLINE_THRESHOLD) setOhoOfflineThresholdHours(settings.OHO_OFFLINE_THRESHOLD);
                    if (settings.PASSENGER_THRESHOLD) setPassengerThreshold(settings.PASSENGER_THRESHOLD);
                } catch (err) {
                    console.error("Settings load error:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (window.electronAPI && window.electronAPI.saveSettings) {
            try {
                await window.electronAPI.saveSettings({
                    HK_OFFLINE_THRESHOLD: parseInt(hkOfflineThreshold),
                    IETT_OFFLINE_THRESHOLD: parseFloat(iettOfflineThresholdHours),
                    OHO_OFFLINE_THRESHOLD: parseFloat(ohoOfflineThresholdHours),
                    PASSENGER_THRESHOLD: parseFloat(passengerThreshold)
                });
                setShowSavedMsg(true);
                window.dispatchEvent(new CustomEvent('settings-updated'));
                setTimeout(() => {
                    setShowSavedMsg(false);
                    if (onClose) onClose();
                }, 1500);
            } catch (err) {
                console.error("Settings save error:", err);
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <AlertCircle className="text-blue-400 shrink-0" size={24} />
                <p className="text-sm text-blue-200/80 leading-relaxed">
                    Buradaki ayarlar, raporlama motorunun çalışma parametrelerini belirler.
                    <span className="font-bold text-blue-400 ml-1">
                        {selectedMethod === 1 ? "1. Yöntem" : "2. Yöntem"}
                    </span> parametreleri aktiftir.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HK Offline */}
                <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-400 ml-1 group-focus-within:text-blue-400 transition-colors">
                        HK Offline Eşiği (Dakika)
                    </label>
                    <input
                        type="number"
                        value={hkOfflineThreshold}
                        onChange={(e) => setHkOfflineThreshold(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>

                {/* IETT Offline */}
                <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-400 ml-1 group-focus-within:text-blue-400 transition-colors">
                        İETT Offline Eşiği (Saat)
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        value={iettOfflineThresholdHours}
                        onChange={(e) => setIettOfflineThresholdHours(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>

                {/* OHO Offline */}
                <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-400 ml-1 group-focus-within:text-blue-400 transition-colors">
                        ÖHO Offline Eşiği (Saat)
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        value={ohoOfflineThresholdHours}
                        onChange={(e) => setOhoOfflineThresholdHours(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>

                {/* Passenger Threshold */}
                <div className="space-y-2 group">
                    <label className="text-sm font-bold text-slate-400 ml-1 group-focus-within:text-blue-400 transition-colors">
                        Yolcu Yükü Faktörü Eşiği (%)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={passengerThreshold}
                        onChange={(e) => setPassengerThreshold(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={showSavedMsg}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${showSavedMsg
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30'
                    }`}
            >
                {showSavedMsg ? (
                    <>Başarıyla Kaydedildi!</>
                ) : (
                    <>
                        <Save size={20} />
                        Ayarları Kaydet
                    </>
                )}
            </button>
        </div>
    );
};

export default Settings;
