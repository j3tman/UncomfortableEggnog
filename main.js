var electron = require('electron');
var app = electron.app;  // Module to control application life.
var BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var globalShortcut = electron.globalShortcut;
var ipcMain = electron.ipcMain;
var Tray = electron.Tray;
var Menu = electron.Menu;
var MenuItem = electron.MenuItem;

electron.crashReporter.start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var appIcon = null;
var toggle = false;
var menu = null;


app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
    // minWidth: 800,
    // minHeight: 600,
    // maxWidth: 800,
    // maxHeight: 600
  });
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  //start listening when the app starts
  mainWindow.webContents.on('dom-ready', function () {
    mainWindow.webContents.send('listening', 'listening');
  });

  //user doesn't want app to be always listening
  //register shortcut for listening
  ipcMain.on('registerShortcut', function () {
    console.log('registerShortcut');
    var startRecording = globalShortcut.register('ctrl+r', function () {
      //emitted to renderer process (speechRecognition and other js files loaded
      //when index.html loads) to start recording
      mainWindow.webContents.send('listening', 'shortcutListening');
    });
  });

  //user wants app to be always listening
  //unregister shortcut to avoid errors and start loop on renderer
  ipcMain.on('unregisterShortcut', function () {
    globalShortcut.unregister('ctrl+r');
    mainWindow.webContents.send('listening', 'listening');
  });

  mainWindow.showWindow = false;
  mainWindow.toggle = function () {
    if (this.showWindow) {
      console.log('show');
      this.show();
      this.showWindow = !this.showWindow;
    } else {
      console.log('hide');
      this.hide();
      this.showWindow = !this.showWindow;
    }
  };

  menu = new Menu();
  menu.append(new MenuItem({
    label: 'Quit',
    click: function () {
      app.quit();
    }
  }));

  appIcon = new Tray('./app/assets/icons/rsz_1rsz_jarvis_tiny.png');
  appIcon.on('click', function () {
    mainWindow.toggle();
  });
  appIcon.on('right-click', function (e) {
    console.log('right click');
    this.popUpContextMenu(menu);
  });

  mainWindow.on('close', function (e) {
    app.quit();
  });
  mainWindow.on('closed', function () {
    globalShortcut.unregister('ctrl+r');
    app.quit();
  });
  app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
      app.quit();
    }
  });
});
