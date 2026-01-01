import json
import time
import sys
import asyncio
from .HKOffline import process_hk_offline

def run(args):
    mode = args.get('mode', 'unknown')
    # Method 1 might send file via --file or --file1
    file1 = args.get('file') or args.get('file1')
    threshold = int(args.get('threshold', 360))
    
    def log_func(message, progress=None):
        if progress is not None:
            print(json.dumps({"type": "progress", "data": {"percentage": progress}}), flush=True)
        print(json.dumps({"type": "log", "data": {"timestamp": time.strftime("%H:%M:%S"), "level": "info", "message": message}}), flush=True)

    if mode == 'offline':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .HKOffline import process_hk_offline
        asyncio.run(process_hk_offline(file1, threshold, log_func))
    elif mode == 'hdd':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .HKHDD import process_hk_hdd
        asyncio.run(process_hk_hdd(file1, log_func))
    elif mode == 'firebox':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .HKFirebox import process_hk_firebox
        asyncio.run(process_hk_firebox(file1, log_func))
    elif mode == 'yolcu':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .HKPassenger import process_hk_passenger
        asyncio.run(process_hk_passenger(file1, threshold, log_func))
    elif mode == 'pc_offline':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .PCOffline import process_pc_offline
        asyncio.run(process_pc_offline(file1, log_func))
    elif mode == 'oho_offline':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .PortalOffline import process_portal_offline
        asyncio.run(process_portal_offline(file1, threshold, "ÖHO", log_func))
    elif mode == 'iett_offline':
        if not file1:
            log_func("Hata: Dosya seçilmedi.", 0)
            return
        from .PortalOffline import process_portal_offline
        asyncio.run(process_portal_offline(file1, threshold, "İETT", log_func))
    else:
        log_func(f"1. YÖNTEM: Mod '{mode}' henüz aktif değil veya geliştirme aşamasında.", 100)

if __name__ == "__main__":
    run({"mode": "test"})
