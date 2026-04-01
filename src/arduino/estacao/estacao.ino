#include "DHT.h"
#define DHTPIN 2
#define DHTTYPE DHT11
#include <Wire.h>
#include <Adafruit_BMP280.h>

Adafruit_BMP280 bmp;
DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(9600);
    Wire.begin();    
    delay(100);      
    dht.begin();
    
    if (!bmp.begin(0x76, 0x60)) { 
        Serial.println("Sensor não encontrado!");
        while (1) delay(10);
    }
}

void loop() {
    float temp = dht.readTemperature();
    float umid = dht.readHumidity();
    float pres = bmp.readPressure() / 100.0F; // converte Pa para hPa que é o padrão internacional
    if (!isnan(temp) && !isnan(umid) && !isnan(pres)) {
        Serial.print("{");
        Serial.print("\"temperatura\":"); Serial.print(temp);
        Serial.print(",\"umidade\":"); Serial.print(umid);
        Serial.print(",\"pressao\":"); Serial.print(pres);
        Serial.println("}");
    }
    delay(5000);
}