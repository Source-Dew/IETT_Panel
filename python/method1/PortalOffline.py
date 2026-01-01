import os
import asyncio
import pandas as pd
import json
from utils import (
    IETTBypasser, normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column
)

async def process_portal_offline(file_path, threshold, mode_type, log_func):
    def log(msg, p=None): log_func(msg, p)

    try:
        log(f"Portal ({mode_type}) Offline verileri okunuyor...", 5)
        df_portal = read_excel_smart(file_path, log)
        
        if df_portal.empty:
            log("Excel dosyası boş veya okunamadı.", 0)
            return

        # Kolon Tespiti
        plaka_col = find_best_column(df_portal.columns, ['PLAKA', 'KAPINO', 'KAPI NO', 'ARAC'])
        status_col = find_best_column(df_portal.columns, ['DURUM', 'STATUS', 'AĞ'])
        last_seen_col = find_best_column(df_portal.columns, ['SON GÖRÜLME', 'LAST SEEN', 'TARIH'])

        if not plaka_col:
            log(f"Hata: Plaka/Kapı no kolonu bulunamadı.", 0)
            return

        # Filtreleme (Sadece Offline olanlar)
        if status_col:
            mask = df_portal[status_col].astype(str).str.contains('Çevrim dışı|Offline|KAPALI|PASIF', na=False, case=False)
            df_offline = df_portal[mask].copy()
        else:
            df_offline = df_portal.copy()
            
        if df_offline.empty:
            log("Portal üzerinde offline araç bulunamadı.", 100)
            return

        # Kodları normalleştir ve G plakalıları çıkar
        vehicle_list = sorted(list(set([normalize_car_code(x) for x in df_offline[plaka_col].dropna() if normalize_car_code(x)])))
        vehicle_list = [c for c in vehicle_list if not c.startswith('G')]
        
        if not vehicle_list:
            log(f"{mode_type} Offline taranacak uygun (G-olmayan) araç bulunamadı.", 100)
            return

        log(f"{len(vehicle_list)} {mode_type} araç için canlı veri çekiliyor (G-plakalılar elendi)...", 20)
        
        # IETT Sorgu
        fetcher = IETTBypasser(log)
        results = await fetcher.safe_fetch_all(vehicle_list, 20, 90)

        active_doors = {normalize_car_code(t.get("busDoorNumber") or t.get("vehicleDoorCode") or t.get("kapiKodu")) for t in results if t}
        df_offline['Normalized'] = df_offline[plaka_col].apply(normalize_car_code)
        df_offline['İETT Sefer Durumu'] = df_offline['Normalized'].apply(lambda x: 'Sefer VAR' if x in active_doors else 'Sefer YOK')
        
        # Sadece SEFER VAR olanları filtrele
        df_final = df_offline[df_offline['İETT Sefer Durumu'] == 'Sefer VAR'].copy()
        
        # 'G' plakalı araçları ELE
        df_final = df_final[~df_final['Normalized'].str.startswith('G', na=False)].copy()

        if df_final.empty:
            log("Filtre sonrası (Sefer VAR ve G-olmayan) raporlanacak araç kalmadı.", 100)
            return

        # Rapor Hazırlama (Görseldeki Formata Tam Uyum)
        df_report = pd.DataFrame()
        df_report['Cihaz İsmi'] = df_final[plaka_col]
        # Süre tespiti (Eğer varsa ham veriyi kullan, yoksa eşiği yaz)
        time_col = find_best_column(df_final.columns, ['ÇEVRİMDİŞİ', 'ZAMAN', 'SÜRE', 'DURATION'])
        if time_col:
            df_report['Çevrimdışı Zaman(saat)'] = df_final[time_col]
        else:
            df_report['Çevrimdışı Zaman(saat)'] = threshold
            
        df_report['Durum'] = 'Çevrimdışı'
        df_report['İETT Sefer Durumu'] = df_final['İETT Sefer Durumu']
        
        df_report = df_report.sort_values(by=['İETT Sefer Durumu', 'Plaka/Kapı No'], ascending=[False, True])

        output_path = generate_premium_excel(df_report, "PORTAL OFFLINE ANALİZ (1.YÖNTEM)", "Portal Offline Veri (1.Yöntem).xlsx", log)
        
        log(f"İşlem tamamlandı. {len(df_report)} araç raporlandı.", 100)
        print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_path}}), flush=True)

    except Exception as e:
        log(f"Sistem Hatası: {str(e)}", 0)
