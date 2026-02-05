#include <Servo.h>

const int NUM_VALVES = 4;
const int TOGGLE_TICKS = 5;     // debounce threshold - Needs to go 5 times in a counter
const int SERVO_OPEN_ANGLE = 90; // angle is fixed to open - 90 - Ravi Check  
const int SERVO_CLOSED_ANGLE = 0;   // angle is fixed to close

/********* PLC command inputs  *************/
const int plcCmdPins[NUM_VALVES] = {10, 11, 12, 13};

/********* PLC status outputs *************/
const int plcStatusPins[NUM_VALVES] = {6, 7, 8, 9};

/********* Servo PWM outputs *************/
const int servoPins[NUM_VALVES] = {5, 4, 3, 2};

/********* Feedback digital inputs (A0-A3 on Mega) *************/
const int feedbackPins[NUM_VALVES] = {14, 15, 16, 17};

/********* LabJack outputs (state + feedback) *************/
const int labjackStatePins[NUM_VALVES] = {22, 24, 26, 28};
const int labjackFeedbackPins[NUM_VALVES] = {23, 25, 27, 29};

/* ===================== STATE ===================== */

Servo valves[NUM_VALVES];

bool valveState[NUM_VALVES] = {false, false, false, false};   // false = closed
int debounceCounter[NUM_VALVES] = {0, 0, 0, 0};

/* ===================== SETUP ===================== */

void setup() {

  // PLC command inputs
  for (int i = 0; i < NUM_VALVES; i++) {
    pinMode(plcCmdPins[i], INPUT);
    pinMode(feedbackPins[i], INPUT);

    pinMode(plcStatusPins[i], OUTPUT);
    pinMode(labjackStatePins[i], OUTPUT);
    pinMode(labjackFeedbackPins[i], OUTPUT);

    valves[i].attach(servoPins[i]);
    valves[i].write(SERVO_CLOSED_ANGLE);
  }
}


void loop() { // The Main Loop 
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
  }

  // Drive Servo  
  if (valveState[i]) {
    valves[i].write(SERVO_OPEN_ANGLE);
  } else {
    valves[i].write(SERVO_CLOSED_ANGLE);
  }

  // PLC Status Output
  digitalWrite(plcStatusPins[i], valveState[i]);

  // LabJack Ojutputs
  digitalWrite(labjackStatePins[i], valveState[i]);
  digitalWrite(labjackFeedbackPins[i], digitalRead(feedbackPins[i]));
}
