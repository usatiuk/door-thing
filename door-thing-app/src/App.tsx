import { useEffect, useState } from "preact/hooks";

const doorServiceUUIDString = "0x1811";
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
  const [autoConnect, setAutoConnect] = useState(false);

  useEffect(() => {
    window.api.send("read-setting", "autoConnect");
    window.api.receive(
      "read-setting-success",
      (res: { key: string; value: any }) => {
        if (res.key == "autoConnect") {
          setAutoConnect(res.value);
        }
      },
    );
    window.api.receive(
      "user-gesture-reply",
      async (res: { type: string; promise: Promise<any> }) => {
        if (res.type == "find-device") {
          try {
            const foundDevice = await window.newDevice;
            console.log("Found device:");
            console.log(foundDevice);

            await foundDevice.gatt.connect();
            foundDevice.ongattserverdisconnected = onDisconnect;

            const doorService = await foundDevice.gatt.getPrimaryService(
              doorServiceUUID,
            );
            const doorSwitch = await doorService.getCharacteristic(
              doorSwitchUUID,
            );
            setDevice({
              device: foundDevice,
              service: doorService,
              characteristic: doorSwitch,
            });

            const data = await (await doorSwitch.readValue()).getUint8(0);
            setDoorOpen(Boolean(data));

            doorSwitch.oncharacteristicvaluechanged = onDoorUpdate;
            doorSwitch.startNotifications();
          } catch (error) {
            console.log("Error connecting:");
            console.log(error);
          } finally {
            setConnecting(false);
            window.newDevice = null;
          }
        }
      },
    );
  }, []);

  useEffect(() => {
    if (autoConnect && !device && !connecting) {
      tryConnect();
    }
  }, [autoConnect, device, connecting]);

  function onAutoConnectChange(e: Event) {
    const newVal = (e.currentTarget as any).checked;
    setAutoConnect(newVal);
    window.api.send("write-setting", { key: "autoConnect", value: newVal });
  }

  const tryConnect = async () => {
    setConnecting(true);
    //we actually need all this, because otherwise it gives "Must be handling a user gesture..." error
    //and there doesn't seem to be a way to circumvent this yet
    //todo: make this at least somewhat less ugly?
    //similar issue: https://github.com/electron/electron/issues/27625
    window.api.send("exec-user-gesture", {
      type: "find-device",
      function: `
      window.newDevice = navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: "Arduino",
          },
        ],
        optionalServices: [${doorServiceUUIDString}],
      })`,
    });
  };

  const onDoorUpdate = async (e: Event) => {
    const characteristic = e.target as BluetoothRemoteGATTCharacteristic;
    const parsed = Boolean(await characteristic.value.getUint8(0));
    setDoorOpen(parsed);
    new Notification("Door update", { body: parsed ? "Open" : "Closed" });
  };

  const onDisconnect = async () => {
    setDevice(null);
    setDoorOpen(null);
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
    <div class="connectionBar">
      <div class="autoconnectSwitch">
        Autoconnect:
        <input
          onChange={onAutoConnectChange}
          checked={autoConnect}
          type="checkbox"
        />
      </div>
      <div class="connectionStatus">
        {connecting && !device && <span>Trying to connect</span>}
        {device == null && !connecting && (
          <button onClick={tryConnect}>Connect</button>
        )}
        {device && (
          <>
            <span>Connected </span>
            <button onClick={onDisconnectClick}>Disconnect</button>
          </>
        )}
      </div>
      <div>
        {doorOpen != null && <span>Door: {doorOpen ? "open" : "closed"}</span>}
      </div>
    </div>
  );
}
