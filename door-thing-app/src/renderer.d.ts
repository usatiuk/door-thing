export interface IElectronAPI {
  send: (channel: string, data: any) => Promise<void>;
  receive: (channel: string, func: any) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
    newDevice: Promise<BluetoothDevice> | null;
  }
}
