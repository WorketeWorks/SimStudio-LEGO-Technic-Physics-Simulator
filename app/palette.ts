export type PaletteFamily="beams"|"axles"|"pins"|"connectors"|"gears"|"wheels"|"specials"|"spike";
type Entry=[part:string,name:string,bricklinkColor:number];

const groups:Record<PaletteFamily,Entry[]>={
  connectors:[
    ["3713","Technic Bush with Two Flanges",86],["4265c","Technic Bush 1/2 Smooth",86],
    ["39793","Technic Connector Block 3 x 3 with 9 Perpendicular Holes",86],
    ["62462","Technic Pin Joiner Round with Slot",86],
    ["48496","Technic Connector Toggle Joint Smooth Double with 2 Pins",86],
    ["32557","Technic Cross Block 2 x 3 (Pin/Pin/Twin Pin)",86],
    ["44809","Technic Cross Block 2 x 2 Bent 90 (Pin/Pin/Pin)",86],
    ["32039","Technic Connector (Axle/Bush) Type 1",86],
    ["32013","Technic Angle Connector #1",86],["32034","Technic Angle Connector #2 (180°)",86],["32016","Technic Angle Connector #3 (157.5°)",86],["32192","Technic Angle Connector #4 (135°)",86],["32015","Technic Angle Connector #5 (112.5°)",86],["32014","Technic Angle Connector #6 (90°)",86],
    ["22961","Technic Axle with Perpendicular Pin Hole",86],["27940","Technic Axle 3L with Middle Pin Hole",85],["10197","Technic Axle and Pin Connector Hub 90°",85],
    ["6536","Technic Cross Block 1 x 2",86],["42003","Technic Cross Block 1 x 3 (Axle/Pin/Pin)",86],["32184","Technic Cross Block 1 x 3 (Axle/Pin/Axle)",86],["32291","Technic Cross Block 2 x 2",86],["41678","Technic Cross Block 2 x 2 Split",86],["92907","Technic Cross Block Bent 90°",86],["63869","Technic Cross Block 3 x 2",86],
    ["6538","Technic Axle Joiner",86],["6538c","Technic Axle Joiner Inline Smooth",86],["26287","Technic Axle Joiner 3L",86],["6641","Technic Transmission Changeover Catch Type 1",86],["48989","Technic Cross Block 1 x 3 with 4 Pins",86],["87408","Technic Toggle Joint Double",11],
    ["32138","Technic Pin 3L Double with Axlehole",86],["41669","Technic Tooth 1 x 3 with Axlehole with Rounded Bottom Cavity",86]
  ],
  wheels:[["4185","Technic Wedge Belt Wheel",86],["42610","Wheel Rim 8 x 11.2 with Centre Groove",86],["56904","Wheel Rim 14 x 30 with 6 Spokes and No Pegholes",86],["50951","Tyre 6/30 x 11",26]],
  specials:[["45590","Technic Axle Joiner Double Flexible",11],["85543","Rubber Belt Round 15 / 1.6",15],["85545","Rubber Belt Round 26 / 1.6",1],["85546","Rubber Belt Round 33 / 1.6",14]],
  spike:[],
  pins:[
    ["11214","Technic Axle Pin Long with Friction, 2L Pin",85],["43093","Technic Axle Pin with Friction",7],["3749","Technic Axle Pin",2],["18651","Technic Axle Pin Long with Friction, 2L Axle",11],["4274","Technic Pin 1/2",86],
    ["6558","Technic Pin Long with Friction and Slot",7],["87082","Technic Pin Long with Pin Hole",86],["32054","Technic Pin Long with Stop Bush",86],["32054","Technic Pin Long with Stop Bush",5],["32556","Technic Pin Long without Friction",2],["15100","Technic Pin with Friction and Perpendicular Hole",11],["2780","Technic Pin with Friction and Slots",11],["3673","Technic Pin without Friction",86],
    ["32002","Technic Pin 3/4",86],["2736","Technic Axle Towball",86],["6628","Technic Pin Towball with Friction",86]
  ],
  axles:[
    ["32062","Technic Axle 2 Notched",5],["4519","Technic Axle 3",86],["24316","Technic Axle 3 with Stop",88],["3705","Technic Axle 4",11],["87083","Technic Axle 4 with Stop",85],["32073","Technic Axle 5",86],["15462","Technic Axle 5 with Stop",88],["3706","Technic Axle 6",11],["44294","Technic Axle 7",86],["3707","Technic Axle 8",11],["55013","Technic Axle 8 with Stop",85],["60485","Technic Axle 9",86],["3737","Technic Axle 10",11],["23948","Technic Axle 11",86],["3708","Technic Axle 12",11],["99008","Technic Axle 4 with Middle Cylindrical Stop",86]
  ],
  gears:[
    ["6589","Technic Gear 12 Tooth Bevel",2],["32270","Technic Gear 12 Tooth Double Bevel",11],["94925","Technic Gear 16 Tooth Reinforced",86],["6542","Technic Gear 16 Tooth with Clutch (1 stud)",85],["6539","Technic Transmission Driving Ring",86],["18947","Technic Transmission Driving Ring 3L",86],["35188","Technic Changeover Rotary Catch",86],["32198","Technic Gear 20 Tooth Bevel",2],["32269","Technic Gear 20 Tooth Double Bevel",2],["35185","Technic Gear 20 Tooth Double Bevel with Clutch on Both Sides",85],["3648","Technic Gear 24 Tooth",85],["46372","Technic Gear 28 Tooth Double Bevel",86],["32498","Technic Gear 36 Tooth Double Bevel",11],["3649","Technic Gear 40 Tooth",85],["10928","Technic Gear 8 Tooth Reinforced",85],["35186","Technic Transmission Driving Ring Extension",14],
    ["6573","Technic Differential with Gear 16 Tooth and 24 Tooth",85],["62821","Technic Differential with One Gear 28 Tooth Bevel",85]
  ],
  beams:[
    ["18654","Technic Beam 1",86],["43857","Technic Beam 2",86],["60483","Technic Beam 2 Liftarm",86],["41677","Technic Beam 2 x 0.5 Liftarm",86],["32523","Technic Beam 3",86],["6632","Technic Beam 3 x 0.5 Liftarm",86],["32449","Technic Beam 4 x 0.5 Liftarm",86],
    ["32316","Technic Beam 5",86],["32017","Technic Beam 5 x 0.5",86],["11478","Technic Beam 5 x 0.5 with Axle Holes",86],["32063","Technic Beam 6 x 0.5",86],["32524","Technic Beam 7",86],["32065","Technic Beam 7 x 0.5",86],["40490","Technic Beam 9",86],["32271","Technic Beam 3 x 7 Bent 53.13°",86],["32525","Technic Beam 11",86],["41239","Technic Beam 13",86],["32278","Technic Beam 15",86],
    ["32140","Technic Beam 2 x 4 Bent 90°",86],["71708","Technic Beam 2 x 3 Liftarm Bent 90° Quarter Ellipse",86],["32056","Technic Beam 3 x 3 x 0.5 Bent 90°",85],["60484","Technic Beam 3 x 3 T-shaped",86],["55615","Technic Pin Connector 3 x 3 Bent 90°",86],["32526","Technic Beam 3 x 5 Bent 90°",86],["14720","Technic Beam 5 x 3 H-shaped",86],["99773","Technic Beam 5 x 3 x 0.5 Triangle",86],["15458","Technic Panel 3 x 11",86],["64179","Technic Beam 7 x 5 Open Center",86],["32251","Technic Beam 5 x 7 Bent Quarter Ellipse",85],["64178","Technic Beam 11 x 5 Open Center",86],["64782","Technic Panel 5 x 11",86],["32250","Technic Beam 3 x 5 x 0.5 Liftarm Bent 90 Quarter Ellipse",86]
  ],
};

groups.connectors.push(["2825","Technic Beam 4 x 0.5 with Boss",86]);
groups.gears.push(
  ["3584", "Technic Changeover Cylinder with Groove", 86],
  ["4158", "Technic Changeover Cylinder with Groove", 86],
  ["4159", "Technic Changeover Catch Fork", 86],
  ["7445", "Technic Gear Shifter with Axle Hole 30 degrees Offset", 86],
  ["7446", "Technic Gear Shifter with Axle Hole 60 degrees Offset", 86],
);

// Parts imported from the user's BrickLink inventory. These are kept as a
// small data extension so the normal palette/precache pipeline handles them
// exactly like the built-in entries.
const inventoryExtras: Entry[] = [
  ["11455", "Technic Link 2 x 4 Bent 90", 11],
  ["13971", "Wheel Rim 8 x 18 with Deep Centre Groove, Deep Spokes and Peghole", 86], ["15038", "Wheel Rim 34 x 56 with 6 Spokes and 6 Pegholes", 86],
  ["18939", "Technic Turntable 60 Tooth Bottom", 86], ["18940", "Technic Gear Rack 1 x 14 Housing", 86],
  ["18942", "Technic Gear Rack 1 x 14 Beam", 85], ["19467c01", "Technic Pneumatic Cylinder 2 x 11", 3],
  ["21828c01", "Technic Pneumatic Cylinder 1 x 11", 3], ["2391", "Technic Beam 7 Alternating Holes", 86],
  ["2393", "Technic Cross Block 1 x 3 (Pin/Pin/Pin) with 2 Pins", 86], ["24121", "Technic Gear Ring Quarter 35 Tooth", 3],
  ["2477", "Technic Beam 3 x 5 Bent 90", 11], ["27938", "Technic Worm Gear 1L", 85],
  ["2815", "Technic Wedge Belt Wheel Tyre", 11], ["3167", "Technic Beam 2 x 3 C-shaped", 86],
  ["32009", "Technic Liftarm Bent 45 Double", 86], ["32019", "Tyre 20/64 x 37", 11],
  ["32072", "Technic Gear 4 Knob", 3], ["32185", "Technic Gear Rack 1 x 14", 9],
  ["32209", "Technic Axle 5.5 with Stop", 85], ["32249", "Technic Liftarm Bent 90 Quarter Circle", 85],
  ["32348", "Technic Beam 4 x 4 Liftarm Bent 53.13", 86], ["32905", "Technic Worm Gear 2L with Axle Hole Two-toothed Sliding", 86],
  ["3743", "Technic Gear Rack 1 x 4", 86], ["39369", "Technic Beam 19 x 11 Baseplate", 3],
  ["39790", "Technic Beam 15 x 11 Open Center", 11], ["39794", "Technic Beam 11 x 7 Open Center", 71],
  ["44", "Technic Beam 1 x 2 (legacy 44)", 86], ["46834", "Technic Clutch Axle Connector", 1],
  ["46835", "Technic Clutch with Axle Connector Inner Side", 85], ["4697b", "Technic Pneumatic T-Piece Type 2", 86],
  ["49283", "Technic Cable Clip", 71], ["50945", "Tyre 6/30 x 11", 11],
  ["55981", "Wheel Rim 14 x 18 Holes", 86],
  ["55982", "Wheel Rim 14 x 18 Axlehole", 86], ["56145", "Wheel Rim 20 x 30 Dual Spokes", 86],
  ["56903", "Wheel Rim 8 x 18 with Deep Centre Groove and Axle Hole", 86], ["56908", "Wheel Rim 26 x 43 with 6 Spokes and 6 Pegholes", 86],
  ["61408", "Technic Beam 3 x 0.5 with Boss", 86], ["64781", "Technic Gear Rack 1 x 13", 11],
  ["65249", "Technic Axle Pin Long without Friction", 1], ["6553", "Technic Axle Connector 1.5", 86],
  ["6587", "Technic Axle 3 with Stud", 69], ["6592", "Technic Gear Rack 1 x 10 with Holes", 11],
  ["6629", "Technic Beam 4 x 6 Liftarm Bent 53.13", 86], ["6630", "Technic Gear Rack 1 x 8 with Holes", 9],
  ["67491", "Technic Beam 19 x 3 with Three Open Areas 5 x 1", 11], ["71709", "Technic Panel 3 x 7", 85],
  ["71710", "Technic Beam 15 Alternating Holes", 86], ["73507", "Technic Beam 11 Alternating Holes", 86],
  ["77765", "Technic Pin Long with End Stop", 86], ["78442", "Technic Gear Ring Quarter 15 Tooth", 86],
  ["80286", "Technic Beam 2 x 5 Liftarm Bent 90 Quarter Ellipse", 86], ["86652", "Wheel Rim 18 x 37 with 6 Pegholes and Short Axle Bush", 86],
  ["87407", "Technic Gear 20 Tooth Bevel with Peghole", 86], ["87761", "Technic Gear Rack 1 x 7", 11],
  ["89678", "Technic Pin 1/2 with Friction", 5], ["92911", "Technic Ball Joint 2.25 Diameter Socket", 85],
  ["98585", "Technic Connector Circular with 2 Pin Holes and 3 Axle Holes", 86], ["99009", "Technic Turntable 28 Tooth (Complete)", 86],
  ["99010", "Technic Turntable 28 Tooth Top", 11], ["99021", "Technic Pneumatic Hose Connector with Bush", 85],
  ["99948", "Technic Steel Ball 18mm", 67],
  ["61903", "Technic Universal Joint 3L (Complete)", 86],
  ["62519", "Technic Universal Joint 3L Centre", 86],
  ["62520", "Technic Universal Joint 3L End", 86],
  ["18938u", "Technic Turntable 60 Tooth (Complete)", 11],
];

const inventoryFamily = (part:string,name:string):PaletteFamily => {
  if (/Powered Up|SPIKE|Colour Sensor|Force Sensor|Angular Motor/i.test(name)) return "spike";
  if (/Pneumatic|Hose|Rubber|Flexible/i.test(name) || part === "45590") return "specials";
  if (/Wheel|Rim|Tyre|Tire/i.test(name)) return "wheels";
  if (/Gear|Worm|Differential|Turntable/i.test(name)) return "gears";
  if (/^Technic (Axle )?Pin|^Technic Pin|Pin Long/i.test(name)) return "pins";
  if (/^Technic Axle/i.test(name)) return "axles";
  if (/Beam|Liftarm|Panel/i.test(name) && !/Boss|Pin Connector|with Stud|Cross Block/i.test(name)) return "beams";
  return "connectors";
};
for (const entry of inventoryExtras) groups[inventoryFamily(entry[0],entry[1])].push(entry);

const beamRank=(name:string)=>/(?:\b0\.5\b|\bhalf\b)/i.test(name)?1:/(?:hole|open|alternating|axle holes)/i.test(name)?2:/(?:bent|panel|t-shaped|h-shaped|triangle|c-shaped|baseplate)/i.test(name)?3:0;
groups.beams.sort((a,b)=>beamRank(a[1])-beamRank(b[1])||a[1].localeCompare(b[1],undefined,{numeric:true}));
for(const family of ["axles","pins","connectors","gears","wheels","specials","spike"] as const)
  groups[family].sort((a,b)=>a[1].localeCompare(b[1],undefined,{numeric:true}));

const ldrawColor:Record<number,number>={2:19,5:4,7:1,11:0,85:72,86:71,88:70};
const defaultColorOverride:Record<string,number>={"4265c":14,"15458":72,"32002":19,"4274":1,"48496":0,"39793":0,"32138":0,"32139":0,"6628":0,"50951":0,"6539":4,"18947":72,"35188":25,"35186":14,"3584":25,"4158":73,"4159":73,"7445":4,"7446":14,"85543":15,"85544":4,"85545":1,"85546":14};
const invalidGeometry=new Set<string>();
const modelAlias:Record<string,string>={"4265c":"32123b","4185":"4185b","6538":"6538a","6538c":"59443","6542":"6542a","3648":"3648b","44":"32126","18938u":"18938","6628a":"6628"};
export const paletteRequestAliases:Record<string,string>={"32123a":"4265c","32556b":"32556","62520c01":"61903"};
const thumbAlias:Record<string,string>={"32556":"32556b","19467c01":"19467","21828c01":"21828","3167":"3167s01","2477":"24779s01"};
// Turntable bottoms stay in the gear palette, but their teeth are captive:
// only the matching top is allowed to participate in a drivetrain.
const nonPhysicalGearParts = new Set(["6539", "18947", "35186", "35188", "3584", "4158", "4159", "7445", "7446", "99009", "18939"]);
const thumbId:Record<string,number>={
  "3713":6784,"32123b":5579,"4185b":8129,"11214":388,"43093":8530,"3749":6834,"32062":5541,"18651":1221,"4519":8934,"24316":2294,"3705":6762,"87083":13103,"32073":5553,"15462":851,"3706":6765,"44294":8683,"3707":6767,"55013":10160,"60485":10650,"3737":6803,"23948":2182,"3708":6769,"42610":8436,"56904":10268,"50951":9907,"99008":15067,"2736":3057,"85543":12935,"85544":12936,"85545":52503,"85546":12938,
  "45590":9043,"39793":7471,"62462":11259,"48496":9688,"32557":5822,"44809":8823,"32039":5527,"4274":8466,"32002":5491,"32138":5589,"41669":7984,"6628":11877,"32013":5501,"32034":5526,"32016":5504,"32192":5624,"32015":5503,"32014":5502,"22961":2013,"27940":3116,"10197":242,"6536":11777,"42003":8199,"32184":5614,"32291":5697,"41678":7992,"92907":13823,"63869":11564,"6538a":11779,"6539":11781,"26287":2850,"6641":11915,"35186":6163,"35188":6164,"18947":1300,
  "6589":11864,"32270":5668,"94925":14043,"6542a":11797,"32198":5631,"32269":5667,"35185":6162,"3648b":6672,"46372":25167,"32498":5794,"3649":6673,"10928":312,"6573":11834,"62821":11387,"18654":1223,"43857":8641,"60483":10647,"41677":7991,"32523":5796,"6632":11881,"32449":5752,"2825":3162,"32316":5721,"32017":5505,"11478":461,"32063":5542,"32524":5798,"32065":5548,"40490":7552,"32271":5669,"32525":5799,"41239":7796,"32278":5679,"32140":5590,"71708":26188,"32056":5533,"60484":10649,"55615":10189,"32526":5800,"14720":688,"99773":15141,"15458":847,"64179":11590,"32251":5666,"64178":11589,"64782":11701,"32250":5665,
  "6558":11816,"87082":13102,"32054":5532,"32556":43906,"48989":9789,"87408":13112,"15100":782,"2780":3099,"3673":6706,
  "11455":50663,"13971":628,"15038":746,"18938":1292,"18939":1293,"18940":1294,"18942":1295,
  "19467c01":1515,"21828c01":1784,"2391":24189,"2393":24191,"24121":2231,"2477":17101,"27938":3111,"2815":49713,"3167":33532,
  "32009":5499,"32019":5507,"32072":5552,"32185":5615,"32209":5643,"32249":5664,"32348":5734,"32905":5842,
  "3743":6824,"39369":7361,"39790":7470,"39794":7472,"44":5582,"46834":25212,"46835":9356,"4697b":9374,"49283":9796,"50945":25293,
  "55981":10219,"55982":10222,"56145":10228,"56903":10266,"56908":10271,"61408":46051,"64781":11700,
  "65249":11769,"6553":11811,"6587":11862,"6592":11866,"6629":11878,"6630":11879,"67491":26092,"71709":26189,"71710":12166,"73507":12326,
  "77765":12586,"78442":26329,"80286":26373,"86652":13015,"87407":13111,"87761":13203,"89678":13327,"92911":13827,"98585":15050,
  "99009":15068,"99010":15069,"99021":15074,"99948":15156,"61903":11177,"62519":11290,"62520":11291,"62821":11387,"6628":11877,"32126":5582
};

const thumbExtras:Record<string,number>={"3584":39899,"4158":32581,"4159":32584,"7446":53322};
const compoundPartAssets = new Set(["62519", "62520", "99010", "18939"]);
export const paletteParts=Object.entries(groups).flatMap(([family,entries])=>entries.map(([part,name,bricklinkColor])=>{const modelPart=modelAlias[part]??part,id=thumbId[modelPart]??thumbExtras[modelPart],thumbPart=thumbAlias[part]??modelPart,sourceColor=ldrawColor[bricklinkColor]??71,color=defaultColorOverride[part]??sourceColor;return{
  part,name,family:family as PaletteFamily,color,sourceColor,kind:(family==="gears"||family==="wheels"||family==="specials"?"wheel":family==="spike"&&/motor/i.test(name)?"motor":"beam") as "beam"|"wheel"|"motor",gear:family==="gears"&&!nonPhysicalGearParts.has(part),modelPart,rawThumb:true,
  paletteHidden:compoundPartAssets.has(part),
  origin:"default-palette" as const,sourceKind:(invalidGeometry.has(part)?"ldraw-network":"packaged-cache") as "ldraw-network"|"packaged-cache",requestedPart:part,catalogReturnedPart:part,resolvedPart:modelPart,
  geometry:invalidGeometry.has(part)?undefined:`catalog/geometry/${part}-${color}.json`,
  thumb:id?(invalidGeometry.has(part)?`https://library.ldraw.org/media/parts/${id}/conversions/${thumbPart}-thumb.png`:`catalog/renders/${modelPart}.png`):undefined,
  sourceThumb:id?`https://library.ldraw.org/media/parts/${id}/conversions/${thumbPart}-thumb.png`:undefined
}}));
