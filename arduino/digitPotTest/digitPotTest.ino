#include <SPI.h>

const int slaveSelectPin = 10;

void setup() {
  pinMode (slaveSelectPin, OUTPUT);
  SPI.begin(); 
  
  pinMode(A0,OUTPUT);
  pinMode(A4,OUTPUT);
  digitalWrite(A0,HIGH);
  digitalWrite(A4,LOW);
}

void loop() {
  digitalPotWrite(analogRead(A2)/4);
}

void digitalPotWrite(int value) {
  digitalWrite(slaveSelectPin,LOW);
  SPI.transfer(0);
  SPI.transfer(value);
  digitalWrite(slaveSelectPin,HIGH);  
  
  delay(2);
}
