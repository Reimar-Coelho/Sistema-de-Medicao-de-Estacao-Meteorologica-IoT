#include "DHT.h"
#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(9600);
    dht.begin();
}

void loop() {
    float temp = dht.readTemperature();
    float umid = dht.readHumidity();
    if (!isnan(temp) && !isnan(umid)) {
        Serial.print("{");
        Serial.print("\"temperatura\":"); Serial.print(temp);
        Serial.print(",\"umidade\":"); Serial.print(umid);
        Serial.println("}");
    }
    delay(5000);
}