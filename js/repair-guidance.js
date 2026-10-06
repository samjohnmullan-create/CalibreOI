// Source-backed diagnostic guidance for Calibre.
// Generic guidance is deliberately conservative. Calibre-specific technical sheets should override it when available.

const G=(inspect=[],repair=[],parts=[],sources=[])=>({inspect,repair,parts,sources});

export const SOURCES={
  awciLub:{label:"AWCI · General Lubrication Chart",url:"https://www.awci.com/wp-content/uploads/2020/05/Lubrication-1B.pdf"},
  awciEsc:{label:"AWCI · The Escapement",url:"https://www.awci.com/watchmaking-excellen/the-escapement/"},
  awciEscLub:{label:"AWCI · Escapement Lubrication",url:"https://www.awci.com/watchmaking-excellen/lubrication/"},
  seiko6r5:{label:"Seiko · 6R5 Technical Guide",url:"https://www.seikoserviceusa.com/uploads/datasheets/6R5A1_54A_55A_5JA_5HA.pdf"},
  seiko4r:{label:"Seiko · 4R15/4R16 Technical Guide",url:"https://www.seikoserviceusa.com/uploads/datasheets/4R15AB%2C16AB.pdf"}
};

const BY_ID={
  winding_keyless:G(
    ["Check crown/stem engagement before dismantling.","Inspect sliding pinion, winding pinion, setting lever, yoke and setting-lever spring for wear or displacement.","Confirm parts move freely before lubrication."],
    ["Correct displaced or damaged keyless components.","Clean before lubricating; use lubricant only at specified sliding/high-friction contacts."],
    ["Stem","Sliding pinion","Winding pinion","Setting lever / yoke if damaged"],
    [SOURCES.awciLub]
  ),
  setting_keyless:G(
    ["Check stem positions and positive engagement of winding/setting modes.","Inspect setting lever, yoke, clutch/sliding pinion and minute-wheel/motion-work engagement."],
    ["Repair or reposition the failed setting component, then retest all crown positions before casing."],
    ["Stem","Setting lever","Yoke","Sliding pinion"],
    [SOURCES.awciLub]
  ),
  mainspring_broken:G(
    ["Open the barrel and inspect spring continuity, inner hook engagement and outer attachment/bridle.","Inspect barrel arbor hook and barrel wall/notches for damage.","Check barrel arbor endshake and freedom."],
    ["Replace the mainspring if broken, cracked, heavily set or dimensionally unsuitable.","Clean barrel and arbor before reassembly and use the correct lubricant for the movement/spring type."],
    ["Correct mainspring","Barrel arbor or barrel if hook/wall damaged"],
    [SOURCES.awciLub]
  ),
  mainspring_slipping:G(
    ["For an automatic, inspect the bridle and barrel-wall braking surface.","Check for incorrect or contaminated braking grease and evidence of knocking/slipping too early.","For a manual-wind watch, confirm this is not actually a broken hook or keyless fault."],
    ["Clean the barrel and use the manufacturer-specified braking grease for automatic barrel walls where applicable."],
    ["Mainspring if bridle damaged","Manufacturer-specified braking grease"],
    [SOURCES.awciLub,SOURCES.seiko4r]
  ),
  barrel_fault:G(
    ["Inspect barrel teeth, arbor pivots, arbor holes/bushings, hooks and lid fit.","Check barrel turns freely with appropriate endshake and without wobble."],
    ["Correct damaged hooks, worn arbor support or barrel damage before continuing the train test."],
    ["Barrel","Barrel arbor","Mainspring"],
    [SOURCES.awciLub]
  ),
  train_blocked:G(
    ["Let down power safely, remove the balance/pallet as appropriate, then test train freedom.","Inspect each pivot/jewel for dirt, bent pivots, cracked jewels and incorrect endshake.","Check wheels for bridge/plate contact and tooth damage."],
    ["Do not regulate around a binding train. Correct mechanical friction first, then clean/lubricate and retest."],
    ["Wheel/pinion if damaged","Jewel if damaged"],
    [SOURCES.awciLub]
  ),
  train_not_free:G(
    ["Check train freedom with the escapement isolated where appropriate.","Inspect pivot seating, bridge seating, endshake, side shake and wheel-to-bridge/plate clearance."],
    ["Re-seat bridges/pivots carefully; repair worn pivots or jewels before lubrication and timing."],
    ["Pivot/wheel","Jewel","Bridge screw if damaged"],
    [SOURCES.awciLub]
  ),
  pivot_damage:G(
    ["Inspect pivot straightness, polish, diameter and jewel fit under magnification.","Compare endshake and side shake with adjacent train components."],
    ["Polish only if material and dimensions remain suitable; otherwise replace staff/wheel or repair the pivot using an appropriate watchmaking method."],
    ["Wheel/pinion or balance staff","Matching jewel if worn"],
    []
  ),
  jewel_damage:G(
    ["Inspect jewel hole, setting security, cracks/chips and oil sink condition.","Check the mating pivot for scoring before replacing only the jewel."],
    ["Replace damaged jewel with correct hole/outer dimensions and verify endshake after fitting."],
    ["Correct replacement jewel"],
    []
  ),
  escapement_fault:G(
    ["Identify escapement type first; do not apply Swiss-lever assumptions to cylinder, verge or pin-lever movements.","For Swiss lever: inspect lock, drop/draw, guard-pin safety, roller jewel, pallet stones, endshake and freedom."],
    ["Correct geometry or damaged components before lubrication. Lubricant belongs only on intended functional surfaces and in controlled quantity."],
    ["Pallet fork/stones","Escape wheel","Roller jewel if damaged"],
    [SOURCES.awciEsc,SOURCES.awciEscLub]
  ),
  pallet_lock:G(
    ["Check lock on both pallets, run-to-banking and stone security.","Verify escape-wheel teeth contact the pallet stones correctly in all positions."],
    ["Correct pallet/stone geometry only with appropriate tooling and reference data; recheck safety action afterwards."],
    ["Pallet fork/stones if damaged","Escape wheel if damaged"],
    [SOURCES.awciEsc]
  ),
  escapement_drop:G(
    ["Inspect drop on entry and exit pallets and confirm division before altering anything.","Check escape-wheel tooth condition and pallet-stone position."],
    ["Adjust only after confirming endshake, division and lock; one correction can affect the others."],
    ["Pallet stones or escape wheel if damaged"],
    [SOURCES.awciEsc]
  ),
  roller_jewel:G(
    ["Inspect roller jewel security, upright position, fork-slot engagement and clearance from surrounding parts."],
    ["Re-shellac/reseat or replace only if you have the correct tooling and dimensions; then verify guard-pin safety and beat."],
    ["Roller jewel","Shellac"],
    [SOURCES.awciEsc]
  ),
  balance_fault:G(
    ["Check balance pivots/jewels, endshake, freedom and whether the hairspring is flat and centred.","Look for hairspring contact with regulator pins, balance cock, stud or adjacent coils."],
    ["Correct friction or hairspring geometry before rate regulation."],
    ["Balance staff","Balance jewels","Hairspring/balance complete if beyond repair"],
    []
  ),
  balance_staff:G(
    ["Inspect both staff pivots under magnification and compare positional behaviour if the watch runs.","Check cap/hole jewels and endshake before condemning the staff."],
    ["Replace or repair the staff if pivots are bent/broken/worn beyond acceptable limits; verify poise and endshake afterwards."],
    ["Balance staff","Balance jewel if damaged"],
    []
  ),
  hairspring_fault:G(
    ["Check flatness, centring, concentric breathing, stud attachment and regulator clearance.","Demagnetise before making permanent hairspring corrections if magnetism is suspected."],
    ["Correct only the identified geometry fault; avoid chasing rate until the spring breathes freely."],
    ["Hairspring/balance complete only if irreparable"],
    []
  ),
  magnetised:G(
    ["Verify with a magnetism tester if available and compare behaviour before/after demagnetising."],
    ["Demagnetise the movement/watch using an appropriate demagnetiser, then recheck timing before mechanical adjustment."],
    [],
    []
  ),
  beat_error:G(
    ["Confirm the timing signal is stable and the movement is sufficiently wound.","Check beat in more than one useful position before adjustment."],
    ["Correct beat using the movement's intended system (movable stud carrier where fitted); do not bend parts casually to mask another fault."],
    [],
    [SOURCES.seiko6r5]
  ),
  timing_unstable:G(
    ["Confirm sufficient wind and a clean acoustic signal.","Check train freedom, escapement condition, hairspring freedom, magnetism and balance-jewel condition before regulation."],
    ["Treat regulation as the last step after mechanical causes of instability are resolved."],
    [],
    [SOURCES.seiko6r5,SOURCES.awciEsc]
  ),
  low_balance_energy:G(
    ["Check mainspring strength/condition, train freedom and escapement delivery before focusing on the balance.","Compare dial-up/down and vertical behaviour if a reliable amplitude reading is available."],
    ["Resolve power-transmission or friction faults before rate regulation."],
    ["Mainspring if weak or incorrect","Train/escapement parts if damaged"],
    []
  ),
  auto_winding_fault:G(
    ["Inspect rotor freedom, bearing/axle, reversers/reduction wheels and engagement with the barrel winding system.","Check the automatic works transmit power without excessive drag."],
    ["Clean and lubricate according to the movement technical sheet; automatic systems vary significantly by calibre."],
    ["Rotor bearing","Reverser/reduction wheel","Automatic bridge parts"],
    [SOURCES.seiko4r]
  ),
  movement_loose:G(
    ["Inspect case clamps/screws, movement ring/spacer, stem alignment and dial feet/security.","Check whether the loose movement has allowed dial, hand or stem damage."],
    ["Restore the intended movement retention system rather than packing the case with improvised material."],
    ["Case clamp/screw","Movement ring/spacer","Stem if bent"],
    []
  ),
  hand_clearance:G(
    ["Check hand parallelism, height, dial clearance and crystal clearance through a full 12-hour cycle where practical."],
    ["Re-seat/straighten hands using proper support and verify no dial or crystal contact remains."],
    ["Replacement hand if damaged"],
    []
  ),
  calendar_function:G(
    ["Check quick-set and normal midnight change separately where fitted.","Inspect driving wheel/finger, jumper, spring and calendar seating for binding or damage."],
    ["Correct the failed calendar component and retest through multiple change cycles before casing."],
    ["Calendar wheel/disc","Jumper/spring","Driving component"],
    []
  ),
  poor_power_reserve:G(
    ["Confirm full wind first, then measure actual run time.","Investigate mainspring condition/strength, barrel friction, train freedom and escapement efficiency."],
    ["Correct the underlying power or friction fault; do not treat poor reserve as a rate-regulation problem."],
    ["Mainspring if weak/incorrect"],
    [SOURCES.seiko6r5]
  )
};

const BY_CATEGORY={
  Lubrication:G(["Check the movement/calibre technical sheet for lubricant type and quantity."],["Clean old lubricant before applying the specified lubricant sparingly."],[],[SOURCES.awciLub]),
  Escapement:G(["Identify escapement type and inspect freedom, geometry and safety action."],["Correct geometry/mechanical faults before lubrication."],[],[SOURCES.awciEsc,SOURCES.awciEscLub]),
  Timing:G(["Confirm sufficient wind, stable signal and mechanical health before regulation."],["Regulate only after instability, beat and friction issues are resolved."],[],[SOURCES.seiko6r5]),
  Automatic:G(["Check rotor, bearing and transmission/reverser system for free movement and correct engagement."],["Use calibre-specific service data for lubrication and assembly."],[],[SOURCES.seiko4r]),
  Barrel:G(["Inspect spring, arbor, hooks, barrel wall and freedom."],["Repair power source before downstream timing work."],["Mainspring/barrel parts if damaged"],[SOURCES.awciLub]),
  Balance:G(["Inspect staff pivots, jewels, endshake and hairspring breathing."],["Resolve friction/geometry before regulation."],[],[]),
  Train:G(["Check free train movement, pivots, jewels, endshake and contact."],["Resolve friction and alignment before lubrication/timing."],[],[SOURCES.awciLub]),
  Winding:G(["Inspect crown/stem and winding/keyless engagement."],["Correct worn/displaced parts, then lubricate specified contacts only."],[],[SOURCES.awciLub]),
  Setting:G(["Inspect crown positions, setting lever/yoke/clutch and motion works."],["Repair engagement fault and retest all functions."],[],[SOURCES.awciLub]),
  Case:G(["Inspect movement retention, stem alignment and case fit."],["Restore original-style retention and verify function after casing."],[],[])
};

export function guidanceFor(fault){
  if(!fault)return null;
  return BY_ID[fault.id]||BY_CATEGORY[fault.category]||G(
    ["Inspect this fault at the next relevant stage and gather evidence before replacing parts."],
    ["Confirm the cause before repair; use calibre-specific technical information where available."],
    [],[]
  );
}
