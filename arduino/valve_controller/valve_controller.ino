#include <Servo.h>
#include <Arduino.h>

const int NUM_VALVES = 4;
const int TOGGLE_TICKS = 5;     // debounce threshold - Needs to go 5 times in a counter
const int SERVO_OPEN_ANGLE = 95; // angle is fixed to open - 95 - Ravi Check  
const int SERVO_CLOSED_ANGLE = 0;   // angle is fixed to close

/********* PLC command inputs  *************/
const int plcCmdPins[NUM_VALVES] = {10, 11, 12, 13};

 // const int plcCmdPins[NUM_VALVES] = {13, 12, 11, 10};

// /********* PLC status outputs *************/
// const int plcStatusPins[NUM_VALVES] = {6, 7, 8, 9};

/********* Servo PWM outputs *************/
const int servoPins[NUM_VALVES] = {2, 3, 4, 5};

/********* Ground pins (A0-A3 on Mega) *************/
const int groundPins[NUM_VALVES] = {17, 16, 15, 14};

/********* LabJack outputs (command states) *************/
// Valve 1 -> DIO0 (pin 29), Valve 2 -> DIO1 (pin 28), Valve 3 -> DIO2 (pin 27), Valve 4 -> DIO3 (pin 26)
const int labjackStatePins[NUM_VALVES] = {29, 28, 27, 26};

/* ===================== STATE ===================== */

Servo valves[NUM_VALVES];

bool valveState[NUM_VALVES] = {false, false, false, false};   // false = closed
int debounceCounter[NUM_VALVES] = {0, 0, 0, 0};
bool lastFeedbackState[NUM_VALVES] = {false, false, false, false};  // track previous feedback state

/* ===================== SETUP ===================== */

void setup() {

  Serial.begin(9600);
  delay(50);

  // PLC command inputs
  for (int i = 0; i < NUM_VALVES; i++) {
    pinMode(plcCmdPins[i], INPUT);
    pinMode(groundPins[i], OUTPUT);

    // pinMode(plcStatusPins[i], OUTPUT);
    pinMode(labjackStatePins[i], OUTPUT);
    // No LabJack feedback pins in this setup.
    

    valves[i].attach(servoPins[i]);
    valves[i].write(SERVO_CLOSED_ANGLE);

    // outputs now - set to LOW (ground)
    digitalWrite(groundPins[i], LOW);
    lastFeedbackState[i] = false;
  }
}


void loop() { // The Main Loop - Check with SAM?
  for (int i = 0; i < NUM_VALVES; i++) {
    handleValve(i);
  }
}

void handleValve(int i) { // The Function
  bool plcCommand = digitalRead(plcCmdPins[i]);
  bool desiredState = plcCommand;  // HIGH = open, LOW = closed

  

  // Debounce Logic:
  if (desiredState != valveState[i]) {
    debounceCounter[i]++;
  } else {
    debounceCounter[i] = 0;
  }
  
  if (debounceCounter[i] >= TOGGLE_TICKS) {
    valveState[i] = desiredState;
    debounceCounter[i] = 0;

    // State changed - log it
    Serial.print("Valve ");
    Serial.print(i + 1);
    Serial.print(" -> ");
    Serial.print(valveState[i] ? "OPEN" : "CLOSED");
    Serial.print(" (angle=");
    Serial.print(valveState[i] ? SERVO_OPEN_ANGLE : SERVO_CLOSED_ANGLE);
    Serial.println(")");
  }

  // Drive Servo  
  if (valveState[i]) {
    valves[i].write(SERVO_OPEN_ANGLE);
  } else {
    valves[i].write(SERVO_CLOSED_ANGLE);
  }


  // PLC Status Output (disabled)
  // digitalWrite(plcStatusPins[i], valveState[i]);

  // LabJack Ojutputs
  digitalWrite(labjackStatePins[i], valveState[i]);
}
