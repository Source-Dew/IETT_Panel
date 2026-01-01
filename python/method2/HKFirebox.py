import os
import pandas as pd
import json
from utils import (
    generate_premium_excel, read_excel_smart, find_best_column, normalize_car_code
)

def process_hk_firebox(file_path, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log("HIKVISION Firebox verileri okunuyor...", 10)
        df_hik = read_excel_smart(file_path, log)
        
        if df_hik.empty:
            log("Excel dosyası boş veya okunamadı.", 0)
            return

        # Kolon Tespiti
        plaka_col = find_best_column(df_hik.columns, ['PLAKANUMARASI', 'PLAKA', 'NUMARASI'])
        status_col = find_best_column(df_hik.columns, ['AGDURUMU', 'AĞ DURUMU', 'DURUM', 'STATUS'])
        firebox_col = find_best_column(df_hik.columns, ['YANGINSÖNDÜRÜCÜ', 'FIREBOX', 'YANGIN'])
        adres_col = find_best_column(df_hik.columns, ['ADRES', 'KONUM', 'LOCATION'])

        if not all([plaka_col, status_col, firebox_col]):
            log("Gerekli kolonlar bulunamadı.", 0)
            return

        # Filtreleme
        df_hik[firebox_col] = df_hik[firebox_col].astype(str).fillna('')
        mask = (df_hik[firebox_col].str.strip() != 'Normal') & (df_hik[firebox_col].str.strip() != '')
        
        filtered_df = df_hik[mask].copy()
        
        if filtered_df.empty:
            log("Firebox sorunu olan araç bulunamadı.", 100)
            return

        # 'G' plakalıları çıkar
        filtered_df['Normalized'] = filtered_df[plaka_col].apply(normalize_car_code)
        df_final = filtered_df[~filtered_df['Normalized'].str.startswith('G', na=False)].copy()

        if df_final.empty:
            log("Firebox sorunu olan uygun (G-olmayan) araç bulunamadı.", 100)
            return

        # Rapor Hazırlama
        df_report = pd.DataFrame()
        df_report['Plaka Numarası'] = df_final[plaka_col]
        df_report['Adres'] = df_final[adres_col] if adres_col else ""
        df_report['Firebox Durumu'] = df_final[firebox_col]
        df_report['İETT Sefer Durumu'] = 'Bilinmiyor (Çevrimiçi)'
        
        df_report = df_report.sort_values(by=['Firebox Durumu', 'Plaka Numarası'])

        output_path = generate_premium_excel(df_report, "HIKVISION FIREBOX HATA ANALİZİ", "HIKVISION Firebox Veri (2.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
