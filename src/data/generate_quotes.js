// Generator script to produce student_quotes.json and teacher_quotes.json with 100 authentic Islamic quotes each.
const fs = require('fs');
const path = require('path');

const studentQuotes = [
  {
    id: 's-1',
    category: 'seeking_knowledge',
    arabic: 'وَقُل رَّبِّ زِدۡنِي عِلۡمٗا',
    text: 'And say: My Lord, increase me in knowledge.',
    source: 'Surah Ta-Ha (20:114)',
    type: 'quran'
  },
  {
    id: 's-2',
    category: 'seeking_knowledge',
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    text: 'Seeking knowledge is an obligation upon every Muslim.',
    source: 'Sunan Ibn Majah 224 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-3',
    category: 'seeking_knowledge',
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    text: 'Whoever treads a path in search of knowledge, Allah will make easy for him the path to Paradise.',
    source: 'Sahih Muslim 2699',
    type: 'hadith'
  },
  {
    id: 's-4',
    category: 'quran_learning',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    text: 'The best among you are those who learn the Quran and teach it.',
    source: 'Sahih al-Bukhari 5027',
    type: 'hadith'
  },
  {
    id: 's-5',
    category: 'seeking_knowledge',
    arabic: 'هَلۡ يَسۡتَوِي الَّذِينَ يَعۡلَمُونَ وَالَّذِينَ لَا يَعۡلَمُونَ',
    text: 'Are those who know equal to those who do not know? Only they will remember who are people of understanding.',
    source: 'Surah Az-Zumar (39:9)',
    type: 'quran'
  },
  {
    id: 's-6',
    category: 'discipline_sincerity',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    text: 'Actions are judged by intentions, and every person will get what they intended.',
    source: 'Sahih al-Bukhari 1, Sahih Muslim 1907',
    type: 'hadith'
  },
  {
    id: 's-7',
    category: 'good_manners',
    arabic: 'إِنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنَكُمْ أَخْلاَقًا',
    text: 'The most beloved of you to me and the closest of you to me on the Day of Resurrection are the best of you in character.',
    source: 'Jami at-Tirmidhi 2018 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-8',
    category: 'respect_parents',
    arabic: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعۡبُدُوٓاْ إِلَّآ إِيَّاهُ وَبِٱلۡوَٰلِدَيۡنِ إِحۡسَٰنًا',
    text: 'And your Lord has decreed that you not worship except Him, and to parents, good treatment.',
    source: 'Surah Al-Isra (17:23)',
    type: 'quran'
  },
  {
    id: 's-9',
    category: 'respect_teachers',
    arabic: 'تَعَلَّمُوا الْعِلْمَ وَتَعَلَّمُوا لِلْعِلْمِ السَّكِينَةَ وَالْوَقَارَ وَتَوَاضَعُوا لِمَنْ تَتَعَلَّمُونَ مِنْهُ',
    text: 'Learn knowledge, and acquire tranquility and dignity along with it, and humble yourselves before those from whom you learn.',
    source: 'Al-Mu’jam al-Awsat of at-Tabarani',
    type: 'hadith'
  },
  {
    id: 's-10',
    category: 'patience_perseverance',
    arabic: 'وَٱصۡبِرۡۚ إِنَّ ٱللَّهَ لَا يُضِيعُ أَجۡرَ ٱلۡمُحۡسِنِينَ',
    text: 'And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.',
    source: 'Surah Hud (11:115)',
    type: 'quran'
  },
  {
    id: 's-11',
    category: 'study_habits',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    text: 'The most beloved deed to Allah is the most regular and constant even if it were little.',
    source: 'Sahih al-Bukhari 6464, Sahih Muslim 782',
    type: 'hadith'
  },
  {
    id: 's-12',
    category: 'honesty_truth',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    text: 'Adhere to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise.',
    source: 'Sahih Muslim 2607',
    type: 'hadith'
  },
  {
    id: 's-13',
    category: 'seeking_knowledge',
    arabic: 'يَرۡفَعِ ٱللَّهُ ٱلَّذِينَ ءَامَنُواْ مِنكُمۡ وَٱلَّذِينَ أُوتُواْ ٱلۡعِلۡمَ دَرَجَٰتٖ',
    text: 'Allah will raise those who have believed among you and those who were given knowledge, by degrees.',
    source: 'Surah Al-Mujadila (58:11)',
    type: 'quran'
  },
  {
    id: 's-14',
    category: 'kindness_manners',
    arabic: 'إِنَّ الرِّفْقَ لاَ يَكُونُ فِي شَىْءٍ إِلاَّ زَانَهُ وَلاَ يُنْزَعُ مِنْ شَىْءٍ إِلاَّ شَانَهُ',
    text: 'Gentleness is not found in anything except that it beautifies it, and it is not removed from anything except that it mars it.',
    source: 'Sahih Muslim 2594',
    type: 'hadith'
  },
  {
    id: 's-15',
    category: 'respect_parents',
    arabic: 'رِضَى الرَّبِّ فِي رِضَى الْوَالِدِ وَسَخَطُ الرَّبِّ فِي سَخَطِ الْوَالِدِ',
    text: 'The pleasure of the Lord lies in the pleasure of the parent, and the displeasure of the Lord lies in the displeasure of the parent.',
    source: 'Jami at-Tirmidhi 1899 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-16',
    category: 'time_management',
    arabic: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ الصِّحَّةُ وَالْفَرَاغُ',
    text: 'There are two blessings which many people lose: health and free time.',
    source: 'Sahih al-Bukhari 6412',
    type: 'hadith'
  },
  {
    id: 's-17',
    category: 'seeking_knowledge',
    arabic: 'إِنَّ الْمَلاَئِكَةَ لَتَضَعُ أَجْنِحَتَهَا رِضًا لِطَالِبِ الْعِلْمِ',
    text: 'Indeed, the angels lower their wings in approval for the seeker of knowledge, being pleased with what he seeks.',
    source: 'Sunan Abi Dawud 3641, Jami at-Tirmidhi 2682 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-18',
    category: 'quran_learning',
    arabic: 'الَّذِي يَقْرَأُ الْقُرْآنَ وَهُوَ مَاهِرٌ بِهِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ',
    text: 'The one who is proficient in the recitation of the Quran will be with the noble and honorable scribes (angels).',
    source: 'Sahih al-Bukhari 4937, Sahih Muslim 798',
    type: 'hadith'
  },
  {
    id: 's-19',
    category: 'quran_learning',
    arabic: 'وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ',
    text: 'And the one who recites the Quran with difficulty, stammering through its verses, for him is a double reward.',
    source: 'Sahih al-Bukhari 4937, Sahih Muslim 798',
    type: 'hadith'
  },
  {
    id: 's-20',
    category: 'character_manners',
    arabic: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ صَالِحَ الأَخْلاَقِ',
    text: 'I was sent only to perfect noble character.',
    source: 'Musnad Ahmad 8952, Al-Adab Al-Mufrad 273 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-21',
    category: 'prayer_humility',
    arabic: 'وَٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلۡخَٰشِعِينَ',
    text: 'And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive to Allah.',
    source: 'Surah Al-Baqarah (2:45)',
    type: 'quran'
  },
  {
    id: 's-22',
    category: 'trust_in_allah',
    arabic: 'وَمَن يَتَّقِ ٱللَّهَ يَجۡعَل لَّهُۥ مَخۡرَجٗا وَيَرۡزُقۡهُ مِنۡ حَيۡثُ لَا يَحۡتَسِبُ',
    text: 'And whoever fears Allah — He will make for him a way out and will provide for him from where he does not expect.',
    source: 'Surah At-Talaq (65:2-3)',
    type: 'quran'
  },
  {
    id: 's-23',
    category: 'seeking_knowledge',
    arabic: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا',
    text: 'O Allah, benefit me with what You have taught me, teach me that which will benefit me, and increase me in knowledge.',
    source: 'Sunan Ibn Majah 251, Jami at-Tirmidhi 3599 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-24',
    category: 'seeking_knowledge',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً',
    text: 'O Allah, I ask You for beneficial knowledge, wholesome sustenance, and accepted deeds.',
    source: 'Sunan Ibn Majah 925 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-25',
    category: 'friendship_company',
    arabic: 'الْمَرْءُ عَلَى دِينِ خَلِيلِهِ فَلْيَنْظُرْ أَحَدُكُمْ مَنْ يُخَالِلُ',
    text: 'A person is upon the religion of his close friend, so let each of you look at whom he befriends.',
    source: 'Sunan Abi Dawud 4833, Jami at-Tirmidhi 2378 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-26',
    category: 'good_words',
    arabic: 'وَقُولُواْ لِلنَّاسِ حُسۡنٗا',
    text: 'And speak to people good words.',
    source: 'Surah Al-Baqarah (2:83)',
    type: 'quran'
  },
  {
    id: 's-27',
    category: 'respect_elders',
    arabic: 'لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا وَيَعْرِفْ شَرَفَ كَبِيرِنَا',
    text: 'He is not one of us who does not show mercy to our young nor acknowledge the honor of our elders.',
    source: 'Sunan Abi Dawud 4943, Jami at-Tirmidhi 1919 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-28',
    category: 'patience_learning',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلاَّ عِزًّا وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ',
    text: 'Charity does not decrease wealth, and Allah does not increase a servant for forgiving except in honor, and no one humbles himself for Allah except that Allah raises him.',
    source: 'Sahih Muslim 2588',
    type: 'hadith'
  },
  {
    id: 's-29',
    category: 'discipline_habits',
    arabic: 'احْفَظِ اللَّهَ يَحْفَظْكَ احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ',
    text: 'Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him in front of you.',
    source: 'Jami at-Tirmidhi 2516 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-30',
    category: 'studying_effort',
    arabic: 'وَأَن لَّيۡسَ لِلۡإِنسَٰنِ إِلَّا مَا سَعَىٰ وَأَنَّ سَعۡيَهُۥ سَوۡفَ يُرَىٰ',
    text: 'And that there is not for man except that for which he strives, and that his effort is going to be seen.',
    source: 'Surah An-Najm (53:39-40)',
    type: 'quran'
  },
  {
    id: 's-31',
    category: 'quran_pondering',
    arabic: 'كِتَٰبٌ أَنزَلۡنَٰهُ إِلَيۡكَ مُبَٰرَكٞ لِّيَدَّبَّرُوٓاْ ءَايَٰتِهِۦ وَلِيَتَذَكَّرَ أُوْلُواْ ٱلۡأَلۡبَٰبِ',
    text: 'This is a blessed Book which We have revealed to you, that they might reflect upon its verses and that those of understanding would be reminded.',
    source: 'Surah Sad (38:29)',
    type: 'quran'
  },
  {
    id: 's-32',
    category: 'gratitude_learning',
    arabic: 'لَئِن شَكَرۡتُمۡ لَأَزِيدَنَّكُمۡ',
    text: 'If you are grateful, I will surely increase you in favor.',
    source: 'Surah Ibrahim (14:7)',
    type: 'quran'
  },
  {
    id: 's-33',
    category: 'curiosity_asking',
    arabic: 'فَسۡـَٔلُوٓاْ أَهۡلَ ٱلذِّكۡرِ إِن كُنتُمۡ لَا تَعۡلَمُونَ',
    text: 'So ask the people of the message if you do not know.',
    source: 'Surah An-Nahl (16:43)',
    type: 'quran'
  },
  {
    id: 's-34',
    category: 'consistency_deeds',
    arabic: 'سَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا فَإِنَّهُ لاَ يُدْخِلُ أَحَدًا الْجَنَّةَ عَمَلُهُ قَالُوا وَلاَ أَنْتَ يَا رَسُولَ اللَّهِ قَالَ وَلاَ أَنَا إِلاَّ أَنْ يَتَغَمَّدَنِي اللَّهُ بِمَغْفِرَةٍ وَرَحْمَةٍ',
    text: 'Follow the right course, be moderate, and give glad tidings; for none among you will be saved by his deeds alone.',
    source: 'Sahih al-Bukhari 6467, Sahih Muslim 2818',
    type: 'hadith'
  },
  {
    id: 's-35',
    category: 'modesty_shyness',
    arabic: 'الْحَيَاءُ لاَ يَأْتِي إِلاَّ بِخَيْرٍ',
    text: 'Modesty brings nothing but good.',
    source: 'Sahih al-Bukhari 6117, Sahih Muslim 37',
    type: 'hadith'
  },
  {
    id: 's-36',
    category: 'seeking_knowledge',
    arabic: 'مَنْ جَاءَهُ أَجَلُهُ وَهُوَ يَطْلُبُ الْعِلْمَ لِيُحْيِيَ بِهِ الإِسْلاَمَ كَانَ بَيْنَهُ وَبَيْنَ النَّبِيِّينَ دَرَجَةٌ وَاحِدَةٌ فِي الْجَنَّةِ',
    text: 'Whoever meets his death while seeking knowledge to revive Islam, between him and the prophets is only one degree in Paradise.',
    source: 'Sunan ad-Darimi 361 — Hasan Gharib',
    type: 'hadith'
  },
  {
    id: 's-37',
    category: 'cleanliness_discipline',
    arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ',
    text: 'Cleanliness and purification are half of faith.',
    source: 'Sahih Muslim 223',
    type: 'hadith'
  },
  {
    id: 's-38',
    category: 'controlling_anger',
    arabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
    text: 'The strong is not the one who overcomes the people by his strength, but the strong is the one who controls himself while in anger.',
    source: 'Sahih al-Bukhari 6114, Sahih Muslim 2609',
    type: 'hadith'
  },
  {
    id: 's-39',
    category: 'kindness_generosity',
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    text: 'Your smiling in the face of your brother is charity for you.',
    source: 'Jami at-Tirmidhi 1956 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-40',
    category: 'truthfulness',
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱتَّقُواْ ٱللَّهَ وَكُونُواْ مَعَ ٱلصَّٰدِقِينَ',
    text: 'O you who have believed, fear Allah and be with those who are true.',
    source: 'Surah At-Tawbah (9:119)',
    type: 'quran'
  },
  {
    id: 's-41',
    category: 'seeking_knowledge',
    arabic: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    text: 'When a human being dies, his deeds come to an end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.',
    source: 'Sahih Muslim 1631',
    type: 'hadith'
  },
  {
    id: 's-42',
    category: 'punctuality_promises',
    arabic: 'وَأَوۡفُواْ بِٱلۡعَهۡدِۖ إِنَّ ٱلۡعَهۡدَ كَانَ مَسۡـُٔولٗا',
    text: 'And fulfill every commitment. Indeed, the commitment is ever inquired about.',
    source: 'Surah Al-Isra (17:34)',
    type: 'quran'
  },
  {
    id: 's-43',
    category: 'respect_teachers',
    arabic: 'وَقِّرُوا مَنْ تَتَعَلَّمُونَ مِنْهُ الْعِلْمَ',
    text: 'Respect and revere those from whom you learn knowledge.',
    source: 'Imam ash-Shafi’i in Diwan ash-Shafi’i',
    type: 'reminder'
  },
  {
    id: 's-44',
    category: 'quran_light',
    arabic: 'إِنَّ هَٰذَا ٱلۡقُرۡءَانَ يَهۡدِي لِلَّتِي هِيَ أَقۡوَمُ',
    text: 'Indeed, this Quran guides to that which is most suitable and gives good tidings to the believers.',
    source: 'Surah Al-Isra (17:9)',
    type: 'quran'
  },
  {
    id: 's-45',
    category: 'wisdom_understanding',
    arabic: 'يُؤۡتِي ٱلۡحِكۡمَةَ مَن يَشَآءُۚ وَمَن يُؤۡتَ ٱلۡحِكۡمَةَ فَقَدۡ أُوتِيَ خَيۡرٗا كَثِيرٗا',
    text: 'He gives wisdom to whom He wills, and whoever has been given wisdom has certainly been given much good.',
    source: 'Surah Al-Baqarah (2:269)',
    type: 'quran'
  },
  {
    id: 's-46',
    category: 'excellence_in_action',
    arabic: 'إِنَّ اللَّهَ تَعَالَى يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلاً أَنْ يُتْقِنَهُ',
    text: 'Verily Allah loves that when one of you does a job, he should do it with perfection and excellence.',
    source: 'Shu’ab al-Iman of al-Bayhaqi 4929 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-47',
    category: 'humility_learning',
    arabic: 'لاَ يَنَالُ الْعِلْمَ مُسْتَحْيٍ وَلاَ مُسْتَكْبِرٌ',
    text: 'Knowledge cannot be acquired by one who is too timid (to ask) nor by one who is proud.',
    source: 'Mujahid ibn Jabr in Sahih al-Bukhari (Book of Knowledge)',
    type: 'reminder'
  },
  {
    id: 's-48',
    category: 'guarding_tongue',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    source: 'Sahih al-Bukhari 6018, Sahih Muslim 47',
    type: 'hadith'
  },
  {
    id: 's-49',
    category: 'brotherhood_mercy',
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    text: 'None of you truly believes until he loves for his brother what he loves for himself.',
    source: 'Sahih al-Bukhari 13, Sahih Muslim 45',
    type: 'hadith'
  },
  {
    id: 's-50',
    category: 'dua_difficulty',
    arabic: 'اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً',
    text: 'O Allah, there is no ease except what You make easy, and You make hardship easy if You will.',
    source: 'Sahih Ibn Hibban 974',
    type: 'hadith'
  },
  {
    id: 's-51',
    category: 'seeking_knowledge',
    arabic: 'مَنْ خَرَجَ فِي طَلَبِ الْعِلْمِ كَانَ فِي سَبِيلِ اللَّهِ حَتَّى يَرْجِعَ',
    text: 'Whoever goes out seeking knowledge is in the path of Allah until he returns.',
    source: 'Jami at-Tirmidhi 2647 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-52',
    category: 'listening_attentively',
    arabic: 'وَإِذَا قُرِئَ ٱلۡقُرۡءَانُ فَٱسۡتَمِعُواْ لَهُۥ وَأَنصِتُواْ لَعَلَّكُمۡ تُرۡحَمُونَ',
    text: 'So when the Quran is recited, then listen to it and pay attention that you may receive mercy.',
    source: 'Surah Al-A’raf (7:204)',
    type: 'quran'
  },
  {
    id: 's-53',
    category: 'respect_parents',
    arabic: 'جَآءَ رَجُلٌ إِلَىٰ رَسُولِ ٱللَّهِ ﷺ فَقَالَ مَنْ أَحَقُّ ٱلنَّاسِ بِحُسۡنِ صَحَابَتِي؟ قَالَ: أُمُّكَ. قَالَ ثُمَّ مَنْ؟ قَالَ: أُمُّكَ. قَالَ ثُمَّ مَنْ؟ قَالَ: أُمُّكَ. قَالَ ثُمَّ مَنْ؟ قَالَ: أَبُوكَ',
    text: 'A man asked: Who is most entitled to my good companionship? The Prophet ﷺ replied: Your mother, then your mother, then your mother, then your father.',
    source: 'Sahih al-Bukhari 5971, Sahih Muslim 2548',
    type: 'hadith'
  },
  {
    id: 's-54',
    category: 'perseverance_ease',
    arabic: 'فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا إِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا',
    text: 'For indeed, with hardship will be ease. Indeed, with hardship will be ease.',
    source: 'Surah Ash-Sharh (94:5-6)',
    type: 'quran'
  },
  {
    id: 's-55',
    category: 'gratitude_teachers',
    arabic: 'لاَ يَشْكُرُ اللَّهَ مَنْ لاَ يَشْكُرُ النَّاسَ',
    text: 'He who does not thank people does not thank Allah.',
    source: 'Sunan Abi Dawud 4811, Jami at-Tirmidhi 1954 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-56',
    category: 'writing_preserving',
    arabic: 'قَيِّدُوا الْعِلْمَ بِالْكِتَابِ',
    text: 'Preserve and bind knowledge by writing it down.',
    source: 'Al-Mu’jam al-Kabeer of at-Tabarani, Mustadrak al-Hakim — Sahih',
    type: 'hadith'
  },
  {
    id: 's-57',
    category: 'mindfulness_character',
    arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    text: 'Fear Allah wherever you may be, follow an evil deed with a good deed to wipe it out, and treat people with good behavior.',
    source: 'Jami at-Tirmidhi 1987 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 's-58',
    category: 'justice_fairness',
    arabic: 'وَإِذَا حَكَمۡتُم بَيۡنَ ٱلنَّاسِ أَن تَحۡكُمُواْ بِٱلۡعَدۡلِ',
    text: 'And when you judge between people, judge with justice.',
    source: 'Surah An-Nisa (4:58)',
    type: 'quran'
  },
  {
    id: 's-59',
    category: 'seerah_compassion',
    arabic: 'فَبِمَا رَحۡمَةٖ مِّنَ ٱللَّهِ لِنتَ لَهُمۡۖ وَلَوۡ كُنتَ فَظًّا غَلِيظَ ٱلۡقَلۡبِ لَٱنفَضُّواْ مِنۡ حَوۡلِكَ',
    text: 'So by mercy from Allah, you were lenient with them. And if you had been rude and harsh in heart, they would have disbanded from about you.',
    source: 'Surah Ali ‘Imran (3:159)',
    type: 'quran'
  },
  {
    id: 's-60',
    category: 'knowledge_light',
    arabic: 'إِنَّمَا يَخۡشَى ٱللَّهَ مِنۡ عِبَادِهِ ٱلۡعُلَمَٰٓؤُاْ',
    text: 'Only those fear Allah, from among His servants, who have knowledge.',
    source: 'Surah Fatir (35:28)',
    type: 'quran'
  },
  {
    id: 's-61',
    category: 'helpfulness',
    arabic: 'وَاللَّهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ',
    text: 'Allah helps His servant as long as the servant helps his brother.',
    source: 'Sahih Muslim 2699',
    type: 'hadith'
  },
  {
    id: 's-62',
    category: 'morning_blessing',
    arabic: 'اللَّهُمَّ بَارِكْ لأُمَّتِي فِي بُكُورِهَا',
    text: 'O Allah, bless my nation in their early morning endeavors.',
    source: 'Sunan Abi Dawud 2606, Jami at-Tirmidhi 1212 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-63',
    category: 'guarding_pride',
    arabic: 'لاَ يَدْخُلُ الْجَنَّةَ مَنْ كَانَ فِي قَلْبِهِ مِثْقَالُ ذَرَّةٍ مِنْ كِبْرٍ',
    text: 'He who has in his heart an atom’s weight of arrogance will not enter Paradise.',
    source: 'Sahih Muslim 91',
    type: 'hadith'
  },
  {
    id: 's-64',
    category: 'humility_in_speech',
    arabic: 'وَٱقۡصِدۡ فِي مَشۡيِكَ وَٱغۡضُضۡ مِن صَوۡتِكَ',
    text: 'And be moderate in your pace and lower your voice.',
    source: 'Surah Luqman (31:19)',
    type: 'quran'
  },
  {
    id: 's-65',
    category: 'patience_reward',
    arabic: 'إِنَّمَا يُوَفَّى ٱلصَّٰبِرُونَ أَجۡرَهُم بِغَيۡرِ حِسَابٖ',
    text: 'Indeed, the patient will be given their reward without account.',
    source: 'Surah Az-Zumar (39:10)',
    type: 'quran'
  },
  {
    id: 's-66',
    category: 'seeking_knowledge',
    arabic: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ',
    text: 'Whomever Allah desires good for, He gives him comprehension of the religion.',
    source: 'Sahih al-Bukhari 71, Sahih Muslim 1037',
    type: 'hadith'
  },
  {
    id: 's-67',
    category: 'peace_greetings',
    arabic: 'أَفْشُوا السَّلاَمَ بَيْنَكُمْ تَحَابُّوا',
    text: 'Spread peace among yourselves and you will love one another.',
    source: 'Sahih Muslim 54',
    type: 'hadith'
  },
  {
    id: 's-68',
    category: 'good_character',
    arabic: 'مَا مِنْ شَىْءٍ أَثْقَلُ فِي مِيزَانِ الْمُؤْمِنِ يَوْمَ الْقِيَامَةِ مِنْ حُسْنِ الْخُلُقِ',
    text: 'There is nothing heavier upon the balance of the believer on the Day of Resurrection than good character.',
    source: 'Jami at-Tirmidhi 2002 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-69',
    category: 'striving_righteousness',
    arabic: 'وَٱلَّذِينَ جَٰهَدُواْ فِينَا لَنَهۡدِيَنَّهُمۡ سُبُلَنَاۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلۡمُحۡسِنِينَ',
    text: 'And those who strive for Us — We will surely guide them to Our ways. And indeed, Allah is with the doers of good.',
    source: 'Surah Al-’Ankabut (29:69)',
    type: 'quran'
  },
  {
    id: 's-70',
    category: 'remembering_allah',
    arabic: 'أَلَا بِذِكۡرِ ٱللَّهِ تَطۡمَئِنُّ ٱلۡقُلُوبُ',
    text: 'Unquestionably, by the remembrance of Allah hearts are assured.',
    source: 'Surah Ar-Ra’d (13:28)',
    type: 'quran'
  },
  {
    id: 's-71',
    category: 'quran_companion',
    arabic: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا',
    text: 'It will be said to the companion of the Quran: Read and ascend, and recite as you recited in the world, for your status will be at the last verse you recite.',
    source: 'Sunan Abi Dawud 1464, Jami at-Tirmidhi 2914 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 's-72',
    category: 'knowledge_practice',
    arabic: 'العِلْمُ يَهْتِفُ بِالعَمَلِ فَإِنْ أَجَابَهُ وَإِلاَّ ارْتَحَلَ',
    text: 'Knowledge calls out for action; if it is answered, it stays, and if not, it departs.',
    source: 'Sufyan ath-Thawri in Jami’ Bayan al-’Ilm',
    type: 'reminder'
  },
  {
    id: 's-73',
    category: 'modesty_garment',
    arabic: 'وَلِبَاسُ ٱلتَّقۡوَىٰ ذَٰلِكَ خَيۡرٞ',
    text: 'And the garment of God-consciousness — that is best.',
    source: 'Surah Al-A’raf (7:26)',
    type: 'quran'
  },
  {
    id: 's-74',
    category: 'avoiding_waste',
    arabic: 'كُلُواْ وَٱشۡرَبُواْ وَلَا تُسۡرِفُوٓاْۚ إِنَّهُۥ لَا يُحِبُّ ٱلۡمُسۡرِفِينَ',
    text: 'Eat and drink, but be not excessive. Indeed, He does not like those who commit excess.',
    source: 'Surah Al-A’raf (7:31)',
    type: 'quran'
  },
  {
    id: 's-75',
    category: 'integrity_trust',
    arabic: 'لاَ إِيمَانَ لِمَنْ لاَ أَمَانَةَ لَهُ وَلاَ دِينَ لِمَنْ لاَ عَهْدَ لَهُ',
    text: 'There is no true faith for one who has no trustworthiness, and no true religion for one who does not keep his covenants.',
    source: 'Musnad Ahmad 12386 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-76',
    category: 'perseverance_goal',
    arabic: 'ٱصۡبِرُوٓاْ وَصَابِرُواْ وَرَابِطُواْ وَٱتَّقُواْ ٱللَّهَ لَعَلَّكُمۡ تُفۡلِحُونَ',
    text: 'Persevere and endure and remain stationed and fear Allah that you may be successful.',
    source: 'Surah Ali ‘Imran (3:200)',
    type: 'quran'
  },
  {
    id: 's-77',
    category: 'seeking_refuge_ignorance',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لاَ يَنْفَعُ وَمِنْ قَلْبٍ لاَ يَخْشَعُ',
    text: 'O Allah, I seek refuge in You from knowledge that does not benefit and from a heart that does not humble itself.',
    source: 'Sahih Muslim 2722',
    type: 'hadith'
  },
  {
    id: 's-78',
    category: 'seerah_mercy',
    arabic: 'وَمَآ أَرۡسَلۡنَٰكَ إِلَّا رَحۡمَةٗ لِّلۡعَٰلَمِينَ',
    text: 'And We have not sent you, [O Muhammad], except as a mercy to the worlds.',
    source: 'Surah Al-Anbiya (21:107)',
    type: 'quran'
  },
  {
    id: 's-79',
    category: 'beneficial_deeds',
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    text: 'The best of people are those that bring the most benefit to people.',
    source: 'Al-Mu’jam al-Awsat of at-Tabarani 5787 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-80',
    category: 'contentment_heart',
    arabic: 'لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ، وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ',
    text: 'True wealth is not in the abundance of material goods; rather, true wealth is the richness of the soul.',
    source: 'Sahih al-Bukhari 6446, Sahih Muslim 1051',
    type: 'hadith'
  },
  {
    id: 's-81',
    category: 'repentance_renewal',
    arabic: 'كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ',
    text: 'Every son of Adam commits sins, and the best of sinners are those who constantly repent.',
    source: 'Jami at-Tirmidhi 2499, Sunan Ibn Majah 4251 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-82',
    category: 'respect_teachers',
    arabic: 'مَنْ عَلَّمَنِي حَرْفاً صِرْتُ لَهُ عَبْداً (أَيْ تَقْدِيراً وَاحْتِرَاماً)',
    text: 'Honor and express gratitude to those who open the gates of understanding for you.',
    source: 'Classical Scholarly Proverb on Teachers',
    type: 'reminder'
  },
  {
    id: 's-83',
    category: 'avoiding_suspicion',
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱجۡتَنِبُواْ كَثِيرٗا مِّنَ ٱلظَّنِّ إِنَّ بَعۡضَ ٱلظَّنِّ إِثۡمٞ',
    text: 'O you who have believed, avoid much negative assumption; indeed, some assumption is sin.',
    source: 'Surah Al-Hujurat (49:12)',
    type: 'quran'
  },
  {
    id: 's-84',
    category: 'curiosity_inquiry',
    arabic: 'العِلْمُ خَزَائِنُ وَمَفَاتِيحُهَا السُّؤَالُ',
    text: 'Knowledge is a collection of treasures, and its keys are thoughtful questions.',
    source: 'Ad-Durr al-Manthur, classical narration',
    type: 'reminder'
  },
  {
    id: 's-85',
    category: 'brotherhood_unity',
    arabic: 'إِنَّمَا ٱلۡمُؤۡمِنُونَ إِخۡوَةٞ فَأَصۡلِحُواْ بَيۡنَ أَخَوَيۡكُمۡ',
    text: 'The believers are but brothers, so make settlement between your brothers.',
    source: 'Surah Al-Hujurat (49:10)',
    type: 'quran'
  },
  {
    id: 's-86',
    category: 'generosity_character',
    arabic: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    text: 'A good, kind word is charity.',
    source: 'Sahih al-Bukhari 2989, Sahih Muslim 1009',
    type: 'hadith'
  },
  {
    id: 's-87',
    category: 'striving_for_excellence',
    arabic: 'إِنَّ ٱللَّهَ يُحِبُّ ٱلۡمُحۡسِنِينَ',
    text: 'Indeed, Allah loves the doers of good and excellence.',
    source: 'Surah Al-Baqarah (2:195)',
    type: 'quran'
  },
  {
    id: 's-88',
    category: 'patience_tests',
    arabic: 'وَلَنَبۡلُوَنَّكُم بِشَيۡءٖ مِّنَ ٱلۡخَوۡفِ وَٱلۡجُوعِ وَنَقۡصٖ مِّنَ ٱلۡأَمۡوَٰلِ وَٱلۡأَنفُسِ وَٱلثَّمَرَٰتِۗ وَبَشِّرِ ٱلصَّٰبِرِينَ',
    text: 'And We will surely test you... but give good tidings to the patient.',
    source: 'Surah Al-Baqarah (2:155)',
    type: 'quran'
  },
  {
    id: 's-89',
    category: 'seeking_forgiveness',
    arabic: 'وَٱسۡتَغۡفِرُواْ ٱللَّهَۖ إِنَّ ٱللَّهَ غَفُورٞ رَّحِيمٞ',
    text: 'And ask forgiveness of Allah. Indeed, Allah is Forgiving and Merciful.',
    source: 'Surah Al-Muzzammil (73:20)',
    type: 'quran'
  },
  {
    id: 's-90',
    category: 'discipline_action',
    arabic: 'بَادِرُوا بِالأَعْمَالِ الصَّالِحَةِ',
    text: 'Hasten to perform righteous and beneficial deeds.',
    source: 'Sahih Muslim 118',
    type: 'hadith'
  },
  {
    id: 's-91',
    category: 'quran_recitation',
    arabic: 'وَرَتِّلِ ٱلۡقُرۡءَانَ تَرۡتِيلًا',
    text: 'And recite the Quran with measured, clear recitation.',
    source: 'Surah Al-Muzzammil (73:4)',
    type: 'quran'
  },
  {
    id: 's-92',
    category: 'trust_in_allah',
    arabic: 'حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ',
    text: 'Sufficient for us is Allah, and He is the best Disposer of affairs.',
    source: 'Surah Ali ‘Imran (3:173)',
    type: 'quran'
  },
  {
    id: 's-93',
    category: 'good_manners',
    arabic: 'أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا',
    text: 'The most complete of believers in faith are those with the best character.',
    source: 'Sunan Abi Dawud 4682, Jami at-Tirmidhi 1162 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 's-94',
    category: 'time_value',
    arabic: 'اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ: شَبَابَكَ قَبْلَ هَرَمِكَ، وَصِحَّتَكَ قَبْلَ سَقَمِكَ، وَغِنَاكَ قَبْلَ فَقْرِكَ، وَفَرَاغَكَ قَبْلَ شُغْلِكَ، وَحَيَاتَكَ قَبْلَ مَوْتِكَ',
    text: 'Take benefit of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your preoccupation, and your life before your death.',
    source: 'Shu’ab al-Iman of al-Bayhaqi 10248 — Sahih',
    type: 'hadith'
  },
  {
    id: 's-95',
    category: 'gratitude_blessings',
    arabic: 'وَإِن تَعُدُّواْ نِعۡمَةَ ٱللَّهِ لَا تُحۡصُوهَآ',
    text: 'And if you should count the favors of Allah, you could not enumerate them.',
    source: 'Surah Ibrahim (14:34)',
    type: 'quran'
  },
  {
    id: 's-96',
    category: 'seeking_knowledge',
    arabic: 'مَنْ أَرَادَ الدُّنْيَا فَعَلَيْهِ بِالعِلْمِ، وَمَنْ أَرَادَ الآخِرَةَ فَعَلَيْهِ بِالعِلْمِ، وَمَنْ أَرَادَهُمَا مَعاً فَعَلَيْهِ بِالعِلْمِ',
    text: 'Whoever desires this world must seek knowledge, whoever desires the hereafter must seek knowledge, and whoever desires both must seek knowledge.',
    source: 'Imam ash-Shafi’i',
    type: 'reminder'
  },
  {
    id: 's-97',
    category: 'honoring_parents',
    arabic: 'وَٱخۡفِضۡ لَهُمَا جَنَاحَ ٱلذُّلِّ مِنَ ٱلرَّحۡمَةِ وَقُل رَّبِّ ٱرۡحَمۡهُمَا كَمَا رَبَّيَانِي صَغِيرٗا',
    text: 'And lower to them the wing of humility out of mercy and say: My Lord, have mercy upon them as they brought me up when I was small.',
    source: 'Surah Al-Isra (17:24)',
    type: 'quran'
  },
  {
    id: 's-98',
    category: 'modesty_conduct',
    arabic: 'إِنَّ لِكُلِّ دِينٍ خُلُقًا وَخُلُقُ الإِسْلاَمِ الْحَيَاءُ',
    text: 'Every religion has its distinct character, and the distinct character of Islam is modesty.',
    source: 'Sunan Ibn Majah 4181 — Hasan',
    type: 'hadith'
  },
  {
    id: 's-99',
    category: 'righteousness_piety',
    arabic: 'لَن تَنَالُواْ ٱلۡبِرَّ حَتَّىٰ تُنفِقُواْ مِمَّا تُحِبُّونَ',
    text: 'Never will you attain the good reward until you spend in the way of Allah from that which you love.',
    source: 'Surah Ali ‘Imran (3:92)',
    type: 'quran'
  },
  {
    id: 's-100',
    category: 'perseverance_supplication',
    arabic: 'رَبَّنَآ ءَاتِنَا فِي ٱلدُّنۡيَا حَسَنَةٗ وَفِي ٱلۡأٓخِرَةِ حَسَنَةٗ وَقِنَا عَذَابَ ٱلنَّارِ',
    text: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.',
    source: 'Surah Al-Baqarah (2:201)',
    type: 'quran'
  }
];

const teacherQuotes = [
  {
    id: 't-1',
    category: 'virtue_of_teaching',
    arabic: 'إِنَّمَا بُعِثْتُ مُعَلِّمًا',
    text: 'Verily, I was sent only as a teacher.',
    source: 'Sunan Ibn Majah 229 — Hasan',
    type: 'hadith'
  },
  {
    id: 't-2',
    category: 'virtue_of_teaching',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    text: 'The best among you are those who learn the Quran and teach it to others.',
    source: 'Sahih al-Bukhari 5027',
    type: 'hadith'
  },
  {
    id: 't-3',
    category: 'virtue_of_teaching',
    arabic: 'إِنَّ اللَّهَ وَمَلاَئِكَتَهُ وَأَهْلَ السَّمَوَاتِ وَالأَرْضِ حَتَّى النَّمْلَةَ فِي جُحْرِهَا وَحَتَّى الْحُوتَ لَيُصَلُّونَ عَلَى مُعَلِّمِ النَّاسِ الْخَيْرَ',
    text: 'Indeed, Allah, His angels, the inhabitants of the heavens and the earth, even the ant in its hole and the fish send blessings upon the one who teaches people good.',
    source: 'Jami at-Tirmidhi 2685 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 't-4',
    category: 'sharing_knowledge',
    arabic: 'مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ',
    text: 'Whoever guides someone to goodness will have a reward like that of its doer.',
    source: 'Sahih Muslim 1893',
    type: 'hadith'
  },
  {
    id: 't-5',
    category: 'method_compassion',
    arabic: 'يَسِّرُوا وَلاَ تُعَسِّرُوا، وَبَشِّرُوا وَلاَ تُنَفِّرُوا',
    text: 'Make things easy for people and do not make them difficult; give glad tidings and do not push them away.',
    source: 'Sahih al-Bukhari 69, Sahih Muslim 1734',
    type: 'hadith'
  },
  {
    id: 't-6',
    category: 'wisdom_in_guidance',
    arabic: 'ٱدۡعُ إِلَىٰ سَبِيلِ رَبِّكَ بِٱلۡحِكۡمَةِ وَٱلۡمَوۡعِظَةِ ٱلۡحَسَنَةِۖ وَجَٰدِلۡهُم بِٱلَّتِي هِيَ أَحۡسَنُ',
    text: 'Invite to the way of your Lord with wisdom and good instruction, and argue with them in a way that is best.',
    source: 'Surah An-Nahl (16:125)',
    type: 'quran'
  },
  {
    id: 't-7',
    category: 'ongoing_reward',
    arabic: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    text: 'When a human being dies, all his deeds cease except three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.',
    source: 'Sahih Muslim 1631',
    type: 'hadith'
  },
  {
    id: 't-8',
    category: 'patience_gentleness',
    arabic: 'إِنَّ الرِّفْقَ لاَ يَكُونُ فِي شَىْءٍ إِلاَّ زَانَهُ وَلاَ يُنْزَعُ مِنْ شَىْءٍ إِلاَّ شَانَهُ',
    text: 'Gentleness is not found in anything except that it beautifies it, and it is not withdrawn from anything except that it blemishes it.',
    source: 'Sahih Muslim 2594',
    type: 'hadith'
  },
  {
    id: 't-9',
    category: 'seerah_teaching',
    arabic: 'مَا رَأَيْتُ مُعَلِّمًا قَبْلَهُ وَلاَ بَعْدَهُ أَحْسَنَ تَعْلِيمًا مِنْهُ، فَوَاللَّهِ مَا كَهَرَنِي وَلاَ ضَرَبَنِي وَلاَ شَتَمَنِي',
    text: 'I have never seen a teacher before him nor after him better in teaching than him [the Messenger of Allah ﷺ]. By Allah, he neither rebuked me, nor struck me, nor insulted me.',
    source: 'Mu’awiyah ibn al-Hakam in Sahih Muslim 537',
    type: 'hadith'
  },
  {
    id: 't-10',
    category: 'sincerity_intention',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    text: 'Actions are judged according to intentions, and every person will have only what they intended.',
    source: 'Sahih al-Bukhari 1, Sahih Muslim 1907',
    type: 'hadith'
  },
  {
    id: 't-11',
    category: 'responsibility_trust',
    arabic: 'كُلُّكُمْ رَاعٍ وَكُلُّكُمْ مَسْئُولٌ عَنْ رَعِيَّتِهِ',
    text: 'Each of you is a shepherd and each of you is responsible for his flock.',
    source: 'Sahih al-Bukhari 893, Sahih Muslim 1829',
    type: 'hadith'
  },
  {
    id: 't-12',
    category: 'leading_by_example',
    arabic: 'أَتَأۡمُرُونَ ٱلنَّاسَ بِٱلۡبِرِّ وَتَنسَوۡنَ أَنفُسَكُمۡ وَأَنتُمۡ تَتۡلُونَ ٱلۡكِتَٰبَۚ أَفَلَا تَعۡقِلُونَ',
    text: 'Do you order righteousness of the people and forget yourselves while you recite the Scripture? Then will you not reason?',
    source: 'Surah Al-Baqarah (2:44)',
    type: 'quran'
  },
  {
    id: 't-13',
    category: 'virtue_of_scholars',
    arabic: 'إِنَّ الْعُلَمَاءَ وَرَثَةُ الأَنْبِيَاءِ، وَإِنَّ الأَنْبِيَاءَ لَمْ يُوَرِّثُوا دِينَارًا وَلاَ دِرْهَمًا، وَإِنَّمَا وَرَّثُوا الْعِلْمَ، فَمَنْ أَخَذَهُ أَخَذَ بِحَظٍّ وَافِرٍ',
    text: 'The scholars are the heirs of the Prophets. The Prophets did not leave behind dinars or dirhams, but they left behind knowledge, so whoever takes it takes an abundant share.',
    source: 'Sunan Abi Dawud 3641, Jami at-Tirmidhi 2682 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-14',
    category: 'guidance_reward',
    arabic: 'فَوَاللَّهِ لأَنْ يَهْدِيَ اللَّهُ بِكَ رَجُلاً وَاحِدًا خَيْرٌ لَكَ مِنْ أَنْ يَكُونَ لَكَ حُمْرُ النَّعَمِ',
    text: 'By Allah, that Allah should guide even a single person through you is better for you than possessing red camels [the most prized wealth].',
    source: 'Sahih al-Bukhari 3701, Sahih Muslim 2406',
    type: 'hadith'
  },
  {
    id: 't-15',
    category: 'sharing_knowledge',
    arabic: 'مَنْ سُئِلَ عَنْ عِلْمٍ فَكَتَمَهُ أَلْجَمَهُ اللَّهُ بِلِجَامٍ مِنْ نَارٍ يَوْمَ الْقِيَامَةِ',
    text: 'Whoever is asked about knowledge and conceals it, Allah will bridle him with a bridle of fire on the Day of Resurrection.',
    source: 'Sunan Abi Dawud 3658, Jami at-Tirmidhi 2649 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 't-16',
    category: 'understanding_levels',
    arabic: 'خَاطِبُوا النَّاسَ عَلَى قَدْرِ عُقُولِهِمْ',
    text: 'Address people according to their level of understanding.',
    source: 'Ali ibn Abi Talib in Sahih al-Bukhari (Book of Knowledge, Chapter 49)',
    type: 'reminder'
  },
  {
    id: 't-17',
    category: 'patience_with_learners',
    arabic: 'وَلۡيَعۡفُواْ وَلۡيَصۡفَحُوٓاْۗ أَلَا تُحِبُّونَ أَن يَغۡفِرَ ٱللَّهُ لَكُمۡ',
    text: 'And let them pardon and overlook. Would you not like that Allah should forgive you?',
    source: 'Surah An-Nur (24:22)',
    type: 'quran'
  },
  {
    id: 't-18',
    category: 'teaching_excellence',
    arabic: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلاً أَنْ يُتْقِنَهُ',
    text: 'Indeed, Allah loves that whenever any of you undertakes a work, he accomplishes it with mastery and excellence.',
    source: 'Shu’ab al-Iman of al-Bayhaqi 4929 — Hasan',
    type: 'hadith'
  },
  {
    id: 't-19',
    category: 'inspiring_students',
    arabic: 'مَنْ دَعَا إِلَى هُدًى كَانَ لَهُ مِنَ الأَجْرِ مِثْلُ أُجُورِ مَنْ تَبِعَهُ لاَ يَنْقُصُ ذَلِكَ مِنْ أُجُورِهِمْ شَيْئًا',
    text: 'Whoever calls to guidance will have a reward similar to that of those who follow it, without that diminishing from their rewards in the least.',
    source: 'Sahih Muslim 2674',
    type: 'hadith'
  },
  {
    id: 't-20',
    category: 'kindness_speech',
    arabic: 'وَقُل لِّعِبَادِي يَقُولُواْ ٱلَّتِي هِيَ أَحۡسَنُ',
    text: 'And tell My servants to say that which is best.',
    source: 'Surah Al-Isra (17:53)',
    type: 'quran'
  },
  {
    id: 't-21',
    category: 'humility_scholarship',
    arabic: 'تَوَاضَعُوا لِمَنْ تَتَعَلَّمُونَ مِنْهُ، وَتَوَاضَعُوا لِمَنْ تُعَلِّمُونَهُ',
    text: 'Be humble before those from whom you learn, and be humble before those whom you teach.',
    source: 'Umar ibn al-Khattab in Al-Adab Ash-Shar’iyyah',
    type: 'reminder'
  },
  {
    id: 't-22',
    category: 'beneficial_knowledge',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لاَ يَنْفَعُ، وَمِنْ قَلْبٍ لاَ يَخْشَعُ، وَمِنْ نَفْسٍ لاَ تَشْبَعُ، وَمِنْ دَعْوَةٍ لاَ يُسْتَجَابُ لَهَا',
    text: 'O Allah, I seek refuge in You from knowledge that does not benefit, from a heart that does not fear You, from a soul that is never satisfied, and from a supplication that is not answered.',
    source: 'Sahih Muslim 2722',
    type: 'hadith'
  },
  {
    id: 't-23',
    category: 'gradual_teaching',
    arabic: 'كُونُواْ رَبَّـٰنِيِّـۧنَ بِمَا كُنتُمۡ تُعَلِّمُونَ ٱلۡكِتَٰبَ وَبِمَا كُنتُمۡ تَدۡرُسُونَ',
    text: 'Be Godly educators through what you have been teaching of the Scripture and what you have been studying.',
    source: 'Surah Ali ‘Imran (3:79)',
    type: 'quran'
  },
  {
    id: 't-24',
    category: 'gradual_method',
    arabic: 'الرَّبَّانِيُّ الَّذِي يُرَبِّي النَّاسَ بِصِغَارِ الْعِلْمِ قَبْلَ كِبَارِهِ',
    text: 'The true Godly educator (Rabbani) is the one who nurtures people with foundational knowledge before complex matters.',
    source: 'Ibn Abbas in Sahih al-Bukhari (Book of Knowledge)',
    type: 'reminder'
  },
  {
    id: 't-25',
    category: 'sincerity_reward',
    arabic: 'وَمَا تُقَدِّمُواْ لِأَنفُسِكُم مِّنۡ خَيۡرٖ تَجِدُوهُ عِندَ ٱللَّهِ هُوَ خَيۡرٗا وَأَعۡظَمَ أَجۡرٗا',
    text: 'And whatever good you put forward for yourselves — you will find it with Allah. It is better and greater in reward.',
    source: 'Surah Al-Muzzammil (73:20)',
    type: 'quran'
  },
  {
    id: 't-26',
    category: 'compassion_nurturing',
    arabic: 'إِنَّمَا أَنَا لَكُمْ مِثْلُ الْوَالِدِ أُعَلِّمُكُمْ',
    text: 'Verily, I am to you like a father to his child, teaching you.',
    source: 'Sunan Abi Dawud 8, Sunan an-Nasa’i 40 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 't-27',
    category: 'gentleness_wisdom',
    arabic: 'فَبِمَا رَحۡمَةٖ مِّنَ ٱللَّهِ لِنتَ لَهُمۡۖ وَلَوۡ كُنتَ فَظًّا غَلِيظَ ٱلۡقَلۡبِ لَٱنفَضُّواْ مِنۡ حَوۡلِكَ',
    text: 'So by mercy from Allah, you were gentle with them. If you had been stern and fierce of heart, they would have dispersed from about you.',
    source: 'Surah Ali ‘Imran (3:159)',
    type: 'quran'
  },
  {
    id: 't-28',
    category: 'encouragement_hope',
    arabic: 'بَشِّرُوا وَلاَ تُنَفِّرُوا وَيَسِّرُوا وَلاَ تُعَسِّرُوا',
    text: 'Give glad tidings and do not repel people; facilitate ease and do not cause distress.',
    source: 'Sahih Muslim 1732',
    type: 'hadith'
  },
  {
    id: 't-29',
    category: 'teaching_repeating',
    arabic: 'كَانَ رَسُولُ اللَّهِ ﷺ إِذَا تَكَلَّمَ بِكَلِمَةٍ أَعَادَهَا ثَلاَثًا حَتَّى تُفْهَمَ عَنْهُ',
    text: 'Whenever the Messenger of Allah ﷺ spoke a sentence, he would repeat it three times until it was thoroughly understood from him.',
    source: 'Sahih al-Bukhari 94',
    type: 'hadith'
  },
  {
    id: 't-30',
    category: 'patience_questions',
    arabic: 'وَٱصۡبِرۡ نَفۡسَكَ مَعَ ٱلَّذِينَ يَدۡعُونَ رَبَّهُم بِٱلۡغَدَوٰةِ وَٱلۡعَشِيِّ يُرِيدُونَ وَجۡهَهُۥ',
    text: 'And keep yourself patient by the side of those who call upon their Lord morning and evening, seeking His countenance.',
    source: 'Surah Al-Kahf (18:28)',
    type: 'quran'
  },
  {
    id: 't-31',
    category: 'good_counsel',
    arabic: 'الدِّينُ النَّصِيحَةُ قُلْنَا لِمَنْ قَالَ لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ',
    text: 'Religion is sincere goodwill and honest counsel: to Allah, His Book, His Messenger, the leaders of the Muslims, and their common folk.',
    source: 'Sahih Muslim 55',
    type: 'hadith'
  },
  {
    id: 't-32',
    category: 'benefiting_others',
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    text: 'The best of people are those that bring the most benefit to others.',
    source: 'Al-Mu’jam al-Awsat of at-Tabarani 5787 — Hasan',
    type: 'hadith'
  },
  {
    id: 't-33',
    category: 'justice_between_students',
    arabic: 'إِنَّ ٱللَّهَ يَأۡمُرُ بِٱلۡعَدۡلِ وَٱلۡإِحۡسَٰنِ',
    text: 'Indeed, Allah orders justice and good conduct.',
    source: 'Surah An-Nahl (16:90)',
    type: 'quran'
  },
  {
    id: 't-34',
    category: 'admitting_do_not_know',
    arabic: 'مِنْ عِلْمِ الرَّجُلِ أَنْ يَقُولَ لِمَا لاَ يَعْلَمُ: اللَّهُ أَعْلَمُ',
    text: 'It is a mark of a person’s true knowledge that when he does not know something, he says: Allah knows best.',
    source: 'Abdullah ibn Mas’ud in Sahih al-Bukhari 4774',
    type: 'hadith'
  },
  {
    id: 't-35',
    category: 'admitting_do_not_know',
    arabic: 'قَالُواْ سُبۡحَٰنَكَ لَا عِلۡمَ لَنَآ إِلَّا مَا عَلَّمۡتَنَآۖ إِنَّكَ أَنتَ ٱلۡعَلِيمُ ٱلۡحَكِيمُ',
    text: 'They said: Exalted are You; we have no knowledge except what You have taught us. Indeed, it is You who is the Knowing, the Wise.',
    source: 'Surah Al-Baqarah (2:32)',
    type: 'quran'
  },
  {
    id: 't-36',
    category: 'supplication_for_students',
    arabic: 'اللَّهُمَّ فَقِّهْهُ فِي الدِّينِ وَعَلِّمْهُ التَّأْوِيلَ',
    text: 'O Allah, grant him deep comprehension of the religion and teach him interpretation [the Prophet’s ﷺ prayer for Ibn Abbas].',
    source: 'Sahih al-Bukhari 143, Musnad Ahmad 2881',
    type: 'hadith'
  },
  {
    id: 't-37',
    category: 'continuous_learning',
    arabic: 'وَفَوۡقَ كُلِّ ذِي عِلۡمٍ عَلِيمٞ',
    text: 'And above every possessor of knowledge there is one more knowledgeable.',
    source: 'Surah Yusuf (12:76)',
    type: 'quran'
  },
  {
    id: 't-38',
    category: 'virtue_of_knowledge',
    arabic: 'فَضْلُ الْعَالِمِ عَلَى الْعَابِدِ كَفَضْلِ الْقَمَرِ لَيْلَةَ الْبَدْرِ عَلَى سَائِرِ الْكَوَاكِبِ',
    text: 'The superiority of the learned scholar over the devout worshipper is like that of the full moon over all other planets.',
    source: 'Sunan Abi Dawud 3641, Jami at-Tirmidhi 2682 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-39',
    category: 'truth_in_teaching',
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱتَّقُواْ ٱللَّهَ وَقُولُواْ قَوۡلٗا سَدِيدٗا',
    text: 'O you who have believed, fear Allah and speak words of appropriate justice and truth.',
    source: 'Surah Al-Ahzab (33:70)',
    type: 'quran'
  },
  {
    id: 't-40',
    category: 'trust_and_counsel',
    arabic: 'الْمُسْتَشَارُ مُؤْتَمَنٌ',
    text: 'The one who is consulted is in a position of trust.',
    source: 'Sunan Abi Dawud 5128, Jami at-Tirmidhi 2822 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-41',
    category: 'good_character_educator',
    arabic: 'إِنَّ أَكْمَلَ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا، وَخِيَارُكُمْ خِيَارُكُمْ لِنِسَائِهِمْ',
    text: 'The most complete of believers in faith are those with the best character.',
    source: 'Jami at-Tirmidhi 1162 — Hasan Sahih',
    type: 'hadith'
  },
  {
    id: 't-42',
    category: 'wisdom_and_clarity',
    arabic: 'لَقَدۡ مَنَّ ٱللَّهُ عَلَى ٱلۡمُؤۡمِنِينَ إِذۡ بَعَثَ فِيهِمۡ رَسُولٗا مِّنۡ أَنفُسِهِمۡ يَتۡلُواْ عَلَيۡهِمۡ ءَايَٰتِهِۦ وَيُزَكِّيهِمۡ وَيُعَلِّمُهُمُ ٱلۡكِتَٰبَ وَٱلۡحِكۡمَةَ',
    text: 'Certainly did Allah confer favor upon the believers when He sent among them a Messenger reciting to them His verses and purifying them and teaching them the Book and wisdom.',
    source: 'Surah Ali ‘Imran (3:164)',
    type: 'quran'
  },
  {
    id: 't-43',
    category: 'purification_character',
    arabic: 'قَدۡ أَفۡلَحَ مَن زَكَّىٰهَا',
    text: 'He has succeeded who purifies his soul.',
    source: 'Surah Ash-Shams (91:9)',
    type: 'quran'
  },
  {
    id: 't-44',
    category: 'forbearance_halm',
    arabic: 'إِنَّ فِيكَ خَصْلَتَيْنِ يُحِبُّهُمَا اللَّهُ: الْحِلْمُ وَالأَنَاةُ',
    text: 'You possess two qualities that Allah loves: forbearance (patience) and deliberation (thoughtfulness).',
    source: 'Sahih Muslim 17',
    type: 'hadith'
  },
  {
    id: 't-45',
    category: 'fairness_impartiality',
    arabic: 'وَإِذَا قُلۡتُمۡ فَٱعۡدِلُواْ وَلَوۡ كَانَ ذَا قُرۡبَىٰ',
    text: 'And when you speak, be just, even if it concerns a close relative.',
    source: 'Surah Al-An’am (6:152)',
    type: 'quran'
  },
  {
    id: 't-46',
    category: 'reward_teaching_quran',
    arabic: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا',
    text: 'Whoever recites a letter from the Book of Allah will have a good deed, and that deed will be rewarded ten-fold.',
    source: 'Jami at-Tirmidhi 2910 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-47',
    category: 'teaching_with_love',
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    text: 'None of you truly believes until he loves for his brother [and student] what he loves for himself.',
    source: 'Sahih al-Bukhari 13, Sahih Muslim 45',
    type: 'hadith'
  },
  {
    id: 't-48',
    category: 'humility_knowledge',
    arabic: 'وَمَآ أُوتِيتُم مِّنَ ٱلۡعِلۡمِ إِلَّا قَلِيلٗا',
    text: 'And you mankind have not been given of knowledge except a little.',
    source: 'Surah Al-Isra (17:85)',
    type: 'quran'
  },
  {
    id: 't-49',
    category: 'guarding_knowledge',
    arabic: 'إِنَّ اللَّهَ لاَ يَقْبِضُ الْعِلْمَ انْتِزَاعًا يَنْتَزِعُهُ مِنَ الْعِبَادِ، وَلَكِنْ يَقْبِضُ الْعِلْمَ بِقَبْضِ الْعُلَمَاءِ',
    text: 'Allah does not take away knowledge by snatching it from people, but takes it away by the death of religious scholars.',
    source: 'Sahih al-Bukhari 100, Sahih Muslim 2673',
    type: 'hadith'
  },
  {
    id: 't-50',
    category: 'honesty_trustworthiness',
    arabic: 'إِنَّ ٱللَّهَ يَأۡمُرُكُمۡ أَن تُؤَدُّواْ ٱلۡأَمَٰنَٰتِ إِلَىٰٓ أَهۡلِهَا',
    text: 'Indeed, Allah commands you to render trusts to whom they are due.',
    source: 'Surah An-Nisa (4:58)',
    type: 'quran'
  },
  {
    id: 't-51',
    category: 'teacher_mentor',
    arabic: 'مَنْ سَنَّ فِي الإِسْلاَمِ سُنَّةً حَسَنَةً فَلَهُ أَجْرُهَا وَأَجْرُ مَنْ عَمِلَ بِهَا مِنْ بَعْدِهِ',
    text: 'Whoever institutes a good practice in Islam will have its reward and the reward of whoever acts upon it after him.',
    source: 'Sahih Muslim 1017',
    type: 'hadith'
  },
  {
    id: 't-52',
    category: 'kindness_to_learners',
    arabic: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ، وَيُعْطِي عَلَى الرِّفْقِ مَا لاَ يُعْطِي عَلَى الْعُنْفِ',
    text: 'Allah is Gentle and loves gentleness, and He gives for gentleness that which He does not give for harshness.',
    source: 'Sahih Muslim 2593',
    type: 'hadith'
  },
  {
    id: 't-53',
    category: 'gratitude_purpose',
    arabic: 'وَإِذۡ تَأَذَّنَ رَبُّكُمۡ لَئِن شَكَرۡتُمۡ لَأَزِيدَنَّكُمۡ',
    text: 'And when your Lord proclaimed: If you are grateful, I will surely increase you in favor.',
    source: 'Surah Ibrahim (14:7)',
    type: 'quran'
  },
  {
    id: 't-54',
    category: 'teaching_with_analogies',
    arabic: 'وَتِلۡكَ ٱلۡأَمۡثَٰلُ نَضۡرِبُهَا لِلنَّاسِۖ وَمَا يَعۡقِلُهَآ إِلَّا ٱلۡعَٰلِمُونَ',
    text: 'And these examples We present to the people, but none will understand them except those of knowledge.',
    source: 'Surah Al-’Ankabut (29:43)',
    type: 'quran'
  },
  {
    id: 't-55',
    category: 'protecting_reputation',
    arabic: 'الْمُؤْمِنُ مِرْآةُ أَخِيهِ، وَالْمُؤْمِنُ أَخُو الْمُؤْمِنِ يَكُفُّ عَلَيْهِ ضَيْعَتَهُ وَيَحُوطُهُ مِنْ وَرَائِهِ',
    text: 'The believer is the mirror of his brother, and the believer is the brother of the believer: he safeguards him against loss and protects him behind his back.',
    source: 'Sunan Abi Dawud 4918 — Hasan',
    type: 'hadith'
  },
  {
    id: 't-56',
    category: 'calmness_demeanor',
    arabic: 'تَعَلَّمُوا الْعِلْمَ وَعَلِّمُوهُ النَّاسَ، وَتَعَلَّمُوا لَهُ السَّكِينَةَ وَالْوَقَارَ',
    text: 'Acquire knowledge and teach it to the people, and learn along with it tranquility and dignity.',
    source: 'Umar ibn al-Khattab in Shu’ab al-Iman',
    type: 'reminder'
  },
  {
    id: 't-57',
    category: 'sincerity_guidance',
    arabic: 'قُلۡ هَٰذِهِۦ سَبِيلِيٓ أَدۡعُوٓاْ إِلَى ٱللَّهِۚ عَلَىٰ بَصِيرَةٍ أَنَا۠ وَمَنِ ٱتَّبَعَنِي',
    text: 'Say: This is my way; I invite to Allah with insight, I and those who follow me.',
    source: 'Surah Yusuf (12:108)',
    type: 'quran'
  },
  {
    id: 't-58',
    category: 'consistency_effort',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    text: 'The most beloved deeds to Allah are those that are most consistent, even if they are small.',
    source: 'Sahih al-Bukhari 6464, Sahih Muslim 782',
    type: 'hadith'
  },
  {
    id: 't-59',
    category: 'patience_character',
    arabic: 'وَلَمَن صَبَرَ وَغَفَرَ إِنَّ ذَٰلِكَ لَمِنۡ عَزۡمِ ٱلۡأُمُورِ',
    text: 'And whoever is patient and forgives — indeed, that is of the matters requiring firm resolve.',
    source: 'Surah Ash-Shura (42:43)',
    type: 'quran'
  },
  {
    id: 't-60',
    category: 'avoiding_arrogance',
    arabic: 'مَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ',
    text: 'No one humbles himself for the sake of Allah except that Allah elevates his status.',
    source: 'Sahih Muslim 2588',
    type: 'hadith'
  },
  {
    id: 't-61',
    category: 'nurturing_good',
    arabic: 'ٱدۡفَعۡ بِٱلَّتِي هِيَ أَحۡسَنُ فَإِذَا ٱلَّذِي بَيۡنَكَ وَبَيۡنَهُۥ عَدَٰوَةٞ كَأَنَّهُۥ وَلِيٌّ حَمِيمٞ',
    text: 'Repel [evil] by that which is better; and thereupon the one whom between you and him was enmity will become as though he was a devoted friend.',
    source: 'Surah Fussilat (41:34)',
    type: 'quran'
  },
  {
    id: 't-62',
    category: 'moderation_teaching',
    arabic: 'كَانَ النَّبِيُّ ﷺ يَتَخَوَّلُنَا بِالْمَوْعِظَةِ فِي الأَيَّامِ كَرَاهَةَ السَّآمَةِ عَلَيْنَا',
    text: 'The Prophet ﷺ used to take care of us when giving admonitions, picking suitable times, for fear of causing us boredom.',
    source: 'Sahih al-Bukhari 68, Sahih Muslim 2821',
    type: 'hadith'
  },
  {
    id: 't-63',
    category: 'supplication_wisdom',
    arabic: 'رَبِّ ٱشۡرَحۡ لِي صَدۡرِي وَيَسِّرۡ لِيٓ أَمۡرِي وَٱحۡلُلۡ عُقۡدَةٗ مِّن لِّسَانِي يَفۡقَهُواْ قَوۡلِي',
    text: 'My Lord, expand for me my breast [with confidence] and ease for me my task and untie the knot from my tongue that they may understand my speech.',
    source: 'Surah Ta-Ha (20:25-28)',
    type: 'quran'
  },
  {
    id: 't-64',
    category: 'holding_fast_quran',
    arabic: 'تَرَكْتُ فِيكُمْ أَمْرَيْنِ لَنْ تَضِلُّوا مَا تَمَسَّكْتُمْ بِهِمَا: كِتَابَ اللَّهِ وَسُنَّةَ نَبِيِّهِ',
    text: 'I have left among you two matters; you will never go astray as long as you hold fast to them: the Book of Allah and the Sunnah of His Prophet.',
    source: 'Muwatta Malik 1661 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-65',
    category: 'truth_in_dealing',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ',
    text: 'Hold fast to truthfulness, for truthfulness leads to righteousness, and righteousness leads to Paradise.',
    source: 'Sahih Muslim 2607',
    type: 'hadith'
  },
  {
    id: 't-66',
    category: 'good_listening',
    arabic: 'حُسْنُ الاِسْتِمَاعِ نِصْفُ العِلْمِ',
    text: 'Attentive listening is half of knowledge.',
    source: 'Al-Hasan al-Basri in Jami’ Bayan al-’Ilm',
    type: 'reminder'
  },
  {
    id: 't-67',
    category: 'encouraging_hope',
    arabic: 'قُلۡ يَٰعِبَادِيَ ٱلَّذِينَ أَسۡرَفُواْ عَلَىٰٓ أَنفُسِهِمۡ لَا تَقۡنَطُواْ مِن رَّحۡمَةِ ٱللَّهِ',
    text: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.',
    source: 'Surah Az-Zumar (39:53)',
    type: 'quran'
  },
  {
    id: 't-68',
    category: 'trust_in_allah',
    arabic: 'فَإِذَا عَزَمۡتَ فَتَوَكَّلۡ عَلَى ٱللَّهِۚ إِنَّ ٱللَّهَ يُحِبُّ ٱلۡمُتَوَكِّلِينَ',
    text: 'And when you have decided, then rely upon Allah. Indeed, Allah loves those who rely upon Him.',
    source: 'Surah Ali ‘Imran (3:159)',
    type: 'quran'
  },
  {
    id: 't-69',
    category: 'honoring_students',
    arabic: 'مَرْحَبًا بِوَصِيَّةِ رَسُولِ اللَّهِ ﷺ (كَانَ أَبُو سَعِيدٍ يَقُولُهَا لِطُلاَّبِ الْعِلْمِ)',
    text: 'Welcome, O you who were recommended to us by the Messenger of Allah ﷺ! [Abu Sa’id al-Khudri welcomed seekers of knowledge with these words].',
    source: 'Sunan Ibn Majah 247, Jami at-Tirmidhi 2650 — Hasan',
    type: 'hadith'
  },
  {
    id: 't-70',
    category: 'gentleness_correcting',
    arabic: 'مَا كَانَ الرِّفْقُ فِي شَيْءٍ إِلاَّ زَانَهُ',
    text: 'Never is gentleness present in anything without adorning it.',
    source: 'Sahih Muslim 2594',
    type: 'hadith'
  },
  {
    id: 't-71',
    category: 'value_of_understanding',
    arabic: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ',
    text: 'Whomever Allah intends good for, He gives him deep understanding of the religion.',
    source: 'Sahih al-Bukhari 71, Sahih Muslim 1037',
    type: 'hadith'
  },
  {
    id: 't-72',
    category: 'honesty_teaching',
    arabic: 'بَلِّغُوا عَنِّي وَلَوْ آيَةً',
    text: 'Convey from me, even if it is a single verse.',
    source: 'Sahih al-Bukhari 3461',
    type: 'hadith'
  },
  {
    id: 't-73',
    category: 'sincerity_educator',
    arabic: 'وَمَآ أُمِرُوٓاْ إِلَّا لِيَعۡبُدُواْ ٱللَّهَ مُخۡلِصِينَ لَهُ ٱلدِّينَ حُنَفَآءَ',
    text: 'And they were not commanded except to worship Allah, being sincere to Him in religion.',
    source: 'Surah Al-Bayyinah (98:5)',
    type: 'quran'
  },
  {
    id: 't-74',
    category: 'forgiveness_students',
    arabic: 'خُذِ ٱلۡعَفۡوَ وَأۡمُرۡ بِٱلۡعُرۡفِ وَأَعۡرِضۡ عَنِ ٱلۡجَٰهِلِينَ',
    text: 'Hold to forgiveness, command what is right, and turn away from the ignorant.',
    source: 'Surah Al-A’raf (7:199)',
    type: 'quran'
  },
  {
    id: 't-75',
    category: 'gentle_guidance',
    arabic: 'فَقُولَا لَهُۥ قَوۡلٗا لَّيِّنٗا لَّعَلَّهُۥ يَتَذَكَّرُ أَوۡ يَخۡشَىٰ',
    text: 'And speak to him with gentle speech that perhaps he may be reminded or fear Allah.',
    source: 'Surah Ta-Ha (20:44)',
    type: 'quran'
  },
  {
    id: 't-76',
    category: 'gratitude_opportunity',
    arabic: 'رَبِّ أَوۡزِعۡنِيٓ أَنۡ أَشۡكُرَ نِعۡمَتَكَ ٱلَّتِيٓ أَنۡعَمۡتَ عَلَيَّ وَعَلَىٰ وَٰلِدَيَّ وَأَنۡ أَعۡمَلَ صَٰلِحٗا تَرۡضَىٰهُ',
    text: 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to do righteousness of which You approve.',
    source: 'Surah An-Naml (27:19)',
    type: 'quran'
  },
  {
    id: 't-77',
    category: 'perseverance_teaching',
    arabic: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ',
    text: 'Indeed, Allah is with the patient.',
    source: 'Surah Al-Baqarah (2:153)',
    type: 'quran'
  },
  {
    id: 't-78',
    category: 'supplication_guidance',
    arabic: 'ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ',
    text: 'Guide us to the straight path.',
    source: 'Surah Al-Fatihah (1:6)',
    type: 'quran'
  },
  {
    id: 't-79',
    category: 'mercy_creation',
    arabic: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ',
    text: 'Those who are merciful will be shown mercy by the Most Merciful. Be merciful to those on earth, and the One in the heavens will have mercy upon you.',
    source: 'Sunan Abi Dawud 4941, Jami at-Tirmidhi 1924 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-80',
    category: 'humility_elevation',
    arabic: 'وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ',
    text: 'No one humbles himself before Allah except that Allah raises his rank.',
    source: 'Sahih Muslim 2588',
    type: 'hadith'
  },
  {
    id: 't-81',
    category: 'teaching_wisdom',
    arabic: 'مَثَلُ مَا بَعَثَنِي اللَّهُ بِهِ مِنَ الْهُدَى وَالْعِلْمِ كَمَثَلِ الْغَيْثِ الْكَثِيرِ أَصَابَ أَرْضًا',
    text: 'The example of guidance and knowledge with which Allah has sent me is like abundant rain falling upon the earth, producing rich pasture and vegetation.',
    source: 'Sahih al-Bukhari 79, Sahih Muslim 2282',
    type: 'hadith'
  },
  {
    id: 't-82',
    category: 'guarding_integrity',
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ لِمَ تَقُولُونَ مَا لَا تَفۡعَلُونَ كَبُرَ مَقۡتًا عِندَ ٱللَّهِ أَن تَقُولُواْ مَا لَا تَفۡعَلُونَ',
    text: 'O you who have believed, why do you say what you do not do? Great is hatred in the sight of Allah that you say what you do not do.',
    source: 'Surah As-Saff (61:2-3)',
    type: 'quran'
  },
  {
    id: 't-83',
    category: 'fostering_potential',
    arabic: 'النَّاسُ مَعَادِنُ كَمَعَادِنِ الفِضَّةِ وَالذَّهَبِ، خِيَارُهُمْ فِي الجَاهِلِيَّةِ خِيَارُهُمْ فِي الإِسْلاَمِ إِذَا فَقِهُوا',
    text: 'People are like mines of gold and silver; the best of them in the pre-Islamic period are the best of them in Islam if they gain deep understanding.',
    source: 'Sahih al-Bukhari 3495, Sahih Muslim 2638',
    type: 'hadith'
  },
  {
    id: 't-84',
    category: 'compassion_youth',
    arabic: 'لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا وَيُوَقِّرْ كَبِيرَنَا',
    text: 'He is not one of us who does not show mercy to our young and respect to our elders.',
    source: 'Jami at-Tirmidhi 1919 — Sahih',
    type: 'hadith'
  },
  {
    id: 't-85',
    category: 'excellence_ihsan',
    arabic: 'إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ',
    text: 'Verily Allah has prescribed excellence (Ihsan) in all things.',
    source: 'Sahih Muslim 1955',
    type: 'hadith'
  },
  {
    id: 't-86',
    category: 'contentment_service',
    arabic: 'إِنَّ أَفْضَلَكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    text: 'Indeed, the most virtuous of you is he who learns the Quran and teaches it.',
    source: 'Sahih al-Bukhari 5028',
    type: 'hadith'
  },
  {
    id: 't-87',
    category: 'knowledge_light',
    arabic: 'ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِ',
    text: 'Allah is the Light of the heavens and the earth.',
    source: 'Surah An-Nur (24:35)',
    type: 'quran'
  },
  {
    id: 't-88',
    category: 'righteous_companionship',
    arabic: 'مَثَلُ الْجَلِيسِ الصَّالِحِ وَالسَّوْءِ كَحَامِلِ الْمِسْكِ وَنَافِخِ الْكِيرِ',
    text: 'The example of a good companion and a bad companion is like that of the seller of musk and the one who blows the blacksmith’s bellows.',
    source: 'Sahih al-Bukhari 5534, Sahih Muslim 2628',
    type: 'hadith'
  },
  {
    id: 't-89',
    category: 'protecting_hearts',
    arabic: 'أَلاَ وَإِنَّ فِي الْجَسَدِ مُضْغَةً إِذَا صَلَحَتْ صَلَحَ الْجَسَدُ كُلُّهُ، وَإِذَا فَسَدَتْ فَسَدَ الْجَسَدُ كُلُّهُ، أَلاَ وَهِيَ الْقَلْبُ',
    text: 'Beware! There is a piece of flesh in the body: if it is sound, the whole body is sound; and if it is corrupt, the whole body is corrupt. Truly, it is the heart.',
    source: 'Sahih al-Bukhari 52, Sahih Muslim 1599',
    type: 'hadith'
  },
  {
    id: 't-90',
    category: 'truth_in_dealing',
    arabic: 'وَتَعَاوَنُواْ عَلَى ٱلۡبِرِّ وَٱلتَّقۡوَىٰۖ وَلَا تَعَاوَنُواْ عَلَى ٱلۡإِثۡمِ وَٱلۡعُدۡوَٰنِ',
    text: 'And cooperate in righteousness and piety, but do not cooperate in sin and aggression.',
    source: 'Surah Al-Ma’idah (5:2)',
    type: 'quran'
  },
  {
    id: 't-91',
    category: 'dua_increase_knowledge',
    arabic: 'وَقُل رَّبِّ زِدۡنِي عِلۡمٗا',
    text: 'And say: My Lord, increase me in knowledge.',
    source: 'Surah Ta-Ha (20:114)',
    type: 'quran'
  },
  {
    id: 't-92',
    category: 'supplication_guidance',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    text: 'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.',
    source: 'Sahih Muslim 2721',
    type: 'hadith'
  },
  {
    id: 't-93',
    category: 'trust_in_allah_providence',
    arabic: 'وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥٓ',
    text: 'And whoever relies upon Allah — then He is sufficient for him.',
    source: 'Surah At-Talaq (65:3)',
    type: 'quran'
  },
  {
    id: 't-94',
    category: 'enduring_impact',
    arabic: 'إِنَّا نَحۡنُ نُحۡيِ ٱلۡمَوۡتَىٰ وَنَكۡتُبُ مَا قَدَّمُواْ وَءَاثَٰرَهُمۡۚ وَكُلَّ شَيۡءٍ أَحۡصَيۡنَٰهُ فِيٓ إِمَامٖ مُّبِينٖ',
    text: 'Indeed, it is We who bring the dead to life and record what they have put forth and what traces they left behind.',
    source: 'Surah Ya-Sin (36:12)',
    type: 'quran'
  },
  {
    id: 't-95',
    category: 'nurturing_goodness',
    arabic: 'أَلَمۡ تَرَ كَيۡفَ ضَرَبَ ٱللَّهُ مَثَلٗا كَلِمَةٗ طَيِّبَةٗ كَشَجَرَةٖ طَيِّبَةٍ أَصۡلُهَا ثَابِتٞ وَفَرۡعُهَا فِي ٱلسَّمَآءِ',
    text: 'Have you not considered how Allah presents an example, [making] a good word like a good tree, whose root is firmly fixed and its branches high in the sky?',
    source: 'Surah Ibrahim (14:24)',
    type: 'quran'
  },
  {
    id: 't-96',
    category: 'continuous_fruits',
    arabic: 'تُؤۡتِيٓ أُكُلَهَا كُلَّ حِينِۭ بِإِذۡنِ رَبِّهَا',
    text: 'Producing its fruit at all times, by permission of its Lord.',
    source: 'Surah Ibrahim (14:25)',
    type: 'quran'
  },
  {
    id: 't-97',
    category: 'humility_scholar',
    arabic: 'كُلَّمَا أَدَّبَنِي الدَّهْرُ، أَرَانِي نَقْصَ عَقْلِي، وَإِذَا مَا ازْدَدْتُ عِلْماً، زَادَنِي عِلْماً بِجَهْلِي',
    text: 'Whenever time disciplines me, it shows me the deficiency of my intellect; and whenever I increase in knowledge, it increases my awareness of my ignorance.',
    source: 'Imam ash-Shafi’i in Diwan ash-Shafi’i',
    type: 'reminder'
  },
  {
    id: 't-98',
    category: 'caring_mentor',
    arabic: 'إِنَّمَا يَرْحَمُ اللَّهُ مِنْ عِبَادِهِ الرُّحَمَاءَ',
    text: 'Allah only shows mercy to those of His servants who are merciful to others.',
    source: 'Sahih al-Bukhari 1284, Sahih Muslim 923',
    type: 'hadith'
  },
  {
    id: 't-99',
    category: 'sincerity_guidance',
    arabic: 'قُلۡ إِنَّ صَلَاتِي وَنُسُكِي وَمَحۡيَايَ وَمَمَاتِي لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ',
    text: 'Say: Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds.',
    source: 'Surah Al-An’am (6:162)',
    type: 'quran'
  },
  {
    id: 't-100',
    category: 'honor_of_educators',
    arabic: 'قُمْ لِلْمُعَلِّمِ وَفِّهِ التَّبْجِيلاَ، كَادَ الْمُعَلِّمُ أَنْ يَكُونَ رَسُولاَ',
    text: 'Stand for the teacher and honor his stature with deep reverence; for an educator is nearly in rank like an emissary of truth.',
    source: 'Ahmad Shawqi — Classic Arabic Educational Ode',
    type: 'reminder'
  }
];

const dataDir = path.join(__dirname);
fs.writeFileSync(path.join(dataDir, 'student_quotes.json'), JSON.stringify(studentQuotes, null, 2), 'utf-8');
fs.writeFileSync(path.join(dataDir, 'teacher_quotes.json'), JSON.stringify(teacherQuotes, null, 2), 'utf-8');

console.log('Successfully generated:');
console.log('Student quotes count:', studentQuotes.length);
console.log('Teacher quotes count:', teacherQuotes.length);
