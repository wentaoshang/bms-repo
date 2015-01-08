// Mapping from db schema to name component positions (zero indexed)
exports.schema =
  [
   { name: 'building', pos: 3 },
   { name: 'room', pos: 5 },
   { name: 'devtype', pos: 6 },
   { name: 'devid', pos: 7 },
   { name: 'datatype', pos: 8},
   { name: 'ts', pos: 9 },
   { name: 'val', pos: null }
   ];

// Mapping from name components to db schema index (zero indexed)
exports.data_name_pattern = ['test', 'ucla.edu', 'bms', 0, 'data', 1, 2, 3, 4, 5];
exports.symkey_name_pattern = ['test', 'ucla.edu', 'bms', 0, 'symkey', 1, 2, 3, 4, 5];

// Data points for Melnitz building studio1
exports.data_points =
  [
   // aggregates
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand",
//      unit: "kW", lable: "MLNTZ.STUDIO1.DEMAND" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/peak",
//      unit: "kW", lable: "MLNTZ.STUDIO1.PEAK" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/5minavg",
//      unit: "kW", lable: "MLNTZ.STUDIO1.A405" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/10minavg",
//      unit: "kW", lable: "MLNTZ.STUDIO1.A410" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/15minavg",
//      unit: "kW", lable: "MLNTZ.STUDIO1.A415" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/daytot",
//      unit: "kW", lable: "MLNTZ.STUDIO1.A4DC" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/weektot",
//      unit: "kW", lable: "MLNTZ.STUDIO1.C7" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/weekavg",
//      unit: "kW", lable: "MLNTZ.STUDIO1.C7AVG" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/demand/monthtot",
//      unit: "kW", lable: "MLNTZ.STUDIO1.MON" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/voltage",
//      unit: "V", lable: "MLNTZ.STUDIO1.VOLTS" },
//    { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/aggregate/current",
//      unit: "A", lable: "MLNTZ.STUDIO1.AMPS" },
   // DMR
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/DMR/demand",
     unit: "kW", lable: "MLNTZ.PNL.DMR.DEMAND" },
//     { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/DMR/demand/peak",
//       unit: "kW", lable: "MLNTZ.PNL.DMR.PEAK"  },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/DMR/voltage",
     unit: "V", lable: "MLNTZ.PNL.DMR.VOLTS"  },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/DMR/current",
     unit: "A", lable: "MLNTZ.PNL.DMR.AMPS" },
   // AH8
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/demand",
     unit: "kW", lable: "MLNTZ.PNL.AH8.DEMAND" },
//     { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/demand/peak",
//       unit: "kW", lable: "MLNTZ.PNL.AH8.PEAK" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/voltage",
     unit: "V", lable: "MLNTZ.PNL.AH8.VOLTS" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AH8/current",
     unit: "A", lable: "MLNTZ.PNL.AH8.AMPS" },
   // AA
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AA/demand",
     unit: "kW", lable: "MLNTZ.PNL.AA.DEMAND" },
//     { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AA/demand/peak",
//       unit: "kW", lable: "MLNTZ.PNL.AA.PEAK" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AA/voltage",
     unit: "V", lable: "MLNTZ.PNL.AA.VOLTS" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/AA/current",
     unit: "A", lable: "MLNTZ.PNL.AA.AMPS" },
   // K
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/K/demand",
     unit: "kW", lable: "MLNTZ.PNL.K.DEMAND" },
//     { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/K/demand/peak",
//       unit: "kW", lable: "MLNTZ.PNL.K.PEAK" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/K/voltage",
     unit: "V", lable: "MLNTZ.PNL.K.VOLTS" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/K/current",
     unit: "A", lable: "MLNTZ.PNL.K.AMPS" },
   // J
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/J/demand",
     unit: "kW", lable: "MLNTZ.PNL.J.DEMAND" },
//     { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/J/demand/peak",
//       unit: "kW", lable: "MLNTZ.PNL.J.PEAK" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/J/voltage",
     unit: "V", lable: "MLNTZ.PNL.J.VOLTS" },
   { name: "/ndn/ucla.edu/bms/melnitz/data/studio1/electrical/J/current",
     unit: "A", lable: "MLNTZ.PNL.J.AMPS" }
   ];
