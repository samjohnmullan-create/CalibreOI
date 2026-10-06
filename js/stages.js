export const STAGE_COPY = {
  "Intake": {
    title: "Assessment",
    aim: "Establish condition, faults and the level of work before dismantling anything.",
    steps: [
      { id:"runs", text:"Is the watch running on arrival?" },
      { id:"winds", text:"Does it wind normally without slipping, binding or unusual noise?" },
      { id:"sets", text:"Do the hands set correctly through a full 12 hours?" },
      { id:"calendar", text:"Is a calendar or other setting complication fitted?" },
      { id:"calendarWorks", text:"Does the calendar/setting function operate correctly?", when:{ id:"calendar", value:"yes" } },
      { id:"magnetised", text:"Does a compass or hairspring check indicate magnetism?" },
      { id:"demag", text:"Has it been demagnetised before timing or diagnosis?", when:{ id:"magnetised", value:"yes" } },
      { id:"demagClear", text:"After demagnetising, is the magnetic pull gone?", when:{ id:"demag", value:"yes" } },
      { id:"external", text:"Are the crown, stem, crystal, case, strap/bracelet and movement security acceptable?" },
      { id:"decision", text:"Is the required level of work now clear?" }
    ]
  },
  "Pre-service timing": {
    title: "Pre-service timing",
    aim: "Record the watch before opening it further, but only if it runs well enough to measure.",
    steps: [
      { id:"timeable", text:"Is the watch running consistently enough to take a meaningful timing reading?" },
      { id:"du", text:"Has a dial-up timing reading been recorded?", when:{ id:"timeable", value:"yes" } },
      { id:"pu", text:"Has at least one vertical-position reading been recorded?", when:{ id:"timeable", value:"yes" } },
      { id:"beat", text:"Was the beat error noted before service?", when:{ id:"timeable", value:"yes" } },
      { id:"unstable", text:"If the trace is unstable, has that been recorded as a fault rather than regulated now?", when:{ id:"timeable", value:"yes" } }
    ]
  },
  "Uncasing": {
    title: "Uncasing",
    aim: "Separate the movement from the case without damaging the stem, dial or hands.",
    steps: [
      { id:"photos", text:"Were the dial, hands, case and movement photographed before dismantling?" },
      { id:"power", text:"If wound, was the mainspring power safely let down before movement work?" },
      { id:"stem", text:"Was the stem/crown removed without forcing the setting mechanism?" },
      { id:"movementOut", text:"Is the movement safely out of the case with clamps, screws and spacers accounted for?" },
      { id:"caseFault", text:"Was any loose movement, damaged stem, crown or case fault recorded?" }
    ]
  },
  "Dismantling & inspection": {
    title: "Dismantling & inspection",
    aim: "Inspect parts as they come apart so wear, damage and previous poor work are not missed.",
    steps: [
      { id:"handsDial", text:"Are hands and dial removed and protected?" },
      { id:"balanceFirst", text:"Was the balance removed and protected before train work?" },
      { id:"pallet", text:"Was the pallet fork removed before releasing the train?" },
      { id:"train", text:"Are train wheels, pivots, jewels and endshake inspected as they are dismantled?" },
      { id:"barrel", text:"Was the barrel opened and the mainspring, arbor, hook and barrel wall inspected?" },
      { id:"keyless", text:"Were the keyless works inspected for wear, damage and correct spring positions?" },
      { id:"esc", text:"Were escape-wheel teeth, pallet stones, roller jewel and banking checked?" },
      { id:"balance", text:"Were balance staff pivots, jewels and hairspring condition checked?" }
    ]
  },
  "Cleaning & parts inspection": {
    title: "Cleaning & final inspection",
    aim: "Clean components correctly, then inspect again when dirt and old oil are no longer hiding wear.",
    steps: [
      { id:"safeParts", text:"Were dial, hands, shellacked pallet/roller parts and other sensitive parts kept out of unsuitable cleaning fluids?" },
      { id:"cleaned", text:"Were plates, bridges, wheels and suitable steel parts cleaned and rinsed?" },
      { id:"jewels", text:"Were jewel holes pegged and pivots cleaned/pithed where appropriate?" },
      { id:"dry", text:"Are all components completely dry and free of residue?" },
      { id:"reinspect", text:"After cleaning, were pivots, jewels, teeth, screw heads and bearing surfaces inspected again?" },
      { id:"partsNeeded", text:"Are all required repair/replacement parts now identified?" }
    ]
  },
  "Repairs & parts": {
    title: "Repairs & parts",
    aim: "Correct faults before reassembly rather than trying to regulate around them.",
    steps: [
      { id:"partsRequired", text:"Are replacement parts required?" },
      { id:"partsReady", text:"Are all required replacement parts present and checked for fit?", when:{ id:"partsRequired", value:"yes" } },
      { id:"jewels", text:"Have damaged jewels, pivots, screws or train components been corrected?" },
      { id:"mainspring", text:"Has the mainspring/barrel fault been corrected if one was found?" },
      { id:"keyless", text:"Have winding and setting faults been corrected?" },
      { id:"balance", text:"Have balance/hairspring faults been corrected before reassembly?" }
    ]
  },
  "Reassembly & lubrication": {
    title: "Reassembly & lubrication",
    aim: "Lubrication belongs with assembly: apply the correct lubricant, in the correct quantity, as each system goes together.",
    steps: [
      { id:"barrel", text:"Is the barrel/mainspring assembled correctly with appropriate lubricant for the spring type?" },
      { id:"keyless", text:"Are keyless and motion works assembled and lubricated at their specified friction points?" },
      { id:"train", text:"Is the train assembled with pivots located correctly and bridges seated without force?" },
      { id:"free", text:"Before fitting the escapement, does the train run down freely with acceptable endshake?" },
      { id:"trainOil", text:"Are train jewels lubricated with suitable oil, without flooding or oil on wheel teeth/leaves?" },
      { id:"palletOil", text:"Are pallet stones/escape lubrication handled appropriately for this movement?" },
      { id:"hairspringDry", text:"Is the hairspring clean and dry?" }
    ]
  },
  "Train & escapement": {
    title: "Train & escapement",
    aim: "Confirm freedom of the going train and correct escapement action before relying on timing results.",
    steps: [
      { id:"runDown", text:"Does the train run down freely with no wheel or bridge contact?" },
      { id:"lock", text:"Is there secure lock on both pallet stones?" },
      { id:"drop", text:"Are drop and draw acceptable?" },
      { id:"guard", text:"Are guard pin and roller safety action correct?" },
      { id:"roller", text:"Is the roller jewel secure and correctly positioned?" }
    ]
  },
  "Balance & beat": {
    title: "Balance & beat",
    aim: "Fit the balance only after the train and escapement are right, then establish healthy oscillation and beat.",
    steps: [
      { id:"staff", text:"Do the balance pivots seat correctly with acceptable endshake and side shake?" },
      { id:"spring", text:"Is the hairspring flat, centred and clear through its full motion?" },
      { id:"starts", text:"Does the balance start and sustain oscillation without external help?" },
      { id:"beat", text:"Is beat error acceptable or corrected before rate regulation?" },
      { id:"positional", text:"Do positional differences suggest a balance, hairspring or poise issue requiring correction?" }
    ]
  },
  "Automatic works": {
    title: "Automatic winding",
    aim: "Service and verify the automatic winding system before the movement is cased.",
    steps: [
      { id:"rotor", text:"Does the rotor turn freely without case/bridge contact?" },
      { id:"bearing", text:"Is the rotor bearing/axle sound?" },
      { id:"reversers", text:"Are reverser wheels or winding transmission clean, free and correctly lubricated?" },
      { id:"winds", text:"Does rotor motion positively wind the mainspring?" }
    ]
  },
  "Case & pendant": {
    title: "Case & pendant",
    aim: "Pocket-watch case, bow, pendant, sleeve and stem faults are checked before movement work proceeds.",
    steps: [
      { id:"bow", text:"Is the bow secure and serviceable?" },
      { id:"pendant", text:"Is the pendant/sleeve free and functioning correctly?" },
      { id:"stem", text:"Does the stem engage winding and setting correctly?" },
      { id:"case", text:"Are case hinges, covers and movement seating sound?" }
    ]
  },
  "Casing & function": {
    title: "Casing & function",
    aim: "Refit dial, hands and movement, then verify every user function before final regulation.",
    steps: [
      { id:"dial", text:"Is the dial secure and correctly seated?" },
      { id:"hands", text:"Are hands correctly aligned and clear of each other, the dial and crystal?" },
      { id:"calendar", text:"Does the calendar/setting system change correctly if fitted?", whenGlobal:{ stage:"Intake", id:"calendar", value:"yes" } },
      { id:"stem", text:"Do winding, hand-setting and crown positions operate correctly after casing?" },
      { id:"secure", text:"Is the movement secure in the case with clamps/spacers correctly fitted?" },
      { id:"case", text:"Are case back, crystal and crown correctly fitted and clean?" }
    ]
  },
  "Case / hands / crystal": {
    title: "Case, hands or crystal",
    aim: "For external or dial-side work where a full movement service is not required.",
    steps: [
      { id:"fault", text:"Is the exact external/dial-side fault identified?" },
      { id:"movementProtected", text:"Is the movement protected from dust and damage while the work is carried out?" },
      { id:"repair", text:"Has the case, crystal, crown, hand or dial-side repair been completed?" },
      { id:"function", text:"After the repair, do winding, setting, hand clearance and case fit all check correctly?" }
    ]
  },
  "Regulation": {
    title: "Timing & regulation",
    aim: "Regulate only after mechanical faults, beat and lubrication are settled.",
    steps: [
      { id:"stable", text:"Is the timing signal stable enough to trust?" },
      { id:"beat", text:"Is beat error acceptable before adjusting rate?", when:{ id:"stable", value:"yes" } },
      { id:"rate", text:"Has rate been adjusted to the target for this watch?", when:{ id:"stable", value:"yes" } },
      { id:"positions", text:"Have useful horizontal and vertical positions been checked after adjustment?", when:{ id:"stable", value:"yes" } },
      { id:"rerun", text:"After the final regulator move, was the watch allowed to settle and measured again?", when:{ id:"stable", value:"yes" } }
    ]
  },
  "Final QC": {
    title: "Final quality control",
    aim: "Verify the complete watch over time, not just the movement for a few seconds on the bench.",
    steps: [
      { id:"windSet", text:"Does the watch wind, set and operate all fitted functions correctly?" },
      { id:"hands", text:"Are hand alignment and clearance correct through a full cycle?" },
      { id:"case", text:"Is the movement secure and the case/crown/crystal correctly closed?" },
      { id:"timing", text:"Has final timing been recorded after casing?" },
      { id:"reserve", text:"Has useful running/power-reserve performance been checked after service?" },
      { id:"extended", text:"Has it completed an extended running test (ideally overnight/24 hours for a full service)?" },
      { id:"appearance", text:"Has the final visual and cleanliness check been completed?" }
    ]
  },
  "Battery & electrical": { title:"Battery & electrical", aim:"Start quartz diagnosis with the power source and contacts.", steps:[{id:"cell",text:"Is the cell correct, in date and at a useful voltage?"},{id:"contacts",text:"Are battery contacts clean and making correctly?"},{id:"knownCell",text:"Does the movement run on a known-good cell?"}] },
  "Movement inspection": { title:"Movement inspection", aim:"Inspect the quartz movement and mechanical load before replacing parts.", steps:[{id:"coil",text:"Is the coil/stepper area visually sound?"},{id:"train",text:"Is the train free rather than mechanically jammed?"},{id:"corrosion",text:"Is the movement free from leakage/corrosion damage?"}] },
  "Cleaning & contacts": { title:"Cleaning & contacts", aim:"Clean only appropriate quartz components and electrical contact surfaces.", steps:[{id:"contacts",text:"Are battery and circuit contacts clean?"},{id:"train",text:"Are mechanical train parts clean and free if the movement is serviceable?"}] },
  "Repair & reassembly": { title:"Repair & reassembly", aim:"Complete the required quartz repair, then verify current draw/function where possible.", steps:[{id:"repair",text:"Has the identified fault been corrected?"},{id:"reassembled",text:"Is the movement correctly reassembled and running?"}] },
  "Hands & calendar": { title:"Hands & calendar", aim:"Check hand clearance and calendar functions before casing.", steps:[{id:"hands",text:"Do hands clear each other, the dial and crystal?"},{id:"calendar",text:"Does the calendar operate correctly if fitted?"}] },
  "Inspection only": { title:"Inspection only", aim:"Document condition and faults without starting a service.", steps:[{id:"external",text:"Has external condition been documented?"},{id:"movement",text:"Has movement condition been inspected as far as authorised?"},{id:"faults",text:"Are faults and recommendations recorded clearly?"}] },
  "Case": { title:"Case", aim:"Check clock case and movement seating.", steps:[{id:"seat",text:"Is the movement correctly seated?"},{id:"dial",text:"Are dial, bezel and mounting points sound?"}] },
  "Clock inspection": { title:"Clock inspection", aim:"Inspect train, pivots, bushings, springs and escapement before cleaning.", steps:[{id:"train",text:"Are pivots and bushings inspected for wear?"},{id:"springs",text:"Are mainsprings and clicks safe and sound?"},{id:"esc",text:"Is escapement condition understood?"}] },
  "Clock cleaning": { title:"Clock cleaning", aim:"Clean and prepare components before repair/reassembly.", steps:[{id:"clean",text:"Are movement components cleaned and dry?"},{id:"holes",text:"Are pivot holes/bushings clean and inspected?"}] },
  "Clock reassembly": { title:"Clock reassembly", aim:"Repair, assemble and lubricate before testing strike and beat.", steps:[{id:"repair",text:"Are required bushings/repairs complete?"},{id:"assembly",text:"Is the train free after assembly?"},{id:"oil",text:"Are pivots lubricated appropriately?"}] },
  "Pendulum": { title:"Pendulum & beat", aim:"Set suspension, beat and free swing.", steps:[{id:"suspension",text:"Is the suspension spring sound?"},{id:"beat",text:"Is the clock in beat?"},{id:"clear",text:"Does the pendulum swing clear of the case?"}] },
  "Strike": { title:"Strike / chime", aim:"Only for a clock fitted with strike/chime work.", steps:[{id:"fitted",text:"Is strike/chime work fitted?"},{id:"warn",text:"Does warning and release operate correctly?",when:{id:"fitted",value:"yes"}},{id:"count",text:"Does it strike/chime the correct sequence?",when:{id:"fitted",value:"yes"}}] }
};
