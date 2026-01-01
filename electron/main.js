const { app, BrowserWindow, ipcMain, dialog, Notification, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { PythonShell } = require('python-shell');
const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const log = require('electron-log');
log.transports.file.level = 'info';

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1350,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 40
        },
        title: "IETT Hıkvısıon Panel",
        show: true,
        backgroundColor: '#0f172a'
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}



app.whenReady().then(() => {
    createWindow();

    // Auto update check
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let pythonShellInstance = null;
let pythonProcess = null;

let configPath;
if (app.isPackaged) {
    configPath = path.join(path.dirname(process.execPath), 'config.json');
} else {
    configPath = path.join(__dirname, '../python/config.json');
}

ipcMain.handle('get-settings', async () => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error("Error reading settings:", error);
        return {};
    }
});

ipcMain.handle('save-settings', async (event, settings) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 4), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error("Error saving settings:", error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('run-python-script', async (event, args) => {
    if (pythonShellInstance) {
        pythonShellInstance.kill();
        pythonShellInstance = null;
    }
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }

    const pythonArgs = [...args, '--config', configPath];

    return new Promise((resolve, reject) => {
        if (app.isPackaged) {
            const exePath = path.join(process.resourcesPath, 'python', 'main.exe');

            pythonProcess = spawn(exePath, pythonArgs);

            const rl = readline.createInterface({ input: pythonProcess.stdout });

            rl.on('line', (line) => {
                try {
                    const data = JSON.parse(line);
                    event.sender.send('python-log', data);

                    if (data.type === 'finish' && data.data.success) {
                        new Notification({
                            title: 'İşlem Tamamlandı',
                            body: `Rapor başarıyla oluşturuldu.\n${data.data.output_path}`,
                            icon: path.join(__dirname, '../public/icon.png')
                        }).show();
                    }
                } catch (e) {
                    console.log('Non-JSON output:', line);
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
                event.sender.send('python-log', { type: 'error', data: { message: data.toString() } });
            });

            pythonProcess.on('close', (code) => {
                pythonProcess = null;
                if (code === 0) {
                    resolve({ status: 'success' });
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });

        } else {
            const scriptPath = path.join(__dirname, '../python/main.py');

            let options = {
                mode: 'text',
                pythonPath: 'python',
                pythonOptions: ['-u'],
                scriptPath: path.dirname(scriptPath),
                args: pythonArgs
            };

            pythonShellInstance = new PythonShell('main.py', options);

            pythonShellInstance.on('message', function (message) {
                try {
                    const data = JSON.parse(message);
                    event.sender.send('python-log', data);
                } catch (e) {
                    const regex = /\{(?:[^{}]|(\{(?:[^{}]|(\{[^{}]*\}))*\}))*\}/g;
                    const matches = message.match(regex);
                    if (matches) {
                        matches.forEach(jsonStr => {
                            try {
                                const data = JSON.parse(jsonStr);
                                event.sender.send('python-log', data);
                            } catch (err) {
                                console.log('Parçalı JSON parse hatası:', jsonStr);
                            }
                        });
                    } else {
                        console.log('Python raw:', message);
                    }
                }
            });

            pythonShellInstance.end(function (err, code, signal) {
                pythonShellInstance = null;
                if (err) {
                    reject(err);
                } else {
                    resolve({ status: 'success' });
                }
            });
        }
    });
});

ipcMain.handle('stop-python-script', () => {
    let stopped = false;
    if (pythonShellInstance) {
        pythonShellInstance.kill();
        pythonShellInstance = null;
        stopped = true;
    }
    if (pythonProcess) {
        if (process.platform === 'win32') {
            try {
                require('child_process').execSync(`taskkill /pid ${pythonProcess.pid} /f /t`);
            } catch (e) {
                pythonProcess.kill();
            }
        } else {
            pythonProcess.kill();
        }
        pythonProcess = null;
        stopped = true;
    }
    return stopped;
});

ipcMain.handle('open-file', async (event, filePath) => {
    if (filePath) {
        await shell.openPath(filePath);
    }
});

ipcMain.handle('check-report-exists', async (event, filename) => {
    try {
        const desktopPath = app.getPath('desktop');
        const homePath = app.getPath('home');

        const pathsToCheck = [
            path.join(desktopPath, 'IETT Veri Panel Çıktı', filename),
            path.join(homePath, 'Desktop', 'IETT Veri Panel Çıktı', filename),
            path.join(homePath, 'OneDrive', 'Desktop', 'IETT Veri Panel Çıktı', filename),
            path.join(homePath, 'OneDrive', 'Masaüstü', 'IETT Veri Panel Çıktı', filename)
        ];

        const fs = require('fs');
        for (const reportPath of pathsToCheck) {
            if (fs.existsSync(reportPath)) {
                return reportPath;
            }
        }
    } catch (error) {
        console.error('Report check error:', error);
    }
    return null;
});

ipcMain.handle('sniff-files', async (event, filePaths) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../python/main.py');
        let options = {
            mode: 'text',
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath: path.dirname(scriptPath),
            args: ['sniff', '--config', configPath]
        };

        // Add file paths to args
        filePaths.forEach((p, i) => {
            options.args.push(i === 0 ? '--file1' : (i === 1 ? '--file2' : '--file'));
            options.args.push(p);
        });

        const pyShell = new PythonShell('main.py', options);
        let result = null;

        pyShell.on('message', function (message) {
            try {
                const data = JSON.parse(message);
                if (data.type === 'sniff_result') {
                    result = data.data;
                }
            } catch (e) {
                console.log('Sniff parse error:', message);
            }
        });

        pyShell.end(function (err) {
            if (err) reject(err);
            else resolve(result);
        });
    });
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Excel/CSV', extensions: ['xlsx', 'xls', 'csv'] }
        ]
    });
    return result.filePaths[0];
});

ipcMain.handle('clean-outputs', async () => {
    try {
        const desktopPath = app.getPath('desktop');
        const homePath = app.getPath('home');
        const pathsToCheck = [
            path.join(desktopPath, 'IETT Veri Panel Çıktı'),
            path.join(homePath, 'Desktop', 'IETT Veri Panel Çıktı'),
            path.join(homePath, 'OneDrive', 'Desktop', 'IETT Veri Panel Çıktı'),
            path.join(homePath, 'OneDrive', 'Masaüstü', 'IETT Veri Panel Çıktı')
        ];

        const fs = require('fs');
        let foundDir = null;

        for (const p of pathsToCheck) {
            if (fs.existsSync(p)) {
                foundDir = p;
                break;
            }
        }

        if (foundDir) {
            const items = fs.readdirSync(foundDir);
            let deleteCount = 0;

            for (const item of items) {
                const itemPath = path.join(foundDir, item);
                try {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    deleteCount++;
                } catch (e) {
                    console.error('Error deleting item ' + item + ':', e);
                }
            }
            return { success: true, count: deleteCount };
        }
        return { success: true, count: 0 };
    } catch (error) {
        console.error('Clean outputs error:', error);
        return { success: false, error: error.message };
    }
});

// Auto-updater logs and events
autoUpdater.logger = log;
autoUpdater.on('update-available', () => {
    log.info('Güncelleme bulundu.');
});

autoUpdater.on('update-downloaded', () => {
    log.info('Güncelleme indirildi. Uygulama kapatılıp güncellenecek.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Güncelleme Hazır',
        message: 'Yeni bir sürüm indirildi. Güncellemek için uygulama yeniden başlatılacak.',
        buttons: ['Hemen Yükle']
    }).then(() => {
        autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (err) => {
    log.error('Güncelleme hatası:', err);
});
