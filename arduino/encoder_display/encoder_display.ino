//Import Libraries
#include <Adafruit_NeoPixel.h>
#include <Encoder.h>

// Pins
#define PIN 6                // LED - Data in
const int buttonPin = 7;    // Button - Encoder
const int encoderPinL = 5;
const int encoderPinR = 3;

// LED.Ring
Adafruit_NeoPixel strip = Adafruit_NeoPixel(16, PIN, NEO_GRB + NEO_KHZ800);
Encoder myEnc(encoderPinL, encoderPinR);

// Rotary Encoder
long previousMillis = 0;
long interval = 4000;
long oldPosition  = -999;
int volume = 15;
boolean on = false;

// Button State
int buttonPushCounter = 0;   // counter for the number of button presses
int buttonState = 0;         // current state of the button
int lastButtonState = 0;     // previous state of the button
int mode = 0;

const int maxVolume = 50;
const int totalModes = 4;

int red = 0;
int green = 0;
int blue = 0;


void setup() {
  pinMode(buttonPin, INPUT);
  Serial.begin(9600);
  
  // LEDs
  strip.begin();
  strip.setBrightness(25);
  display(0);
  //strip.show();              // Initialize all pixels to 'off'
}

void loop() {
    
  checkSerial();
  
  // physical input stuff
  // notice we only write to the LEDs if a value has changed, using display()
  checkKnob();
  checkButton();
}

void checkSerial(){
  if(Serial.available()>=2){
    
    int tempVolume = Serial.read();
    int tempMode = Serial.read();
    
    if(tempMode<totalModes && tempMode>=0 && tempMode!=mode){
      mode = tempMode;
    }
    
    if(volume!=tempVolume){
      updateVolume(tempVolume,false);
    }
    else{
      display(mode);
    }
  }
}


// ------------------------------------------------------------------- Main Control / Encoder + LED.Ring

void checkButton(){
  buttonState = digitalRead(buttonPin);
  if (buttonState != lastButtonState) {
    if (buttonState == HIGH) {
      buttonPushCounter++;
    } 
    else {
     int tempMode = (mode+1)%totalModes;
     if(tempMode!=mode){
       Serial.print("m,");
       Serial.println(tempMode);
       display(tempMode);
     }
     mode = tempMode;
    }
  }
  lastButtonState = buttonState;
}

void checkKnob(){
  long newPosition = myEnc.read();
  unsigned long currentMillis = millis();
  
  if(newPosition != oldPosition && newPosition > oldPosition+1){
    updateVolume(volume-1,true);
    oldPosition = newPosition;
  }
  else if(newPosition != oldPosition && newPosition < oldPosition-1){
    updateVolume(volume+1,true);
    oldPosition = newPosition;
  }
}

void updateVolume(int tempVolume,boolean internal){
  if(tempVolume>maxVolume){
    tempVolume = maxVolume;
  }
  else if(tempVolume<0){
    tempVolume = 0;
  }
  if(tempVolume!=volume){
    if(internal){
      Serial.print("v,");
      Serial.println(tempVolume);
    }
    display(-1); // just update the position, not the color
  }
  volume = tempVolume;
}

/////////   NEO-PIXEL STUFF IS DOWN HERE

void display(int a){
  clear();
  
  if(a == 0){
    red = 0;
    green = 255;
    blue = 0;
  }
  else if(a == 1){
    red = 0;
    green = 0;
    blue = 255;
  }
  else if(a == 2){
    red = 255;
    green = 255;
    blue = 255;
  }
  else if(a == 3){
    red = 255;
    green = 0;
    blue = 0;
  }
  
  int volumePixelAmount = (int)map(maxVolume-volume,0,maxVolume,0,17);
  for(int i = 16; i>=volumePixelAmount; i--){
    strip.setPixelColor(i, red, green, blue);
  }
  for(int i = 0; i<volumePixelAmount; i++){
    strip.setPixelColor(i, 0, 0, 0);
  }
  
  strip.show();
}

void clear(){
    for(int i = 0; i<=16; i++){
      strip.setPixelColor(i, 0, 0, 0);
    }
}
