// Outreach content: stories, quizzes, virtual tours and educator kits.
// Facts used are well-established public information (station dates, treaties);
// illustrative numbers are marked as such. `ta` holds Tamil translations where available.
import type { Lang } from './store';

const U = (id: string) => `https://images.unsplash.com/photo-${id}`;
export const EDU_IMG = {
  iceberg: U('1494564605686-2e931f77a8e2'), cabin: U('1517299321609-52687d1bc55a'), field: U('1491555103944-7c647fd857e6'),
  snow: U('1418985991508-e47386d96a71'), sky: U('1525490829609-d166ddb58678'), earth: U('1446776811953-b23d57bd21aa'),
  aurora: U('1529963183134-61a90db47eaf'), auroraTrees: U('1483347756197-71ef80e95f73'), flag: U('1520769669658-f07657f5a307'),
  ocean: U('1468581264429-2548ef9eb732'), himalaya: U('1454496522488-7a8e488e8606'), peak: U('1589802829985-817e51171b92'),
  clouds: U('1506905925346-21bda4d32df4'), spiti: U('1486870591958-9b9d0d1dda99'), chinstrap: U('1551415923-a2297c7fda79'),
  gentoo: U('1598439210625-5067c578f3f6'), king: U('1517783999520-f068d7431a60'), gentooRock: U('1462888210965-cdf193fb74de'),
  lake: U('1503614472-8c93d56e92ce'), nunatak: U('1458668383970-8ddd3927deed'),
};

type L10n = { en: string; ta?: string; hi?: string };
export const tr = (v: L10n, lang: Lang) => v[lang] || v.en;

export interface StorySection { key: string; image: string; heading: L10n; body: L10n[]; fact?: { value: string; label: L10n }; link?: { href: string; label: L10n } }
export interface Story { id: string; title: L10n; subtitle: L10n; hero: string; readTime: string; sections: StorySection[] }

export const STORIES: Story[] = [
  {
    id: 'story-antarctica', hero: EDU_IMG.iceberg, readTime: '8 min',
    title: { en: 'How India Studies Antarctica', ta: 'இந்தியா அண்டார்டிகாவை எப்படி ஆராய்கிறது', hi: 'भारत अंटार्कटिका का अध्ययन कैसे करता है' },
    subtitle: { en: 'From a first voyage in 1981 to year-round science at Maitri and Bharati.', ta: '1981-ன் முதல் பயணத்திலிருந்து மைத்ரி, பாரதி நிலையங்களில் ஆண்டு முழுவதும் நடக்கும் அறிவியல் வரை.' },
    sections: [
      {
        key: 'why', image: EDU_IMG.snow,
        heading: { en: 'Why Antarctica matters', ta: 'அண்டார்டிகா ஏன் முக்கியம்' },
        body: [
          { en: 'Antarctica is the coldest, windiest and highest continent. Its ice sheet stores most of the fresh water on Earth, so even small changes in that ice can affect sea level for coastal countries like India.', ta: 'அண்டார்டிகா மிகக் குளிரான, அதிகக் காற்று வீசும், மிக உயரமான கண்டம். அதன் பனிப்படலத்தில் பூமியின் பெரும்பாலான நன்னீர் சேமிக்கப்பட்டுள்ளது. அதில் ஏற்படும் சிறிய மாற்றங்களும் இந்தியா போன்ற கடலோர நாடுகளின் கடல் மட்டத்தைப் பாதிக்கலாம்.' },
          { en: 'The continent is also a natural laboratory: its clean air, long polar nights and ancient ice preserve records of Earth’s climate that cannot be found anywhere else.', ta: 'இந்தக் கண்டம் ஒரு இயற்கை ஆய்வகமும் கூட: அதன் தூய காற்று, நீண்ட துருவ இரவுகள், பழமையான பனி ஆகியவை வேறு எங்கும் கிடைக்காத பூமியின் காலநிலைப் பதிவுகளைப் பாதுகாக்கின்றன.' },
        ],
        fact: { value: '~70%', label: { en: 'of the world’s fresh water is locked in Antarctic ice', ta: 'உலகின் நன்னீர் அண்டார்டிகா பனியில் உள்ளது' } },
      },
      {
        key: 'expeditions', image: EDU_IMG.ocean,
        heading: { en: 'Indian expeditions', ta: 'இந்தியப் பயணங்கள்' },
        body: [
          { en: 'India’s first scientific expedition to Antarctica set sail from Goa in December 1981 and reached the continent in January 1982. Since then an expedition has sailed almost every austral summer.', ta: 'இந்தியாவின் முதல் அறிவியல் பயணம் டிசம்பர் 1981-ல் கோவாவிலிருந்து புறப்பட்டு, ஜனவரி 1982-ல் அண்டார்டிகாவை அடைந்தது. அதன் பிறகு கிட்டத்தட்ட ஒவ்வொரு தென் கோடைக்காலத்திலும் ஒரு பயணம் நடைபெறுகிறது.' },
          { en: 'Each voyage crosses the Southern Ocean, sampling seawater, plankton and the atmosphere along the way, before relieving the teams who spent the long winter on the ice.', ta: 'ஒவ்வொரு பயணமும் தென் பெருங்கடலைக் கடந்து, வழியில் கடல்நீர், மிதவை உயிரினங்கள், வளிமண்டலம் ஆகியவற்றை மாதிரி எடுத்து, நீண்ட குளிர்காலத்தைப் பனியில் கழித்த குழுக்களை மாற்றுகிறது.' },
        ],
        fact: { value: '1981', label: { en: 'first Indian Antarctic expedition sets sail', ta: 'முதல் இந்திய அண்டார்டிகா பயணம் புறப்பட்டது' } },
        link: { href: '/media/expeditions/exp-antarctic-2026', label: { en: 'Follow the 2026 expedition', ta: '2026 பயணத்தைப் பின்தொடருங்கள்' } },
      },
      {
        key: 'stations', image: EDU_IMG.cabin,
        heading: { en: 'Research stations', ta: 'ஆய்வு நிலையங்கள்' },
        body: [
          { en: 'Dakshin Gangotri (1983) was India’s first base. Maitri, in the Schirmacher Oasis, has operated year-round since 1989, and Bharati in the Larsemann Hills opened in 2012.', ta: 'தக்ஷின் கங்கோத்ரி (1983) இந்தியாவின் முதல் தளம். ஷிர்மாக்கர் சோலையில் உள்ள மைத்ரி 1989 முதல் ஆண்டு முழுவதும் இயங்குகிறது; லார்ஸ்மன் மலைகளில் உள்ள பாரதி 2012-ல் திறக்கப்பட்டது.' },
          { en: 'The stations host laboratories, weather and ozone instruments, magnetometers and living quarters for the wintering team.', ta: 'இந்த நிலையங்களில் ஆய்வகங்கள், வானிலை மற்றும் ஓசோன் கருவிகள், காந்தமானிகள், குளிர்காலக் குழுவிற்கான தங்குமிடங்கள் உள்ளன.' },
        ],
        fact: { value: '3', label: { en: 'Indian Antarctic bases built since 1983', ta: '1983 முதல் கட்டப்பட்ட இந்திய அண்டார்டிகா தளங்கள்' } },
        link: { href: '/education/tour/tour-maitri', label: { en: 'Take the Maitri virtual tour', ta: 'மைத்ரி மெய்நிகர் சுற்றுலா' } },
      },
      {
        key: 'climate', image: EDU_IMG.sky,
        heading: { en: 'Climate research', ta: 'காலநிலை ஆராய்ச்சி' },
        body: [
          { en: 'Scientists track the ozone hole with balloon-borne sensors, measure snowfall with stakes and shallow ice cores, and use satellites to watch sea ice expand and retreat with the seasons.', ta: 'விஞ்ஞானிகள் பலூன் உணரிகள் மூலம் ஓசோன் துளையைக் கண்காணிக்கிறார்கள், அளவுக்கோல்கள் மற்றும் பனிக்கட்டி மாதிரிகள் மூலம் பனிப்பொழிவை அளக்கிறார்கள், செயற்கைக்கோள்கள் மூலம் கடல் பனியின் பருவ மாற்றங்களைக் கவனிக்கிறார்கள்.' },
          { en: 'These long records help separate natural variability from human-caused change.', ta: 'இந்த நீண்டகாலப் பதிவுகள் இயற்கையான மாறுபாட்டையும் மனிதனால் ஏற்படும் மாற்றத்தையும் பிரித்தறிய உதவுகின்றன.' },
        ],
        link: { href: '/search?q=How%20is%20climate%20change%20affecting%20Antarctic%20ice%3F', label: { en: 'Explore Antarctic climate research', ta: 'அண்டார்டிகா காலநிலை ஆராய்ச்சியை ஆராயுங்கள்' } },
      },
      {
        key: 'discover', image: EDU_IMG.chinstrap,
        heading: { en: 'What scientists discover', ta: 'விஞ்ஞானிகள் கண்டறிவது என்ன' },
        body: [
          { en: 'From microbial mats in frozen lakes to penguin colonies that signal the health of the ocean, Indian research adds pieces to a global puzzle about how polar regions respond to warming.', ta: 'உறைந்த ஏரிகளில் உள்ள நுண்ணுயிர்ப் படலங்கள் முதல் கடலின் ஆரோக்கியத்தைக் காட்டும் பென்குயின் கூட்டங்கள் வரை, துருவப் பகுதிகள் வெப்பமயமாதலுக்கு எப்படி எதிர்வினையாற்றுகின்றன என்ற உலகளாவிய புதிருக்கு இந்திய ஆராய்ச்சி பங்களிக்கிறது.' },
          { en: 'All of it is now discoverable in PolarSync — papers, datasets, photographs and stories in one place.', ta: 'இவை அனைத்தும் இப்போது PolarSync-ல் — கட்டுரைகள், தரவுத்தொகுப்புகள், புகைப்படங்கள், கதைகள் — ஒரே இடத்தில் கிடைக்கின்றன.' },
        ],
        link: { href: '/explore/location/loc-maitri', label: { en: 'See everything linked to Maitri', ta: 'மைத்ரியுடன் இணைந்த அனைத்தையும் காண்க' } },
      },
    ],
  },
  {
    id: 'story-arctic', hero: EDU_IMG.auroraTrees, readTime: '6 min',
    title: { en: 'The Arctic Is Changing — Why It Matters to India', ta: 'ஆர்க்டிக் மாறுகிறது — அது இந்தியாவிற்கு ஏன் முக்கியம்' },
    subtitle: { en: 'Sea ice, warming fjords and the questions studied at Himadri.' },
    sections: [
      { key: 'ocean', image: EDU_IMG.aurora, heading: { en: 'An ocean of ice' }, body: [{ en: 'Unlike Antarctica, the Arctic is an ocean surrounded by land. Its floating sea ice grows each winter and shrinks each summer, and the summer minimum has declined markedly over the satellite era.' }, { en: 'The Arctic has been warming several times faster than the global average — a process scientists call Arctic amplification.' }], fact: { value: 'Several×', label: { en: 'faster warming than the global average' } } },
      { key: 'himadri', image: EDU_IMG.flag, heading: { en: 'India in the Arctic' }, body: [{ en: 'India opened Himadri station in Ny-Ålesund, Svalbard in 2008 and deployed the IndARC ocean observatory in Kongsfjorden in 2014. India became an observer to the Arctic Council in 2013.' }], link: { href: '/explore/location/loc-himadri', label: { en: 'Explore Himadri' } } },
      { key: 'link', image: EDU_IMG.clouds, heading: { en: 'Why it matters to India' }, body: [{ en: 'Researchers are investigating whether changes in Arctic sea ice influence weather far away, including the Indian monsoon. These links are still being debated — which is exactly why long-term observations matter.' }], link: { href: '/search?q=arctic%20sea%20ice%20monsoon', label: { en: 'Read the research' } } },
    ],
  },
  {
    id: 'story-third-pole', hero: EDU_IMG.himalaya, readTime: '7 min',
    title: { en: 'The Third Pole: Himalayan Glaciers', ta: 'மூன்றாம் துருவம்: இமயமலைப் பனியாறுகள்' },
    subtitle: { en: 'Why the Himalaya is called the Third Pole and how its glaciers are watched.' },
    sections: [
      { key: 'third', image: EDU_IMG.peak, heading: { en: 'The Third Pole' }, body: [{ en: 'Outside the Arctic and Antarctic, the Himalaya and neighbouring ranges hold the largest store of ice on Earth — earning the name “Third Pole”.' }, { en: 'Meltwater from these glaciers and seasonal snow feeds rivers such as the Ganga, Indus and Brahmaputra.' }] },
      { key: 'himansh', image: EDU_IMG.spiti, heading: { en: 'Himansh station' }, body: [{ en: 'High in the Chandra basin of Himachal Pradesh, the Himansh research station (2016) supports scientists who measure glacier mass balance, snow and weather.' }], link: { href: '/explore/location/loc-himansh', label: { en: 'Explore Himansh' } } },
      { key: 'measure', image: EDU_IMG.himalaya, heading: { en: 'Measuring a glacier' }, body: [{ en: 'Field teams drill stakes into the ice and revisit them each season to see how much was gained as snow and lost as melt. Satellites add the big picture, mapping glacier outlines and lakes year after year.' }], link: { href: '/search?q=What%20is%20happening%20to%20Himalayan%20glaciers%3F', label: { en: 'Explore Himalayan research' } } },
    ],
  },
  {
    id: 'story-penguins', hero: EDU_IMG.gentoo, readTime: '5 min',
    title: { en: 'Penguins: Sentinels of the Southern Ocean', ta: 'பென்குயின்கள்: தென் பெருங்கடலின் காவலர்கள்' },
    subtitle: { en: 'How counting nests helps scientists read the health of the ocean.' },
    sections: [
      { key: 'meet', image: EDU_IMG.chinstrap, heading: { en: 'Meet the penguins' }, body: [{ en: 'Adélie penguins build nests from small pebbles on the rocky coast during the short summer. Emperor penguins do the opposite — they breed on sea ice in the depth of winter.' }] },
      { key: 'food', image: EDU_IMG.ocean, heading: { en: 'Everything depends on krill' }, body: [{ en: 'Tiny shrimp-like krill feed penguins, seals and whales. Krill depend on sea ice and plankton, so a change in the ice ripples up the food web.' }] },
      { key: 'count', image: EDU_IMG.gentooRock, heading: { en: 'Counting nests' }, body: [{ en: 'By photographing colonies and counting nests every season near Bharati station, scientists can spot trends that point to changes in the ocean.' }], link: { href: '/repository/p-penguins', label: { en: 'Read the penguin study' } } },
    ],
  },
];

export interface QuizQ { q: L10n; options: L10n[]; answer: number; explain: L10n }
export interface Quiz { id: string; title: L10n; image: string; questions: QuizQ[] }

const o = (...xs: (string | [string, string])[]): L10n[] => xs.map((x) => (Array.isArray(x) ? { en: x[0], ta: x[1] } : { en: x }));

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz-polar', image: EDU_IMG.chinstrap,
    title: { en: 'How much do you know about the Polar Regions?', ta: 'துருவப் பகுதிகளைப் பற்றி உங்களுக்கு எவ்வளவு தெரியும்?' },
    questions: [
      { q: { en: 'Which Indian research station is located in Antarctica?', ta: 'அண்டார்டிகாவில் அமைந்துள்ள இந்திய ஆய்வு நிலையம் எது?' }, options: o(['Maitri', 'மைத்ரி'], ['Himadri', 'ஹிமாத்ரி'], ['Himansh', 'ஹிமான்ஷ்'], ['None of these', 'இவற்றில் எதுவுமில்லை']), answer: 0, explain: { en: 'Maitri (and Bharati) are in Antarctica. Himadri is in the Arctic, Himansh in the Himalaya.', ta: 'மைத்ரி (மற்றும் பாரதி) அண்டார்டிகாவில் உள்ளன. ஹிமாத்ரி ஆர்க்டிக்கிலும், ஹிமான்ஷ் இமயமலையிலும் உள்ளன.' } },
      { q: { en: 'When did India’s first Antarctic expedition set sail?', ta: 'இந்தியாவின் முதல் அண்டார்டிகா பயணம் எப்போது புறப்பட்டது?' }, options: o('1971', '1981', '1991', '2001'), answer: 1, explain: { en: 'It left Goa in December 1981 and reached Antarctica in January 1982.', ta: 'அது டிசம்பர் 1981-ல் கோவாவிலிருந்து புறப்பட்டு ஜனவரி 1982-ல் அண்டார்டிகாவை அடைந்தது.' } },
      { q: { en: 'Himadri, India’s Arctic station, is located in which archipelago?', ta: 'இந்தியாவின் ஆர்க்டிக் நிலையமான ஹிமாத்ரி எந்தத் தீவுக்கூட்டத்தில் உள்ளது?' }, options: o(['Greenland', 'கிரீன்லாந்து'], ['Svalbard', 'ஸ்வால்பார்ட்'], ['Iceland', 'ஐஸ்லாந்து'], ['Faroe Islands', 'ஃபாரோ தீவுகள்']), answer: 1, explain: { en: 'Himadri is in Ny-Ålesund on Svalbard (Norway), opened in 2008.', ta: 'ஹிமாத்ரி ஸ்வால்பார்ட்டில் (நார்வே) உள்ள நை-ஆலசுண்டில் 2008-ல் திறக்கப்பட்டது.' } },
      { q: { en: 'In which year did Bharati station open?', ta: 'பாரதி நிலையம் எந்த ஆண்டு திறக்கப்பட்டது?' }, options: o('1989', '2005', '2012', '2016'), answer: 2, explain: { en: 'Bharati, in the Larsemann Hills, opened in 2012.', ta: 'லார்ஸ்மன் மலைகளில் உள்ள பாரதி 2012-ல் திறக்கப்பட்டது.' } },
      { q: { en: 'Which is the coldest continent on Earth?', ta: 'பூமியின் மிகக் குளிரான கண்டம் எது?' }, options: o(['Asia', 'ஆசியா'], ['Antarctica', 'அண்டார்டிகா'], ['Europe', 'ஐரோப்பா'], ['North America', 'வட அமெரிக்கா']), answer: 1, explain: { en: 'Antarctica holds the record for the lowest temperatures measured on Earth.', ta: 'பூமியில் அளக்கப்பட்ட மிகக் குறைந்த வெப்பநிலைகள் அண்டார்டிகாவில்தான்.' } },
      { q: { en: 'Over which region does the “ozone hole” form each spring?', ta: 'ஒவ்வொரு வசந்த காலத்திலும் “ஓசோன் துளை” எந்தப் பகுதியின் மேல் உருவாகிறது?' }, options: o(['Antarctica', 'அண்டார்டிகா'], ['The Sahara', 'சஹாரா'], ['The Himalaya', 'இமயமலை'], ['The Amazon', 'அமேசான்']), answer: 0, explain: { en: 'Cold stratospheric clouds over Antarctica speed up ozone loss in austral spring.', ta: 'அண்டார்டிகாவின் மேல் உள்ள குளிர்ந்த மேகங்கள் தென் வசந்த காலத்தில் ஓசோன் இழப்பை விரைவுபடுத்துகின்றன.' } },
      { q: { en: 'Which animal lives in Antarctica but not in the Arctic?', ta: 'ஆர்க்டிக்கில் இல்லாமல் அண்டார்டிகாவில் வாழும் விலங்கு எது?' }, options: o(['Polar bear', 'துருவக் கரடி'], ['Walrus', 'கடற்குதிரை'], ['Penguin', 'பென்குயின்'], ['Arctic fox', 'ஆர்க்டிக் நரி']), answer: 2, explain: { en: 'Penguins live in the Southern Hemisphere; polar bears only in the Arctic.', ta: 'பென்குயின்கள் தென் அரைக்கோளத்தில் வாழ்கின்றன; துருவக் கரடிகள் ஆர்க்டிக்கில் மட்டுமே.' } },
      { q: { en: 'Roughly what share of Earth’s fresh water is stored in Antarctic ice?', ta: 'பூமியின் நன்னீரில் தோராயமாக எவ்வளவு அண்டார்டிகா பனியில் உள்ளது?' }, options: o('About 10%', 'About 30%', 'About 70%', 'About 95%'), answer: 2, explain: { en: 'Commonly cited estimates put it at around 70%.', ta: 'பொதுவாக சுமார் 70% என மதிப்பிடப்படுகிறது.' } },
      { q: { en: 'What is the Arctic mainly?', ta: 'ஆர்க்டிக் முக்கியமாக என்ன?' }, options: o(['A continent covered by ice', 'பனியால் மூடப்பட்ட கண்டம்'], ['An ocean surrounded by land', 'நிலத்தால் சூழப்பட்ட பெருங்கடல்'], ['A mountain range', 'மலைத்தொடர்'], ['A desert of sand', 'மணல் பாலைவனம்']), answer: 1, explain: { en: 'The Arctic is an ocean surrounded by land; Antarctica is land surrounded by ocean.', ta: 'ஆர்க்டிக் நிலத்தால் சூழப்பட்ட பெருங்கடல்; அண்டார்டிகா கடலால் சூழப்பட்ட நிலம்.' } },
      { q: { en: 'Which agreement reserves Antarctica for peace and science?', ta: 'அண்டார்டிகாவை அமைதிக்கும் அறிவியலுக்கும் ஒதுக்கும் ஒப்பந்தம் எது?' }, options: o(['The Antarctic Treaty', 'அண்டார்டிக் ஒப்பந்தம்'], ['The Paris Agreement', 'பாரிஸ் ஒப்பந்தம்'], ['The Kyoto Protocol', 'கியோட்டோ நெறிமுறை'], ['The Montreal Protocol', 'மாண்ட்ரீல் நெறிமுறை']), answer: 0, explain: { en: 'The Antarctic Treaty (1959). India joined in 1983.', ta: 'அண்டார்டிக் ஒப்பந்தம் (1959). இந்தியா 1983-ல் இணைந்தது.' } },
    ],
  },
  {
    id: 'quiz-cryo', image: EDU_IMG.clouds,
    title: { en: 'Glaciers and the Third Pole Quiz', ta: 'பனியாறுகளும் மூன்றாம் துருவமும் — வினாடி வினா' },
    questions: [
      { q: { en: 'Why is the Himalaya called the “Third Pole”?' }, options: o('It is at the North Pole', 'It holds the largest store of ice outside the polar regions', 'It is the third-highest range', 'It has three poles of ice'), answer: 1, explain: { en: 'After the Arctic and Antarctic, the Himalaya region holds the most ice.' } },
      { q: { en: 'The Gangotri glacier is the source of which river?' }, options: o('Bhagirathi (Ganga)', 'Narmada', 'Godavari', 'Kaveri'), answer: 0, explain: { en: 'The Bhagirathi, a headstream of the Ganga, emerges from Gangotri glacier.' } },
      { q: { en: 'What does glacier “mass balance” measure?' }, options: o('The weight of rocks on a glacier', 'Ice gained versus lost over a year', 'The speed of rivers', 'Snowfall in cities'), answer: 1, explain: { en: 'Mass balance compares accumulation (snow) with ablation (melt).' } },
      { q: { en: 'What is permafrost?' }, options: o('Snow that falls every year', 'Ground that stays frozen for at least two years in a row', 'A type of glacier lake', 'A frozen waterfall'), answer: 1, explain: { en: 'Permafrost is ground that remains at or below 0 °C for two or more consecutive years.' } },
      { q: { en: 'A thick layer of rock debris on a glacier usually…' }, options: o('Speeds up melting below it', 'Slows down melting below it', 'Has no effect', 'Turns the ice to water instantly'), answer: 1, explain: { en: 'Thick debris insulates the ice; a thin dark layer can instead speed melting.' } },
      { q: { en: 'What is a GLOF?' }, options: o('A glacier lake outburst flood', 'A new type of satellite', 'A mountain festival', 'A weather balloon'), answer: 0, explain: { en: 'A sudden release of water from a lake dammed by a glacier or moraine.' } },
      { q: { en: 'Himansh research station is located in…' }, options: o('Sikkim', 'Ladakh', 'Spiti, Himachal Pradesh', 'Arunachal Pradesh'), answer: 2, explain: { en: 'Himansh is in the Chandra basin of the Spiti region (2016).' } },
      { q: { en: 'Which satellite method measures changes in ice surface height?' }, options: o('Altimetry', 'Carbon dating', 'Seismography', 'Sonar fishing'), answer: 0, explain: { en: 'Radar and laser altimeters measure surface elevation from orbit.' } },
    ],
  },
];

export interface Hotspot { id: string; x: number; y: number; title: L10n; body: L10n; related?: { href: string; label: string } }
export interface Tour { id: string; title: L10n; image: string; intro: L10n; hotspots: Hotspot[] }

export const TOURS: Tour[] = [
  {
    id: 'tour-maitri', image: EDU_IMG.cabin,
    title: { en: 'Maitri Station', ta: 'மைத்ரி நிலையம்' },
    intro: { en: 'India’s year-round Antarctic station in the Schirmacher Oasis, Dronning Maud Land. (Illustrative image — hotspots are schematic.)', ta: 'டிரானிங் மௌட் லேண்டின் ஷிர்மாக்கர் சோலையில் உள்ள இந்தியாவின் ஆண்டு முழுவதும் இயங்கும் அண்டார்டிகா நிலையம். (விளக்கப் படம்.)' },
    hotspots: [
      { id: 'lab', x: 40, y: 56, title: { en: 'Research Laboratory', ta: 'ஆய்வகம்' }, body: { en: 'Scientists process lake water, snow and microbial samples here before they are shipped home. Instruments are kept warm so they work through the winter.', ta: 'ஏரி நீர், பனி, நுண்ணுயிர் மாதிரிகள் இங்கு பகுப்பாய்வு செய்யப்படுகின்றன.' }, related: { href: '/repository/p-microbial', label: 'Microbial mats study' } },
      { id: 'living', x: 69, y: 63, title: { en: 'Living Area', ta: 'தங்குமிடம்' }, body: { en: 'The wintering team — typically a few dozen people — lives, eats and exercises here through months of polar night.', ta: 'குளிர்காலக் குழு மாதக்கணக்கான துருவ இரவில் இங்கு வாழ்கிறது.' } },
      { id: 'obs', x: 22, y: 38, title: { en: 'Observatory', ta: 'வானியல் ஆய்வகம்' }, body: { en: 'Magnetometers and all-sky cameras record geomagnetic activity and the aurora australis.', ta: 'காந்தமானிகள் மற்றும் வான் கேமராக்கள் தென் துருவ ஒளியைப் பதிவு செய்கின்றன.' }, related: { href: '/repository/p-geomag', label: 'Space-weather research' } },
      { id: 'weather', x: 86, y: 34, title: { en: 'Weather Station', ta: 'வானிலை நிலையம்' }, body: { en: 'An automatic weather station logs temperature, pressure, wind and radiation every hour; ozone is measured during spring campaigns.', ta: 'தானியங்கி வானிலை நிலையம் ஒவ்வொரு மணி நேரமும் வெப்பநிலை, அழுத்தம், காற்றைப் பதிவு செய்கிறது.' }, related: { href: '/repository/d-maitri-aws', label: 'Maitri AWS dataset' } },
      { id: 'oasis', x: 52, y: 84, title: { en: 'Schirmacher Oasis', ta: 'ஷிர்மாக்கர் சோலை' }, body: { en: 'An ice-free area dotted with freshwater lakes — a rare habitat for mosses, lichens and microbes.', ta: 'நன்னீர் ஏரிகள் நிறைந்த பனியற்ற பகுதி.' } },
    ],
  },
  {
    id: 'tour-himadri', image: EDU_IMG.flag,
    title: { en: 'Himadri Station, Ny-Ålesund' },
    intro: { en: 'India’s Arctic station in the international research village of Ny-Ålesund, Svalbard. (Illustrative image — hotspots are schematic.)' },
    hotspots: [
      { id: 'station', x: 30, y: 60, title: { en: 'Station building' }, body: { en: 'Laboratories and accommodation for Indian scientists visiting Svalbard, opened in 2008.' } },
      { id: 'atmos', x: 58, y: 30, title: { en: 'Atmosphere lab' }, body: { en: 'Instruments sample aerosols, black carbon and greenhouse gases arriving in the Arctic.' }, related: { href: '/repository/p-blackcarbon', label: 'Black carbon study' } },
      { id: 'fjord', x: 74, y: 70, title: { en: 'Kongsfjorden' }, body: { en: 'The IndARC mooring records ocean temperature and salinity year-round in this fjord.' }, related: { href: '/repository/d-indarc', label: 'IndARC dataset' } },
      { id: 'glacier', x: 12, y: 32, title: { en: 'Glaciers' }, body: { en: 'Teams survey nearby glaciers each summer to measure melt.' }, related: { href: '/repository/p-brogger', label: 'Glacier mass balance' } },
    ],
  },
];

export interface Kit { id: string; title: string; level: string; duration: string; image: string; summary: string; contents: string[]; activity?: 'seaice' }
export const KITS: Kit[] = [
  { id: 'kit-classroom', title: 'Polar Science Classroom Pack', level: 'Ages 12–18', duration: '4 lessons', image: EDU_IMG.field,
    summary: 'A four-lesson unit introducing the polar regions, India’s polar programme, climate change and careers in polar science.',
    contents: ['Lesson 1 — Two poles, one planet: compare Arctic (ocean) and Antarctica (continent).', 'Lesson 2 — India on the ice: timeline of expeditions and stations (1981 → today).', 'Lesson 3 — Reading the climate: ice cores, ozone and sea ice as evidence.', 'Lesson 4 — Be a polar scientist: plan an expedition with a budget and science goals.', 'Worksheet — Map activity using the PolarSync map.', 'Discussion prompts and an exit quiz (links to the PolarSync quiz).'] },
  { id: 'kit-seaice', title: 'Sea Ice Data Activity', level: 'Ages 14–18', duration: '1 lesson', image: EDU_IMG.earth, activity: 'seaice',
    summary: 'Students plot a seasonal sea-ice curve, identify the yearly maximum and minimum, and discuss how scientists detect long-term trends.',
    contents: ['Teacher notes: what passive-microwave satellites measure.', 'Student sheet: plot monthly values and mark the maximum and minimum.', 'Extension: compare two years and discuss natural variability vs. trend.', 'Link: Antarctic Sea Ice Extent Dataset in the PolarSync repository.'] },
  { id: 'kit-glacier', title: 'Teacher’s Guide: Glaciers and Climate', level: 'Ages 11–14', duration: '2 lessons', image: EDU_IMG.peak,
    summary: 'Hands-on experiments showing how glaciers form, flow and respond to warming, connected to Himalayan glacier research.',
    contents: ['Experiment — make a “glacier” with ice and sand and observe melting with/without debris.', 'Background — the Third Pole and Himalayan rivers.', 'Activity — read a mass-balance diagram.', 'Career spotlight — a day at Himansh station.'] },
];

// Illustrative seasonal cycle for the classroom activity (NOT real measurements)
export const SEAICE_ACTIVITY = [
  { m: 'Jan', v: 5.5 }, { m: 'Feb', v: 3.5 }, { m: 'Mar', v: 4.5 }, { m: 'Apr', v: 7.5 }, { m: 'May', v: 10.5 }, { m: 'Jun', v: 13.5 },
  { m: 'Jul', v: 16 }, { m: 'Aug', v: 17.5 }, { m: 'Sep', v: 18.5 }, { m: 'Oct', v: 18 }, { m: 'Nov', v: 15 }, { m: 'Dec', v: 10 },
];
