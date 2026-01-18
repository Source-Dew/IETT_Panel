import json
import time
import pandas as pd
import re
from utils import normalize_car_code, generate_premium_excel, read_excel_smart, find_best_column

def process_oho_trigger(files, cars2_list, cars3_list, log, detailed_cars_list="", is_detailed=False):
    log("ÖHO Tetik Analizi Başlatılıyor...", 5)
    
    # Process vehicle code lists
    def parse_list(s):
        if not s: return set()
        # Handle commas, spaces, newlines
        items = s.replace(',', ' ').split()
        return {normalize_car_code(x) for x in items if x.strip()}

    v2_codes = parse_list(cars2_list)
    v3_codes = parse_list(cars3_list)
    v_detailed = parse_list(detailed_cars_list)
    
    log(f"İşlenek Araçlar: {len(v2_codes)} (2-Kapı), {len(v3_codes)} (3-Kapı)", 10)
    
    all_dfs = []
    for i, file_path in enumerate(files):
        log(f"Okunuyor ({i+1}/{len(files)}): {file_path.split('/')[-1]}", 15 + (i * 2))
        df = read_excel_smart(file_path, log)
        if not df.empty:
            all_dfs.append(df)
    
    if not all_dfs:
        log("Hata: Hiçbir dosya okunamadı veya dosyalar boş.", 100)
        return
    
    df_combined = pd.concat(all_dfs, ignore_index=True)
    
    # Identify columns
    col_device = find_best_column(df_combined, ['Cihaz', 'Device', 'İsim', 'Ad', 'Cihaz Adı'])
    if not col_device:
        log("Hata: 'Cihaz Adı' sütunu bulunamadı.", 100)
        return

    log("Analiz yapılıyor...", 60)
    
    # Pass 1: Simple set check for the primary report
    car_triggers = {} # {car_code: set(trigger_ids)}
    
    # Pass 2: Exact counts for detailed report (if requested)
    detailed_counts = {} # {car_code: {trigger_id: count}}
    
    for _, row in df_combined.iterrows():
        val = str(row[col_device]).strip() # e.g. B-1510_0
        if '_' in val:
            parts = val.rsplit('_', 1)
            raw_code = parts[0]
            trigger_id = parts[1].strip()
            
            car_code = normalize_car_code(raw_code)
            
            # Simple check data
            if car_code not in car_triggers:
                car_triggers[car_code] = set()
            car_triggers[car_code].add(trigger_id)
            
            # Detailed count data
            if is_detailed and car_code in v_detailed:
                if car_code not in detailed_counts:
                    detailed_counts[car_code] = {}
                detailed_counts[car_code][trigger_id] = detailed_counts[car_code].get(trigger_id, 0) + 1

    # Ensure all v_detailed cars are initialized even if not found in data
    if is_detailed:
        for code in v_detailed:
            if code not in detailed_counts:
                detailed_counts[code] = {}

    log(f"Verilerde toplam {len(car_triggers)} benzersiz araç tespit edildi.", 70)
    
    results = []
    output_main = None

    if not is_detailed:
        # Helper to check triggers
        def check_car(code, type_name, expected_triggers):
            # We check both the normalized code and potential variations if needed
            # But since we normalized the lists too, code is already normalized.
            triggers = car_triggers.get(code, set())
            
            missing = []
            for t_id in expected_triggers:
                if t_id not in triggers:
                    missing.append(f"Kapı {int(t_id)+1}")
            
            has_3rd_door = '2' in triggers
            
            if missing:
                msg = ", ".join(missing) + " çalışmıyor"
                durum = "Eksik Tetik"
                if type_name == "2 Kapılı" and has_3rd_door:
                    msg += " (3. Kapı sinyali var!)"
                    durum = "Sinyal Karışıklığı"
                
                return {
                    "Araç Kodu": code,
                    "Araç Tipi": type_name,
                    "Durum": durum,
                    "Detay": msg
                }
            elif type_name == "2 Kapılı" and has_3rd_door:
                return {
                    "Araç Kodu": code,
                    "Araç Tipi": type_name,
                    "Durum": "Uyarı",
                    "Detay": "2 kapılı listede ama 3. kapı tetiği sinyal vermiş (Aslında 3 kapılı olabilir)"
                }
            else:
                return {
                    "Araç Kodu": code,
                    "Araç Tipi": type_name,
                    "Durum": "Tamam",
                    "Detay": "Tüm kapılar aktif"
                }

        # Process 3-door list
        for code in sorted(v3_codes):
            if code in car_triggers:
                results.append(check_car(code, "3 Kapılı", ['0', '1', '2']))

        # Process 2-door list
        for code in sorted(v2_codes):
            if code in car_triggers:
                results.append(check_car(code, "2 Kapılı", ['0', '1']))

        if results:
            # Sort and group results: Sinyal Karışıklığı -> Uyarı -> Eksik Tetik -> Tamam
            sorted_data = []
            
            # 1. Group: Sinyal Karışıklığı (En Kritik Hata)
            group_mix = sorted([r for r in results if r['Durum'] == 'Sinyal Karışıklığı'], key=lambda x: (x['Araç Tipi'], x['Araç Kodu']))
            if group_mix:
                sorted_data.extend(group_mix)

            # 2. Group: Uyarı (Sinyal var ama kapılar çalışıyor)
            group_warn = sorted([r for r in results if r['Durum'] == 'Uyarı'], key=lambda x: (x['Araç Tipi'], x['Araç Kodu']))
            if group_warn:
                if sorted_data: sorted_data.append({k: "" for k in results[0].keys()}) # Space
                sorted_data.extend(group_warn)
                
            # 3. Group: Eksik Tetik (Normal Hatalar)
            group_error = sorted([r for r in results if r['Durum'] == 'Eksik Tetik'], key=lambda x: (x['Araç Tipi'], x['Araç Kodu']))
            if group_error:
                if sorted_data: sorted_data.append({k: "" for k in results[0].keys()}) # Space
                sorted_data.extend(group_error)
                
            # 4. Group: Tamam
            group_ok = sorted([r for r in results if r['Durum'] == 'Tamam'], key=lambda x: (x['Araç Tipi'], x['Araç Kodu']))
            if group_ok:
                if sorted_data: sorted_data.append({k: "" for k in results[0].keys()}) # Space
                sorted_data.extend(group_ok)

            df_results = pd.DataFrame(sorted_data)
            log("Ana rapor oluşturuluyor...", 85)
            output_main = generate_premium_excel(df_results, "ÖHO Tetik Analizi", "ÖHO Tetik Veri Analizi.xlsx", log)

    # Detailed Analysis Report
    output_detailed = None
    if is_detailed and v_detailed:
        log("Detaylı analiz raporu oluşturuluyor...", 90)
        det_data = []
        for car in sorted(v_detailed):
            triggers = detailed_counts.get(car, {})
            c1 = triggers.get('0', 0)
            c2 = triggers.get('1', 0)
            c3 = triggers.get('2', 0)
            total = c1 + c2 + c3
            
            # Determine status
            status = "Günlük aktivite normal"
            if total == 0:
                status = "VERİ BULUNAMADI!"
            else:
                missing = []
                if c1 == 0: missing.append("1. Kapı")
                if c2 == 0: missing.append("2. Kapı")
                if car in v3_codes and c3 == 0: missing.append("3. Kapı")
                
                if missing:
                    status = f"{', '.join(missing)} Sinyal YOK"
                elif total < 100:
                    status = "Düşük sinyal sayısı"
            
            det_data.append({
                "Araç Kodu": car,
                "Tip": "3 Kapılı" if car in v3_codes else "2 Kapılı",
                "1. Kapı (Adet)": c1,
                "2. Kapı (Adet)": c2,
                "3. Kapı (Adet)": c3,
                "Toplam Sinyal": total,
                "Toplam Durum": status
            })
        
        if det_data:
            # Hierarchy: No Data -> Error/Low -> Normal
            # Inside each: 3-Door -> (Space) -> 2-Door
            # Inside each Type: Sinyal YOK -> Düşük sinyal -> Normal
            sorted_det = []
            
            def sort_by_status_and_code(item):
                status = item['Toplam Durum']
                # Priority: Sinyal YOK (0) > Düşük sinyal (1) > Normal (2)
                prio = 2
                if "Sinyal YOK" in status: prio = 0
                elif "Düşük sinyal" in status: prio = 1
                return (prio, item['Araç Kodu'])

            def process_group(original_list, filter_fn):
                group = [r for r in original_list if filter_fn(r)]
                if not group: return []
                
                v3_part = sorted([r for r in group if r['Tip'] == "3 Kapılı"], key=sort_by_status_and_code)
                v2_part = sorted([r for r in group if r['Tip'] == "2 Kapılı"], key=sort_by_status_and_code)
                
                combined = []
                if v3_part:
                    combined.extend(v3_part)
                if v3_part and v2_part:
                    combined.append({k: "" for k in det_data[0].keys()}) # Type Gap
                if v2_part:
                    combined.extend(v2_part)
                return combined

            # 1. Group: No Data
            group_nodata = process_group(det_data, lambda r: "VERİ BULUNAMADI" in r['Toplam Durum'])
            if group_nodata:
                sorted_det.extend(group_nodata)
                
            # 2. Group: Error or Low Signal
            group_issue = process_group(det_data, lambda r: "Sinyal YOK" in r['Toplam Durum'] or "Düşük sinyal" in r['Toplam Durum'])
            if group_issue:
                if sorted_det: sorted_det.append({k: "" for k in det_data[0].keys()}) # Group Gap
                sorted_det.extend(group_issue)
                
            # 3. Group: Normal
            group_normal = process_group(det_data, lambda r: "Günlük aktivite normal" in r['Toplam Durum'])
            if group_normal:
                if sorted_det: sorted_det.append({k: "" for k in det_data[0].keys()}) # Group Gap
                sorted_det.extend(group_normal)

            df_det = pd.DataFrame(sorted_det)
            output_detailed = generate_premium_excel(df_det, "Detaylı Tetik Analizi", "ÖHO Detaylı Tetik Analizi.xlsx", log)

    if not output_main and not output_detailed:
        log("Uyarı: Analiz edilecek araç bulunamadı.", 100)
        return

    final_msg = f"Raporlar hazır: {output_main or ''} {output_detailed or ''}"
    log(final_msg, 100)
    print(json.dumps({"type": "finish", "data": {"success": True, "output_path": output_main or output_detailed}}), flush=True)
