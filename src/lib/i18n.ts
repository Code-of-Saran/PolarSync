'use client';
// Lightweight i18n: flat key → string dictionaries. Missing keys fall back to English,
// so new languages can be added incrementally (Hindi is partial by design).
import { useCallback } from 'react';
import { useAppStore, type Lang } from './store';

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

const en = {
  // navigation
  'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.map': 'Polar Map', 'nav.search': 'Search', 'nav.repository': 'Repository',
  'nav.media': 'Media', 'nav.education': 'Education', 'nav.about': 'About', 'nav.analytics': 'Analytics', 'nav.dashboard': 'My Dashboard',
  'nav.upload': 'Upload', 'nav.admin': 'Admin', 'nav.review': 'Review Queue', 'nav.settings': 'Settings', 'nav.profile': 'Profile',
  'nav.signin': 'Sign in', 'nav.signout': 'Sign out', 'nav.language': 'Language', 'nav.menu': 'Menu', 'nav.more': 'More',
  // common
  'common.search': 'Search', 'common.searchPlaceholder': 'Search papers, datasets, media or topics...', 'common.view': 'View',
  'common.download': 'Download', 'common.share': 'Share', 'common.cite': 'Cite', 'common.loading': 'Loading…', 'common.retry': 'Retry',
  'common.noResults': 'No results found', 'common.clearFilters': 'Clear filters', 'common.filters': 'Filters', 'common.all': 'All',
  'common.contentType': 'Content type', 'common.region': 'Region', 'common.researchArea': 'Research area', 'common.year': 'Year',
  'common.author': 'Author', 'common.mediaType': 'Media type', 'common.topic': 'Topic', 'common.sort': 'Sort', 'common.recent': 'Most recent',
  'common.popular': 'Most viewed', 'common.titleSort': 'Title A–Z', 'common.viewAll': 'View all', 'common.back': 'Back', 'common.close': 'Close',
  'common.relevant': 'relevant', 'common.results': 'results', 'common.related': 'Related content', 'common.metadata': 'Metadata',
  'common.keywords': 'Keywords', 'common.topics': 'Topics', 'common.summary': 'Summary', 'common.location': 'Location', 'common.date': 'Date',
  'common.explore': 'Explore', 'common.next': 'Next', 'common.previous': 'Previous', 'common.sampleNotice': 'Prototype — all scientific content is representative sample data.',
  'common.apiDown': 'The PolarSync API is not reachable. Start the backend (see README) and retry.',
  'common.lowBandwidth': 'Low bandwidth mode', 'common.lowBandwidthDesc': 'Optimized for slower connections',
  // regions
  'region.Antarctica': 'Antarctica', 'region.Arctic': 'Arctic', 'region.Himalaya': 'Himalaya', 'region.Southern Ocean': 'Southern Ocean', 'region.India': 'India',
  // types
  'type.paper': 'Research Paper', 'type.dataset': 'Dataset', 'type.report': 'Report', 'type.photo': 'Photo Gallery', 'type.video': 'Video',
  'type.press_release': 'Press Release', 'type.story': 'Science Story', 'type.tour': 'Virtual Tour', 'type.quiz': 'Quiz', 'type.kit': 'Educator Kit',
  'type.expedition': 'Expedition',
  'group.research': 'Research Papers', 'group.datasets': 'Datasets', 'group.reports': 'Reports', 'group.media': 'Media',
  'group.learn': 'Stories & Learning', 'group.expeditions': 'Expeditions', 'group.locations': 'Locations',
  // landing
  'landing.badge': 'SIH 2026 · SIH26063 · Prototype', 'landing.title1': 'One portal to', 'landing.title2': 'share and preserve',
  'landing.title3': "India's polar science.",
  'landing.subtitle': "Explore research, discover data, experience expeditions, and learn about India's polar science.",
  'landing.browse': 'Browse Repository', 'landing.openMap': 'Explore Polar Map', 'landing.scroll': 'Scroll to explore',
  'landing.card.research': 'Research', 'landing.card.researchSub': 'Papers • Datasets • Reports',
  'landing.card.media': 'Media', 'landing.card.mediaSub': 'Photos • Videos • Press',
  'landing.card.explore': 'Explore', 'landing.card.exploreSub': 'Maps • Stories • Expeditions',
  'landing.pillars': 'Why PolarSync', 'landing.pillarsTitle': "India's digital gateway to polar science",
  'landing.p1': 'One Gateway', 'landing.p1d': 'Research, media and outreach unified in a single searchable portal.',
  'landing.p2': 'AI Discovery', 'landing.p2d': 'Semantic search understands questions, not just keywords.',
  'landing.p3': 'Trusted Content', 'landing.p3d': 'AI suggests metadata — humans review before anything is published.',
  'landing.p4': 'Geo-spatial Knowledge', 'landing.p4d': 'Every record is anchored to stations, glaciers and expedition routes.',
  'landing.tryAsking': 'Try asking', 'landing.recent': 'Recently published', 'landing.workflow': 'From field to the world',
  'landing.workflowSub': 'AI-assisted, human-reviewed publication workflow',
  'landing.mapTitle': "Explore India's polar research on a live map",
  'landing.mapDesc': 'Stations, expedition routes, data sites and media hotspots across Antarctica, the Arctic and the Himalaya — each linked to the research it produced.',
  // search
  'search.title': 'Intelligent Search', 'search.subtitle': 'Ask a question in plain language — PolarSync searches by meaning across research, data, media and stories.',
  'search.insight': 'AI Insight', 'search.pipeline': 'How this search worked', 'search.relatedTopics': 'Related topics',
  'search.mode.hybrid': 'Hybrid AI', 'search.mode.keyword': 'Keyword only', 'search.mode.semantic': 'Semantic only',
  'search.matchedMeaning': 'Matched by meaning', 'search.popular': 'Popular searches', 'search.recent': 'Recent searches',
  'search.searching': 'Searching the polar knowledge base…', 'search.viewResearch': 'View research', 'search.onMap': 'On the map',
  'search.evidence': 'Evidence', 'search.why': 'Why this result?',
  // repository
  'repo.title': 'Knowledge Repository', 'repo.subtitle': "Verified research papers, datasets and reports from India's polar missions.",
  'repo.search': 'Search repository…', 'repo.tabs.all': 'All', 'repo.tabs.papers': 'Papers', 'repo.tabs.datasets': 'Datasets', 'repo.tabs.reports': 'Reports',
  'repo.items': 'items', 'repo.loading': 'Loading repository…', 'repo.abstract': 'Abstract', 'repo.aiSummary': 'AI summary (human-reviewed)',
  'repo.provenance': 'Provenance', 'repo.locations': 'Linked locations', 'repo.access': 'Access', 'repo.copyLink': 'Link copied',
  // map
  'map.title': 'Interactive Polar Map', 'map.searchLocations': 'Search locations…', 'map.locations': 'locations', 'map.exploreStation': 'Explore station',
  'map.research': 'Research', 'map.related': 'Related knowledge', 'map.cat.all': 'All', 'map.cat.station': 'Research Stations',
  'map.cat.expedition': 'Expeditions', 'map.cat.dataset': 'Datasets', 'map.cat.media': 'Media', 'map.cat.event': 'Events',
  // media
  'media.title': 'Media Hub', 'media.subtitle': 'Photographs, films and press from the frontlines of polar research.',
  'media.featured': 'Featured expedition', 'media.exploreExpedition': 'Explore expedition', 'media.tabs.all': 'All', 'media.tabs.photos': 'Photos',
  'media.tabs.videos': 'Videos', 'media.tabs.expeditions': 'Expeditions', 'media.tabs.press': 'Press Releases', 'media.photos': 'photos',
  'media.timeline': 'Expedition timeline',
  // education
  'edu.hero': 'Explore. Learn. Preserve.', 'edu.subtitle': 'Stories, virtual tours, quizzes and classroom kits that bring polar science to every learner.',
  'edu.stories': 'Science Stories', 'edu.storiesDesc': 'Scroll-through narratives of Indian polar science', 'edu.tours': 'Virtual Tours',
  'edu.toursDesc': 'Visit research stations from your screen', 'edu.quizzes': 'Polar Quizzes', 'edu.quizzesDesc': 'Test your knowledge and earn an explorer level',
  'edu.kits': 'Educator Kits', 'edu.kitsDesc': 'Ready-to-use lessons for teachers', 'edu.readStory': 'Read story', 'edu.takeTour': 'Take tour',
  'edu.startQuiz': 'Start quiz', 'edu.openKit': 'Open kit',
  'quiz.question': 'Question', 'quiz.of': 'of', 'quiz.submit': 'Submit answer', 'quiz.next': 'Next question', 'quiz.finish': 'See my score',
  'quiz.correct': 'Correct!', 'quiz.incorrect': 'Not quite.', 'quiz.score': 'Your score', 'quiz.level': 'Polar Explorer Level',
  'quiz.retry': 'Try again', 'quiz.level.beginner': 'Beginner', 'quiz.level.intermediate': 'Intermediate', 'quiz.level.advanced': 'Advanced', 'quiz.level.expert': 'Expert',
  'tour.hint': 'Select a hotspot to learn about each part of the station.',
  // contribute
  'contrib.title': 'Contribute Content', 'contrib.subtitle': 'Upload research, data or media. AI drafts the metadata — you stay in control.',
  'contrib.step1': 'Upload', 'contrib.step2': 'AI Analysis', 'contrib.step3': 'Review & Submit', 'contrib.runAi': 'Run AI analysis',
  'contrib.submit': 'Upload & Submit for Review', 'contrib.saveDraft': 'Save as draft', 'contrib.aiTags': 'AI generated tags',
  'contrib.addTag': 'Add a tag…', 'contrib.applySuggestions': 'Apply suggestions', 'contrib.success': 'Submitted for review',
  // admin
  'admin.title': 'Command Center', 'admin.review': 'Review Queue', 'admin.pending': 'Pending Reviews', 'admin.newContrib': 'New Contributions',
  'admin.published': 'Published Content', 'admin.users': 'Total Users', 'admin.approve': 'Approve & Publish', 'admin.requestChanges': 'Request Changes',
  'admin.reject': 'Reject', 'admin.aiAnalysis': 'AI Analysis', 'admin.insights': 'PolarSync Insights', 'admin.quickActions': 'Quick actions',
  // dashboard
  'dash.welcome': 'Welcome back', 'dash.total': 'Total Submissions', 'dash.review': 'Under Review', 'dash.published': 'Published', 'dash.drafts': 'Drafts',
  'dash.uploadNew': 'Upload New Content', 'dash.recent': 'Recent Contributions',
  // status
  'status.published': 'Published', 'status.under_review': 'Under Review', 'status.draft': 'Draft', 'status.rejected': 'Rejected',
  'status.changes_requested': 'Changes Requested', 'status.approved': 'Approved', 'status.pending': 'Pending',
  // settings
  'settings.title': 'Settings', 'settings.accessibility': 'Accessibility', 'settings.reduceMotion': 'Reduce motion', 'settings.largeText': 'Larger text',
  'settings.appearance': 'Experience',
};

export type TKey = keyof typeof en;
type Dict = Partial<Record<TKey, string>>;

const ta: Dict = {
  'nav.home': 'முகப்பு', 'nav.explore': 'ஆராயுங்கள்', 'nav.map': 'துருவ வரைபடம்', 'nav.search': 'தேடல்', 'nav.repository': 'களஞ்சியம்',
  'nav.media': 'ஊடகம்', 'nav.education': 'கல்வி', 'nav.about': 'பற்றி', 'nav.analytics': 'பகுப்பாய்வு', 'nav.dashboard': 'என் பலகை',
  'nav.upload': 'பதிவேற்றம்', 'nav.admin': 'நிர்வாகம்', 'nav.review': 'மதிப்பாய்வு வரிசை', 'nav.settings': 'அமைப்புகள்', 'nav.profile': 'சுயவிவரம்',
  'nav.signin': 'உள்நுழைக', 'nav.signout': 'வெளியேறு', 'nav.language': 'மொழி', 'nav.menu': 'பட்டி', 'nav.more': 'மேலும்',
  'common.search': 'தேடு', 'common.searchPlaceholder': 'கட்டுரைகள், தரவுத்தொகுப்புகள், ஊடகம் அல்லது தலைப்புகளைத் தேடுங்கள்...',
  'common.view': 'காண்க', 'common.download': 'பதிவிறக்கு', 'common.share': 'பகிர்', 'common.cite': 'மேற்கோள்', 'common.loading': 'ஏற்றுகிறது…',
  'common.retry': 'மீண்டும் முயல்க', 'common.noResults': 'முடிவுகள் எதுவும் இல்லை', 'common.clearFilters': 'வடிகட்டிகளை அழி',
  'common.filters': 'வடிகட்டிகள்', 'common.all': 'அனைத்தும்', 'common.contentType': 'உள்ளடக்க வகை', 'common.region': 'பகுதி',
  'common.researchArea': 'ஆய்வுத் துறை', 'common.year': 'ஆண்டு', 'common.author': 'ஆசிரியர்', 'common.mediaType': 'ஊடக வகை', 'common.topic': 'தலைப்பு',
  'common.sort': 'வரிசை', 'common.recent': 'சமீபத்தியவை', 'common.popular': 'அதிகம் பார்க்கப்பட்டவை', 'common.titleSort': 'தலைப்பு அ–ஃ',
  'common.viewAll': 'அனைத்தையும் காண்க', 'common.back': 'பின்செல்', 'common.close': 'மூடு', 'common.relevant': 'பொருத்தம்',
  'common.results': 'முடிவுகள்', 'common.related': 'தொடர்புடைய உள்ளடக்கம்', 'common.metadata': 'மேல்நிலைத் தரவு', 'common.keywords': 'முக்கியச் சொற்கள்',
  'common.topics': 'தலைப்புகள்', 'common.summary': 'சுருக்கம்', 'common.location': 'இடம்', 'common.date': 'தேதி', 'common.explore': 'ஆராயுங்கள்',
  'common.next': 'அடுத்து', 'common.previous': 'முந்தையது', 'common.sampleNotice': 'முன்மாதிரி — அனைத்து அறிவியல் உள்ளடக்கமும் மாதிரித் தரவு.',
  'common.apiDown': 'PolarSync API-ஐ அணுக முடியவில்லை. பின்தளத்தைத் தொடங்கி மீண்டும் முயலவும்.',
  'common.lowBandwidth': 'குறைந்த அலைவரிசை முறை', 'common.lowBandwidthDesc': 'மெதுவான இணைப்புகளுக்கு உகந்ததாக்கப்பட்டது',
  'region.Antarctica': 'அண்டார்டிகா', 'region.Arctic': 'ஆர்க்டிக்', 'region.Himalaya': 'இமயமலை', 'region.Southern Ocean': 'தென் பெருங்கடல்', 'region.India': 'இந்தியா',
  'type.paper': 'ஆய்வுக் கட்டுரை', 'type.dataset': 'தரவுத்தொகுப்பு', 'type.report': 'அறிக்கை', 'type.photo': 'புகைப்படத் தொகுப்பு', 'type.video': 'காணொளி',
  'type.press_release': 'செய்தி வெளியீடு', 'type.story': 'அறிவியல் கதை', 'type.tour': 'மெய்நிகர் சுற்றுலா', 'type.quiz': 'வினாடி வினா',
  'type.kit': 'ஆசிரியர் கருவித்தொகுப்பு', 'type.expedition': 'பயணம்',
  'group.research': 'ஆய்வுக் கட்டுரைகள்', 'group.datasets': 'தரவுத்தொகுப்புகள்', 'group.reports': 'அறிக்கைகள்', 'group.media': 'ஊடகம்',
  'group.learn': 'கதைகள் & கற்றல்', 'group.expeditions': 'பயணங்கள்', 'group.locations': 'இடங்கள்',
  'landing.badge': 'SIH 2026 · SIH26063 · முன்மாதிரி', 'landing.title1': 'இந்தியாவின் துருவ அறிவியலைப்', 'landing.title2': 'பகிர்ந்து பாதுகாக்க',
  'landing.title3': 'ஒரே தளம்.',
  'landing.subtitle': 'ஆராய்ச்சிகளை ஆராயுங்கள், தரவுகளைக் கண்டறியுங்கள், பயணங்களை அனுபவியுங்கள், இந்தியாவின் துருவ அறிவியலைக் கற்றுக்கொள்ளுங்கள்.',
  'landing.browse': 'களஞ்சியத்தை உலாவுக', 'landing.openMap': 'துருவ வரைபடத்தை ஆராயுங்கள்', 'landing.scroll': 'ஆராய கீழே உருட்டவும்',
  'landing.card.research': 'ஆராய்ச்சி', 'landing.card.researchSub': 'கட்டுரைகள் • தரவுத்தொகுப்புகள் • அறிக்கைகள்',
  'landing.card.media': 'ஊடகம்', 'landing.card.mediaSub': 'புகைப்படங்கள் • காணொளிகள் • செய்திகள்',
  'landing.card.explore': 'ஆராயுங்கள்', 'landing.card.exploreSub': 'வரைபடங்கள் • கதைகள் • பயணங்கள்',
  'landing.pillars': 'ஏன் PolarSync', 'landing.pillarsTitle': 'துருவ அறிவியலுக்கான இந்தியாவின் டிஜிட்டல் நுழைவாயில்',
  'landing.p1': 'ஒரே நுழைவாயில்', 'landing.p1d': 'ஆராய்ச்சி, ஊடகம், மக்கள் தொடர்பு — அனைத்தும் தேடக்கூடிய ஒரே தளத்தில்.',
  'landing.p2': 'AI கண்டுபிடிப்பு', 'landing.p2d': 'சொற்களை மட்டுமல்ல, கேள்விகளின் பொருளையும் புரிந்துகொள்ளும் தேடல்.',
  'landing.p3': 'நம்பகமான உள்ளடக்கம்', 'landing.p3d': 'AI மேல்நிலைத் தரவைப் பரிந்துரைக்கிறது — வெளியிடும் முன் மனிதர்கள் மதிப்பாய்வு செய்கிறார்கள்.',
  'landing.p4': 'புவியியல் சார் அறிவு', 'landing.p4d': 'ஒவ்வொரு பதிவும் நிலையங்கள், பனியாறுகள், பயணப் பாதைகளுடன் இணைக்கப்பட்டுள்ளது.',
  'landing.tryAsking': 'இப்படிக் கேட்டுப் பாருங்கள்', 'landing.recent': 'சமீபத்தில் வெளியிடப்பட்டவை', 'landing.workflow': 'களத்திலிருந்து உலகிற்கு',
  'landing.workflowSub': 'AI உதவியுடன், மனித மதிப்பாய்வுடன் கூடிய வெளியீட்டு முறை',
  'landing.mapTitle': 'இந்தியாவின் துருவ ஆராய்ச்சியை நேரடி வரைபடத்தில் ஆராயுங்கள்',
  'landing.mapDesc': 'அண்டார்டிகா, ஆர்க்டிக், இமயமலை முழுவதும் உள்ள நிலையங்கள், பயணப் பாதைகள், தரவு தளங்கள் — ஒவ்வொன்றும் அதன் ஆராய்ச்சியுடன் இணைக்கப்பட்டுள்ளது.',
  'search.title': 'அறிவார்ந்த தேடல்', 'search.subtitle': 'எளிய மொழியில் கேளுங்கள் — PolarSync பொருளின் அடிப்படையில் தேடுகிறது.',
  'search.insight': 'AI நுண்ணறிவு', 'search.pipeline': 'இந்தத் தேடல் எப்படிச் செயல்பட்டது', 'search.relatedTopics': 'தொடர்புடைய தலைப்புகள்',
  'search.mode.hybrid': 'கலப்பு AI', 'search.mode.keyword': 'சொல் மட்டும்', 'search.mode.semantic': 'பொருள் மட்டும்',
  'search.matchedMeaning': 'பொருளால் பொருந்தியது', 'search.popular': 'பிரபலமான தேடல்கள்', 'search.recent': 'சமீபத்திய தேடல்கள்',
  'search.searching': 'துருவ அறிவுத் தளத்தில் தேடுகிறது…', 'search.viewResearch': 'ஆராய்ச்சியைக் காண்க', 'search.onMap': 'வரைபடத்தில்',
  'search.evidence': 'சான்று', 'search.why': 'ஏன் இந்த முடிவு?',
  'repo.title': 'அறிவுக் களஞ்சியம்', 'repo.subtitle': 'இந்தியாவின் துருவப் பயணங்களிலிருந்து சரிபார்க்கப்பட்ட கட்டுரைகள், தரவுத்தொகுப்புகள், அறிக்கைகள்.',
  'repo.search': 'களஞ்சியத்தில் தேடுங்கள்…', 'repo.tabs.all': 'அனைத்தும்', 'repo.tabs.papers': 'கட்டுரைகள்', 'repo.tabs.datasets': 'தரவுத்தொகுப்புகள்',
  'repo.tabs.reports': 'அறிக்கைகள்', 'repo.items': 'பதிவுகள்', 'repo.loading': 'களஞ்சியம் ஏற்றப்படுகிறது…', 'repo.abstract': 'சுருக்கவுரை',
  'repo.aiSummary': 'AI சுருக்கம் (மனித மதிப்பாய்வு செய்யப்பட்டது)', 'repo.provenance': 'மூலம்', 'repo.locations': 'இணைக்கப்பட்ட இடங்கள்',
  'repo.access': 'அணுகல்', 'repo.copyLink': 'இணைப்பு நகலெடுக்கப்பட்டது',
  'map.title': 'ஊடாடும் துருவ வரைபடம்', 'map.searchLocations': 'இடங்களைத் தேடுங்கள்…', 'map.locations': 'இடங்கள்', 'map.exploreStation': 'நிலையத்தை ஆராயுங்கள்',
  'map.research': 'ஆராய்ச்சி', 'map.related': 'தொடர்புடைய அறிவு', 'map.cat.all': 'அனைத்தும்', 'map.cat.station': 'ஆய்வு நிலையங்கள்',
  'map.cat.expedition': 'பயணங்கள்', 'map.cat.dataset': 'தரவுத்தொகுப்புகள்', 'map.cat.media': 'ஊடகம்', 'map.cat.event': 'நிகழ்வுகள்',
  'media.title': 'ஊடக மையம்', 'media.subtitle': 'துருவ ஆராய்ச்சியின் முன்னணியிலிருந்து புகைப்படங்கள், திரைப்படங்கள், செய்திகள்.',
  'media.featured': 'சிறப்புப் பயணம்', 'media.exploreExpedition': 'பயணத்தை ஆராயுங்கள்', 'media.tabs.all': 'அனைத்தும்', 'media.tabs.photos': 'புகைப்படங்கள்',
  'media.tabs.videos': 'காணொளிகள்', 'media.tabs.expeditions': 'பயணங்கள்', 'media.tabs.press': 'செய்தி வெளியீடுகள்', 'media.photos': 'புகைப்படங்கள்',
  'media.timeline': 'பயணக் காலவரிசை',
  'edu.hero': 'ஆராயுங்கள். கற்றுக்கொள்ளுங்கள். பாதுகாத்திடுங்கள்.', 'edu.subtitle': 'ஒவ்வொரு கற்பவருக்கும் துருவ அறிவியலைக் கொண்டு சேர்க்கும் கதைகள், மெய்நிகர் சுற்றுலாக்கள், வினாடி வினாக்கள்.',
  'edu.stories': 'அறிவியல் கதைகள்', 'edu.storiesDesc': 'இந்தியத் துருவ அறிவியலின் கதைகள்', 'edu.tours': 'மெய்நிகர் சுற்றுலாக்கள்',
  'edu.toursDesc': 'உங்கள் திரையிலிருந்தே ஆய்வு நிலையங்களைப் பார்வையிடுங்கள்', 'edu.quizzes': 'துருவ வினாடி வினாக்கள்',
  'edu.quizzesDesc': 'உங்கள் அறிவைச் சோதித்துப் பாருங்கள்', 'edu.kits': 'ஆசிரியர் கருவித்தொகுப்புகள்', 'edu.kitsDesc': 'ஆசிரியர்களுக்கான பாடங்கள்',
  'edu.readStory': 'கதையைப் படிக்கவும்', 'edu.takeTour': 'சுற்றுலா செல்லுங்கள்', 'edu.startQuiz': 'வினாடி வினா தொடங்கு', 'edu.openKit': 'திறக்கவும்',
  'quiz.question': 'கேள்வி', 'quiz.of': '/', 'quiz.submit': 'பதிலைச் சமர்ப்பி', 'quiz.next': 'அடுத்த கேள்வி', 'quiz.finish': 'மதிப்பெண்ணைக் காண்க',
  'quiz.correct': 'சரி!', 'quiz.incorrect': 'சரியில்லை.', 'quiz.score': 'உங்கள் மதிப்பெண்', 'quiz.level': 'துருவ ஆய்வாளர் நிலை', 'quiz.retry': 'மீண்டும் முயல்க',
  'quiz.level.beginner': 'தொடக்கநிலை', 'quiz.level.intermediate': 'இடைநிலை', 'quiz.level.advanced': 'மேம்பட்டது', 'quiz.level.expert': 'நிபுணர்',
  'tour.hint': 'நிலையத்தின் ஒவ்வொரு பகுதியையும் அறிய ஒரு புள்ளியைத் தேர்ந்தெடுக்கவும்.',
  'contrib.title': 'உள்ளடக்கத்தைப் பங்களிக்கவும்', 'contrib.subtitle': 'ஆராய்ச்சி, தரவு அல்லது ஊடகத்தைப் பதிவேற்றவும். AI மேல்நிலைத் தரவை வரைவு செய்கிறது — கட்டுப்பாடு உங்களிடம்.',
  'contrib.step1': 'பதிவேற்றம்', 'contrib.step2': 'AI பகுப்பாய்வு', 'contrib.step3': 'சரிபார்த்துச் சமர்ப்பி', 'contrib.runAi': 'AI பகுப்பாய்வை இயக்கு',
  'contrib.submit': 'மதிப்பாய்வுக்குச் சமர்ப்பி', 'contrib.saveDraft': 'வரைவாகச் சேமி', 'contrib.aiTags': 'AI உருவாக்கிய குறிச்சொற்கள்',
  'contrib.addTag': 'குறிச்சொல் சேர்…', 'contrib.applySuggestions': 'பரிந்துரைகளைப் பயன்படுத்து', 'contrib.success': 'மதிப்பாய்வுக்குச் சமர்ப்பிக்கப்பட்டது',
  'admin.title': 'கட்டளை மையம்', 'admin.review': 'மதிப்பாய்வு வரிசை', 'admin.pending': 'நிலுவையிலுள்ள மதிப்பாய்வுகள்', 'admin.newContrib': 'புதிய பங்களிப்புகள்',
  'admin.published': 'வெளியிடப்பட்டவை', 'admin.users': 'மொத்தப் பயனர்கள்', 'admin.approve': 'அங்கீகரித்து வெளியிடு', 'admin.requestChanges': 'மாற்றங்களைக் கோரு',
  'admin.reject': 'நிராகரி', 'admin.aiAnalysis': 'AI பகுப்பாய்வு', 'admin.insights': 'PolarSync நுண்ணறிவுகள்', 'admin.quickActions': 'விரைவுச் செயல்கள்',
  'dash.welcome': 'மீண்டும் வருக', 'dash.total': 'மொத்தச் சமர்ப்பிப்புகள்', 'dash.review': 'மதிப்பாய்வில்', 'dash.published': 'வெளியிடப்பட்டவை', 'dash.drafts': 'வரைவுகள்',
  'dash.uploadNew': 'புதிய உள்ளடக்கத்தைப் பதிவேற்று', 'dash.recent': 'சமீபத்திய பங்களிப்புகள்',
  'status.published': 'வெளியிடப்பட்டது', 'status.under_review': 'மதிப்பாய்வில்', 'status.draft': 'வரைவு', 'status.rejected': 'நிராகரிக்கப்பட்டது',
  'status.changes_requested': 'மாற்றங்கள் கோரப்பட்டன', 'status.approved': 'அங்கீகரிக்கப்பட்டது', 'status.pending': 'நிலுவையில்',
  'settings.title': 'அமைப்புகள்', 'settings.accessibility': 'அணுகல்தன்மை', 'settings.reduceMotion': 'அசைவுகளைக் குறை', 'settings.largeText': 'பெரிய எழுத்துரு',
  'settings.appearance': 'அனுபவம்',
};

const hi: Dict = {
  'nav.home': 'होम', 'nav.explore': 'अन्वेषण', 'nav.map': 'ध्रुवीय मानचित्र', 'nav.search': 'खोज', 'nav.repository': 'भंडार', 'nav.media': 'मीडिया',
  'nav.education': 'शिक्षा', 'nav.about': 'परिचय', 'nav.analytics': 'विश्लेषण', 'nav.dashboard': 'मेरा डैशबोर्ड', 'nav.upload': 'अपलोड',
  'nav.admin': 'प्रशासन', 'nav.review': 'समीक्षा कतार', 'nav.settings': 'सेटिंग्स', 'nav.signin': 'साइन इन', 'nav.signout': 'साइन आउट', 'nav.language': 'भाषा',
  'common.search': 'खोजें', 'common.searchPlaceholder': 'शोध-पत्र, डेटासेट, मीडिया या विषय खोजें...', 'common.view': 'देखें', 'common.download': 'डाउनलोड',
  'common.share': 'साझा करें', 'common.loading': 'लोड हो रहा है…', 'common.noResults': 'कोई परिणाम नहीं मिला', 'common.filters': 'फ़िल्टर',
  'common.lowBandwidth': 'कम बैंडविड्थ मोड', 'common.lowBandwidthDesc': 'धीमे कनेक्शन के लिए अनुकूलित',
  'region.Antarctica': 'अंटार्कटिका', 'region.Arctic': 'आर्कटिक', 'region.Himalaya': 'हिमालय', 'region.Southern Ocean': 'दक्षिणी महासागर',
  'landing.title1': 'भारत के ध्रुवीय विज्ञान को', 'landing.title2': 'साझा और संरक्षित', 'landing.title3': 'करने का एक पोर्टल।',
  'landing.subtitle': 'शोध खोजें, डेटा पाएं, अभियानों का अनुभव करें और भारत के ध्रुवीय विज्ञान के बारे में जानें।',
  'landing.browse': 'भंडार देखें', 'landing.openMap': 'ध्रुवीय मानचित्र', 'landing.scroll': 'स्क्रॉल करें',
  'landing.card.research': 'शोध', 'landing.card.media': 'मीडिया', 'landing.card.explore': 'अन्वेषण',
  'edu.hero': 'खोजें। सीखें। संरक्षित करें।', 'search.insight': 'AI अंतर्दृष्टि', 'search.title': 'बुद्धिमान खोज',
  'repo.title': 'ज्ञान भंडार', 'media.title': 'मीडिया हब', 'map.title': 'इंटरैक्टिव ध्रुवीय मानचित्र',
};

const DICTS: Record<Lang, Dict> = { en, ta, hi };

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

export function useT() {
  const lang = useAppStore((s) => s.lang);
  return useCallback((key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}

/** Translate a region name if known, otherwise return as-is. */
export function useRegionLabel() {
  const t = useT();
  return (r?: string | null) => (r ? (t(`region.${r}` as TKey) === `region.${r}` ? r : t(`region.${r}` as TKey)) : '');
}
