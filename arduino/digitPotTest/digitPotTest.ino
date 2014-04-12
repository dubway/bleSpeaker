///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

#include <SPI.h>

const int slaveSelectPin = 10;
const int ledPin = 3;

const int outputMax = 255;
const int outputMin = 40;

boolean follow = true;

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
  int mappedValue;
  if(follow){
    mappedValue = map(value,0,255,outputMin,outputMax);
  }
  else{
    mappedValue = map(value,0,255,outputMax,outputMin);
  }
  
  digitalWrite(slaveSelectPin,LOW);
  SPI.transfer(0);
  SPI.transfer(value);
  digitalWrite(slaveSelectPin,HIGH);
  
  analogWrite(ledPin,value);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
