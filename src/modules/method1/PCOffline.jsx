import React from 'react';

const PCOffline = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-2">PC Offline Veri Girişi</h3>
            <p className="text-center max-w-sm">
                Lütfen yukarıdan <b>Atayol Excel</b> dosyasını seçin.
                Sistem seçilen araçların IETT servisleri üzerinden canlı sefer bilgisini kontrol eder.
            </p>
        </div>
    );
};

export default PCOffline;
