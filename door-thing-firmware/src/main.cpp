#include <Arduino.h>
#include <ArduinoBLE.h>

// Door switch pin
#define SWITCH_PIN 2
const char *name = "Arduino";
BLEService switchService("1811"); // BLE Switch Service

// BLE Switch Characteristic - custom 128-bit UUID, read by central
BLEByteCharacteristic switchCharacteristic("2AE2", BLERead | BLEIndicate);

void setup()
{
    Serial.begin(9600);
    // while (!Serial)
    //     ;

    // begin initialization
    if (!BLE.begin())
    {
        Serial.println("starting Bluetooth® Low Energy failed!");
        while (1)
            ;
    }
    pinMode(SWITCH_PIN, INPUT);

    // set advertised local name and service UUID:
    BLE.setDeviceName(name);
    BLE.setLocalName(name);
    BLE.setAdvertisedService(switchService);

    // add the characteristic to the service
    switchService.addCharacteristic(switchCharacteristic);

    // add service
    BLE.addService(switchService);

    // set the initial value for the characteristic:
    switchCharacteristic.writeValue(0);

    // start advertising
    BLE.advertise();

    Serial.println("BLE Switch Peripheral");
}

void loop()
{
    // listen for BLE peripherals to connect:
    BLEDevice central = BLE.central();

    // if a central is connected to peripheral:
    if (central)
    {
        Serial.print("Connected to central: ");
        // print the central's MAC address:
        Serial.println(central.address());
        digitalWrite(LED_BUILTIN, HIGH); // turn on the LED to indicate the connection

        // while the central is still connected to peripheral:
        bool oldState = digitalRead(SWITCH_PIN);
        switchCharacteristic.writeValue(oldState);

        while (central.connected())
        {
            // read the switch state:
            bool newState = digitalRead(SWITCH_PIN);

            // if the switch state has changed:
            if (newState != oldState)
            {
                // update the characteristic value:
                switchCharacteristic.writeValue(newState);

                // print the new switch state:
                Serial.print("Switch state: ");
                Serial.println(newState);

                // update the old switch state:
                oldState = newState;
            }
        }

        // when the central disconnects, print it out:
        Serial.print(F("Disconnected from central: "));
        Serial.println(central.address());
        digitalWrite(LED_BUILTIN, LOW); // turn on the LED to indicate the connection
    }
}