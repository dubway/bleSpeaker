int downVolumePin = 3;
int upVolumePin = 4;

int targetVolume = 0;
int currentVolume = 32;
const int maxVolume = 32;

const int buttonInterval = 200;
unsigned long buttonStamp = 0;

boolean buttonPressed = false;

void setup() {
  // writing that pin LOW will "press" that button
  
  pinMode(upVolumePin,OUTPUT);
  pinMode(downVolumePin,OUTPUT);
  digitalWrite(upVolumePin,HIGH);
  digitalWrite(downVolumePin,HIGH);
  
  pinMode(13,OUTPUT);
  digitalWrite(13,LOW);
  
  Serial.begin(9600);
  
  while(currentVolume!=0){
    updateVolume();
  }
}

void loop() {
  while(Serial.available()>0){
    targetVolume = Serial.read();
  }
  updateVolume();
}

void updateVolume(){
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
    
    Serial.print("target: ");
    Serial.print(targetVolume);
    Serial.print(" , current: ");
    Serial.println(currentVolume);
  }
}
