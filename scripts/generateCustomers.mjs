/**
 * Deterministic generator for src/data/customers.ts (120 flat CustomerProfile records).
 *
 * Why a generator: the spec pins hard distribution quotas (cities, religions,
 * income, marital status, gender, matchmaker assignment). Building exact-count
 * arrays + a seeded shuffle guarantees the quotas and keeps re-runs stable,
 * which hand-authoring 120 × 40 fields cannot.
 *
 * Run:  node scripts/generateCustomers.mjs
 * Emits a literal array (all 120 objects inline) so the dataset is readable/editable.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'customers.ts');

// ── Seeded RNG (mulberry32) so output is identical every run ──
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260604);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
};
const int = (min, max) => min + Math.floor(rng() * (max - min + 1));
/** Build an array of exact counts then shuffle (Fisher–Yates with seeded rng). */
function quota(spec) {
  const arr = [];
  for (const [val, count] of spec) for (let i = 0; i < count; i++) arr.push(val);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const N = 120;

// ── Quota'd attributes (exact counts, summing to 120) ──
const cities = quota([
  ['Mumbai', 24], ['Delhi', 18], ['Bangalore', 18], ['Hyderabad', 12], ['Chennai', 12],
  ['Pune', 10], ['Ahmedabad', 6], ['Jaipur', 6], ['Lucknow', 5], ['Kolkata', 5], ['Indore', 4],
]);
const religions = quota([
  ['Hindu', 84], ['Muslim', 14], ['Christian', 10], ['Sikh', 7], ['Jain', 4], ['Parsi', 1],
]);
const incomeBuckets = quota([
  ['5L', 18], ['8L', 24], ['12L', 30], ['18L', 24], ['25L', 14], ['35L', 10],
]);
const maritals = quota([
  ['never_married', 90], ['divorced', 22], ['widowed', 5], ['separated', 3],
]);
const genders = quota([['male', 60], ['female', 60]]);
const matchmakers = quota([['mm_001', 15], ['mm_002', 12], [null, 93]]);
const statuses = quota([
  ['ACTIVE', 55], ['PENDING', 25], ['MATCHED', 18], ['ON_HOLD', 12], ['CLOSED', 10],
]);

// ── Correlated pools ──
const NAMES = {
  Hindu: {
    male: ['Aarav', 'Vivaan', 'Aditya', 'Rohan', 'Arjun', 'Karthik', 'Siddharth', 'Nikhil', 'Rahul', 'Ankit', 'Pranav', 'Harsh', 'Varun', 'Akshay', 'Sandeep', 'Manish', 'Rohit', 'Saurabh', 'Tushar', 'Gaurav', 'Abhishek', 'Yash', 'Kunal', 'Deepak'],
    female: ['Ananya', 'Diya', 'Ishita', 'Meera', 'Priya', 'Sneha', 'Pooja', 'Riya', 'Aishwarya', 'Neha', 'Shruti', 'Kavya', 'Tanvi', 'Divya', 'Anjali', 'Swati', 'Nisha', 'Radhika', 'Sakshi', 'Aditi', 'Vidya', 'Lakshmi', 'Sanjana', 'Megha'],
    last: ['Sharma', 'Verma', 'Gupta', 'Mehta', 'Agarwal', 'Iyer', 'Nair', 'Reddy', 'Joshi', 'Rao', 'Malhotra', 'Kapoor', 'Patel', 'Desai', 'Bhat', 'Menon', 'Chauhan', 'Saxena', 'Pillai', 'Kulkarni'],
    caste: ['Brahmin', 'Agarwal', 'Khatri', 'Rajput', 'Kayastha', 'Reddy', 'Nair', 'Maratha', 'Kamma', 'Yadav', 'Baniya', 'Gupta'],
    sub: { Brahmin: ['Iyer', 'Iyengar', 'Deshastha', 'Kanyakubj', 'Smartha'] },
    gotra: ['Bharadwaj', 'Kashyap', 'Vashishtha', 'Gautam', 'Atri', 'Kaushik', 'Shandilya', 'Vatsa', 'Garg', 'Sankrityayan'],
  },
  Muslim: {
    male: ['Faiz', 'Imran', 'Zaid', 'Adnan', 'Rehan', 'Sohail', 'Tariq', 'Asif', 'Bilal', 'Kashif', 'Arif', 'Junaid'],
    female: ['Zoya', 'Aisha', 'Sana', 'Nida', 'Hina', 'Farah', 'Mariam', 'Sadia', 'Rabia', 'Iram', 'Saba', 'Heena'],
    last: ['Khan', 'Ahmed', 'Sheikh', 'Syed', 'Ansari', 'Qureshi', 'Pathan', 'Hussain', 'Mirza', 'Shaikh'],
    caste: ['Sunni', 'Shia'],
    sub: { Sunni: ['Syed', 'Sheikh', 'Pathan', 'Ansari'], Shia: ['Syed', 'Bohra'] },
  },
  Christian: {
    male: ['Aaron', 'Joel', 'Ryan', 'Nathan', 'Joseph', 'Daniel', 'Ivan', 'Melwin', 'Rohan', 'Ashwin'],
    female: ['Maria', 'Sarah', 'Anita', 'Jennifer', 'Riya', 'Elizabeth', 'Sneha', 'Diana', 'Rachel', 'Nisha'],
    last: ['Dsouza', 'Fernandes', 'Pereira', 'Thomas', 'Mathew', 'George', 'Pinto', 'Lobo', 'Joseph', 'Sebastian'],
    caste: ['Roman Catholic', 'Protestant', 'Syrian Catholic', 'Mar Thoma'],
    sub: {},
  },
  Sikh: {
    male: ['Gurpreet', 'Harman', 'Jaspreet', 'Manpreet', 'Simran', 'Arjun', 'Ravneet', 'Sukhdeep'],
    female: ['Simran', 'Harleen', 'Jasleen', 'Navneet', 'Gurleen', 'Manpreet', 'Amrit', 'Kiran'],
    last: ['Singh', 'Kaur', 'Gill', 'Sidhu', 'Dhillon', 'Bedi', 'Sandhu', 'Bajwa'],
    caste: ['Jatt', 'Khatri', 'Arora', 'Ramgarhia'],
    sub: {},
  },
  Jain: {
    male: ['Aryan', 'Parth', 'Rishabh', 'Mehul', 'Chirag', 'Nirav'],
    female: ['Khushboo', 'Shreya', 'Pallavi', 'Disha', 'Mansi', 'Ria'],
    last: ['Jain', 'Shah', 'Mehta', 'Sancheti', 'Bhandari', 'Doshi'],
    caste: ['Svetambar', 'Digambar'],
    sub: { Svetambar: ['Oswal', 'Porwal'], Digambar: ['Agarwal'] },
  },
  Parsi: {
    male: ['Cyrus', 'Farhan', 'Zubin'],
    female: ['Delna', 'Mahzarin', 'Anahita'],
    last: ['Mistry', 'Irani', 'Wadia'],
    caste: ['Zoroastrian'],
    sub: {},
  },
};

const CITY_LANG = {
  Mumbai: 'Marathi', Delhi: 'Punjabi', Bangalore: 'Kannada', Hyderabad: 'Telugu',
  Chennai: 'Tamil', Pune: 'Marathi', Ahmedabad: 'Gujarati', Jaipur: 'Rajasthani',
  Lucknow: 'Urdu', Kolkata: 'Bengali', Indore: 'Hindi',
};
const CITY_COUNTRY = 'India';

const COLLEGES = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani', 'NIT Trichy', 'Delhi University', 'St. Xavier’s College, Mumbai', 'Christ University, Bangalore', 'VIT Vellore', 'Manipal Institute of Technology', 'Symbiosis, Pune', 'NIFT', 'NLSIU Bangalore', 'AIIMS Delhi', 'Loyola College, Chennai', 'Jadavpur University', 'Anna University', 'Osmania University', 'Mumbai University', 'SRCC, Delhi'];
const DEGREES = ['B.Tech', 'B.E.', 'MBA', 'MBBS', 'CA', 'M.Tech', 'LLB', 'B.Des', 'B.Arch', 'M.Sc', 'B.Com', 'BBA', 'BA Economics', 'B.Pharm'];
const COMPANIES = ['TCS', 'Infosys', 'Wipro', 'Google', 'Microsoft', 'Amazon', 'Flipkart', 'Deloitte', 'McKinsey & Co.', 'Goldman Sachs', 'Reliance Industries', 'HDFC Bank', 'Accenture', 'Tata Motors', 'Self-employed', 'Apollo Hospitals', 'Cognizant', 'Zomato', 'Razorpay', 'PwC'];
const DESIGNATIONS = ['Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Data Scientist', 'Management Consultant', 'Physician', 'Chartered Accountant', 'Architect', 'Corporate Lawyer', 'Marketing Manager', 'Investment Banker', 'Assistant Professor', 'Entrepreneur', 'UX Designer', 'Operations Manager', 'Business Analyst'];
const PARENT_OCC_M = ['Businessman', 'Government Officer', 'Retired', 'Engineer', 'Doctor', 'Bank Manager', 'Professor', 'Farmer', 'Lawyer', 'Chartered Accountant'];
const PARENT_OCC_F = ['Homemaker', 'Teacher', 'Doctor', 'Government Officer', 'Businesswoman', 'Professor', 'Retired', 'Bank Officer'];
const HOBBIES = ['Reading', 'Travelling', 'Cooking', 'Photography', 'Cricket', 'Yoga', 'Painting', 'Trekking', 'Music', 'Dancing', 'Gardening', 'Cycling', 'Fitness', 'Movies', 'Singing', 'Chess', 'Badminton', 'Writing', 'Foodie', 'Volunteering'];
const COMPLEXIONS = ['fair', 'wheatish', 'wheatish-medium', 'dusky', 'dark'];
const BODY = ['slim', 'average', 'athletic', 'heavy'];

const incomeFor = (bucket) => {
  switch (bucket) {
    case '5L': return int(450000, 650000);
    case '8L': return int(700000, 950000);
    case '12L': return int(1100000, 1400000);
    case '18L': return int(1600000, 2000000);
    case '25L': return int(2300000, 2900000);
    case '35L': return int(3500000, 6500000);
  }
};

// Age 24–42, peak 27–34 (weighted bucket then jitter).
const ageWeighted = () => {
  const r = rng();
  if (r < 0.18) return int(24, 26);
  if (r < 0.72) return int(27, 34); // peak
  if (r < 0.92) return int(35, 38);
  return int(39, 42);
};

const pad = (n, w = 2) => String(n).padStart(w, '0');
const langsFor = (city) => {
  const set = new Set(['English']);
  set.add(CITY_LANG[city] ?? 'Hindi');
  if (rng() < 0.7) set.add('Hindi');
  if (rng() < 0.25) set.add(pick(['Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati']));
  return [...set];
};

const dietFor = (religion) => {
  if (religion === 'Jain') return 'vegetarian';
  const r = rng();
  if (religion === 'Hindu') return r < 0.55 ? 'vegetarian' : r < 0.75 ? 'eggetarian' : r < 0.95 ? 'non-vegetarian' : 'vegan';
  return r < 0.2 ? 'vegetarian' : r < 0.35 ? 'eggetarian' : 'non-vegetarian';
};
const tri = (pYes, pNo) => {
  const r = rng();
  return r < pYes ? 'yes' : r < pYes + pNo ? 'no' : 'maybe';
};
const smokeFor = () => { const r = rng(); return r < 0.78 ? 'never' : r < 0.94 ? 'occasionally' : 'regularly'; };
const drinkFor = () => { const r = rng(); return r < 0.5 ? 'never' : r < 0.72 ? 'occasionally' : r < 0.92 ? 'socially' : 'regularly'; };

const aboutMe = (p, h) => {
  const v = { orthodox: 'family-first', traditional: 'rooted-yet-modern', moderate: 'easygoing', liberal: 'progressive' }[p.familyValues];
  const templates = [
    `A ${v}, ${p.city}-based ${p.designation} who enjoys ${h[0].toLowerCase()} and ${h[1].toLowerCase()}. I value honesty and a good sense of humour, and I'm looking for a partner to share everyday moments and big dreams with.`,
    `${p.designation} by profession and a ${h[0].toLowerCase()} enthusiast at heart. Coming from a ${p.familyValues} ${p.familyType} family, I believe in balancing ambition with warmth and hope to find someone who feels the same.`,
    `Born and raised with ${p.familyValues} values, I work as a ${p.designation} in ${p.city}. Weekends usually mean ${h[0].toLowerCase()} or ${h[1].toLowerCase()}; I'm looking for a kind, like-minded companion to build a life with.`,
  ];
  return pick(templates);
};

const seenEmail = new Map();
const customers = [];
for (let i = 0; i < N; i++) {
  const gender = genders[i];
  const religion = religions[i];
  const city = cities[i];
  const pool = NAMES[religion];
  const firstName = pick(pool[gender]);
  const lastName = pick(pool.last);
  const caste = pick(pool.caste);
  const subList = (pool.sub && pool.sub[caste]) || [];
  const subCaste = subList.length ? pick(subList) : undefined;
  const gotra = religion === 'Hindu' ? pick(pool.gotra) : undefined;
  const manglik = religion === 'Hindu' ? rng() < 0.3 : false;

  const age = ageWeighted();
  const birthYear = 2026 - age;
  const dateOfBirth = `${birthYear}-${pad(int(1, 12))}-${pad(int(1, 28))}`;

  const familyType = rng() < 0.45 ? 'joint' : 'nuclear';
  const familyValues = pick(['orthodox', 'traditional', 'moderate', 'moderate', 'liberal']);
  const hobbies = pickN(HOBBIES, int(2, 4));

  // unique-ish email
  let emailBase = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '');
  const seen = seenEmail.get(emailBase) ?? 0;
  seenEmail.set(emailBase, seen + 1);
  const email = `${emailBase}${seen ? seen : ''}@gmail.com`;

  const createdAt = `2025-${pad(int(8, 12))}-${pad(int(1, 28))}T${pad(int(8, 19))}:${pad(int(0, 59))}:00.000Z`;

  const profile = {
    id: `cust_${pad(i + 1, 3)}`,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    country: CITY_COUNTRY,
    city,
    height: gender === 'male' ? int(165, 188) : int(150, 175),
    email,
    phone: `+91 9${int(100000000, 899999999)}`,
    undergraduateCollege: pick(COLLEGES),
    degree: pick(DEGREES),
    incomeAnnual: incomeFor(incomeBuckets[i]),
    currentCompany: pick(COMPANIES),
    designation: pick(DESIGNATIONS),
    maritalStatus: maritals[i],
    languagesKnown: langsFor(city),
    siblings: pick([0, 1, 1, 2, 2, 3]),
    caste,
    religion,
    subCaste,
    gotra,
    manglik,
    wantKids: tri(0.55, 0.12),
    openToRelocate: tri(0.45, 0.2),
    openToPets: tri(0.4, 0.25),
    diet: dietFor(religion),
    smoke: smokeFor(),
    drink: drinkFor(),
    physicalStatus: rng() < 0.97 ? 'normal' : 'differently-abled',
    complexion: pick(COMPLEXIONS),
    bodyType: pick(BODY),
    familyType,
    familyValues,
    fatherOccupation: pick(PARENT_OCC_M),
    motherOccupation: pick(PARENT_OCC_F),
    hobbies,
    profilePhoto: `https://api.dicebear.com/7.x/personas/svg?seed=${firstName}`,
    createdAt,
    status: statuses[i],
    assignedMatchmakerId: matchmakers[i],
  };
  profile.aboutMe = aboutMe(profile, hobbies);
  customers.push(profile);
}

// ── Serialise to a literal TS array (stable key order) ──
const KEY_ORDER = [
  'id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'country', 'city', 'height',
  'email', 'phone', 'undergraduateCollege', 'degree', 'incomeAnnual', 'currentCompany',
  'designation', 'maritalStatus', 'languagesKnown', 'siblings', 'caste', 'religion',
  'subCaste', 'gotra', 'manglik', 'wantKids', 'openToRelocate', 'openToPets', 'diet',
  'smoke', 'drink', 'physicalStatus', 'complexion', 'bodyType', 'familyType',
  'familyValues', 'fatherOccupation', 'motherOccupation', 'hobbies', 'aboutMe',
  'profilePhoto', 'createdAt', 'status', 'assignedMatchmakerId',
];
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const fmtVal = (k, v) => {
  if (v === undefined) return undefined;
  if (v === null) return 'null';
  if (k === 'status') return `CustomerStatus.${v}`;
  if (Array.isArray(v)) return `[${v.map(q).join(', ')}]`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return q(v);
};
const fmtProfile = (p) => {
  const lines = [];
  for (const k of KEY_ORDER) {
    const val = fmtVal(k, p[k]);
    if (val === undefined) continue; // skip optional gotra/subCaste when absent
    lines.push(`    ${k}: ${val},`);
  }
  return `  {\n${lines.join('\n')}\n  }`;
};

// Distribution summary for the file header (sanity at a glance).
const tally = (key) => customers.reduce((m, c) => ((m[c[key]] = (m[c[key]] ?? 0) + 1), m), {});
const summary = JSON.stringify({
  gender: tally('gender'), religion: tally('religion'), city: tally('city'),
  maritalStatus: tally('maritalStatus'), status: tally('status'),
  assigned: tally('assignedMatchmakerId'),
}, null, 0);

const header = `/**
 * AUTO-GENERATED by scripts/generateCustomers.mjs — DO NOT EDIT BY HAND.
 * Re-run \`node scripts/generateCustomers.mjs\` to regenerate (seeded, stable output).
 *
 * 120 flat CustomerProfile records meeting the spec's distribution quotas.
 * Matchmaker assignment: 15 → mm_001, 12 → mm_002, remaining 93 unassigned (null).
 * Distribution snapshot:
 * ${summary}
 */
import { CustomerStatus } from '@types';
import type { CustomerProfile } from '@types';

export const CUSTOMERS: CustomerProfile[] = [
${customers.map(fmtProfile).join(',\n')},
];
`;

writeFileSync(OUT, header, 'utf8');
console.log(`Wrote ${customers.length} profiles to ${OUT}`);
console.log('Distribution:', summary);
