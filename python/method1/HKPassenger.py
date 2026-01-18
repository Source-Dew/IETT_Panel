import pandas as pd
import os
import json
from utils import (
    normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

async def process_hk_passenger(file_path, threshold, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log(f"HIKVISION Yolcu Yükü verileri okunuyor...", 10)
        df_hik = read_excel_smart(file_path, log)
        
        if df_hik.empty:
            log("Excel dosyası boş veya okunamadı.", 0)
            return

        # Kolon Tespiti
        plaka_col = find_best_column(df_hik.columns, ['PLAKANUMARASI', 'PLAKA', 'NUMARASI'])
        status_col = find_best_column(df_hik.columns, ['AGDURUMU', 'AĞ DURUMU', 'DURUM', 'STATUS'])
        yolcu_col = find_best_column(df_hik.columns, ['YOLCUYÜKÜ', 'YOLCU', 'FAKTÖR'])
        adres_col = find_best_column(df_hik.columns, ['ADRES', 'KONUM', 'LOCATION'])

        if not all([plaka_col, status_col, yolcu_col]):
            log(f"Hata: Gerekli kolonlar bulunamadı.", 0)
            return

        # Filtreleme
        def parse_percent(val):
            try: return float(str(val).replace('%', '').replace(',', '.').strip())
            except: return -1.0

        df_hik['__yolcu'] = df_hik[yolcu_col].apply(parse_percent)
        mask = df_hik['__yolcu'] >= threshold
        
        filtered_df = df_hik[mask].copy()
        
        if filtered_df.empty:
            log(f"%{threshold} üzerinde yolcu yükü olan araç bulunamadı.", 100)
            return

        # 'G' plakalı araçları ELE ve Normalize et
        filtered_df['Normalized'] = filtered_df[plaka_col].apply(normalize_car_code)
        df_final = filtered_df[~filtered_df['Normalized'].str.startswith('G', na=False)].copy()
        
        if df_final.empty:
            log(f"%{threshold} üzerinde yolcu yükü olan uygun (G-olmayan) araç bulunamadı.", 100)
            return

        # Ağ Durumu Normalizasyon
        def normalize_status(val):
            s = str(val).lower()
            if 'dışı' in s or 'offline' in s or 'kapalı' in s or 'pasif' in s: return 'Çevrim dışı'
            return 'Çevrimiçi'

        df_final['__status_norm'] = df_final[status_col].apply(normalize_status)

        # Sıralama: Ağ Durumu (Çevrimiçi önce) -> Yolcu Yükü (Yüksek önce)
        df_final = df_final.sort_values(by=['__status_norm', '__yolcu'], ascending=[False, False])
        
        # Rapor Hazırlama ve Grupları Ayırma
        df_online = df_final[df_final['__status_norm'] == 'Çevrimiçi'].copy()
        df_offline = df_final[df_final['__status_norm'] == 'Çevrim dışı'].copy()

        def create_report_section(source_df):
            temp = pd.DataFrame()
            temp['Plaka Numarası'] = source_df[plaka_col]
            temp['Adres'] = source_df[adres_col] if adres_col else ""
            temp['Ağ Durumu'] = source_df['__status_norm']
            temp['Yolcu Yükü Faktörü'] = source_df[yolcu_col]
            return temp

        rep_online = create_report_section(df_online)
        rep_offline = create_report_section(df_offline)
        
        # Aralara 2 boş satır ekle
        empty_rows = pd.DataFrame([["", "", "", ""]] * 2, columns=rep_online.columns)
        
        df_report = pd.concat([rep_online, empty_rows, rep_offline], ignore_index=True)

        output_path = generate_premium_excel(df_report, "HIKVISION YOLCU YÜKÜ ANALİZİ", "HIKVISION Yolcu Yükü Veri (1.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
