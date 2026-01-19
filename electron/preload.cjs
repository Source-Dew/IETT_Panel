const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getFilePath: (file) => webUtils.getPathForFile(file),
    runPythonScript: (args) => ipcRenderer.invoke('run-python-script', args),
    stopPythonScript: () => ipcRenderer.invoke('stop-python-script'),
    selectFile: () => ipcRenderer.invoke('select-file'),
    selectFiles: () => ipcRenderer.invoke('select-files'),
    openFile: (path) => ipcRenderer.invoke('open-file', path),
    checkReportExists: (filename) => ipcRenderer.invoke('check-report-exists', filename),
    cleanOutputs: (options) => ipcRenderer.invoke('clean-outputs', options),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    sniffFiles: (filePaths) => ipcRenderer.invoke('sniff-files', filePaths),
    openTextContent: (content, title) => ipcRenderer.invoke('open-text-content', content, title),
    onLog: (callback) => {
        const subscription = (event, data) => callback(data);
        ipcRenderer.on('python-log', subscription);
        return () => ipcRenderer.removeListener('python-log', subscription);
    }
});
