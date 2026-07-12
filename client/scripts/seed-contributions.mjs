// Seeds the contributions collection with curated, approved Banglish->Bangla
// pairs (used by the training notebook). Idempotent: re-running replaces the
// seed set. Reads MONGODB_URI / DBNAME from client/.env.local.
//
// Run:  node scripts/seed-contributions.mjs
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = parseEnv(path.join(__dirname, "..", ".env.local"));
const MONGODB_URI = process.env.MONGODB_URI || env.MONGODB_URI;
const DBNAME = process.env.DBNAME || env.DBNAME || "bongolipi";

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in client/.env.local");
  process.exit(1);
}

// [banglish, bangla]
const pairs = [
  // Greetings & social
  ["tumi kemon acho", "তুমি কেমন আছ"],
  ["ami bhalo achi", "আমি ভালো আছি"],
  ["apni kemon achen", "আপনি কেমন আছেন"],
  ["onek dhonnobad", "অনেক ধন্যবাদ"],
  ["tomake dekhe bhalo laglo", "তোমাকে দেখে ভালো লাগলো"],
  ["subho sokal", "শুভ সকাল"],
  ["subho ratri", "শুভ রাত্রি"],
  ["abar dekha hobe", "আবার দেখা হবে"],
  ["sabai kemon acho", "সবাই কেমন আছ"],
  ["onek din por dekha holo", "অনেক দিন পর দেখা হলো"],
  ["tomar sathe kotha bole bhalo laglo", "তোমার সাথে কথা বলে ভালো লাগলো"],
  ["swagotom", "স্বাগতম"],
  ["biday nite hobe", "বিদায় নিতে হবে"],
  ["bhalo theko", "ভালো থেক"],
  ["sabaike shubheccha", "সবাইকে শুভেচ্ছা"],

  // Feelings
  ["ajke amar mon onek bhalo", "আজকে আমার মন অনেক ভালো"],
  ["amar mon kharap", "আমার মন খারাপ"],
  ["ami khub khushi", "আমি খুব খুশি"],
  ["ami tomake miss korchi", "আমি তোমাকে মিস করছি"],
  ["amar khub bhoy korche", "আমার খুব ভয় করছে"],
  ["ami khub klanto", "আমি খুব ক্লান্ত"],
  ["amar matha byatha korche", "আমার মাথা ব্যথা করছে"],
  ["ami raag korechi", "আমি রাগ করেছি"],
  ["amar khub anondo hocche", "আমার খুব আনন্দ হচ্ছে"],
  ["ami ektu chintito", "আমি একটু চিন্তিত"],
  ["tomake niye ami gorbito", "তোমাকে নিয়ে আমি গর্বিত"],
  ["ami kichuta hotash", "আমি কিছুটা হতাশ"],

  // Daily life
  ["ami bhat khai", "আমি ভাত খাই"],
  ["ami skule jai", "আমি স্কুলে যাই"],
  ["amra bajare jacchi", "আমরা বাজারে যাচ্ছি"],
  ["se boi porche", "সে বই পড়ছে"],
  ["ami ghumate jacchi", "আমি ঘুমাতে যাচ্ছি"],
  ["tumi ki korcho", "তুমি কী করছ"],
  ["ami ranna korchi", "আমি রান্না করছি"],
  ["amar khide peyeche", "আমার খিদে পেয়েছে"],
  ["cha khabe", "চা খাবে"],
  ["pani khao", "পানি খাও"],
  ["ami hat dhuchi", "আমি হাত ধুচ্ছি"],
  ["se gaan gaiche", "সে গান গাইছে"],
  ["amra khela dekhchi", "আমরা খেলা দেখছি"],
  ["ami bazar theke phirchi", "আমি বাজার থেকে ফিরছি"],
  ["ghor ta porishkar koro", "ঘরটা পরিষ্কার কর"],
  ["darja bondho koro", "দরজা বন্ধ কর"],
  ["light ta jaliye dao", "লাইটটা জ্বালিয়ে দাও"],

  // Questions
  ["tomar naam ki", "তোমার নাম কী"],
  ["tumi kothay thako", "তুমি কোথায় থাক"],
  ["ekhon koyta baje", "এখন কয়টা বাজে"],
  ["tumi kobe asbe", "তুমি কবে আসবে"],
  ["eta koto taka", "এটা কত টাকা"],
  ["tomar boyos koto", "তোমার বয়স কত"],
  ["tumi ki bangla jano", "তুমি কি বাংলা জান"],
  ["kothay jaccho", "কোথায় যাচ্ছ"],
  ["keno kandcho", "কেন কাঁদছ"],
  ["ke esheche", "কে এসেছে"],
  ["tumi ki amake chino", "তুমি কি আমাকে চেন"],
  ["ei jinis ta ki", "এই জিনিসটা কী"],
  ["amra kokhon berobo", "আমরা কখন বেরোব"],
  ["tomar sathe ke ache", "তোমার সাথে কে আছে"],
  ["tumi ki amake sahajjo korte parbe", "তুমি কি আমাকে সাহায্য করতে পারবে"],

  // Family
  ["amar maa amake bhalobashe", "আমার মা আমাকে ভালোবাসে"],
  ["amar baba office jay", "আমার বাবা অফিস যায়"],
  ["amar ekta choto bhai ache", "আমার একটা ছোট ভাই আছে"],
  ["amader poribar boro", "আমাদের পরিবার বড়"],
  ["dadu golpo bolen", "দাদু গল্প বলেন"],
  ["amar bon gaan shekhe", "আমার বোন গান শেখে"],
  ["amra sobai eksathe khai", "আমরা সবাই একসাথে খাই"],
  ["ma ranna korchen", "মা রান্না করছেন"],

  // Weather & time
  ["ajke onek gorom", "আজকে অনেক গরম"],
  ["bristi porche", "বৃষ্টি পড়ছে"],
  ["ajke akash meghla", "আজকে আকাশ মেঘলা"],
  ["shiter din eshe geche", "শীতের দিন এসে গেছে"],
  ["kal amra ghurte jabo", "কাল আমরা ঘুরতে যাব"],
  ["ajke chuti", "আজকে ছুটি"],
  ["surjo utheche", "সূর্য উঠেছে"],
  ["ratri hoye geche", "রাত্রি হয়ে গেছে"],
  ["batash boyche", "বাতাস বইছে"],

  // Work & study
  ["ami porashona korchi", "আমি পড়াশোনা করছি"],
  ["amar porikkha samne", "আমার পরীক্ষা সামনে"],
  ["se chakri korche", "সে চাকরি করছে"],
  ["amake kaj korte hobe", "আমাকে কাজ করতে হবে"],
  ["ami notun kichu shikhchi", "আমি নতুন কিছু শিখছি"],
  ["amar homework baki ache", "আমার হোমওয়ার্ক বাকি আছে"],
  ["se meeting e ache", "সে মিটিংয়ে আছে"],
  ["ami report ta likhchi", "আমি রিপোর্টটা লিখছি"],
  ["kal amar interview", "কাল আমার ইন্টারভিউ"],

  // Travel & place
  ["ami dhakay thaki", "আমি ঢাকায় থাকি"],
  ["amra grame jacchi", "আমরা গ্রামে যাচ্ছি"],
  ["train station kothay", "ট্রেন স্টেশন কোথায়"],
  ["ami bideshe jete chai", "আমি বিদেশে যেতে চাই"],
  ["rasta onek bhir", "রাস্তা অনেক ভিড়"],
  ["gari ashte deri hocche", "গাড়ি আসতে দেরি হচ্ছে"],
  ["amra somudre berate jacchi", "আমরা সমুদ্রে বেড়াতে যাচ্ছি"],
  ["airport ekhan theke koto dur", "এয়ারপোর্ট এখান থেকে কত দূর"],

  // Food
  ["amar priyo khabar biryani", "আমার প্রিয় খাবার বিরিয়ানি"],
  ["maach bhat amar posondo", "মাছ ভাত আমার পছন্দ"],
  ["misti khete bhalo lage", "মিষ্টি খেতে ভালো লাগে"],
  ["ranna ta khub moza hoyeche", "রান্নাটা খুব মজা হয়েছে"],
  ["ami cha khete bhalobashi", "আমি চা খেতে ভালোবাসি"],
  ["khabar ta thanda hoye geche", "খাবারটা ঠান্ডা হয়ে গেছে"],
  ["aro ektu bhat dao", "আরো একটু ভাত দাও"],

  // Shopping & money
  ["ami bajar korte jacchi", "আমি বাজার করতে যাচ্ছি"],
  ["eta amar kache beshi dami", "এটা আমার কাছে বেশি দামি"],
  ["amar kache taka nei", "আমার কাছে টাকা নেই"],
  ["dam ta kom korun", "দামটা কম করুন"],
  ["ei jinis ta amar dorkar", "এই জিনিসটা আমার দরকার"],
  ["taka ta ferot dao", "টাকাটা ফেরত দাও"],

  // Health
  ["amar jor eseche", "আমার জ্বর এসেছে"],
  ["daktar dekhate hobe", "ডাক্তার দেখাতে হবে"],
  ["osudh kheye nao", "ওষুধ খেয়ে নাও"],
  ["bishram nao", "বিশ্রাম নাও"],
  ["amar kashi hocche", "আমার কাশি হচ্ছে"],
  ["shorir bhalo lagche na", "শরীর ভালো লাগছে না"],

  // Common expressions
  ["kono somossa nei", "কোনো সমস্যা নেই"],
  ["ektu opekkha koro", "একটু অপেক্ষা কর"],
  ["ami bujhte parchi na", "আমি বুঝতে পারছি না"],
  ["aste aste bolo", "আস্তে আস্তে বল"],
  ["amake maf koro", "আমাকে মাফ কর"],
  ["cinta korona", "চিন্তা করো না"],
  ["sob thik hoye jabe", "সব ঠিক হয়ে যাবে"],
  ["amar sathe eso", "আমার সাথে এস"],
  ["darun hoyeche", "দারুণ হয়েছে"],
  ["eta khub sundor", "এটা খুব সুন্দর"],
  ["tumi thik bolecho", "তুমি ঠিক বলেছ"],
  ["amar kotha shono", "আমার কথা শোন"],
  ["ekhon ami byasto", "এখন আমি ব্যস্ত"],
  ["pore kotha hobe", "পরে কথা হবে"],
  ["tumi paro", "তুমি পার"],
  ["haal chero na", "হাল ছেড় না"],
  ["nijer jotno nio", "নিজের যত্ন নিও"],
  ["amake ekTu somoy dao", "আমাকে একটু সময় দাও"],
  ["tomar upor amar bishwas ache", "তোমার উপর আমার বিশ্বাস আছে"],
  ["dhonnobad tomake", "ধন্যবাদ তোমাকে"],
  ["ami rajito", "আমি রাজি"],
  ["eta somvob noy", "এটা সম্ভব নয়"],
  ["ekhon somoy nei", "এখন সময় নেই"],
  ["taratari koro", "তাড়াতাড়ি কর"],
  ["mon diye poro", "মন দিয়ে পড়"],
];

const ContribSchema = new mongoose.Schema(
  {
    userId: String,
    banglish_text: String,
    bangla_text: String,
    isApproved: Boolean,
  },
  { timestamps: true },
);
const Contribution =
  mongoose.models.Contribution || mongoose.model("Contribution", ContribSchema);

function validate() {
  const bengali = /[ঀ-৿]/;
  const latin = /[a-zA-Z]/;
  const bad = [];
  for (const [b, n] of pairs) {
    if (bengali.test(b)) bad.push(`Bengali in source: "${b}"`);
    if (latin.test(n)) bad.push(`Latin in target: "${n}"`);
  }
  return bad;
}

async function main() {
  const bad = validate();
  if (bad.length) {
    console.error("Data validation failed:");
    bad.forEach((m) => console.error("  - " + m));
    process.exit(1);
  }
  console.log(`Validated ${pairs.length} pairs.`);

  await mongoose.connect(MONGODB_URI, { dbName: DBNAME });
  const removed = await Contribution.deleteMany({ userId: "seed-script" });
  const docs = pairs.map(([b, n]) => ({
    userId: "seed-script",
    banglish_text: b,
    bangla_text: n,
    isApproved: true,
  }));
  const res = await Contribution.insertMany(docs);
  const total = await Contribution.countDocuments({ isApproved: true });
  console.log(`Removed ${removed.deletedCount} old seed docs.`);
  console.log(`Inserted ${res.length} approved seed contributions.`);
  console.log(`Total approved contributions now: ${total}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
