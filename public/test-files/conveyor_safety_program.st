PROGRAM ConveyorControl
VAR
    (* Input Variables *)
    bStartButton        : BOOL := FALSE;  (* Start button input *)
    bStopButton         : BOOL := FALSE;  (* Stop button input *)
    bEmergencyStop      : BOOL := FALSE;  (* Emergency stop button *)
    bSafetyGate1        : BOOL := FALSE;  (* Safety gate 1 position *)
    bSafetyGate2        : BOOL := FALSE;  (* Safety gate 2 position *)
    bLightCurtain       : BOOL := FALSE;  (* Light curtain status *)
    bMotorFeedback      : BOOL := FALSE;  (* Motor contactor feedback *)
    rConveyorSpeed      : REAL := 0.0;    (* Conveyor speed setpoint *)
    
    (* Output Variables *)
    bMotorStart         : BOOL := FALSE;  (* Motor start command *)
    bMotorStop          : BOOL := FALSE;  (* Motor stop command *)
    bAlarmLight         : BOOL := FALSE;  (* Alarm indicator *)
    bWarningLight       : BOOL := FALSE;  (* Warning indicator *)
    
    (* Internal Variables *)
    bSystemEnable       : BOOL := FALSE;  (* System enable internal *)
    bSafetyOK           : BOOL := FALSE;  (* Safety conditions OK *)
    bSystemRunning      : BOOL := FALSE;  (* System running status *)
    iProductionCounter  : INT := 0;       (* Production counter *)
    
    (* Timers *)
    TON_StartDelay      : TON;            (* Start delay timer *)
    TON_AlarmDelay      : TON;            (* Alarm delay timer *)
    
    (* Constants *)
    CONVEYOR_MAX_SPEED  : REAL := 100.0;  (* Maximum conveyor speed *)
    START_DELAY_TIME    : TIME := T#2S;    (* Start delay time *)
    ALARM_DELAY_TIME    : TIME := T#5S;    (* Alarm delay time *)
END_VAR

(* Safety Logic *)
bSafetyOK := bEmergencyStop AND bSafetyGate1 AND bSafetyGate2 AND bLightCurtain;

(* System Enable Logic *)
bSystemEnable := bSafetyOK AND NOT bStopButton;

(* Start Logic with Delay *)
TON_StartDelay(IN := bStartButton AND bSystemEnable AND NOT bSystemRunning, PT := START_DELAY_TIME);

(* Motor Control Logic *)
IF TON_StartDelay.Q THEN
    bMotorStart := TRUE;
    bMotorStop := FALSE;
    bSystemRunning := TRUE;
ELSIF NOT bSystemEnable OR bStopButton THEN
    bMotorStart := FALSE;
    bMotorStop := TRUE;
    bSystemRunning := FALSE;
END_IF;

(* Alarm Logic *)
TON_AlarmDelay(IN := NOT bSafetyOK, PT := ALARM_DELAY_TIME);
bAlarmLight := TON_AlarmDelay.Q;
bWarningLight := NOT bSafetyOK AND NOT TON_AlarmDelay.Q;

(* Production Counter *)
IF bSystemRunning AND bMotorFeedback THEN
    iProductionCounter := iProductionCounter + 1;
END_IF;

(* Speed Control *)
IF bSystemRunning THEN
    rConveyorSpeed := CONVEYOR_MAX_SPEED;
ELSE
    rConveyorSpeed := 0.0;
END_IF;

END_PROGRAM


FUNCTION_BLOCK FB_SafetyMonitor
VAR_INPUT
    bEmergencyStops     : ARRAY[1..4] OF BOOL;  (* Emergency stop buttons *)
    bSafetyGates        : ARRAY[1..8] OF BOOL;  (* Safety gate positions *)
    bLightCurtains      : ARRAY[1..2] OF BOOL;  (* Light curtain statuses *)
    bSafetyMats         : ARRAY[1..4] OF BOOL;  (* Safety mat statuses *)
    bEStopReset         : BOOL;                 (* Emergency stop reset *)
END_VAR

VAR_OUTPUT
    bSafetySystemOK     : BOOL := FALSE;        (* Overall safety status *)
    bSafetyAlarm        : BOOL := FALSE;        (* Safety alarm active *)
    wAlarmCode          : WORD := 0;            (* Alarm code *)
    sSafetyMessage      : STRING(80) := '';     (* Safety status message *)
END_VAR

VAR
    bAllEStopsOK        : BOOL;
    bAllGatesOK         : BOOL;
    bAllCurtainsOK      : BOOL;
    bAllMatsOK          : BOOL;
    i                   : INT;
END_VAR

(* Check Emergency Stops *)
bAllEStopsOK := TRUE;
FOR i := 1 TO 4 DO
    IF NOT bEmergencyStops[i] THEN
        bAllEStopsOK := FALSE;
        wAlarmCode := 1000 + i;
        sSafetyMessage := 'Emergency Stop Active';
        EXIT;
    END_IF;
END_FOR;

(* Check Safety Gates *)
bAllGatesOK := TRUE;
FOR i := 1 TO 8 DO
    IF NOT bSafetyGates[i] THEN
        bAllGatesOK := FALSE;
        wAlarmCode := 2000 + i;
        sSafetyMessage := 'Safety Gate Open';
        EXIT;
    END_IF;
END_FOR;

(* Check Light Curtains *)
bAllCurtainsOK := TRUE;
FOR i := 1 TO 2 DO
    IF NOT bLightCurtains[i] THEN
        bAllCurtainsOK := FALSE;
        wAlarmCode := 3000 + i;
        sSafetyMessage := 'Light Curtain Blocked';
        EXIT;
    END_IF;
END_FOR;

(* Check Safety Mats *)
bAllMatsOK := TRUE;
FOR i := 1 TO 4 DO
    IF NOT bSafetyMats[i] THEN
        bAllMatsOK := FALSE;
        wAlarmCode := 4000 + i;
        sSafetyMessage := 'Safety Mat Activated';
        EXIT;
    END_IF;
END_FOR;

(* Overall Safety Status *)
bSafetySystemOK := bAllEStopsOK AND bAllGatesOK AND bAllCurtainsOK AND bAllMatsOK;
bSafetyAlarm := NOT bSafetySystemOK;

(* Clear alarm message when system is OK *)
IF bSafetySystemOK THEN
    wAlarmCode := 0;
    sSafetyMessage := 'Safety System OK';
END_IF;

END_FUNCTION_BLOCK
