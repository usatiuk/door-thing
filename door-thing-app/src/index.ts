import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

interface ISettings {
  autoConnect: boolean;
}

const settingsPath = path.join(app.getPath("userData"), "settings.json");
const settings = new Low<ISettings>(new JSONFile(settingsPath));
const settingsRead = false;

async function initSettings() {
  if (!settingsRead) {
    await settings.read();
  }

  settings.data ||= {
    autoConnect: false,
  };
}

ipcMain.on("read-setting", async (event, arg: string) => {
  await initSettings();
  if (Object.keys(settings.data).includes(arg)) {
    event.reply("read-setting-success", {
      key: arg,
      value: settings.data[arg as keyof ISettings],
    });
  } else {
    event.reply("read-setting-error", {
      key: arg,
      error: "bad key",
    });
  }
});

ipcMain.on(
  "write-setting",
  async (event, arg: { key: keyof ISettings; value: any }) => {
    await initSettings();
    settings.data[arg.key] = arg.value;
    try {
      await settings.write();
      event.reply("write-setting-success", arg.key);
    } catch (e) {
      event.reply("write-setting-fail", { key: arg.key, error: e });
    }
  },
);

// This allows TypeScript to pick up the magic constant that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      }
    },
  );

  ipcMain.on(
    "exec-user-gesture",
    async (event, arg: { type: string; function: string }) => {
      await mainWindow.webContents.executeJavaScript(arg.function, true);
      event.reply("user-gesture-reply", {
        type: arg.type,
        promise: "aaaah",
      });
    },
  );

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
