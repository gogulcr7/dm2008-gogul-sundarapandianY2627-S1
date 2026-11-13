int ledPin1 = 6;
int ledPin2 = 10;
int ledPin3 = 11;
float brightness = 0;
String recvString = "";

void setup() {

  // set LED pins to receive current from the MCU
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);

  //start serial communication:
  Serial.begin(9600);
}

void loop() {

  if(Serial.available() > 0){

    brightness = Serial.parseFloat();

    while (Serial.available() > 0 && Serial.peek() == '\n') {
      Serial.read(); 
    }
  }

  Serial.println(brightness);
  // receive brightness value from serail communication:

  if(brightness >= 200){
    int brightnessVal = ((brightness - 200)/55) * 255;
    analogWrite(ledPin1, brightnessVal);
    digitalWrite(ledPin2, HIGH);
    digitalWrite(ledPin3, HIGH);
  }
  else if(brightness >= 120){
    int brightnessVal = ((brightness - 120)/80) * 255;
    digitalWrite(ledPin1, LOW);
    analogWrite(ledPin2, brightnessVal);
    digitalWrite(ledPin3, HIGH);
  }
  else if(brightness >= 40){
    int brightnessVal = ((brightness - 40)/80) * 255;
    digitalWrite(ledPin1, LOW);
    digitalWrite(ledPin2, LOW);
    analogWrite(ledPin3, brightnessVal);
  }
  else if(brightness >= 0){
    int brightnessVal = (brightness/40) * 255;
    analogWrite(ledPin3, brightnessVal);
    delay(100);
    digitalWrite(ledPin3, LOW);
  }

  delay(100);
  // brightness--;

}
