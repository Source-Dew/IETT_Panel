import React from 'react';

const IETTOffline = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-2">İETT Portal Girişi</h3>
            <p className="text-center max-w-sm">
                Lütfen yukarıdan <b>İETT Portal Excel</b> dosyasını seçin.
                Sistem portalda çevrimdışı görünen araçları canlı IETT veri akışıyla karşılaştırarak raporlar.
            </p>
        </div>
    );
};

export default IETTOffline;
