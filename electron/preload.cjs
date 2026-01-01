const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getFilePath: (file) => webUtils.getPathForFile(file),
    runPythonScript: (args) => ipcRenderer.invoke('run-python-script', args),
    stopPythonScript: () => ipcRenderer.invoke('stop-python-script'),
    selectFile: () => ipcRenderer.invoke('select-file'),
    openFile: (path) => ipcRenderer.invoke('open-file', path),
    checkReportExists: (filename) => ipcRenderer.invoke('check-report-exists', filename),
    checkReportExists: (filename) => ipcRenderer.invoke('check-report-exists', filename),
    cleanOutputs: () => ipcRenderer.invoke('clean-outputs'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    sniffFiles: (filePaths) => ipcRenderer.invoke('sniff-files', filePaths),
    onLog: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('python-log', subscription);
        return () => ipcRenderer.removeListener('python-log', subscription);
    }
});
