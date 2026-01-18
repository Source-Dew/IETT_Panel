import os
import json
import time
import asyncio
import base64
import random
import uuid
import orjson
import pandas as pd
from datetime import datetime, timedelta, timezone
from curl_cffi.requests import AsyncSession
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Hash import SHA256
from python_calamine import CalamineWorkbook
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.drawing.image import Image
from openpyxl.utils.units import pixels_to_EMU
from openpyxl.drawing.spreadsheet_drawing import OneCellAnchor, AnchorMarker
from openpyxl.drawing.xdr import XDRPositiveSize2D

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class IETTBypasser:
    def __init__(self, log_func):
        self.pub_der = None
        self.log = log_func
        self.profiles = ["chrome110", "chrome120", "edge101", "safari15_5"]
        self.os_configs = [
            {"platform": "\"Windows\"", "ua_platform": "Windows", "mobile": "?0"},
            {"platform": "\"macOS\"", "ua_platform": "macOS", "mobile": "?0"},
            {"platform": "\"Linux\"", "ua_platform": "Linux", "mobile": "?0"}
        ]
        self.base_url = "https://arac.iett.gov.tr"
        self.task_url_base = f"{self.base_url}/api/task/getCarTasks/"
        self.pub_url = f"{self.base_url}/api/task/crypto/pubkey"

    async def init_session(self):
        return True

    async def get_ultra_session(self):
        profile = random.choice(self.profiles)
        os_cfg = random.choice(self.os_configs)
        
        session = AsyncSession(impersonate=profile, timeout=25)
        headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8",
            "DeviceID": str(uuid.uuid4()),
            "Origin": self.base_url,
            "Referer": f"{self.base_url}/",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Ch-Ua-Platform": os_cfg["platform"],
            "Sec-Ch-Ua-Mobile": os_cfg["mobile"],
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty"
        }
        
        if "chrome" in profile or "edge" in profile:
            ver = profile.replace("chrome", "").replace("edge", "")
            headers["Sec-Ch-Ua"] = f'"Not_A Brand";v="8", "Chromium";v="{ver}", "Google Chrome";v="{ver}"'
        
        session.headers.update(headers)
        try: 
            await session.get(f"{self.base_url}/", timeout=12)
            await asyncio.sleep(random.uniform(0.1, 0.3))
        except: pass
        return session

    async def refresh_pubkey(self):
        try:
            async with await self.get_ultra_session() as s:
                r = await s.get(self.pub_url, timeout=10)
                if r.status_code == 200:
                    self.pub_der = base64.b64decode(r.json()["key"])
                    return True
        except Exception as e:
            self.log(f"   [!] PubKey Hatası: {e}")
        return False

    def decrypt(self, aes_key, rj):
        try:
            iv, data = base64.b64decode(rj["iv"]), base64.b64decode(rj["data"])
            return orjson.loads(AESGCM(aes_key).decrypt(iv, data, None).decode("utf-8"))
        except: return None

    async def _fetch_all_raw(self):
        if not self.pub_der:
            if not await self.refresh_pubkey(): return None
        
        try:
            pk = serialization.load_der_public_key(self.pub_der)
        except:
            await self.refresh_pubkey()
            return None
        
        attempt = 0
        while attempt < 3:
            attempt += 1
            try:
                async with await self.get_ultra_session() as session:
                    aes_key = os.urandom(32)
                    ek = base64.b64encode(pk.encrypt(aes_key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))).decode()
                    
                    await asyncio.sleep(random.uniform(0.1, 0.4))
                    # Use BULK endpoint
                    r = await session.post(f"{self.base_url}/api/task/bus-fleet/buses", 
                                           json={"encKey": ek}, timeout=30)
                    
                    if "text/html" in r.headers.get("Content-Type", ""):
                        self.log(f"   [X] WAF TESPİTİ! Profil değiştiriliyor... (Deneme: {attempt})")
                        continue

                    if r.status_code == 200:
                        data = self.decrypt(aes_key, r.json())
                        if isinstance(data, list):
                            self.log(f"   [✓] BAŞARILI: Tüm filo verisi çekildi ({len(data)} araç).")
                            return data
                        self.log(f"   [!] Veri formatı beklenmedik: {type(data)}")

                    self.log(f"   [!] SUNUCU HATASI (HTTP {r.status_code}) (Deneme: {attempt})")
            except Exception as e:
                self.log(f"   [!] BAĞLANTI HATASI: {str(e)}. (Deneme: {attempt})")
            
            await asyncio.sleep(random.uniform(1.0, 2.5))
        return None

    async def safe_fetch_all(self, all_codes, start_p=20, end_p=85):
        total = len(all_codes)
        if total == 0: return []
        
        self.log(f"[BAŞLADI] {total} araç için Toplu Veri Çekme işlemi başlatıldı...", start_p)
        
        # Tek seferde tüm veriyi çek
        all_data = await self._fetch_all_raw()
        
        self.log("Veriler işleniyor ve eşleştiriliyor...", int((start_p + end_p) / 2))
        
        results = []
        if all_data:
            # Hızlı erişim için map oluştur (Normalize edilmiş kodlar üzerinden)
            data_map = {}
            for item in all_data:
                # API KEYS: vehicleDoorCode / numberPlate
                door = normalize_car_code(item.get("vehicleDoorCode") or item.get("doorNumber"))
                plate = normalize_car_code(item.get("numberPlate") or item.get("plateNumber"))
                
                if door: data_map[door] = item
                if plate: data_map[plate] = item
            
            # İstenen araçları bul
            found_count = 0
            for code in all_codes:
                norm_code = normalize_car_code(code)
                if norm_code in data_map:
                    results.append(data_map[norm_code])
                    found_count += 1
            
            self.log(f"[TAMAMLANDI] {total} araçtan {found_count} tanesinin güncel verisi bulundu.", end_p)
        else:
             self.log(f"[HATA] İETT'den veri çekilemedi. Lütfen daha sonra tekrar deneyin.", end_p)
             
        return results

def normalize_car_code(val):
    return str(val).strip().upper().replace(' ', '').replace('_', '').replace('.', '')

def get_desktop_path():
    return os.path.join(os.path.expanduser("~"), "Desktop")

def read_excel_smart(file_path, log):
    try:
        wb = CalamineWorkbook.from_path(file_path)
        sheet_name = wb.sheet_names[0]
        rows = wb.get_sheet_by_name(sheet_name).to_python()
        if not rows: return pd.DataFrame()
        
        best_row_idx = 0
        max_score = -1
        search_keywords = ['KAPINO', 'KAPI NO', 'PLAKA', 'DURUM', 'AĞ DURUMU', 'CIHAZ', 'KOD', 'SÜRE', 'SURE', 'ADRES', 'FAKTÖR', 'NUMARASI']
        for i in range(min(30, len(rows))):
            row_str = [str(x).strip().upper() for x in rows[i] if x is not None]
            score = sum(1 for kw in search_keywords if any(kw in val for val in row_str))
            if score > max_score:
                max_score = score
                best_row_idx = i
            if score >= 3: break
        
        headers = [str(x).strip() if x is not None else f"Column_{j}" for j, x in enumerate(rows[best_row_idx])]
        df = pd.DataFrame(rows[best_row_idx + 1:], columns=headers)
        return df
    except Exception as e:
        log(f"Okuma hatası: {str(e)}")
        return pd.DataFrame()

def find_best_column(columns, target_keywords):
    for col in columns:
        norm_col = str(col).upper().replace('İ', 'I').replace('Ğ', 'G').replace('Ü', 'U').replace('Ş', 'S').replace('Ö', 'O').replace('Ç', 'C').replace(' ', '').replace('_', '')
        for kw in target_keywords:
            if kw.upper().replace(' ', '') in norm_col: return col
    return None

def generate_premium_excel(df, title, output_filename, log):
    output_path = os.path.join(get_desktop_path(), "IETT Veri Panel Çıktı", output_filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    wb = Workbook()
    ws = wb.active
    ws.title = "Rapor"
    
    # Header Layout: A (Logo), B-C (Title), D (Logo or Last Column)
    num_cols = len(df.columns)
    max_header_col = max(num_cols, 4)
    last_col_letter = chr(64 + max_header_col)
    
    # Column Widths
    for i in range(1, max_header_col + 1):
        ws.column_dimensions[chr(64+i)].width = 25
    
    ws.row_dimensions[1].height = 78
    row_h_px = 104

    def add_logo(path, col_letter, col_idx):
        if os.path.exists(path):
            try:
                img = Image(path)
                target_h = 85
                ratio = target_h / img.height
                img_w = int(img.width * ratio)
                img.width = img_w
                img.height = target_h
                
                col_w_px = ws.column_dimensions[col_letter].width * 7.5
                off_x = pixels_to_EMU(int(max(0, (col_w_px - img_w) / 2)))
                off_y = pixels_to_EMU(int(max(0, (row_h_px - target_h) / 2)))
                marker = AnchorMarker(col=col_idx, colOff=off_x, row=0, rowOff=off_y)
                img.anchor = OneCellAnchor(_from=marker, ext=XDRPositiveSize2D(pixels_to_EMU(img_w), pixels_to_EMU(target_h)))
                ws.add_image(img)
            except: pass

    assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')
    add_logo(os.path.join(assets_dir, 'ibb_logo.png'), 'A', 0)
    add_logo(os.path.join(assets_dir, 'iett_logo.png'), last_col_letter, max_header_col - 1)

    # Title - Merge B1 until LastColumn-1
    if max_header_col > 2:
        title_range = f"B1:{chr(64 + max_header_col - 1)}1"
        ws.merge_cells(title_range)
        title_cell = ws['B1']
    else:
        title_cell = ws['A1']

    title_cell.value = title.upper()
    red_fill = PatternFill(start_color="C00000", end_color="C00000", fill_type="solid")
    title_cell.fill = red_fill
    title_cell.font = Font(color="FFFFFF", bold=True, size=16)
    title_cell.alignment = Alignment(horizontal='center', vertical='center')
    
    # Apply border and fill to all merged cells
    border_thin = Side(style='thin')
    full_border = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)
    if max_header_col > 2:
        for row in ws[title_range]:
            for cell in row:
                cell.border = full_border
                cell.fill = red_fill

    # Date
    date_cell = ws[f"{last_col_letter}2"]
    date_cell.value = f"Rapor Tarihi: {time.strftime('%d.%m.%Y %H:%M')}"
    date_cell.alignment = Alignment(horizontal='right')
    date_cell.font = Font(size=9, italic=True)

    # Table Header (Row 4)
    header_fill = PatternFill(start_color="404040", end_color="404040", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    for i, h in enumerate(df.columns, 1):
        cell = ws.cell(row=4, column=i, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = full_border

    # Data (Row 5+)
    for r_idx, (idx, row_data) in enumerate(df.iterrows(), 5):
        for c_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = full_border

    wb.save(output_path)
    return output_path
