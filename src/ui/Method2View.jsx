import React, { useState } from 'react';
import { WifiOff, HardDrive, Users, FileSpreadsheet } from 'lucide-react';

// Method 2 specific modules
import HKOffline from '../modules/method2/HKOffline';
import HKHDD from '../modules/method2/HKHDD';
import HKFirebox from '../modules/method2/HKFirebox';
import HKPassenger from '../modules/method2/HKPassenger';
import PCOffline from '../modules/method2/PCOffline';
import OHOOffline from '../modules/method2/OHOOffline';
import IETTOffline from '../modules/method2/IETTOffline';
import OHOTrigger from '../modules/method2/OHOTrigger';


const Method2View = ({ activeMode, onModeChange }) => {

    // Alt modüllerin kendine has 'status' veya 'logs' bilgisi olabilir. 
    // Ancak Method2View sadece hangisini render edeceğine karar verir.
    // Eğer ortak bir durum yönetimi gerekiyorsa (örneğin sidebar'da loading göstermek için)
    // o zaman state burada tutulabilir. Şimdilik her modül kendi mantığını yönetiyor.

    const renderModule = () => {
        switch (activeMode) {
            case 'offline': return <HKOffline />;
            case 'hdd': return <HKHDD />;
            case 'firebox': return <HKFirebox />;
            case 'yolcu': return <HKPassenger />;
            case 'pc_offline': return <PCOffline />;
            case 'oho_offline': return <OHOOffline />;
            case 'oho_trigger': return <OHOTrigger />;
            case 'iett_offline': return <IETTOffline />;
            default: return <div className="text-slate-400">Mod seçilmedi veya geliştirme aşamasında.</div>;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden p-8 pt-12">

            {/* 
               Sidebar ve Header (MainLayout içinde) zaten var.
               Burada sadece seçili modülün içeriği gösterilir.
            */}

            <div className="flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderModule()}
            </div>

        </div>
    );
};

export default Method2View;

