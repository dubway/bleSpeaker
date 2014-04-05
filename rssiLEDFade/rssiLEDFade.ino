int pwmAmount = 0;

void setup(){
  Serial.begin(57600);
  pinMode(3,OUTPUT);
  pinMode(4,OUTPUT);
  digitalWrite(4,LOW);
  
  for(int i=0;i<3;i++){
    digitalWrite(3,HIGH);
    delay(200);
    digitalWrite(3,LOW);
    delay(200);
  }
}

void loop(){
  if(Serial.available()>0){
    int fade = Serial.parseInt();
    if(fade){
      pwmAmount = fade;
      while(Serial.available()>0){
        byte trash = Serial.read();
      }
    }
  }
  
  analogWrite(3,pwmAmount);
}
