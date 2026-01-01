import os
import pandas as pd
import json
from utils import (
    normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

def process_hk_offline(file1, file2, threshold, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log("Atayol ve HIKVISION verileri karşılaştırılıyor...", 10)
        df_atayol = read_excel_smart(file1, log)
        df_hik = read_excel_smart(file2, log)

        if df_atayol.empty or df_hik.empty:
            log("Dosyalar okunamadı veya boş.", 0)
            return

        # Atayol Kapı No Tespiti
        atayol_col = find_best_column(df_atayol.columns, ['PLAKA', 'KAPINO', 'KOD', 'ARAC'])
        if not atayol_col:
            log("Atayol dosyasında araç kodu kolonu bulunamadı.", 0)
            return
            
        atayol_set = {normalize_car_code(val) for val in df_atayol[atayol_col].dropna() if normalize_car_code(val)}
        # 'G' plakalıları çıkar
        atayol_set = {c for c in atayol_set if not c.startswith('G')}
        log(f"Atayol'da {len(atayol_set)} araç doğrulandı (G-plakalılar hariç).", 30)

        # Hikvision Kolon Tespiti
        plaka_col = find_best_column(df_hik.columns, ['PLAKANUMARASI', 'PLAKA', 'NUMARASI'])
        status_col = find_best_column(df_hik.columns, ['AGDURUMU', 'AĞ DURUMU', 'DURUM', 'STATUS'])
        duration_col = find_best_column(df_hik.columns, ['CEVRIMDISI', 'SURE', 'DURATION', 'OFFLINE'])
        adres_col = find_best_column(df_hik.columns, ['ADRES', 'KONUM', 'LOCATION'])

        if not all([plaka_col, status_col, duration_col]):
            log("Hikvision dosyasında gerekli kolonlar bulunamadı.", 0)
            return

        # Filtreleme
        def parse_min(val):
            try: return float(str(val).replace(',', '.').strip())
            except: return 0.0

        df_hik['__min'] = df_hik[duration_col].apply(parse_min)
        mask = (df_hik[status_col].astype(str).str.contains('Çevrim dışı|Offline', na=False, case=False)) & \
               (df_hik['__min'] >= threshold)
        
        df_offline = df_hik[mask].copy()
        df_offline['Normalized'] = df_offline[plaka_col].apply(normalize_car_code)
        
        # Atayol Kıyaslaması (Sadece Atayol listesinde olanları al ve G olanları ele)
        df_result = df_offline[
            (df_offline['Normalized'].isin(atayol_set)) &
            (~df_offline['Normalized'].str.startswith('G', na=False))
        ].copy()
        
        if df_result.empty:
            log(f"Atayol listesinde olup çevrimdışı olan araç bulunamadı.", 100)
            return

        # Rapor Hazırlama
        df_report = pd.DataFrame()
        df_report['Plaka Numarası'] = df_result[plaka_col]
        df_report['Adres'] = df_result[adres_col] if adres_col else ""
        df_report['HIK Durumu'] = df_result[status_col]
        df_report['Süre (DK)'] = df_result['__min']
        df_report['İETT Sefer Durumu'] = 'Sefer VAR' # Method 2 varsayımı: Atayol'da varsa seferde kabul edilir
        
        df_report = df_report.sort_values(by='Süre (DK)', ascending=False)

        output_path = generate_premium_excel(df_report, "HIKVISION OFFLINE ANALİZ (2.YÖNTEM)", "HIKVISION Offline Veri (2.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
