import React from 'react';

const HKFirebox = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-2">Hikvision Firebox Veri Girişi</h3>
            <p className="text-center max-w-sm">
                Lütfen yukarıdan <b>Hikvision Excel</b> dosyasını seçin.
                Sistem <b>Firebox Durumu: Normal Olmayan</b> araçları çekip IETT üzerinden canlı sefer kontrolü yapar.
            </p>
        </div>
    );
};

export default HKFirebox;
