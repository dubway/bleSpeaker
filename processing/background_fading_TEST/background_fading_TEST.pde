import oscP5.*;
import netP5.*;

OscP5 oscP5;

int brightness;

void setup(){
  size(800,800);
  brightness = 0;
  oscP5 = new OscP5(this,8080);
  textAlign(CENTER);
  textSize(150);
}

void draw(){
  background(brightness);
  fill(255-brightness);
  int percentage = (int)((255/((float)brightness)*100);
  text(brightness, width/2, height/2);
}

void oscEvent(OscMessage theOscMessage) {
  if (theOscMessage.checkAddrPattern("/rssi")) {
    brightness = theOscMessage.get(0).intValue();  
  }
  println(brightness);
}
