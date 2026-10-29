import { supabase } from './supabase'
export type GloamingMonth = { name: string; season: string; description: string }
export const GLOAMING_MONTHS: GloamingMonth[]=[['Brzask','Wiosna'],['Rosa','Wiosna'],['Głóg','Wiosna'],['Zenit','Lato'],['Żar','Lato'],['Złoto','Lato'],['Szkarłat','Jesień'],['Popiół','Jesień'],['Mgła','Jesień'],['Zmierzch','Zima'],['Szron','Zima'],['Wilk','Zima'],['Cisza','Zima']].map(([name,season])=>({name,season,description:''}))
export const GLOAMING_WEEKDAYS=['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela']
export type CalendarState={campaignId:string;year:number;month:number;day:number;kytheros:boolean}
export type CalendarEvent={id:string;campaignId:string;year:number|null;month:number;day:number;title:string;description:string;createdAt:string}
export type CalendarHoliday={month:number;day:number;title:string;description:string;mark:string}
export const GLOAMING_HOLIDAYS:CalendarHoliday[] = [
  {
    "month": 1,
    "day": 1,
    "title": "Nowy Rok — Pierwszy Roztop",
    "description": "Pierwszy dzień roku. W Wardenwood wylewa się do studni kubek ciepłego piwa „dla tych, co nie doczekali wiosny” i wymienia nazwiska zmarłych zimą.",
    "mark": "✦"
  },
  {
    "month": 1,
    "day": 3,
    "title": "Bieg Barana (Ramlaat)",
    "description": "Na początku wiosny wyznawcy Ramlaata biegną wąskimi wąwozami przed szarżującym stadem baranów. Wśród goblinów to próba odwagi; Krunshlik wybiera w ten dzień nowych jeźdźców worgów.",
    "mark": "★"
  },
  {
    "month": 1,
    "day": 7,
    "title": "Uczta Przymierza (Madeera)",
    "description": "Zaczyna się o świcie siódmego dnia wiosny: jagnięcina i wino, rytualne sprzątanie i naprawy domów. Gralen tego dnia nie bierze zapłaty za naprawy.",
    "mark": "★"
  },
  {
    "month": 1,
    "day": 10,
    "title": "Trzy Księżyce (Zagubieni)",
    "description": "Podczas roztopów wyznawcy Zagubionych przez 3 dni nie śpią, żeby wywołać święte wizje (10–12 Brzasku). Obchodzone potajemnie, to bluźnierstwo.",
    "mark": "★"
  },
  {
    "month": 1,
    "day": 20,
    "title": "Pierwszy Pień",
    "description": "Drwale z Wardenwood ścinają pierwsze drzewo roku i zostawiają pod nim chleb dla Gede. Kto ściął Czarcie Drzewo, ten w ten dzień nie pracuje — tak na wszelki wypadek.",
    "mark": "✦"
  },
  {
    "month": 2,
    "day": 14,
    "title": "Dzień Marchii",
    "description": "Kompania Odbudowy Marchii świętuje dekret Korony o odzyskaniu Wschodniej Marchii. Thornwall albo jego zastępca czyta dekret na głos, wbija się nowy słup graniczny i stawia piwo.",
    "mark": "✦"
  },
  {
    "month": 3,
    "day": 2,
    "title": "Przebudzenie (Gede)",
    "description": "Gdy zakwitną pierwsze kwiaty, kapłani Gede ogłaszają Przebudzenie: wymiana słodyczy, tańce i korony z plecionych gałązek. Data ruchoma, w Gloaming zwykle na początku Głogu.",
    "mark": "★"
  },
  {
    "month": 3,
    "day": 15,
    "title": "Noc Tańczącego Kręgu",
    "description": "W tę pełnię Titania pojawia się w kręgu grzybów (1002) z największą trupą aktorów w roku. Kto zatańczy do świtu, wraca odmieniony — albo nie wraca wcale.",
    "mark": "✦"
  },
  {
    "month": 4,
    "day": 1,
    "title": "Noc Szeptów (Shune)",
    "description": "W każdy nów trzech letnich miesięcy wyznawcy Shune przeszukują nocą dzicz, żeby znaleźć czaszkę zwierzęcia i wyszeptać jej sekret.",
    "mark": "★"
  },
  {
    "month": 4,
    "day": 10,
    "title": "Sześć Batów (Memnon)",
    "description": "Gdy nadciągnie pierwsza letnia burza, wierni muszą wychłostać się sześć razy, zanim burza minie. Data ruchoma, zwykle w Zenicie.",
    "mark": "★"
  },
  {
    "month": 4,
    "day": 21,
    "title": "Miodobranie",
    "description": "Pierwsze wybieranie miodu. W Gede's Hearth Elana warzy miód pitny, a dzieci dostają plastry wosku. W tym roku dzieci nie przyszły — nucą coś w lesie.",
    "mark": "✦"
  },
  {
    "month": 5,
    "day": 1,
    "title": "Noc Szeptów (Shune)",
    "description": "Druga letnia noc szeptów.",
    "mark": "★"
  },
  {
    "month": 5,
    "day": 14,
    "title": "Pamięć (Terragnis)",
    "description": "W pełni lata wierni odnawiają przysięgę miłosierdzia i pokory, brodząc w bieżącej wodzie w prostych białych szatach. W Wardenwood to pierwsza Pamięć bez siostry Agnes.",
    "mark": "★"
  },
  {
    "month": 5,
    "day": 21,
    "title": "Dzień Oprawy (Ord)",
    "description": "Dzień poświęcony oprawianiu ksiąg: konkursy na najpiękniej wykonany tom. Gorkem Sabri twierdzi, że kiedyś wygrał.",
    "mark": "★"
  },
  {
    "month": 5,
    "day": 28,
    "title": "Zerwanie Łańcuchów (Memnon)",
    "description": "W pełni lata więźniów maluje się popiołem i krwią, uzbraja i daje im szansę walki o wolność z czempionem Memnona. W Gloaming mówi się, że tak wybierano ludzi do bandy Greavesa.",
    "mark": "★"
  },
  {
    "month": 6,
    "day": 1,
    "title": "Noc Szeptów (Shune)",
    "description": "Trzecia i ostatnia letnia noc szeptów.",
    "mark": "★"
  },
  {
    "month": 6,
    "day": 20,
    "title": "Pierwszy Snop",
    "description": "Pierwszy snop zboża stawia się przy kaplicy w Wardenwood. Kto go postawi, ma szczęście do końca roku; o to miejsce zawsze ktoś się pobije.",
    "mark": "✦"
  },
  {
    "month": 7,
    "day": 5,
    "title": "Noc Żałoby (Terragnis)",
    "description": "W pierwszym tygodniu jesieni aktorzy odgrywają Bitwę pod Diabelskim Szczytem, gdzie św. Terragnis poprowadziła rycerzy przeciw demonom Dziewiątego Kręgu w pyrrusowym zwycięstwie.",
    "mark": "★"
  },
  {
    "month": 7,
    "day": 21,
    "title": "Położenie Kamienia (Madeera)",
    "description": "Barwna jesienna parada w Mieście Masek, zakończona kamienowaniem kukły przestępcy. W Gloaming obchodzą to tylko krasnoludy: Gralen kładzie nowy kamień w fundamentach kuźni.",
    "mark": "★"
  },
  {
    "month": 8,
    "day": 28,
    "title": "Wesołe Biesiady (Gede)",
    "description": "Jesienne żniwa zwieńcza wielka uczta: grzane wino, mięso z rożna i radosne zawody siłowe. Gede's Hearth jest wtedy pełne do świtu.",
    "mark": "★"
  },
  {
    "month": 9,
    "day": 1,
    "title": "Wywar",
    "description": "W nów kultyści Mugdulbluba gotują zęby i kości w wywar, który trzeba wypić. Ten dzień wyznacza im patron; w Wardenwood znikają wtedy psy.",
    "mark": "✦"
  },
  {
    "month": 9,
    "day": 9,
    "title": "Dzień Krwi Ydrisa",
    "description": "Rycerze św. Ydrisa z Greywall Priory (1406) przyjmują nowych braci, którzy piją przeklętą krew świętego. Do przeoratu nikt wtedy nie podchodzi.",
    "mark": "✦"
  },
  {
    "month": 9,
    "day": 24,
    "title": "Marsz Kości (Shune)",
    "description": "Późną jesienią wyznawcy Shune odbywają ponury, milczący marsz z grzechotkami i bębnami z kości.",
    "mark": "★"
  },
  {
    "month": 10,
    "day": 1,
    "title": "Noc Zmierzchu i Równowaga (Ord)",
    "description": "Najważniejsze lokalne święto Gloaming: progi posypuje się solą, w oknach stawia się świecę, a imion zmarłych nie wypowiada się do świtu. To zarazem pierwszy nów zimy, czyli Równowaga Orda: jego wyznawcy przez dzień i noc jedzą tylko chleb i wodę i nie używają magii. Czary rzucone tej nocy uchodzą w Wardenwood za bardzo złą wróżbę.",
    "mark": "✦★"
  },
  {
    "month": 10,
    "day": 15,
    "title": "Palenie Świec (Shune)",
    "description": "Kto w zimową pełnię zobaczy albo usłyszy kruka, musi przez całą noc palić świecę; sama Shune może go odwiedzić. Dotyczy każdej zimowej pełni.",
    "mark": "★"
  },
  {
    "month": 11,
    "day": 14,
    "title": "Ogień Kuźni (Madeera)",
    "description": "W najciemniejszym czasie zimy rozpala się kuźnie do białości i wykuwa święte symbole Madeery. Pierwszy rok, w którym kuźnia Gralena może obchodzić to święto.",
    "mark": "★"
  },
  {
    "month": 11,
    "day": 15,
    "title": "Palenie Świec (Shune)",
    "description": "Zimowa pełnia.",
    "mark": "★"
  },
  {
    "month": 11,
    "day": 28,
    "title": "Spalenie (Memnon)",
    "description": "W środku zimy, w najdłuższą noc roku, wyznawcy Memnona palą ludzi, zwierzęta i przedmioty wybrane przez niego na ofiarę. W Wardenwood trzyma się wtedy straż przy stogach.",
    "mark": "★"
  },
  {
    "month": 12,
    "day": 10,
    "title": "Upuszczanie Krwi (Zagubieni)",
    "description": "Zimą wyznawcy Zagubionych stają na brzegu morza i spuszczają do wody krew ludzkich i zwierzęcych ofiar. W Gloaming zamiast morza jest Finimere Lake — rybacy z Szarych Pomostów (0506) znajdują wtedy czerwony lód.",
    "mark": "★"
  },
  {
    "month": 12,
    "day": 15,
    "title": "Wilcza Pełnia",
    "description": "Najstraszniejsza noc roku w Wardenwood: dzieci nie wychodzą z domów, a na drzwiach maluje się srebrną farbą znak dłoni. W tym roku kilkoro dzieci bardzo chce wyjść. To także zimowa pełnia Shune.",
    "mark": "✦"
  },
  {
    "month": 13,
    "day": 7,
    "title": "Bladość (Gede)",
    "description": "Późną zimą, gdy ziemia ma barwę śmierci, wierni lepią z gliny ludzkie figurki, malują je i zakopują w ziemi.",
    "mark": "★"
  },
  {
    "month": 13,
    "day": 15,
    "title": "Palenie Świec (Shune)",
    "description": "Ostatnia zimowa pełnia.",
    "mark": "★"
  },
  {
    "month": 13,
    "day": 21,
    "title": "Wniebowstąpienie (Terragnis)",
    "description": "Dzień, w którym św. Terragnis stała się boginią. Wierni kładą róże na grobach czczonych zmarłych. W Wardenwood najwięcej róż trafia na grób siostry Agnes.",
    "mark": "★"
  },
  {
    "month": 13,
    "day": 28,
    "title": "Wigilia Roku",
    "description": "Ostatni wieczór roku. Spala się w ognisku wszystko, co zepsute i niepotrzebne, a długi trzeba spłacić przed północą — inaczej przechodzą na cały następny rok.",
    "mark": "✦"
  }
]
export const moonPhase=(d:number)=>d===1?'🌑 Nów':d===8?'🌓 Pierwsza kwadra':d===15?'🌕 Pełnia':d===22?'🌗 Ostatnia kwadra':''
export const weekday=(d:number)=>GLOAMING_WEEKDAYS[(d-1)%7]
export async function loadCalendarState(campaignId:string):Promise<CalendarState>{if(!supabase)throw Error('Supabase nie jest skonfigurowany.');let q=await supabase.from('campaign_calendar_state').select('*').eq('campaign_id',campaignId).maybeSingle();if(q.error)throw q.error;if(!q.data){q=await supabase.from('campaign_calendar_state').insert({campaign_id:campaignId,year:1,month:3,day:8,is_kytheros:false}).select().single();if(q.error)throw q.error}const r:any=q.data;return{campaignId,year:r.year,month:r.month,day:r.day,kytheros:r.is_kytheros}}
export async function saveCalendarState(s:CalendarState){if(!supabase)throw Error('Supabase nie jest skonfigurowany.');const{error}=await supabase.from('campaign_calendar_state').upsert({campaign_id:s.campaignId,year:s.year,month:s.month,day:s.day,is_kytheros:s.kytheros,updated_at:new Date().toISOString()},{onConflict:'campaign_id'});if(error)throw error}
export async function loadCalendarEvents(campaignId:string):Promise<CalendarEvent[]>{if(!supabase)throw Error('Supabase nie jest skonfigurowany.');const{data,error}=await supabase.from('campaign_calendar_events').select('*').eq('campaign_id',campaignId).order('month').order('day');if(error)throw error;return(data??[]).map((r:any)=>({id:r.id,campaignId:r.campaign_id,year:r.year,month:r.month,day:r.day,title:r.title,description:r.description??'',createdAt:r.created_at}))}
export async function createCalendarEvent(campaignId:string,i:{year:number|null;month:number;day:number;title:string;description:string}){if(!supabase)throw Error('Supabase nie jest skonfigurowany.');const{error}=await supabase.from('campaign_calendar_events').insert({campaign_id:campaignId,year:i.year,month:i.month,day:i.day,title:i.title,description:i.description});if(error)throw error}
export async function deleteCalendarEvent(id:string){if(!supabase)return;const{error}=await supabase.from('campaign_calendar_events').delete().eq('id',id);if(error)throw error}
