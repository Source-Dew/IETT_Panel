import os
import asyncio
import pandas as pd
import json
from utils import (
    IETTBypasser, normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

async def process_hk_offline(file_path, threshold, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log(f"HIKVISION Offline verileri okunuyor...", 5)
        df_hik = read_excel_smart(file_path, log)
        
        if df_hik.empty:
            log("Excel dosyası boş veya okunamadı.", 0)
            return

        # Kolon Tespiti
        plaka_col = find_best_column(df_hik.columns, ['PLAKANUMARASI', 'PLAKA', 'NUMARASI'])
        status_col = find_best_column(df_hik.columns, ['AGDURUMU', 'AĞ DURUMU', 'DURUM', 'STATUS'])
        duration_col = find_best_column(df_hik.columns, ['CEVRIMDISI', 'SURE', 'DURATION', 'OFFLINE'])
        adres_col = find_best_column(df_hik.columns, ['ADRES', 'KONUM', 'LOCATION'])

        if not all([plaka_col, status_col, duration_col]):
            log(f"Gerekli kolonlar bulunamadı. Mevcutlar: {list(df_hik.columns)}", 0)
            return

        # Filtreleme
        def parse_min(val):
            try: return float(str(val).replace(',', '.').strip())
            except: return 0.0

        df_hik['__min'] = df_hik[duration_col].apply(parse_min)
        mask = (df_hik[status_col].astype(str).str.contains('Çevrim dışı|Offline', na=False, case=False)) & \
               (df_hik['__min'] >= threshold)
        df_offline = df_hik[mask].copy()
        
        if df_offline.empty:
            log(f"{threshold} dakikadan uzun çevrimdışı araç bulunamadı.", 100)
            return

        vehicle_list = sorted(list(set([normalize_car_code(x) for x in df_offline[plaka_col].dropna() if normalize_car_code(x)])))
        
        # 'G' plakalı araçları ELE (Kullanıcı talebi)
        vehicle_list = [c for c in vehicle_list if not c.startswith('G')]
        
        if not vehicle_list:
            log("Taranacak uygun araç (G-olmayan) bulunamadı.", 100)
            return

        # IETT Sorgu
        fetcher = IETTBypasser(log)
        results = await fetcher.safe_fetch_all(vehicle_list, 20, 90)

        active_doors = {normalize_car_code(t.get("busDoorNumber") or t.get("vehicleDoorCode") or t.get("kapiKodu")) for t in results if t}
        df_offline['Normalized'] = df_offline[plaka_col].apply(normalize_car_code)
        
        # Sadece G olmayanlar için sefer durumu (G'liler raporda görünmeyeceği için bu kısım performansı etkilemez)
        df_offline['İETT Sefer Durumu'] = df_offline['Normalized'].apply(lambda x: 'Sefer VAR' if x in active_doors else 'Sefer YOK')
        
        # Sadece SEFER VAR olanları filtrele (Eski Düzenleme Geri Geldi)
        df_final = df_offline[df_offline['İETT Sefer Durumu'] == 'Sefer VAR'].copy()
        
        if df_final.empty:
            log("Filtre sonrası (Sefer VAR) raporlanacak araç kalmadı.", 100)
            return

        # Rapor Hazırlama
        df_report = pd.DataFrame()
        df_report['Plaka Numarası'] = df_final[plaka_col]
        df_report['Adres'] = df_final[adres_col] if adres_col else ""
        df_report['HIK Durumu'] = df_final[status_col]
        df_report['Süre (DK)'] = df_final['__min']
        df_report['İETT Sefer Durumu'] = df_final['İETT Sefer Durumu']
        
        df_report = df_report.sort_values(by=['İETT Sefer Durumu', 'Süre (DK)'], ascending=[False, False])

        output_path = generate_premium_excel(df_report, "HIKVISION OFFLINE ANALİZ", "HIKVISION Offline Veri (1.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)

