///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

#include <SPI.h>

const int slaveSelectPin = 10;
const int ledPin = 3;

const int outputMax = 255;
const int outputMin = 40;

boolean follow = false;

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

void setup() {
  SPI.begin(); 
  Serial.begin(57600);
  
  pinMode (slaveSelectPin, OUTPUT);
  pinMode(ledPin,OUTPUT);
  
  digitalPotWrite(0);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

void loop() {
  while(Serial.available()>0){
    int val = Serial.parseInt();
    if(val>=0 && val<=255){
      digitalPotWrite(val);
    }
  }
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

void digitalPotWrite(int value) {
  if(!follow){
    value = 255-value;
  }
  
  int mappedValue = map(value,0,255,outputMin,outputMax);
  
  digitalWrite(slaveSelectPin,LOW);
  SPI.transfer(0);
  SPI.transfer(value);
  digitalWrite(slaveSelectPin,HIGH);
  
  analogWrite(ledPin,value);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
