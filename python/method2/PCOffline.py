import os
import pandas as pd
import json
from utils import (
    normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

def process_pc_offline(file1, file2, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log("Atayol ve Atayol/PC verileri karşılaştırılıyor...", 10)
        df_atayol = read_excel_smart(file1, log)
        df_pc = read_excel_smart(file2, log)

        if df_atayol.empty or df_pc.empty:
            log("Dosyalar okunamadı veya boş.", 0)
            return

        # Kolon Tespiti
        atayol_col = find_best_column(df_atayol.columns, ['PLAKA', 'KAPINO', 'KOD', 'ARAC'])
        pc_col = find_best_column(df_pc.columns, ['KAPI_NO', 'KAPINO', 'KOD', 'PLAKA'])

        if not atayol_col or not pc_col:
            log("Dosyalarda gerekli kolonlar bulunamadı.", 0)
            return

        # Kodları normalleştir ve G plakalıları çıkar
        atayol_set = {normalize_car_code(val) for val in df_atayol[atayol_col].dropna() if normalize_car_code(val)}
        atayol_set = {c for c in atayol_set if not c.startswith('G')}
        
        # Filtreleme: PC listesinde olup Atayol listesinde de olanlar (Eşleşenler)
        df_pc['Normalized'] = df_pc[pc_col].apply(normalize_car_code)
        
        # Sadece G olmayan ve Atayol listesinde olan araçlar
        df_matched = df_pc[
            (df_pc['Normalized'].isin(atayol_set)) & 
            (~df_pc['Normalized'].str.startswith('G', na=False))
        ].copy()

        if df_matched.empty:
            log("Ortak araç bulunamadı.", 100)
            return

        # Rapor Hazırlama
        # PC dosyasından ek kolonları bul (DURUM, TARIH, SAAT)
        status_col = find_best_column(df_pc.columns, ['DURUM', 'STATUS', 'AG DURUMU'])
        date_col = find_best_column(df_pc.columns, ['TARIH', 'DATE', 'GÜN'])
        time_col = find_best_column(df_pc.columns, ['SAAT', 'TIME', 'SÜRE'])

        df_report = pd.DataFrame()
        df_report['Plaka/Kapı No'] = df_matched[pc_col]
        df_report['PC Durumu'] = df_matched[status_col] if status_col else "Aktif"
        df_report['Tarih'] = df_matched[date_col] if date_col else ""
        df_report['Saat'] = df_matched[time_col] if time_col else ""
        
        df_report = df_report.sort_values(by=['Tarih', 'Saat', 'Plaka/Kapı No'], ascending=[False, False, True])

        output_path = generate_premium_excel(df_report, "PC/ATAYOL VERİ ANALİZİ (2.YÖNTEM)", "PC Veri Analiz (2.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
