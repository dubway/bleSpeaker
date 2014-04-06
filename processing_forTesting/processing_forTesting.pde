import oscP5.*;
import netP5.*;

OscP5 oscP5;

int value = 0;

void setup(){
  oscP5 = new OscP5(this,8080);
  size(800,800);
}

void draw(){
  background(value);
}

void oscEvent(OscMessage theOscMessage) {
  /* check if theOscMessage has the address pattern we are looking for. */
  if (theOscMessage.checkAddrPattern("/rssi")) {
    /* check if the typetag is the right one. */
    if (theOscMessage.checkTypetag("i")) {
      /* parse theOscMessage and extract the values from the osc message arguments. */
      value = theOscMessage.get(0).intValue();
    }
  }
}
