import { useState } from "preact/hooks";

export function App() {
  const [connecting, setConnecting] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice>(null);

  const onConnectClick = async () => {
    try {
      setConnecting(true);
      const foundDevice = await navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: "Nano",
          },
        ],
      });
      console.log("Found device:");
      console.log(foundDevice);
      setDevice(foundDevice);
      await foundDevice.gatt.connect();
      foundDevice.ongattserverdisconnected = onDisconnect;
    } catch (error) {
      console.log("Error connecting:");
      console.log(error);
    } finally {
      setConnecting(false);
    }
  };

  const onDisconnect = async () => {
    setDevice(null);
  };

  const onDisconnectClick = async () => {
    try {
      device.gatt.disconnect();
    } catch (error) {
      console.log("Error disconnecting:");
      console.log(error);
    }
  };

  return (
    <div>
      {connecting && !device && <span>Trying to connect</span>}
      {device == null && !connecting && (
        <button onClick={onConnectClick}>Connect</button>
      )}
      {device && (
        <>
          <span>connected</span>
          <button onClick={onDisconnectClick}>Disconnect</button>
        </>
      )}
    </div>
  );
}
