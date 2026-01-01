/**
 * Merkezi API Mantığı
 * Bu dosya Electron IPC (Inter-Process Communication) çağrılarını yönetir.
 */

export const api = {
    // Python scriptini başlatır
    runScan: async (mode, filePath) => {
        if (window.electronAPI) {
            return await window.electronAPI.runPythonScript(['process_file', '--file', filePath, '--mode', mode]);
        }
        return null;
    },

    // Python scriptini durdurur
    stopScan: async () => {
        if (window.electronAPI) {
            return await window.electronAPI.stopPythonScript();
        }
        return null;
    },

    // Ayarları getirir
    getSettings: async () => {
        if (window.electronAPI) {
            return await window.electronAPI.getSettings();
        }
        return {};
    },

    // Dosya seçme diyaloğunu açar
    selectFile: async () => {
        if (window.electronAPI) {
            return await window.electronAPI.selectFile();
        }
        return null;
    },

    // Çıktı klasörünü temizler
    cleanOutputs: async () => {
        if (window.electronAPI) {
            return await window.electronAPI.cleanOutputs();
        }
        return { success: false };
    }
};
