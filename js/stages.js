export const STAGE_COPY = {
  "Intake": {
    title: "Initial check",
    aim: "Does it run, and does it need work? Do not strip a watch that only needs a decision.",
    steps: [
      "Does it take a full wind, without the click slipping?",
      "Do the hands pass twelve without a catch or a slip?",
      "Dial up, then pendant up: does it run without knocking?",
      "Are the dial, hands, crystal, bow and stem sound before the case comes off?",
      "With the back open only: is it free of magnetism, a dry balance, and an obvious broken part?",
      "Is the work decided?"
    ]
  },
  "Demagnetising": {
    title: "Demagnetising",
    aim: "Only if a compass or the hairspring says it is magnetised.",
    steps: [
      "Is there pull on a compass or the hairspring?",
      "Was it drawn out slowly, without stopping in the field?",
      "Is the hairspring free of pull now?"
    ]
  },
  "Strip-down": {
    title: "Strip-down",
    aim: "Only after the initial check says the movement has to come apart.",
    steps: [
      "Was the spring let down before the ratchet screw?",
      "Are the hands off, the dial off, and the dial-foot screws with the dial?",
      "Did the motion works come off before the train, and the balance last?",
      "Is each screw still with its bridge?",
      "Was the bridge photographed before it lifted?"
    ]
  },
  "Inspection": {
    title: "Inspection",
    aim: "The fault named at intake, not a tour of every part.",
    steps: [
      "Is the part that stopped it, or made it slip, identified?",
      "Is the jewel hole for that pivot sound?",
      "Is the endshake on that arbor acceptable?",
      "Were the escape teeth and pallet stones looked at?",
      "Are the staff pivots straight?",
      "Are the barrel hook and bridle sound?"
    ]
  },
  "Cleaning": {
    title: "Cleaning",
    aim: "Clean what came out. Do not ultrasonic a dial or a shellacked spring.",
    steps: [
      "Were the jewel holes that were in the train pegged?",
      "Were the pivots that were out pithed?",
      "Were the plates and steel cleaned in lighter fluid or naphtha?",
      "Were the dial and the shellac kept out of alcohol and out of the ultrasonic?",
      "Was the ultrasonic limited to plates and steel?",
      "Has it been rinsed, dried, and pegged again?"
    ]
  },
  "Barrel & Mainspring": {
    title: "Barrel and spring",
    aim: "Only if the wind slips, the spring is set, or the barrel was opened.",
    steps: [
      "Was it let down before the cover came off?",
      "Are the hook, bridle and cover snap sound?",
      "If the spring is blued, is only the wall oiled?",
      "If the spring is white alloy, was it left dry?",
      "Does it hook after it is closed?"
    ]
  },
  "Train Test": {
    title: "Train",
    aim: "Free run with the balance out. Skip if the train was never out.",
    steps: [
      "Is the train in, with the balance out?",
      "One turn of wind: does it run down freely?",
      "Is the endshake acceptable on each arbor that was out?",
      "Is every wheel clear of the bridges?"
    ]
  },
  "Escapement": {
    title: "Escapement",
    aim: "Lock, drop and draw. Skip if you are not in the escapement.",
    steps: [
      "Is there lock on both stones?",
      "Are the drop and the draw correct?",
      "Does the guard pin pass through the hollow?",
      "Is the roller jewel firm?",
      "Is the beat set before a rate?"
    ]
  },
  "Balance": {
    title: "Balance",
    aim: "Staff, spring and poise. Skip if the balance was not the fault.",
    steps: [
      "Are the staff pivots straight?",
      "Is the hairspring flat and centred?",
      "Is the overcoil clear of the stud?",
      "Does the rate change by position enough to need poising?"
    ]
  },
  "Lubrication": {
    title: "Oil",
    aim: "Oil the pivots you cleaned. Do not oil a watch you did not open.",
    steps: [
      "Are the train pivots oiled with 9010, and not the leaves?",
      "Are the pallet stones oiled with 9415?",
      "Do the escape teeth have a film of oil?",
      "If the spring is blued, is the barrel wall oiled?",
      "Is the hairspring dry?"
    ]
  },
  "Regulation": {
    title: "Regulation",
    aim: "After it is running cleanly, or if the decision was regulate only.",
    steps: [
      "Has it been run dial up, then pendant up?",
      "Was the rate taken before the beat error?",
      "After a regulator move, was it run again?",
      "Was the signal clean enough to trust?"
    ]
  },
  "Final QC": {
    title: "Finish",
    aim: "What you actually did, then a day on the rack if it was opened.",
    steps: [
      "Does it wind and set?",
      "Are the hands clear?",
      "Is the case closed and the bow firm?",
      "If it was apart, has it been demagnetised?",
      "If it was opened, has it been left running a day?"
    ]
  },
  "Rotor": { title: "Rotor", aim: "The automatic works, not the going train.", steps: ["Does the rotor swing free?", "Does winding from the rotor take up the spring?", "Is the reversing wheel sound?"] },
  "Case and strap": { title: "Case and strap", aim: "What is missing or damaged before the movement is blamed.", steps: ["Is the strap present and sound?", "Is the crown attached and able to pull?", "Is the case back secure?"] },
  "Battery": { title: "Battery", aim: "A quartz watch starts here, not at the barrel.", steps: ["Is the cell the right size and in date?", "Are the contacts clean and making?", "Does it run on a known cell?"] },
  "Movement secure": { title: "Movement secure", aim: "A loose movement is a case fault.", steps: ["Are the case clamps or screws holding the movement?", "Does the stem stay in place?"] },
  "Hands and calendar": { title: "Hands and calendar", aim: "Setting and the date, if it has one.", steps: ["Do the hands pass without a catch?", "Does the calendar change, if fitted?"] },
  "Bow and pendant": { title: "Bow and pendant", aim: "Pocket-watch parts a wristwatch does not have.", steps: ["Is the bow sound?", "Does the pendant wind and set?", "Is the sleeve free?"] },
  "Case": { title: "Case", aim: "The clock case and the seat of the movement.", steps: ["Is the movement seated?", "Are the dial feet and the bezel sound?"] },
  "Pendulum": { title: "Pendulum", aim: "Length, beat, and a free swing.", steps: ["Is the suspension spring sound?", "Is it in beat?", "Does it swing free of the case?"] },
  "Strike": { title: "Strike", aim: "Only if this clock strikes or chimes.", steps: ["Does it warn?", "Does it strike the right count?", "Is the rack or countwheel free?"] }
};
