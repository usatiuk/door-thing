import { contextBridge, ipcRenderer } from "electron";

//todo: renderer.d.ts
contextBridge.exposeInMainWorld("api", {
  send: (channel: string, data: any) => {
    // whitelist channels
    const validChannels = [
      "read-setting",
      "write-setting",
      "exec-user-gesture",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: any) => {
    const validChannels = [
      "read-setting-success",
      "read-setting-error",
      "write-setting-success",
      "write-setting-fail",
      "user-gesture-reply",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
