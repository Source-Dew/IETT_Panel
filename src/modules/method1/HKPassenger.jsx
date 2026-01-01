import React from 'react';

const HKPassenger = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/20">
            <h3 className="text-xl font-bold text-white mb-2">Hikvision Yolcu Yükü Girişi</h3>
            <p className="text-center max-w-sm">
                Lütfen yukarıdan <b>Hikvision Excel</b> dosyasını seçin.
                Sistem <b>Yolcu Yükü Faktörü</b> eşik üzeri olan araçları listeler ve sefer durumlarını sorgular.
            </p>
        </div>
    );
};

export default HKPassenger;
