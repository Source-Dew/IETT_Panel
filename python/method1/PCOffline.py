import os
import asyncio
import pandas as pd
import json
from utils import (
    IETTBypasser, normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

async def process_pc_offline(file_path, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log(f"PC/Atayol verileri okunuyor...", 5)
        df_pc = read_excel_smart(file_path, log)
        
        if df_pc.empty:
            log("Excel dosyası boş veya okunamadı.", 0)
            return

        # Kolon Tespiti
        plaka_col = find_best_column(df_pc.columns, ['PLAKANUMARASI', 'PLAKA', 'KAPINO', 'KAPI NO'])
        status_col = find_best_column(df_pc.columns, ['DURUM', 'STATUS', 'AG DURUMU'])

        if not plaka_col:
            log(f"Hata: Plaka/Kapı no kolonu bulunamadı.", 0)
            return

        # Filtreleme (Sadece Offline olanlar)
        if status_col:
            mask = df_pc[status_col].astype(str).str.contains('Çevrim dışı|Offline|KAPALI', na=False, case=False)
            df_offline = df_pc[mask].copy()
        else:
            df_offline = df_pc.copy()
            
        if df_offline.empty:
            log("Offline araç bulunamadı.", 100)
            return

        vehicle_list = sorted(list(set([normalize_car_code(x) for x in df_offline[plaka_col].dropna() if normalize_car_code(x)])))
        
        # 'G' ile başlayan araçları çıkar (Kullanıcı talebi: Gereksiz tarama/zaman kaybı önleme)
        vehicle_list = [c for c in vehicle_list if not c.startswith('G')]
        
        if not vehicle_list:
            log("Taranacak uygun araç (G-olmayan) bulunamadı.", 100)
            return

        log(f"{len(vehicle_list)} araç için canlı veri çekiliyor (G-plakalılar elendi)...", 20)
        
        # IETT Sorgu
        fetcher = IETTBypasser(log)
        results = await fetcher.safe_fetch_all(vehicle_list, 20, 90)

        active_doors = {normalize_car_code(t.get("busDoorNumber") or t.get("vehicleDoorCode") or t.get("kapiKodu")) for t in results if t}
        df_offline['Normalized'] = df_offline[plaka_col].apply(normalize_car_code)
        
        # Sadece G olmayan araçlar için İETT Sefer Durumu belirle
        df_offline['İETT Sefer Durumu'] = df_offline['Normalized'].apply(
            lambda x: 'Sefer VAR' if x in active_doors else ('Sefer YOK' if not x.startswith('G') else 'G Plaka (İETT Sorgulanmadı)')
        )
        
        # Rapor Hazırlama (G plakalıları rapordan TAMAMEN çıkar)
        df_final = df_offline[~df_offline['Normalized'].str.startswith('G', na=False)].copy()
        
        df_report = pd.DataFrame()
        df_report['Plaka/Kapı No'] = df_final[plaka_col]
        df_report['PC Durumu'] = df_final[status_col] if status_col else "Offline"
        df_report['İETT Sefer Durumu'] = df_final['İETT Sefer Durumu']
        
        df_report = df_report.sort_values(by=['İETT Sefer Durumu', 'Plaka/Kapı No'], ascending=[False, True])

        output_path = generate_premium_excel(df_report, "PC OFFLINE ANALİZ (1.YÖNTEM)", "PC Offline Veri (1.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
