#include <Arduino.h>

void setup()
{
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(2, INPUT);
}

void loop()
{
    if (digitalRead(2) == 1)
    {
        digitalWrite(LED_BUILTIN, HIGH);
    }
    else
    {
        digitalWrite(LED_BUILTIN, LOW);
    }
}
