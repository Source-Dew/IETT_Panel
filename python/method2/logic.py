import json
import time
import os
import sys

# Import the modular processors
from .HKOffline import process_hk_offline
from .HKHDD import process_hk_hdd
from .HKFirebox import process_hk_firebox
from .HKPassenger import process_hk_passenger
from .PCOffline import process_pc_offline
from .OHOOffline import process_oho_offline
from .IETTOffline import process_iett_offline
from .OHOTrigger import process_oho_trigger


def run(args):
    mode = args.get('mode', 'unknown')
    file1 = args.get('file1') # Usually Atayol or Reference
    file2 = args.get('file2') # Usually Target (Hikvision, IETT, OHO etc.)
    
    def log(message, progress=None):
        data = {"type": "log", "data": {"message": message}}
        print(json.dumps(data), flush=True)
        if progress is not None:
             print(json.dumps({"type": "progress", "data": {"percentage": progress}}), flush=True)

    # Threshold parsing (usually for passenger load or offline duration)
    try:
        default_val = 10.0 if mode in ['yolcu', 'oho_offline', 'iett_offline'] else 10.0
        threshold = float(args.get('threshold', default_val))
    except:
        threshold = 10.0

    log(f"2. YÖNTEM Analizi Başlatıldı: {mode.upper()}")
    
    # Dispatch Logic
    if mode == 'offline': # HIKVISION Offline
        if not file1 or not file2:
            print(json.dumps({"type": "error", "data": {"message": "Atayol ve HIKVISION dosyaları seçilmelidir."}}), flush=True)
            return
        process_hk_offline(file1, file2, threshold, log)

    elif mode == 'hdd': # HIKVISION HDD Errors
        target_file = args.get('file') or file2 or file1
        process_hk_hdd(target_file, log)

    elif mode == 'firebox': # HIKVISION Firebox Errors
        target_file = args.get('file') or file2 or file1
        process_hk_firebox(target_file, log)

    elif mode == 'yolcu': # HIKVISION Passenger Load
        target_file = args.get('file') or file2 or file1
        process_hk_passenger(target_file, threshold, log)

    elif mode == 'pc_offline': # Atayol vs PC/Atayol Veri List
        process_pc_offline(file1, file2, log)

    elif mode == 'oho_offline': # Atayol vs OHO Veri List
        process_oho_offline(file1, file2, threshold, log)

    elif mode == 'oho_trigger': # OHO Trigger Analysis
        target_files = args.get('file') or ([file2] if file2 else []) or ([file1] if file1 else [])
        if isinstance(target_files, str): target_files = [target_files]
        cars2_list = args.get('cars2', '')
        cars3_list = args.get('cars3', '')
        detailed_cars = args.get('detailed_cars', '')
        is_detailed = args.get('is_detailed', False)
        process_oho_trigger(target_files, cars2_list, cars3_list, log, detailed_cars, is_detailed)

    elif mode == 'iett_offline': # Atayol vs IETT Veri List
        process_iett_offline(file1, file2, threshold, log)

    else:
        log(f"Hata: Geçersiz mod '{mode}'", 100)
        print(json.dumps({"type": "finish", "data": {"success": False, "message": f"Mod yok: {mode}"}}), flush=True)

if __name__ == "__main__":
    # Test stub
    if len(sys.argv) > 1:
        import ast
        run(ast.literal_eval(sys.argv[1]))
