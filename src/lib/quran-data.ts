// Quran Metadata & Audio Library for ALIHSAN LMS

export interface SurahMeta {
  number: number;
  name_en: string;
  name_ar: string;
  translation: string;
  total_ayahs: number;
  revelation_type: 'Meccan' | 'Medinan';
}

export interface ReciterMeta {
  id: string;
  name: string;
  style: string;
  description: string;
}

export interface AyahVerse {
  numberInSurah: number;
  numberInQuran: number;
  text: string;
}

export interface QuranAssignment {
  id: string;
  teacher_id: string;
  student_id: string;
  student_name?: string;
  class_name?: string;
  assignment_type: 'hifz' | 'reading' | 'tajweed';
  surah_number: number;
  surah_name_en: string;
  surah_name_ar: string;
  from_ayah: number;
  to_ayah: number;
  default_reciter: string;
  target_repeats: number;
  teacher_note?: string;
  due_date?: string;
  status: 'assigned' | 'practicing' | 'completed';
  listened_count: number;
  last_practiced_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export const RECITERS: ReciterMeta[] = [
  {
    id: 'Husary_Muallim_128kbps',
    name: 'Al-Husary (Muallim)',
    style: 'Teacher & Student Repeat',
    description: 'Recites with pauses for learner repetition - recommended for Hifz & Nazira'
  },
  {
    id: 'Alafasy_128kbps',
    name: 'Mishary Rashid Alafasy',
    style: 'Murattal',
    description: 'Melodious, clear and precise pronunciation'
  },
  {
    id: 'Minshawy_Murattal_128kbps',
    name: 'Mohamed Siddiq Al-Minshawi',
    style: 'Traditional Tartil',
    description: 'Classic Egyptian tartil with excellent tajweed adherence'
  },
  {
    id: 'Abdul_Basit_Murattal_192kbps',
    name: 'Abdul Basit Abdul Samad',
    style: 'Murattal',
    description: 'World-renowned classic clear recitation'
  },
  {
    id: 'Ghamadi_40kbps',
    name: 'Saad Al-Ghamdi',
    style: 'Murattal',
    description: 'Smooth and rhythmic modern recitation'
  },
  {
    id: 'Abu_Bakr_Ash-Shaatree_128kbps',
    name: 'Abu Bakr Al-Shatri',
    style: 'Murattal',
    description: 'Deep and soothing recitation'
  },
  {
    id: 'Hudhaify_128kbps',
    name: 'Ali Al-Hudhaify',
    style: 'Madinah Tartil',
    description: 'Imam of Prophet\'s Mosque, slow and measured pace'
  },
  {
    id: 'Hani_Rifai_192kbps',
    name: 'Hani Ar-Rifai',
    style: 'Emotional Tartil',
    description: 'Heartfelt, expressive recitation'
  }
];

export const SURAH_LIST: SurahMeta[] = [
  {
    "number": 1,
    "name_en": "Al-Faatiha",
    "name_ar": "سُورَةُ ٱلْفَاتِحَةِ",
    "translation": "The Opening",
    "total_ayahs": 7,
    "revelation_type": "Meccan"
  },
  {
    "number": 2,
    "name_en": "Al-Baqara",
    "name_ar": "سُورَةُ البَقَرَةِ",
    "translation": "The Cow",
    "total_ayahs": 286,
    "revelation_type": "Medinan"
  },
  {
    "number": 3,
    "name_en": "Aal-i-Imraan",
    "name_ar": "سُورَةُ آلِ عِمۡرَانَ",
    "translation": "The Family of Imraan",
    "total_ayahs": 200,
    "revelation_type": "Medinan"
  },
  {
    "number": 4,
    "name_en": "An-Nisaa",
    "name_ar": "سُورَةُ النِّسَاءِ",
    "translation": "The Women",
    "total_ayahs": 176,
    "revelation_type": "Medinan"
  },
  {
    "number": 5,
    "name_en": "Al-Maaida",
    "name_ar": "سُورَةُ المَائـِدَةِ",
    "translation": "The Table",
    "total_ayahs": 120,
    "revelation_type": "Medinan"
  },
  {
    "number": 6,
    "name_en": "Al-An'aam",
    "name_ar": "سُورَةُ الأَنۡعَامِ",
    "translation": "The Cattle",
    "total_ayahs": 165,
    "revelation_type": "Meccan"
  },
  {
    "number": 7,
    "name_en": "Al-A'raaf",
    "name_ar": "سُورَةُ الأَعۡرَافِ",
    "translation": "The Heights",
    "total_ayahs": 206,
    "revelation_type": "Meccan"
  },
  {
    "number": 8,
    "name_en": "Al-Anfaal",
    "name_ar": "سُورَةُ الأَنفَالِ",
    "translation": "The Spoils of War",
    "total_ayahs": 75,
    "revelation_type": "Medinan"
  },
  {
    "number": 9,
    "name_en": "At-Tawba",
    "name_ar": "سُورَةُ التَّوۡبَةِ",
    "translation": "The Repentance",
    "total_ayahs": 129,
    "revelation_type": "Medinan"
  },
  {
    "number": 10,
    "name_en": "Yunus",
    "name_ar": "سُورَةُ يُونُسَ",
    "translation": "Jonas",
    "total_ayahs": 109,
    "revelation_type": "Meccan"
  },
  {
    "number": 11,
    "name_en": "Hud",
    "name_ar": "سُورَةُ هُودٍ",
    "translation": "Hud",
    "total_ayahs": 123,
    "revelation_type": "Meccan"
  },
  {
    "number": 12,
    "name_en": "Yusuf",
    "name_ar": "سُورَةُ يُوسُفَ",
    "translation": "Joseph",
    "total_ayahs": 111,
    "revelation_type": "Meccan"
  },
  {
    "number": 13,
    "name_en": "Ar-Ra'd",
    "name_ar": "سُورَةُ الرَّعۡدِ",
    "translation": "The Thunder",
    "total_ayahs": 43,
    "revelation_type": "Medinan"
  },
  {
    "number": 14,
    "name_en": "Ibrahim",
    "name_ar": "سُورَةُ إِبۡرَاهِيمَ",
    "translation": "Abraham",
    "total_ayahs": 52,
    "revelation_type": "Meccan"
  },
  {
    "number": 15,
    "name_en": "Al-Hijr",
    "name_ar": "سُورَةُ الحِجۡرِ",
    "translation": "The Rock",
    "total_ayahs": 99,
    "revelation_type": "Meccan"
  },
  {
    "number": 16,
    "name_en": "An-Nahl",
    "name_ar": "سُورَةُ النَّحۡلِ",
    "translation": "The Bee",
    "total_ayahs": 128,
    "revelation_type": "Meccan"
  },
  {
    "number": 17,
    "name_en": "Al-Israa",
    "name_ar": "سُورَةُ الإِسۡرَاءِ",
    "translation": "The Night Journey",
    "total_ayahs": 111,
    "revelation_type": "Meccan"
  },
  {
    "number": 18,
    "name_en": "Al-Kahf",
    "name_ar": "سُورَةُ الكَهۡفِ",
    "translation": "The Cave",
    "total_ayahs": 110,
    "revelation_type": "Meccan"
  },
  {
    "number": 19,
    "name_en": "Maryam",
    "name_ar": "سُورَةُ مَرۡيَمَ",
    "translation": "Mary",
    "total_ayahs": 98,
    "revelation_type": "Meccan"
  },
  {
    "number": 20,
    "name_en": "Taa-Haa",
    "name_ar": "سُورَةُ طه",
    "translation": "Taa-Haa",
    "total_ayahs": 135,
    "revelation_type": "Meccan"
  },
  {
    "number": 21,
    "name_en": "Al-Anbiyaa",
    "name_ar": "سُورَةُ الأَنبِيَاءِ",
    "translation": "The Prophets",
    "total_ayahs": 112,
    "revelation_type": "Meccan"
  },
  {
    "number": 22,
    "name_en": "Al-Hajj",
    "name_ar": "سُورَةُ الحَجِّ",
    "translation": "The Pilgrimage",
    "total_ayahs": 78,
    "revelation_type": "Medinan"
  },
  {
    "number": 23,
    "name_en": "Al-Muminoon",
    "name_ar": "سُورَةُ المُؤۡمِنُونَ",
    "translation": "The Believers",
    "total_ayahs": 118,
    "revelation_type": "Meccan"
  },
  {
    "number": 24,
    "name_en": "An-Noor",
    "name_ar": "سُورَةُ النُّورِ",
    "translation": "The Light",
    "total_ayahs": 64,
    "revelation_type": "Medinan"
  },
  {
    "number": 25,
    "name_en": "Al-Furqaan",
    "name_ar": "سُورَةُ الفُرۡقَانِ",
    "translation": "The Criterion",
    "total_ayahs": 77,
    "revelation_type": "Meccan"
  },
  {
    "number": 26,
    "name_en": "Ash-Shu'araa",
    "name_ar": "سُورَةُ الشُّعَرَاءِ",
    "translation": "The Poets",
    "total_ayahs": 227,
    "revelation_type": "Meccan"
  },
  {
    "number": 27,
    "name_en": "An-Naml",
    "name_ar": "سُورَةُ النَّمۡلِ",
    "translation": "The Ant",
    "total_ayahs": 93,
    "revelation_type": "Meccan"
  },
  {
    "number": 28,
    "name_en": "Al-Qasas",
    "name_ar": "سُورَةُ القَصَصِ",
    "translation": "The Stories",
    "total_ayahs": 88,
    "revelation_type": "Meccan"
  },
  {
    "number": 29,
    "name_en": "Al-Ankaboot",
    "name_ar": "سُورَةُ العَنكَبُوتِ",
    "translation": "The Spider",
    "total_ayahs": 69,
    "revelation_type": "Meccan"
  },
  {
    "number": 30,
    "name_en": "Ar-Room",
    "name_ar": "سُورَةُ الرُّومِ",
    "translation": "The Romans",
    "total_ayahs": 60,
    "revelation_type": "Meccan"
  },
  {
    "number": 31,
    "name_en": "Luqman",
    "name_ar": "سُورَةُ لُقۡمَانَ",
    "translation": "Luqman",
    "total_ayahs": 34,
    "revelation_type": "Meccan"
  },
  {
    "number": 32,
    "name_en": "As-Sajda",
    "name_ar": "سُورَةُ السَّجۡدَةِ",
    "translation": "The Prostration",
    "total_ayahs": 30,
    "revelation_type": "Meccan"
  },
  {
    "number": 33,
    "name_en": "Al-Ahzaab",
    "name_ar": "سُورَةُ الأَحۡزَابِ",
    "translation": "The Clans",
    "total_ayahs": 73,
    "revelation_type": "Medinan"
  },
  {
    "number": 34,
    "name_en": "Saba",
    "name_ar": "سُورَةُ سَبَإٍ",
    "translation": "Sheba",
    "total_ayahs": 54,
    "revelation_type": "Meccan"
  },
  {
    "number": 35,
    "name_en": "Faatir",
    "name_ar": "سُورَةُ فَاطِرٍ",
    "translation": "The Originator",
    "total_ayahs": 45,
    "revelation_type": "Meccan"
  },
  {
    "number": 36,
    "name_en": "Yaseen",
    "name_ar": "سُورَةُ يسٓ",
    "translation": "Yaseen",
    "total_ayahs": 83,
    "revelation_type": "Meccan"
  },
  {
    "number": 37,
    "name_en": "As-Saaffaat",
    "name_ar": "سُورَةُ الصَّافَّاتِ",
    "translation": "Those drawn up in Ranks",
    "total_ayahs": 182,
    "revelation_type": "Meccan"
  },
  {
    "number": 38,
    "name_en": "Saad",
    "name_ar": "سُورَةُ صٓ",
    "translation": "The letter Saad",
    "total_ayahs": 88,
    "revelation_type": "Meccan"
  },
  {
    "number": 39,
    "name_en": "Az-Zumar",
    "name_ar": "سُورَةُ الزُّمَرِ",
    "translation": "The Groups",
    "total_ayahs": 75,
    "revelation_type": "Meccan"
  },
  {
    "number": 40,
    "name_en": "Ghafir",
    "name_ar": "سُورَةُ غَافِرٍ",
    "translation": "The Forgiver",
    "total_ayahs": 85,
    "revelation_type": "Meccan"
  },
  {
    "number": 41,
    "name_en": "Fussilat",
    "name_ar": "سُورَةُ فُصِّلَتۡ",
    "translation": "Explained in detail",
    "total_ayahs": 54,
    "revelation_type": "Meccan"
  },
  {
    "number": 42,
    "name_en": "Ash-Shura",
    "name_ar": "سُورَةُ الشُّورَىٰ",
    "translation": "Consultation",
    "total_ayahs": 53,
    "revelation_type": "Meccan"
  },
  {
    "number": 43,
    "name_en": "Az-Zukhruf",
    "name_ar": "سُورَةُ الزُّخۡرُفِ",
    "translation": "Ornaments of gold",
    "total_ayahs": 89,
    "revelation_type": "Meccan"
  },
  {
    "number": 44,
    "name_en": "Ad-Dukhaan",
    "name_ar": "سُورَةُ الدُّخَانِ",
    "translation": "The Smoke",
    "total_ayahs": 59,
    "revelation_type": "Meccan"
  },
  {
    "number": 45,
    "name_en": "Al-Jaathiya",
    "name_ar": "سُورَةُ الجَاثِيَةِ",
    "translation": "Crouching",
    "total_ayahs": 37,
    "revelation_type": "Meccan"
  },
  {
    "number": 46,
    "name_en": "Al-Ahqaf",
    "name_ar": "سُورَةُ الأَحۡقَافِ",
    "translation": "The Dunes",
    "total_ayahs": 35,
    "revelation_type": "Meccan"
  },
  {
    "number": 47,
    "name_en": "Muhammad",
    "name_ar": "سُورَةُ مُحَمَّدٍ",
    "translation": "Muhammad",
    "total_ayahs": 38,
    "revelation_type": "Medinan"
  },
  {
    "number": 48,
    "name_en": "Al-Fath",
    "name_ar": "سُورَةُ الفَتۡحِ",
    "translation": "The Victory",
    "total_ayahs": 29,
    "revelation_type": "Medinan"
  },
  {
    "number": 49,
    "name_en": "Al-Hujuraat",
    "name_ar": "سُورَةُ الحُجُرَاتِ",
    "translation": "The Inner Apartments",
    "total_ayahs": 18,
    "revelation_type": "Medinan"
  },
  {
    "number": 50,
    "name_en": "Qaaf",
    "name_ar": "سُورَةُ قٓ",
    "translation": "The letter Qaaf",
    "total_ayahs": 45,
    "revelation_type": "Meccan"
  },
  {
    "number": 51,
    "name_en": "Adh-Dhaariyat",
    "name_ar": "سُورَةُ الذَّارِيَاتِ",
    "translation": "The Winnowing Winds",
    "total_ayahs": 60,
    "revelation_type": "Meccan"
  },
  {
    "number": 52,
    "name_en": "At-Tur",
    "name_ar": "سُورَةُ الطُّورِ",
    "translation": "The Mount",
    "total_ayahs": 49,
    "revelation_type": "Meccan"
  },
  {
    "number": 53,
    "name_en": "An-Najm",
    "name_ar": "سُورَةُ النَّجۡمِ",
    "translation": "The Star",
    "total_ayahs": 62,
    "revelation_type": "Meccan"
  },
  {
    "number": 54,
    "name_en": "Al-Qamar",
    "name_ar": "سُورَةُ القَمَرِ",
    "translation": "The Moon",
    "total_ayahs": 55,
    "revelation_type": "Meccan"
  },
  {
    "number": 55,
    "name_en": "Ar-Rahmaan",
    "name_ar": "سُورَةُ الرَّحۡمَٰن",
    "translation": "The Beneficent",
    "total_ayahs": 78,
    "revelation_type": "Medinan"
  },
  {
    "number": 56,
    "name_en": "Al-Waaqia",
    "name_ar": "سُورَةُ الوَاقِعَةِ",
    "translation": "The Inevitable",
    "total_ayahs": 96,
    "revelation_type": "Meccan"
  },
  {
    "number": 57,
    "name_en": "Al-Hadid",
    "name_ar": "سُورَةُ الحَدِيدِ",
    "translation": "The Iron",
    "total_ayahs": 29,
    "revelation_type": "Medinan"
  },
  {
    "number": 58,
    "name_en": "Al-Mujaadila",
    "name_ar": "سُورَةُ المُجَادلَةِ",
    "translation": "The Pleading Woman",
    "total_ayahs": 22,
    "revelation_type": "Medinan"
  },
  {
    "number": 59,
    "name_en": "Al-Hashr",
    "name_ar": "سُورَةُ الحَشۡرِ",
    "translation": "The Exile",
    "total_ayahs": 24,
    "revelation_type": "Medinan"
  },
  {
    "number": 60,
    "name_en": "Al-Mumtahana",
    "name_ar": "سُورَةُ المُمۡتَحنَةِ",
    "translation": "She that is to be examined",
    "total_ayahs": 13,
    "revelation_type": "Medinan"
  },
  {
    "number": 61,
    "name_en": "As-Saff",
    "name_ar": "سُورَةُ الصَّفِّ",
    "translation": "The Ranks",
    "total_ayahs": 14,
    "revelation_type": "Medinan"
  },
  {
    "number": 62,
    "name_en": "Al-Jumu'a",
    "name_ar": "سُورَةُ الجُمُعَةِ",
    "translation": "Friday",
    "total_ayahs": 11,
    "revelation_type": "Medinan"
  },
  {
    "number": 63,
    "name_en": "Al-Munaafiqoon",
    "name_ar": "سُورَةُ المُنَافِقُونَ",
    "translation": "The Hypocrites",
    "total_ayahs": 11,
    "revelation_type": "Medinan"
  },
  {
    "number": 64,
    "name_en": "At-Taghaabun",
    "name_ar": "سُورَةُ التَّغَابُنِ",
    "translation": "Mutual Disillusion",
    "total_ayahs": 18,
    "revelation_type": "Medinan"
  },
  {
    "number": 65,
    "name_en": "At-Talaaq",
    "name_ar": "سُورَةُ الطَّلَاقِ",
    "translation": "Divorce",
    "total_ayahs": 12,
    "revelation_type": "Medinan"
  },
  {
    "number": 66,
    "name_en": "At-Tahrim",
    "name_ar": "سُورَةُ التَّحۡرِيمِ",
    "translation": "The Prohibition",
    "total_ayahs": 12,
    "revelation_type": "Medinan"
  },
  {
    "number": 67,
    "name_en": "Al-Mulk",
    "name_ar": "سُورَةُ المُلۡكِ",
    "translation": "The Sovereignty",
    "total_ayahs": 30,
    "revelation_type": "Meccan"
  },
  {
    "number": 68,
    "name_en": "Al-Qalam",
    "name_ar": "سُورَةُ القَلَمِ",
    "translation": "The Pen",
    "total_ayahs": 52,
    "revelation_type": "Meccan"
  },
  {
    "number": 69,
    "name_en": "Al-Haaqqa",
    "name_ar": "سُورَةُ الحَاقَّةِ",
    "translation": "The Reality",
    "total_ayahs": 52,
    "revelation_type": "Meccan"
  },
  {
    "number": 70,
    "name_en": "Al-Ma'aarij",
    "name_ar": "سُورَةُ المَعَارِجِ",
    "translation": "The Ascending Stairways",
    "total_ayahs": 44,
    "revelation_type": "Meccan"
  },
  {
    "number": 71,
    "name_en": "Nooh",
    "name_ar": "سُورَةُ نُوحٍ",
    "translation": "Noah",
    "total_ayahs": 28,
    "revelation_type": "Meccan"
  },
  {
    "number": 72,
    "name_en": "Al-Jinn",
    "name_ar": "سُورَةُ الجِنِّ",
    "translation": "The Jinn",
    "total_ayahs": 28,
    "revelation_type": "Meccan"
  },
  {
    "number": 73,
    "name_en": "Al-Muzzammil",
    "name_ar": "سُورَةُ المُزَّمِّلِ",
    "translation": "The Enshrouded One",
    "total_ayahs": 20,
    "revelation_type": "Meccan"
  },
  {
    "number": 74,
    "name_en": "Al-Muddaththir",
    "name_ar": "سُورَةُ المُدَّثِّرِ",
    "translation": "The Cloaked One",
    "total_ayahs": 56,
    "revelation_type": "Meccan"
  },
  {
    "number": 75,
    "name_en": "Al-Qiyaama",
    "name_ar": "سُورَةُ القِيَامَةِ",
    "translation": "The Resurrection",
    "total_ayahs": 40,
    "revelation_type": "Meccan"
  },
  {
    "number": 76,
    "name_en": "Al-Insaan",
    "name_ar": "سُورَةُ الإِنسَانِ",
    "translation": "Man",
    "total_ayahs": 31,
    "revelation_type": "Medinan"
  },
  {
    "number": 77,
    "name_en": "Al-Mursalaat",
    "name_ar": "سُورَةُ المُرۡسَلَاتِ",
    "translation": "The Emissaries",
    "total_ayahs": 50,
    "revelation_type": "Meccan"
  },
  {
    "number": 78,
    "name_en": "An-Naba",
    "name_ar": "سُورَةُ النَّبَإِ",
    "translation": "The Announcement",
    "total_ayahs": 40,
    "revelation_type": "Meccan"
  },
  {
    "number": 79,
    "name_en": "An-Naazi'aat",
    "name_ar": "سُورَةُ النَّازِعَاتِ",
    "translation": "Those who drag forth",
    "total_ayahs": 46,
    "revelation_type": "Meccan"
  },
  {
    "number": 80,
    "name_en": "Abasa",
    "name_ar": "سُورَةُ عَبَسَ",
    "translation": "He frowned",
    "total_ayahs": 42,
    "revelation_type": "Meccan"
  },
  {
    "number": 81,
    "name_en": "At-Takwir",
    "name_ar": "سُورَةُ التَّكۡوِيرِ",
    "translation": "The Overthrowing",
    "total_ayahs": 29,
    "revelation_type": "Meccan"
  },
  {
    "number": 82,
    "name_en": "Al-Infitaar",
    "name_ar": "سُورَةُ الانفِطَارِ",
    "translation": "The Cleaving",
    "total_ayahs": 19,
    "revelation_type": "Meccan"
  },
  {
    "number": 83,
    "name_en": "Al-Mutaffifin",
    "name_ar": "سُورَةُ المُطَفِّفِينَ",
    "translation": "Defrauding",
    "total_ayahs": 36,
    "revelation_type": "Meccan"
  },
  {
    "number": 84,
    "name_en": "Al-Inshiqaaq",
    "name_ar": "سُورَةُ الانشِقَاقِ",
    "translation": "The Splitting Open",
    "total_ayahs": 25,
    "revelation_type": "Meccan"
  },
  {
    "number": 85,
    "name_en": "Al-Burooj",
    "name_ar": "سُورَةُ البُرُوجِ",
    "translation": "The Constellations",
    "total_ayahs": 22,
    "revelation_type": "Meccan"
  },
  {
    "number": 86,
    "name_en": "At-Taariq",
    "name_ar": "سُورَةُ الطَّارِقِ",
    "translation": "The Morning Star",
    "total_ayahs": 17,
    "revelation_type": "Meccan"
  },
  {
    "number": 87,
    "name_en": "Al-A'laa",
    "name_ar": "سُورَةُ الأَعۡلَىٰ",
    "translation": "The Most High",
    "total_ayahs": 19,
    "revelation_type": "Meccan"
  },
  {
    "number": 88,
    "name_en": "Al-Ghaashiya",
    "name_ar": "سُورَةُ الغَاشِيَةِ",
    "translation": "The Overwhelming",
    "total_ayahs": 26,
    "revelation_type": "Meccan"
  },
  {
    "number": 89,
    "name_en": "Al-Fajr",
    "name_ar": "سُورَةُ الفَجۡرِ",
    "translation": "The Dawn",
    "total_ayahs": 30,
    "revelation_type": "Meccan"
  },
  {
    "number": 90,
    "name_en": "Al-Balad",
    "name_ar": "سُورَةُ البَلَدِ",
    "translation": "The City",
    "total_ayahs": 20,
    "revelation_type": "Meccan"
  },
  {
    "number": 91,
    "name_en": "Ash-Shams",
    "name_ar": "سُورَةُ الشَّمۡسِ",
    "translation": "The Sun",
    "total_ayahs": 15,
    "revelation_type": "Meccan"
  },
  {
    "number": 92,
    "name_en": "Al-Lail",
    "name_ar": "سُورَةُ اللَّيۡلِ",
    "translation": "The Night",
    "total_ayahs": 21,
    "revelation_type": "Meccan"
  },
  {
    "number": 93,
    "name_en": "Ad-Dhuhaa",
    "name_ar": "سُورَةُ الضُّحَىٰ",
    "translation": "The Morning Hours",
    "total_ayahs": 11,
    "revelation_type": "Meccan"
  },
  {
    "number": 94,
    "name_en": "Ash-Sharh",
    "name_ar": "سُورَةُ الشَّرۡحِ",
    "translation": "The Consolation",
    "total_ayahs": 8,
    "revelation_type": "Meccan"
  },
  {
    "number": 95,
    "name_en": "At-Tin",
    "name_ar": "سُورَةُ التِّينِ",
    "translation": "The Fig",
    "total_ayahs": 8,
    "revelation_type": "Meccan"
  },
  {
    "number": 96,
    "name_en": "Al-Alaq",
    "name_ar": "سُورَةُ العَلَقِ",
    "translation": "The Clot",
    "total_ayahs": 19,
    "revelation_type": "Meccan"
  },
  {
    "number": 97,
    "name_en": "Al-Qadr",
    "name_ar": "سُورَةُ القَدۡرِ",
    "translation": "The Power, Fate",
    "total_ayahs": 5,
    "revelation_type": "Meccan"
  },
  {
    "number": 98,
    "name_en": "Al-Bayyina",
    "name_ar": "سُورَةُ البَيِّنَةِ",
    "translation": "The Evidence",
    "total_ayahs": 8,
    "revelation_type": "Medinan"
  },
  {
    "number": 99,
    "name_en": "Az-Zalzala",
    "name_ar": "سُورَةُ الزَّلۡزَلَةِ",
    "translation": "The Earthquake",
    "total_ayahs": 8,
    "revelation_type": "Medinan"
  },
  {
    "number": 100,
    "name_en": "Al-Aadiyaat",
    "name_ar": "سُورَةُ العَادِيَاتِ",
    "translation": "The Chargers",
    "total_ayahs": 11,
    "revelation_type": "Meccan"
  },
  {
    "number": 101,
    "name_en": "Al-Qaari'a",
    "name_ar": "سُورَةُ القَارِعَةِ",
    "translation": "The Calamity",
    "total_ayahs": 11,
    "revelation_type": "Meccan"
  },
  {
    "number": 102,
    "name_en": "At-Takaathur",
    "name_ar": "سُورَةُ التَّكَاثُرِ",
    "translation": "Competition",
    "total_ayahs": 8,
    "revelation_type": "Meccan"
  },
  {
    "number": 103,
    "name_en": "Al-Asr",
    "name_ar": "سُورَةُ العَصۡرِ",
    "translation": "The Declining Day, Epoch",
    "total_ayahs": 3,
    "revelation_type": "Meccan"
  },
  {
    "number": 104,
    "name_en": "Al-Humaza",
    "name_ar": "سُورَةُ الهُمَزَةِ",
    "translation": "The Traducer",
    "total_ayahs": 9,
    "revelation_type": "Meccan"
  },
  {
    "number": 105,
    "name_en": "Al-Fil",
    "name_ar": "سُورَةُ الفِيلِ",
    "translation": "The Elephant",
    "total_ayahs": 5,
    "revelation_type": "Meccan"
  },
  {
    "number": 106,
    "name_en": "Quraish",
    "name_ar": "سُورَةُ قُرَيۡشٍ",
    "translation": "Quraysh",
    "total_ayahs": 4,
    "revelation_type": "Meccan"
  },
  {
    "number": 107,
    "name_en": "Al-Maa'un",
    "name_ar": "سُورَةُ المَاعُونِ",
    "translation": "Almsgiving",
    "total_ayahs": 7,
    "revelation_type": "Meccan"
  },
  {
    "number": 108,
    "name_en": "Al-Kawthar",
    "name_ar": "سُورَةُ الكَوۡثَرِ",
    "translation": "Abundance",
    "total_ayahs": 3,
    "revelation_type": "Meccan"
  },
  {
    "number": 109,
    "name_en": "Al-Kaafiroon",
    "name_ar": "سُورَةُ الكَافِرُونَ",
    "translation": "The Disbelievers",
    "total_ayahs": 6,
    "revelation_type": "Meccan"
  },
  {
    "number": 110,
    "name_en": "An-Nasr",
    "name_ar": "سُورَةُ النَّصۡرِ",
    "translation": "Divine Support",
    "total_ayahs": 3,
    "revelation_type": "Medinan"
  },
  {
    "number": 111,
    "name_en": "Al-Masad",
    "name_ar": "سُورَةُ المَسَدِ",
    "translation": "The Palm Fibre",
    "total_ayahs": 5,
    "revelation_type": "Meccan"
  },
  {
    "number": 112,
    "name_en": "Al-Ikhlaas",
    "name_ar": "سُورَةُ الإِخۡلَاصِ",
    "translation": "Sincerity",
    "total_ayahs": 4,
    "revelation_type": "Meccan"
  },
  {
    "number": 113,
    "name_en": "Al-Falaq",
    "name_ar": "سُورَةُ الفَلَقِ",
    "translation": "The Dawn",
    "total_ayahs": 5,
    "revelation_type": "Meccan"
  },
  {
    "number": 114,
    "name_en": "An-Naas",
    "name_ar": "سُورَةُ النَّاسِ",
    "translation": "Mankind",
    "total_ayahs": 6,
    "revelation_type": "Meccan"
  }
];

export function getSurahByNumber(num: number): SurahMeta | undefined {
  return SURAH_LIST.find((s) => s.number === num);
}

export function getAyahAudioUrl(reciterSlug: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciterSlug}/${s}${a}.mp3`;
}

// In-memory cache for loaded surah texts to eliminate redundant network requests
const surahCache = new Map<number, AyahVerse[]>();

export async function fetchSurahVerses(surahNumber: number): Promise<AyahVerse[]> {
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!;
  }

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
    if (!res.ok) {
      throw new Error(`Quran API error: status ${res.status}`);
    }
    const json = await res.json();
    if (json.status !== 'OK' || !json.data || !Array.isArray(json.data.ayahs)) {
      throw new Error('Invalid response structure from Quran API');
    }

    const verses: AyahVerse[] = json.data.ayahs.map((a: any) => ({
      numberInSurah: a.numberInSurah,
      numberInQuran: a.number,
      text: a.text
    }));

    surahCache.set(surahNumber, verses);
    return verses;
  } catch (err: any) {
    console.error('Failed to fetch surah verses:', err);
    throw err;
  }
}
