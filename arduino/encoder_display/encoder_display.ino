//Import Libraries
#include <Adafruit_NeoPixel.h>
#include <Encoder.h>
#include <SPI.h>

// green = GROUND
// gray = GROUND
// purple = 5V

// LED.Ring
#define PIN 6               // white
Adafruit_NeoPixel strip = Adafruit_NeoPixel(16, PIN, NEO_GRB + NEO_KHZ800);

// Rotary Encoder
const int buttonPin = 7;   // orange
const int encoderPinL = 5; // yellow
const int encoderPinR = 3; // blue
Encoder myEnc(encoderPinL, encoderPinR);

int totalRotarySteps = 50;
int currentRotary = 0;

long previousMillis = 0;
long interval = 4000;
long oldPosition  = -999;
boolean on = false;

// Button State
int buttonPushCounter = 0;   // counter for the number of button presses
int buttonState = 0;         // current state of the button
int lastButtonState = 0;     // previous state of the button
int mode = 0;
int totalModes = 3;

int red = 0;
int green = 0;
int blue = 0;

// stuff for the transistors and BT board
int downVolumePin = 8;
int upVolumePin = 9;

int targetVolume = 0;
int currentVolume = 32;
const int maxVolume = 32;

const int buttonInterval = 200;
unsigned long buttonStamp = 0;

boolean buttonPressed = false;

unsigned long animationStamp = 0;
int animationInterval = 2000;
boolean isAnimating = true;

float glow = 0;
float glowStep = 0;

float animateRotStep = 0.004;
float animateRot = 0;

//////////////////////////////
//////////////////////////////
//////////////////////////////

void setup() {
  pinMode(buttonPin, INPUT);
  Serial.begin(9600);
  
  // LEDs
  strip.begin();
  strip.setBrightness(25);
  display(0); // MODE 0 is normal speaker mode (ignore RSSI)
  
  pinMode(upVolumePin,OUTPUT);
  pinMode(downVolumePin,OUTPUT);
  digitalWrite(upVolumePin,HIGH);
  digitalWrite(downVolumePin,HIGH);
  
  pinMode(13,OUTPUT);
  digitalWrite(13,LOW);
  
  float fill = 0;
  float stepSize = 1;
  
  Serial.println("going into setup mode");
  
  while(currentVolume>0){
    updateVolume();
    if((millis()/200)%2==0){
      digitalWrite(13,HIGH);
    }
    else{
      digitalWrite(13,LOW);
    }
    
    clear();
    for(int i = 0; i<17; i++){
      strip.setPixelColor(i, (int)fill, (int)fill, (int)fill);
    }
    strip.show();
    
    fill += stepSize;
    if(fill>255 || fill<0){
      stepSize*=-1;
      fill+=stepSize;
    }
  }
  Serial.println("calibrated");
  initAnimation();
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void loop() {
    
  checkSerial();
  
  // physical input stuff
  // notice we only write to the LEDs if a value has changed, using display()
  checkKnob();
  checkButton();
  updateVolume();
  updateAnimation();
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void checkSerial(){
  if(Serial.available()>=3){
    
    int tempTargetVolume = Serial.read();
    
    tempTargetVolume = (int) map(tempTargetVolume,0,127,0,maxVolume);
    
    int newMode = Serial.read();
    
    int newRotaryValue = Serial.read();
    
    if(newMode!=mode){
      mode = newMode;
      display(mode);
    }
    updateKnob(newRotaryValue,false);
    
    if(mode==1){
      setTargetVolume(tempTargetVolume);
    }
    else if(mode==2){
      setTargetVolume(maxVolume-tempTargetVolume);
    }
//    while(Serial.available()>0){
//      byte trash = Serial.read();
//    }
  }
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void checkButton(){
  buttonState = digitalRead(buttonPin);
  if (buttonState==LOW && buttonState!=lastButtonState) {
   int tempMode = (mode+1)%totalModes;
   if(tempMode!=mode){
     Serial.print("m,");
     Serial.println(tempMode);
     display(tempMode);
   }
   mode = tempMode;
  }
  lastButtonState = buttonState;
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void checkKnob(){
  long newPosition = myEnc.read();
  unsigned long currentMillis = millis();
  
  if(newPosition != oldPosition && newPosition > oldPosition+1){
    updateKnob(currentRotary-1,true);
    oldPosition = newPosition;
  }
  else if(newPosition != oldPosition && newPosition < oldPosition-1){
    updateKnob(currentRotary+1,true);
    oldPosition = newPosition;
  }
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void updateKnob(int tempRotVal,boolean internal){
  if(tempRotVal>totalRotarySteps){
    tempRotVal = totalRotarySteps;
  }
  else if(tempRotVal<0){
    tempRotVal = 0;
  }
  if(tempRotVal!=currentRotary){
    if(internal){
      Serial.print("v,");
      Serial.println(tempRotVal);
    }
    display(-1); // just update the position, not the color
  }
  currentRotary = tempRotVal;
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void setTargetVolume(int tempTarget){
  // set the maximum volume to be where the rotary encoder is
  int tempMaxVolume = (int) map(currentRotary,0,totalRotarySteps,0,maxVolume);
  if(tempTarget>tempMaxVolume){
    tempTarget = tempMaxVolume;
  }
  targetVolume = tempTarget;
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void updateVolume(){
  if(mode==0){
    targetVolume = map(currentRotary,0,totalRotarySteps,0,maxVolume);
  }
  else{
    int tempMaxVolume = (int) map(currentRotary,0,totalRotarySteps,0,maxVolume);
    if(targetVolume>tempMaxVolume){
      targetVolume = tempMaxVolume;
    }
  }
  if(!buttonPressed && currentVolume!=targetVolume){
    buttonStamp = millis();
    buttonPressed = true;
    if(currentVolume<targetVolume){
      digitalWrite(upVolumePin,LOW);
      digitalWrite(downVolumePin,HIGH);
      currentVolume++;
      if(currentVolume>maxVolume){
        currentVolume = maxVolume;
      }
    }
    else if(currentVolume>targetVolume){
      digitalWrite(upVolumePin,HIGH);
      digitalWrite(downVolumePin,LOW);
      currentVolume--;
      if(currentVolume<0){
        currentVolume = 0;
      }
    }
  }
  else if(buttonPressed && buttonStamp+buttonInterval<millis()){
    buttonPressed = false;
    digitalWrite(upVolumePin,HIGH);
    digitalWrite(downVolumePin,HIGH);
  }
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void updateAnimation(){
  if(animationStamp+animationInterval>millis()){
    // show the animation stuff
    animate();
  }
  else if(isAnimating){
    showVolumeMeter();
    isAnimating = false;
  }
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void animate(){
  clear();
  
  int animateOffset = (sin(animateRot)+1)*2; // sine wave from 0-4;
  animateRot += animateRotStep;
  
  int totalLeds = 17;
  int thingWidth = 3;
  
  glow += glowStep;
  if(glow>1){
    glow = 1;
    glowStep *= -1;
  }
  if(glow<0){
    glow = 0;
    glowStep *= -1;
  }
  
  if(mode==0){
    int totalLeds = 17;
    float r = red;
    float g = green;
    float b = blue;
    for(int i = animateOffset-thingWidth; i<animateOffset; i++){
      int index = (i+6)%totalLeds;
      if(index<0){
        index = (i+6)+totalLeds;
      }
      strip.setPixelColor(index, (int)r, (int)g, (int)b);
    }
    for(int i = animateOffset+(totalLeds/2)-thingWidth; i<animateOffset+(totalLeds/2); i++){
      int index = (i+6)%totalLeds;
      if(i<0){
        index = (i+6)+totalLeds;
      }
      strip.setPixelColor(index, (int)r, (int)g, (int)b);
    }
  }
  else if(mode==1){
    for(int i = animateOffset-thingWidth; i<animateOffset+thingWidth; i++){
      int index = i%totalLeds;
      if(i<0){
        index = i+totalLeds;
      }
      strip.setPixelColor(index, red, green, blue);
    }
    int i = animateOffset+totalLeds/2;
    int index = i;
    if(i>0){
      index = i%totalLeds;
    }
    else{
      index = i+totalLeds;
    }
    float r = ((float)red) * glow;
    float g = ((float)green) * glow;
    float b = ((float)blue) * glow;
    strip.setPixelColor(index, (int)r, (int)g, (int)b);
    
  }
  else if(mode==2){
    int count = 0;
    for(int i = animateOffset-thingWidth; i<animateOffset+thingWidth; i++){
      int index = i%totalLeds;
      if(i<0){
        index = i+totalLeds;
      }
      if(count==thingWidth){
        float r = ((float)red) * glow;
        float g = ((float)green) * glow;
        float b = ((float)blue) * glow;
        strip.setPixelColor(index, (int)r, (int)g, (int)b);
      }
      else{
        strip.setPixelColor(index, red, green, blue);
      }
      count++;
    }
  }
  
  strip.show();
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void initAnimation(){
  animationStamp = millis();
  animateRot = 0;
  glow = 0;
  glowStep = 0.01;
  clear();
  strip.show();
  isAnimating = true;
}

//////////////////////////////
//////////////////////////////
//////////////////////////////

void display(int a){
  
  // green is NORMAL
  // red is FILL
  // green is FOLLOW
  
  if(a == 0){
    red = 0;
    green = 0;
    blue = 255;
    initAnimation();
  }
  else if(a == 1){
    red = 255;
    green = 0;
    blue = 0;
    initAnimation();
  }
  else if(a == 2){
    red = 0;
    green = 255;
    blue = 0;
    initAnimation();
  }
  else if(a<0 && !isAnimating){
    showVolumeMeter();
  }
}

void showVolumeMeter(){
  clear();
  int pixelAmount = (int)map(totalRotarySteps-currentRotary,0,totalRotarySteps,0,17);
  for(int i = 16; i>=pixelAmount; i--){
    strip.setPixelColor(i, red, green, blue);
  }
  for(int i = 0; i<pixelAmount; i++){
    strip.setPixelColor(i, 0, 0, 0);
  }
  
  strip.show();
}

void clear(){
    for(int i = 0; i<=16; i++){
      strip.setPixelColor(i, 0, 0, 0);
    }
}
