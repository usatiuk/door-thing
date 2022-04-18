import { useState } from "preact/hooks";

const doorServiceUUID: BluetoothServiceUUID = 0x1811;
const doorSwitchUUID: BluetoothCharacteristicUUID = 0x2ae2;

export function App() {
  const [connecting, setConnecting] = useState(false);
  const [device, setDevice] = useState<{
    device: BluetoothDevice;
    service: BluetoothRemoteGATTService;
    characteristic: BluetoothRemoteGATTCharacteristic;
  } | null>(null);
  const [doorOpen, setDoorOpen] = useState<boolean | null>(null);

  const onConnectClick = async () => {
    try {
      setConnecting(true);
      const foundDevice = await navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: "Nano",
          },
        ],
        optionalServices: [doorServiceUUID],
      });
      console.log("Found device:");
      console.log(foundDevice);
      await foundDevice.gatt.connect();
      foundDevice.ongattserverdisconnected = onDisconnect;

      const doorService = await foundDevice.gatt.getPrimaryService(
        doorServiceUUID,
      );

      const doorSwitch = await doorService.getCharacteristic(doorSwitchUUID);
      setDevice({
        device: foundDevice,
        service: doorService,
        characteristic: doorSwitch,
      });

      const data = await (await doorSwitch.readValue()).getUint8(0);

      doorSwitch.oncharacteristicvaluechanged = onDoorUpdate;
      doorSwitch.startNotifications();

      setDoorOpen(Boolean(data));
    } catch (error) {
      console.log("Error connecting:");
      console.log(error);
    } finally {
      setConnecting(false);
    }
  };

  const onDoorUpdate = async (ev: Event) => {
    const characteristic = ev.target as BluetoothRemoteGATTCharacteristic;
    const parsed = Boolean(await characteristic.value.getUint8(0));
    setDoorOpen(parsed);
    new Notification("Door update", { body: parsed ? "Open" : "Closed" });
  };

  const onDisconnect = async () => {
    setDevice(null);
  };

  const onDisconnectClick = async () => {
    try {
      await device.characteristic.stopNotifications();
      device.device.gatt.disconnect();
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
          <span>{doorOpen ? "open" : "closed"}</span>
        </>
      )}
    </div>
  );
}
