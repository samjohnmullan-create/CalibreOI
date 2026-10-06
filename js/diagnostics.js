const F=(id,text,category="General",severity="Moderate")=>({id,text,category,severity});

export const DIAGNOSTICS={
  Intake:{
    runs:{no:[F("not_running_power","Insufficient power reaching the train","Power"),F("train_blocked","Going train obstructed or seized","Train"),F("balance_fault","Balance or hairspring fault preventing oscillation","Balance"),F("escapement_fault","Escapement not unlocking or transmitting power","Escapement")]},
    winds:{no:[F("winding_keyless","Keyless works not engaging correctly","Winding"),F("mainspring_broken","Mainspring broken or detached from hook","Barrel","Critical"),F("mainspring_slipping","Mainspring slipping or bridle not gripping","Barrel"),F("click_ratchet","Click, ratchet or crown-wheel fault","Winding")]},
    sets:{no:[F("setting_keyless","Keyless works / setting mechanism fault","Setting"),F("cannon_pinion","Cannon pinion slipping or binding","Motion works"),F("hand_interference","Hands fouling each other, dial or crystal","Hands")]},
    calendarWorks:{no:[F("calendar_drive","Calendar driving component not engaging","Calendar"),F("calendar_damage","Damaged or displaced calendar component","Calendar"),F("calendar_binding","Calendar mechanism binding or incorrectly assembled","Calendar")]},
    magnetised:{yes:[F("magnetised","Movement or hairspring magnetised","Timing","Moderate")]},
    demagClear:{no:[F("persistent_magnetism","Residual magnetism remains after demagnetising","Timing")]},
    external:{no:[F("external_fault","External case, crown, stem, crystal, strap or movement-security fault","Case")]}
  },
  "Pre-service timing":{
    timeable:{no:[F("timing_unstable","Movement too unstable to obtain a reliable timing reading","Timing"),F("intermittent_running","Intermittent or weak running condition","Power") ]},
    unstable:{no:[F("unstable_trace","Unstable timing trace requires mechanical diagnosis","Timing")]}
  },
  Uncasing:{
    stem:{no:[F("stem_release_fault","Stem release or keyless works may be damaged or incorrectly engaged","Setting")]},
    movementOut:{no:[F("movement_retention","Movement clamps, screws, spacer or case fit problem","Case")]},
    caseFault:{yes:[F("case_related_fault","Case, stem, crown or movement-security fault identified during uncasing","Case")]}
  },
  "Dismantling & inspection":{
    train:{no:[F("train_wear","Train pivot, jewel or endshake fault found","Train"),F("pivot_damage","Bent, scored or worn pivot","Train","Parts required"),F("jewel_damage","Cracked, chipped or worn jewel","Train","Parts required")]},
    barrel:{no:[F("barrel_fault","Barrel, arbor, hook or mainspring fault","Barrel"),F("mainspring_set","Mainspring set, fatigued or damaged","Barrel","Parts required")]},
    keyless:{no:[F("keyless_wear","Worn, damaged or incorrectly positioned keyless-works component","Setting") ]},
    esc:{no:[F("escapement_damage","Escape wheel, pallet stone, roller jewel or banking fault","Escapement") ]},
    balance:{no:[F("balance_staff","Balance staff pivot wear or damage","Balance","Parts required"),F("hairspring_fault","Hairspring distorted, fouling or off-centre","Balance") ]}
  },
  "Cleaning & parts inspection":{
    reinspect:{no:[F("wear_after_cleaning","Wear or damage remains unresolved after cleaning","General")]},
    partsNeeded:{no:[F("diagnosis_incomplete","Required parts or repairs not yet fully identified","General")]}
  },
  "Repairs & parts":{
    partsReady:{no:[F("parts_missing","Required replacement part unavailable or unsuitable","Parts","Parts required")]},
    jewels:{no:[F("train_repair_outstanding","Pivot, jewel, screw or train repair still outstanding","Train") ]},
    mainspring:{no:[F("barrel_repair_outstanding","Mainspring or barrel repair still outstanding","Barrel") ]},
    keyless:{no:[F("keyless_repair_outstanding","Winding or setting repair still outstanding","Setting") ]},
    balance:{no:[F("balance_repair_outstanding","Balance or hairspring repair still outstanding","Balance") ]}
  },
  "Reassembly & lubrication":{
    barrel:{no:[F("barrel_assembly","Barrel or mainspring assembly/lubrication problem","Barrel") ]},
    keyless:{no:[F("keyless_assembly","Keyless or motion works incorrectly assembled or lubricated","Setting") ]},
    train:{no:[F("train_alignment","Train pivot not seated, bridge not seated or wheel alignment issue","Train") ]},
    free:{no:[F("train_not_free","Going train does not run freely","Train"),F("endshake_fault","Incorrect endshake or side shake","Train"),F("wheel_contact","Wheel, pinion or bridge contact causing drag","Train") ]},
    trainOil:{no:[F("train_lubrication","Train lubrication incomplete, excessive or misplaced","Lubrication") ]},
    palletOil:{no:[F("escapement_lubrication","Escapement lubrication requires correction","Lubrication") ]},
    hairspringDry:{no:[F("hairspring_contamination","Oil or contamination on hairspring","Balance") ]}
  },
  "Train & escapement":{
    runDown:{no:[F("train_not_free","Going train binding or obstructed","Train"),F("pivot_jewel_drag","Pivot/jewel friction excessive","Train"),F("wheel_contact","Wheel or pinion contacting bridge/plate","Train") ]},
    lock:{no:[F("pallet_lock","Incorrect pallet lock or pallet stone position","Escapement") ]},
    drop:{no:[F("escapement_drop","Incorrect escapement drop/draw geometry","Escapement") ]},
    guard:{no:[F("safety_action","Guard pin / roller safety action incorrect","Escapement") ]},
    roller:{no:[F("roller_jewel","Roller jewel loose, damaged or incorrectly positioned","Escapement","Parts required") ]}
  },
  "Balance & beat":{
    staff:{no:[F("balance_staff","Balance staff pivot/endshake/side-shake fault","Balance","Parts required"),F("balance_jewel","Balance jewel or cap-jewel problem","Balance") ]},
    spring:{no:[F("hairspring_fault","Hairspring not flat, centred or free","Balance"),F("hairspring_fouling","Hairspring fouling stud, regulator, balance cock or adjacent coils","Balance") ]},
    starts:{no:[F("low_balance_energy","Insufficient energy reaching balance","Balance"),F("balance_friction","Balance pivots/jewels creating excessive friction","Balance"),F("escapement_delivery","Escapement not delivering power correctly","Escapement") ]},
    beat:{no:[F("beat_error","Beat error outside acceptable range","Timing") ]},
    positional:{yes:[F("positional_variation","Excessive positional variation","Timing"),F("poise_issue","Possible balance poise issue","Balance"),F("hairspring_geometry","Possible hairspring centring/breathing issue","Balance") ]}
  },
  "Automatic works":{
    rotor:{no:[F("rotor_drag","Rotor contacting case/bridge or not rotating freely","Automatic") ]},
    bearing:{no:[F("rotor_bearing","Rotor bearing or axle worn/damaged","Automatic","Parts required") ]},
    reversers:{no:[F("reverser_fault","Reverser wheel or automatic transmission fault","Automatic") ]},
    winds:{no:[F("auto_winding_fault","Automatic system not transmitting winding power","Automatic") ]}
  },
  "Case & pendant":{
    bow:{no:[F("bow_fault","Bow loose, worn or damaged","Case") ]},
    pendant:{no:[F("pendant_fault","Pendant or sleeve binding/worn","Case") ]},
    stem:{no:[F("pocket_stem_setting","Stem, sleeve or setting engagement fault","Setting") ]},
    case:{no:[F("pocket_case_fault","Case hinge, cover or movement seating fault","Case") ]}
  },
  "Casing & function":{
    dial:{no:[F("dial_security","Dial not correctly seated or secured","Dial") ]},
    hands:{no:[F("hand_clearance","Hands misaligned or fouling","Hands") ]},
    calendar:{no:[F("calendar_function","Calendar or setting function incorrect after casing","Calendar") ]},
    stem:{no:[F("cased_keyless","Winding/setting fault present after casing","Setting") ]},
    secure:{no:[F("movement_loose","Movement not secure in case","Case") ]},
    case:{no:[F("case_closure","Case back, crown or crystal fit/closure issue","Case") ]}
  },
  Regulation:{
    stable:{no:[F("timing_unstable","Timing trace unstable — investigate mechanically before regulation","Timing") ]},
    beat:{no:[F("beat_error","Beat error requires correction before rate regulation","Timing") ]},
    rate:{no:[F("rate_out","Rate remains outside target after regulation attempt","Timing") ]},
    positions:{no:[F("positional_variation","Positional variation outside desired range","Timing") ]}
  },
  "Final QC":{
    windSet:{no:[F("function_qc","Winding, setting or complication fault remains at final QC","General") ]},
    hands:{no:[F("hand_clearance","Hand alignment or clearance fault remains","Hands") ]},
    case:{no:[F("case_qc","Movement security or case closure fault remains","Case") ]},
    timing:{no:[F("final_timing_missing","Final cased timing not yet satisfactory/recorded","Timing") ]},
    reserve:{no:[F("poor_power_reserve","Running duration / power reserve below expectation","Power") ]},
    extended:{no:[F("extended_test_failed","Watch did not complete extended running test satisfactorily","General") ]}
  },
  "Battery & electrical":{
    cell:{no:[F("battery_fault","Incorrect, flat or unsuitable battery","Quartz") ]},
    contacts:{no:[F("battery_contacts","Dirty, corroded or poorly contacting battery terminals","Quartz") ]},
    knownCell:{no:[F("quartz_movement_fault","Quartz movement does not run on known-good cell","Quartz") ]}
  },
  "Movement inspection":{
    coil:{no:[F("coil_damage","Coil or stepper-motor area damaged","Quartz","Parts required") ]},
    train:{no:[F("quartz_train_jam","Quartz train mechanically jammed or dragging","Quartz") ]},
    corrosion:{no:[F("quartz_corrosion","Battery leakage or corrosion damage","Quartz","Critical") ]}
  }
};

export function suggestionsFor(stageName,stepId,answer){
  const group=DIAGNOSTICS[stageName];
  if(!group||!group[stepId])return [];
  return group[stepId][answer]||[];
}
