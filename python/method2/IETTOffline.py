import os
import pandas as pd
import json
from utils import (
    normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

def process_iett_offline(file1, file2, threshold, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log("Atayol ve İETT Offline verileri karşılaştırılıyor...", 10)
        df_atayol = read_excel_smart(file1, log)
        df_iett = read_excel_smart(file2, log)

        if df_atayol.empty or df_iett.empty:
            log("Dosyalar okunamadı veya boş.", 0)
            return

        # Kolon Tespiti
        atayol_col = find_best_column(df_atayol.columns, ['PLAKA', 'KAPINO', 'KOD', 'ARAC'])
        iett_col = find_best_column(df_iett.columns, ['CIHAZ ISMI', 'PLAKA', 'KAPINO', 'ARAC'])
        time_col = find_best_column(df_iett.columns, ['ÇEVRIMDIŞI ZAMAN', 'OFFLINE TIME', 'ZAMAN', 'SAAT'])

        if not atayol_col or not iett_col or not time_col:
            log("Dosyalarda gerekli kolonlar bulunamadı.", 0)
            return

        # Kodları normalleştir ve G plakalıları çıkar
        atayol_set = {normalize_car_code(val) for val in df_atayol[atayol_col].dropna() if normalize_car_code(val)}
        atayol_set = {c for c in atayol_set if not c.startswith('G')}
        
        # Filtreleme: İETT listesinde olup Atayol listesinde de olanlar
        df_iett['Normalized'] = df_iett[iett_col].apply(normalize_car_code)
        
        # Sadece G olmayan ve Atayol listesinde olan araçlar
        df_matched = df_iett[
            (df_iett['Normalized'].isin(atayol_set)) & 
            (~df_iett['Normalized'].str.startswith('G', na=False))
        ].copy()

        # Süre filtresi
        df_matched['numeric_time'] = pd.to_numeric(df_matched[time_col], errors='coerce').fillna(0)
        df_final = df_matched[df_matched['numeric_time'] >= threshold].copy()

        if df_final.empty:
            log(f"{threshold} saat ve üzeri uygun (G-olmayan) offline araç bulunamadı.", 100)
            return

        # Rapor Hazırlama
        df_report = pd.DataFrame()
        df_report['Plaka/Atayol No'] = df_final[iett_col]
        df_report['Çevrimdışı Süre (Saat)'] = df_final[time_col]
        df_report['İETT Durumu'] = 'Seferi Var (Aktif)'
        
        df_report = df_report.sort_values(by=['numeric_time'], ascending=False)

        output_path = generate_premium_excel(df_report, "İETT ÇEVRİMDIŞI ANALİZ (2.YÖNTEM)", "İETT Çevrimdışı Analiz (2.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
