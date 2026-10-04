export const STAGE_COPY = {
  "Intake": {
    title: "Initial check",
    aim: "Does it run, and does it need work? Do not strip a watch that only needs a decision.",
    steps: [
      "Wind fully. Does it take power, or does the click slip?",
      "Set the hands through twelve. Note a catch, a loose hand, or a cannon pinion that slips",
      "Dial up for a minute. Then pendant up. Running, stopping, or knocking?",
      "Look at the dial, hands, crystal, bow and stem before the case comes off",
      "Open the back only. Magnetism, a dry balance, or an obvious broken part",
      "Decide: leave it, regulate only, case work, partial, or full service"
    ]
  },
  "Demagnetising": {
    title: "Demagnetising",
    aim: "Only if a compass or the hairspring says it is magnetised.",
    steps: ["Confirm pull before you use the coil", "Draw it out slowly. Do not stop it in the field", "Check the hairspring again", "Skip this stage if there is no pull"]
  },
  "Strip-down": {
    title: "Strip-down",
    aim: "Only after the initial check says the movement has to come apart.",
    steps: ["Let the spring down before the ratchet screw", "Hands off, dial off, dial-foot screws with the dial", "Motion works, then the train. Balance last", "Each screw stays with its bridge", "Photograph a bridge before it lifts"]
  },
  "Inspection": {
    title: "Inspection",
    aim: "The fault named at intake, not a tour of every part.",
    steps: ["The part that stopped it, or made it slip", "Jewel hole for the affected pivot", "Endshake on that arbor", "Escape teeth and pallet stones only if the lock is wrong", "Staff pivots if the balance is down", "Barrel hook and bridle if the wind slips"]
  },
  "Cleaning": {
    title: "Cleaning",
    aim: "Clean what came out. Do not ultrasonic a dial or a shellacked spring.",
    steps: ["Peg the jewel holes that were in the train", "Pith the pivots that were out", "Lighter fluid or naphtha on plates and steel", "Isopropyl off the dial and off shellac", "Ultrasonic for plates and steel only", "Rinse, dry, peg again"]
  },
  "Barrel & Mainspring": {
    title: "Barrel and spring",
    aim: "Only if the wind slips, the spring is set, or the barrel was opened.",
    steps: ["Let down before the cover comes off", "Hook, bridle and cover snap", "Blued spring: oil the wall only", "White alloy: do not oil it", "Close and confirm it hooks"]
  },
  "Train Test": {
    title: "Train",
    aim: "Free run with the balance out. Skip if the train was never out.",
    steps: ["Train in, balance out", "One turn of wind, free rundown", "Endshake on each arbor that was out", "No wheel rubbing a bridge"]
  },
  "Escapement": {
    title: "Escapement",
    aim: "Lock, drop and draw. Skip if you are not in the escapement.",
    steps: ["Lock on both stones", "Drop and draw", "Guard pin through the passing hollow", "Roller jewel firm", "Set the beat before a rate"]
  },
  "Balance": {
    title: "Balance",
    aim: "Staff, spring and poise. Skip if the balance was not the fault.",
    steps: ["Staff pivots straight", "Hairspring flat and centred", "Overcoil clear of the stud", "Poise only if the rate changes by position"]
  },
  "Lubrication": {
    title: "Oil",
    aim: "Oil the pivots you cleaned. Do not oil a watch you did not open.",
    steps: ["Train pivots 9010, not on the leaves", "Pallet stones 9415 if they were cleaned", "Escape teeth, a film", "Barrel wall only if the spring is blued", "No oil on the hairspring"]
  },
  "Regulation": {
    title: "Regulation",
    aim: "After it is running cleanly, or if the decision was regulate only.",
    steps: ["Dial up, then pendant up", "Rate first, beat error second", "A small regulator move, then another run", "Do not move on a dirty signal"]
  },
  "Final QC": {
    title: "Finish",
    aim: "What you actually did, then a day on the rack if it was opened.",
    steps: ["Wind and set", "Hands clear", "Case closed and bow firm", "Demagnetise if it was apart", "Leave a serviced watch running a day"]
  }
};
