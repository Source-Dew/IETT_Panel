import React from 'react';

const HKOffline = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-2">Hikvision Veri Girişi</h3>
            <p className="text-center max-w-sm">
                Lütfen yukarıdan <b>Hikvision Offline Excel</b> dosyasını seçin ve işlemi başlatın.
                Bu yöntem araçları doğrudan IETT canlı veri akışıyla karşılaştırır.
            </p>
        </div>
    );
};

export default HKOffline;
