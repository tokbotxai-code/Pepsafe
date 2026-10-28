// Steroids section: hub, one card per compound, comparison table and "steroids vs peptides" article.
// Content lives in sterydy/*.json (every text field has en, pl and es); this module is called from tools/v4.js
// with the page helpers. It writes /<lang>/steroids.html, /<lang>/steroids-compare.html, /<lang>/steroids-vs-peptides.html
// and /<lang>/t/s-<id>.html for en and pl. Spanish comes from tools/es.js, which reads the EN->ES pairs this module
// records in tools/sterydy-tm.json (so there is exactly one place for each sentence).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

// Polish spells it "steryd" (corticosteroids stay "kortykosteroidy"); applied to every Polish string the section produces
const plFix = s => typeof s === 'string' ? s.replace(/(?<!kortyko)([Ss])teroid/g, '$1teryd') : s;
const norm = s => s.replace(/\s+/g, ' ').trim();
const ESC = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Q&A about steroids appended to the FAQ page (sterydy/faq.json); EN->ES pairs go to the same memory file as the rest
const EXTRA = {};
function loadArticles() {
  const f = path.join(root, 'sterydy', 'articles.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}
function load() {
  const dir = path.join(root, 'sterydy');
  const rows = [];
  for (const f of fs.readdirSync(dir).filter(f => /^\d.*\.json$/.test(f)).sort()) rows.push(...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const mf = path.join(dir, 'mix.json');
  if (fs.existsSync(mf)) { const m = JSON.parse(fs.readFileSync(mf, 'utf8')); for (const e of rows) if (m[e.id]) e.mix = m[e.id]; }
  return rows;
}

// classes: name, description, legal and WADA defaults (an entry can override with its own `status` / `wada`)
const CLS = {
  inj: {
    name: { en: 'Injectable anabolic steroids', pl: 'Iniekcyjne steroidy anaboliczne', es: 'Esteroides anabólicos inyectables' },
    desc: { en: 'Testosterone and its relatives given by injection. A few are real medicines (testosterone replacement), others are veterinary products or old drugs that were withdrawn.', pl: 'Testosteron i jego pochodne podawane w iniekcji. Część to prawdziwe leki (terapia zastępcza testosteronem), reszta to preparaty weterynaryjne albo dawne leki, które wycofano.', es: 'Testosterona y sus derivados administrados por inyección. Algunos son medicamentos reales (terapia de reemplazo de testosterona); otros son productos veterinarios o fármacos antiguos retirados.' },
    status: { en: 'Anabolic steroids are controlled drugs: Class C in the UK and Schedule III in the US. Supplying them without authority is an offence in both countries, and having them without a prescription is a crime in the US.', pl: 'Steroidy anaboliczne to substancje kontrolowane: w Wielkiej Brytanii klasa C, w USA lista III. Dostarczanie ich bez uprawnień jest przestępstwem w obu krajach, a posiadanie bez recepty w USA również.', es: 'Los esteroides anabólicos son sustancias controladas: clase C en el Reino Unido y lista III en EE. UU. Suministrarlos sin autorización es delito en ambos países, y tenerlos sin receta es delito en EE. UU.' },
    wada: { en: 'WADA prohibits anabolic agents (category S1) at all times, in and out of competition.', pl: 'WADA zakazuje środków anabolicznych (kategoria S1) przez cały czas, w zawodach i poza nimi.', es: 'La AMA prohíbe los agentes anabólicos (categoría S1) en todo momento, dentro y fuera de competición.' }
  },
  oral: {
    name: { en: 'Oral anabolic steroids', pl: 'Doustne steroidy anaboliczne', es: 'Esteroides anabólicos orales' },
    desc: { en: 'Tablets and capsules. Most are chemically altered so they survive the liver, and that alteration is also why many of them are hard on it.', pl: 'Tabletki i kapsułki. Większość ma zmienioną budowę, żeby przetrwać przejście przez wątrobę, i właśnie dlatego wiele z nich ją obciąża.', es: 'Comprimidos y cápsulas. La mayoría están modificados químicamente para sobrevivir al hígado, y esa modificación es también la razón por la que muchos lo dañan.' },
    status: { en: 'Anabolic steroids are controlled drugs: Class C in the UK and Schedule III in the US. Supplying them without authority is an offence in both countries, and having them without a prescription is a crime in the US.', pl: 'Steroidy anaboliczne to substancje kontrolowane: w Wielkiej Brytanii klasa C, w USA lista III. Dostarczanie ich bez uprawnień jest przestępstwem w obu krajach, a posiadanie bez recepty w USA również.', es: 'Los esteroides anabólicos son sustancias controladas: clase C en el Reino Unido y lista III en EE. UU. Suministrarlos sin autorización es delito en ambos países, y tenerlos sin receta es delito en EE. UU.' },
    wada: { en: 'WADA prohibits anabolic agents (category S1) at all times, in and out of competition.', pl: 'WADA zakazuje środków anabolicznych (kategoria S1) przez cały czas, w zawodach i poza nimi.', es: 'La AMA prohíbe los agentes anabólicos (categoría S1) en todo momento, dentro y fuera de competición.' }
  },
  pro: {
    name: { en: 'Topical, prohormone and other hormonal drugs', pl: 'Preparaty miejscowe, prohormony i inne leki hormonalne', es: 'Preparados tópicos, prohormonas y otros fármacos hormonales' },
    desc: { en: 'Gels, precursors the body converts into hormones, and one menopause drug with anabolic activity. Different routes, same hormone system.', pl: 'Żele, prekursory, które organizm zamienia w hormony, i jeden lek menopauzalny o działaniu anabolicznym. Inne drogi podania, ten sam układ hormonalny.', es: 'Geles, precursores que el cuerpo convierte en hormonas y un fármaco para la menopausia con actividad anabólica. Vías distintas, el mismo sistema hormonal.' },
    status: { en: 'Status differs by product and country. Check the entry: some are prescription medicines, some are controlled, some are sold as supplements in one country and banned in another.', pl: 'Status zależy od preparatu i kraju. Sprawdź wpis: niektóre to leki na receptę, niektóre są kontrolowane, a niektóre sprzedaje się jako suplementy w jednym kraju i zakazuje w innym.', es: 'El estatus depende del producto y del país. Consulta la ficha: algunos son medicamentos con receta, otros están controlados y otros se venden como suplementos en un país y están prohibidos en otro.' },
    wada: { en: 'WADA lists these under anabolic agents (category S1), prohibited at all times.', pl: 'WADA wymienia je wśród środków anabolicznych (kategoria S1), zakazanych przez cały czas.', es: 'La AMA los incluye entre los agentes anabólicos (categoría S1), prohibidos en todo momento.' }
  },
  sarm: {
    name: { en: 'SARMs and related “research chemicals”', pl: 'SARM-y i pokrewne „research chemicals”', es: 'SARM y “productos de investigación” afines' },
    desc: { en: 'Selective androgen receptor modulators were designed to act on muscle and bone with fewer hormonal side effects than steroids. None has been approved, and regulators keep warning about products sold under these names.', pl: 'Selektywne modulatory receptora androgenowego miały działać na mięśnie i kości z mniejszą liczbą skutków hormonalnych niż steroidy. Żaden nie został zatwierdzony, a organy nadzoru stale ostrzegają przed produktami sprzedawanymi pod tymi nazwami.', es: 'Los moduladores selectivos de los receptores de andrógenos se diseñaron para actuar sobre músculo y hueso con menos efectos hormonales que los esteroides. Ninguno está aprobado, y los reguladores siguen advirtiendo sobre los productos que se venden con estos nombres.' },
    status: { en: 'Not approved as a medicine in the UK, the US or the EU. Being sold as a “research chemical” does not make it legal for human use, and regulators have warned about products that were mislabelled or contained something else.', pl: 'Nie jest zatwierdzony jako lek w Wielkiej Brytanii, USA ani UE. Sprzedaż jako „research chemical” nie czyni go legalnym do stosowania u ludzi, a organy nadzoru ostrzegały przed źle oznaczonymi produktami i takimi, które zawierały co innego.', es: 'No está aprobado como medicamento en el Reino Unido, EE. UU. ni la UE. Que se venda como “producto de investigación” no lo hace legal para uso humano, y los reguladores han advertido sobre productos mal etiquetados o que contenían otra sustancia.' },
    wada: { en: 'WADA prohibits SARMs (category S1, other anabolic agents) at all times.', pl: 'WADA zakazuje SARM-ów (kategoria S1, inne środki anaboliczne) przez cały czas.', es: 'La AMA prohíbe los SARM (categoría S1, otros agentes anabólicos) en todo momento.' }
  },
  oth: {
    name: { en: 'Other drugs sold alongside steroids', pl: 'Inne substancje sprzedawane obok steroidów', es: 'Otras sustancias que se venden junto a los esteroides' },
    desc: { en: 'Growth hormone, stimulants, fat burners and lab compounds that show up in the same circles. They are not steroids, and some of them are far more dangerous than the steroids themselves.', pl: 'Hormon wzrostu, stymulanty, spalacze tłuszczu i związki laboratoryjne, które pojawiają się w tych samych kręgach. To nie steroidy, a niektóre z nich są znacznie groźniejsze niż same steroidy.', es: 'Hormona del crecimiento, estimulantes, quemagrasas y compuestos de laboratorio que aparecen en los mismos círculos. No son esteroides, y algunos son mucho más peligrosos que los propios esteroides.' },
    status: { en: 'Status differs by substance: some are prescription medicines, some are unapproved, and at least one is banned for human consumption. Read the entry.', pl: 'Status zależy od substancji: część to leki na receptę, część nie jest zatwierdzona, a co najmniej jedna jest zakazana do spożycia przez ludzi. Przeczytaj wpis.', es: 'El estatus depende de la sustancia: algunas son medicamentos con receta, otras no están aprobadas y al menos una está prohibida para consumo humano. Lee la ficha.' },
    wada: { en: 'Most are prohibited in sport at all times, under categories such as S2, S3 and S4. Check the entry.', pl: 'Większość jest zakazana w sporcie przez cały czas, w kategoriach takich jak S2, S3 i S4. Sprawdź wpis.', es: 'La mayoría están prohibidas en el deporte en todo momento, en categorías como S2, S3 y S4. Consulta la ficha.' }
  },
  mod: {
    name: { en: 'Hormone-modulating medicines', pl: 'Leki modulujące gospodarkę hormonalną', es: 'Medicamentos moduladores hormonales' },
    desc: { en: 'Real prescription drugs for breast cancer, fertility and hormone disorders. They show up in the steroid world because they change oestrogen or the signals that drive testosterone, but they are not steroids.', pl: 'Prawdziwe leki na receptę stosowane w raku piersi, niepłodności i zaburzeniach hormonalnych. Pojawiają się w świecie steroidów, bo zmieniają poziom estrogenów albo sygnały sterujące testosteronem, ale steroidami nie są.', es: 'Medicamentos reales con receta para el cáncer de mama, la fertilidad y los trastornos hormonales. Aparecen en el mundo de los esteroides porque modifican los estrógenos o las señales que regulan la testosterona, pero no son esteroides.' },
    status: { en: 'Prescription-only medicines in the UK and the US. They are licensed for specific conditions, and using them for anything else is off-label and needs a doctor.', pl: 'Leki wydawane wyłącznie na receptę w Wielkiej Brytanii i USA. Są zarejestrowane do konkretnych chorób, a stosowanie ich w innym celu jest poza wskazaniami i wymaga lekarza.', es: 'Medicamentos solo con receta en el Reino Unido y EE. UU. Están autorizados para enfermedades concretas; cualquier otro uso es fuera de indicación y requiere un médico.' },
    wada: { en: 'WADA prohibits hormone and metabolic modulators (category S4) or peptide hormones (category S2) at all times, depending on the substance.', pl: 'WADA zakazuje modulatorów hormonów i metabolizmu (kategoria S4) albo hormonów peptydowych (kategoria S2) przez cały czas, zależnie od substancji.', es: 'La AMA prohíbe los moduladores hormonales y metabólicos (categoría S4) o las hormonas peptídicas (categoría S2) en todo momento, según la sustancia.' }
  },
  cort: {
    name: { en: 'Corticosteroids', pl: 'Kortykosteroidy', es: 'Corticosteroides' },
    desc: { en: 'The other family called “steroids”. They calm inflammation and the immune system and do not build muscle; they are a different class from anabolic steroids and are mixed up with them all the time.', pl: 'Druga rodzina nazywana „steroidami”. Hamują zapalenie i układ odpornościowy i nie budują mięśni; to inna klasa niż steroidy anaboliczne, którą ciągle się z nimi myli.', es: 'La otra familia a la que se llama “esteroides”. Calman la inflamación y el sistema inmunitario y no construyen músculo; son una clase distinta de los esteroides anabólicos y se confunden con ellos continuamente.' },
    status: { en: 'Prescription-only medicines in the UK and the US, widely used and not controlled drugs. The risks come from long or repeated use, so they are prescribed for a set purpose and time.', pl: 'Leki wydawane na receptę w Wielkiej Brytanii i USA, szeroko stosowane i niebędące substancjami kontrolowanymi. Ryzyko wynika z długiego lub powtarzanego stosowania, dlatego przepisuje się je na określony cel i czas.', es: 'Medicamentos con receta en el Reino Unido y EE. UU., de uso muy extendido y que no son sustancias controladas. Los riesgos vienen del uso largo o repetido, por eso se recetan para un fin y un tiempo concretos.' },
    wada: { en: 'WADA prohibits glucocorticoids in competition when taken by mouth, by injection or rectally (category S9); other routes are allowed.', pl: 'WADA zakazuje glikokortykosteroidów w zawodach, gdy są podawane doustnie, we wstrzyknięciu lub doodbytniczo (kategoria S9); inne drogi podania są dozwolone.', es: 'La AMA prohíbe los glucocorticoides en competición cuando se toman por vía oral, inyectable o rectal (categoría S9); las demás vías están permitidas.' }
  }
};
// Polish and Spanish spelling of the names (English name is the key)
const NAMES = {
  'Testosterone': ['Testosteron', 'Testosterona'], 'Testosterone cypionate': ['Cypionian testosteronu', 'Cipionato de testosterona'],
  'Testosterone enanthate': ['Enantan testosteronu', 'Enantato de testosterona'], 'Testosterone undecanoate': ['Undekanian testosteronu', 'Undecanoato de testosterona'],
  'Nandrolone decanoate': ['Dekanian nandrolonu', 'Decanoato de nandrolona'], 'Trenbolone': ['Trenbolon', 'Trembolona'], 'Boldenone': ['Boldenon', 'Boldenona'],
  'Drostanolone': ['Drostanolon', 'Drostanolona'], 'Methenolone enanthate': ['Enantan metenolonu', 'Enantato de metenolona']
};
// "what not to combine": a class default, replaced by an entry's own text from sterydy/mix.json (keyed by id)
const CLSMIX = {
  inj: { en: 'Anabolic steroids have not been tested in combination, and every extra hormone adds its own load on the heart, liver and hormone system. Do not combine them with other androgens, stimulants, or drugs that raise blood pressure or clotting risk, and tell every doctor and pharmacist what you take.', pl: 'Steroidy anaboliczne nie były badane w połączeniach, a każdy dodatkowy hormon dokłada własne obciążenie sercu, wątrobie i układowi hormonalnemu. Nie łącz ich z innymi androgenami, stymulantami ani lekami podnoszącymi ciśnienie lub ryzyko zakrzepów i powiedz każdemu lekarzowi i farmaceucie, co przyjmujesz.', es: 'Los esteroides anabólicos no se han probado en combinación, y cada hormona adicional suma su propia carga sobre el corazón, el hígado y el sistema hormonal. No los combines con otros andrógenos, estimulantes ni fármacos que suban la presión arterial o el riesgo de coágulos, e informa a todo médico y farmacéutico de lo que tomas.' },
  oral: { en: 'Do not combine with alcohol or with other drugs that strain the liver, including other oral steroids. Oral androgens of this kind can strengthen the effect of the blood thinner warfarin and raise the risk of bleeding, and they can change blood sugar control in people with diabetes.', pl: 'Nie łącz z alkoholem ani innymi lekami obciążającymi wątrobę, w tym innymi steroidami doustnymi. Doustne androgeny tego typu mogą nasilać działanie leku przeciwzakrzepowego warfaryny i zwiększać ryzyko krwawień, a także zmieniać kontrolę cukru we krwi u osób z cukrzycą.', es: 'No combinar con alcohol ni con otros fármacos que sobrecarguen el hígado, incluidos otros esteroides orales. Los andrógenos orales de este tipo pueden potenciar el efecto del anticoagulante warfarina y aumentar el riesgo de sangrado, y pueden alterar el control del azúcar en personas con diabetes.' },
  pro: { en: 'These products feed the same hormone system as steroids, so avoid stacking them with other hormones or steroids. Tell your doctor about any hormone treatment before starting something new.', pl: 'Te preparaty zasilają ten sam układ hormonalny co steroidy, więc unikaj łączenia ich z innymi hormonami lub steroidami. Przed rozpoczęciem czegoś nowego powiedz lekarzowi o każdej terapii hormonalnej.', es: 'Estos productos alimentan el mismo sistema hormonal que los esteroides, así que evita combinarlos con otras hormonas o esteroides. Informa a tu médico de cualquier tratamiento hormonal antes de empezar algo nuevo.' },
  sarm: { en: 'No combinations have been tested in people. Because these compounds can strain the liver and suppress testosterone, adding alcohol, steroids or other liver-toxic drugs only stacks the risks.', pl: 'Żadne połączenia nie były badane u ludzi. Ponieważ te związki mogą obciążać wątrobę i hamować testosteron, dodanie alkoholu, steroidów lub innych leków toksycznych dla wątroby tylko sumuje ryzyka.', es: 'No se ha probado ninguna combinación en personas. Como estos compuestos pueden sobrecargar el hígado y suprimir la testosterona, añadir alcohol, esteroides u otros fármacos tóxicos para el hígado solo suma riesgos.' },
  oth: { en: 'Check the interaction list on the label before combining with any other medicine, and avoid stacking with other stimulants or hormones. Tell a doctor or pharmacist about everything you take.', pl: 'Przed połączeniem z jakimkolwiek innym lekiem sprawdź listę interakcji w ulotce i unikaj łączenia z innymi stymulantami lub hormonami. Powiedz lekarzowi lub farmaceucie o wszystkim, co przyjmujesz.', es: 'Revisa la lista de interacciones del prospecto antes de combinarlo con cualquier otro medicamento y evita combinarlo con otros estimulantes u hormonas. Informa a un médico o farmacéutico de todo lo que tomas.' },
  mod: { en: 'These are prescription drugs with documented interactions. Do not combine them with oestrogen or other hormone products unless a doctor has prescribed that, and tell your doctor about every medicine and supplement you take.', pl: 'To leki na receptę z udokumentowanymi interakcjami. Nie łącz ich z estrogenami ani innymi preparatami hormonalnymi, jeśli nie zlecił tego lekarz, i powiedz lekarzowi o każdym leku i suplemencie, który przyjmujesz.', es: 'Son medicamentos con receta con interacciones documentadas. No los combines con estrógenos ni otros productos hormonales salvo que un médico lo haya indicado, e informa a tu médico de todo medicamento y suplemento que tomes.' },
  cort: { en: 'Combining a corticosteroid with anti-inflammatory painkillers such as ibuprofen raises the risk of stomach ulcers and bleeding. It can raise blood sugar and weaken the effect of diabetes medicines, and live vaccines are normally avoided during treatment.', pl: 'Łączenie kortykosteroidu z przeciwzapalnymi lekami przeciwbólowymi, takimi jak ibuprofen, zwiększa ryzyko wrzodów żołądka i krwawień. Może podnosić cukier i osłabiać działanie leków na cukrzycę, a szczepionek żywych zwykle unika się w trakcie leczenia.', es: 'Combinar un corticosteroide con antiinflamatorios como el ibuprofeno aumenta el riesgo de úlceras de estómago y sangrado. Puede subir el azúcar y debilitar el efecto de los medicamentos para la diabetes, y las vacunas vivas se evitan normalmente durante el tratamiento.' }
};
const nmL = (e, l) => l === 'en' ? e.n : ((e.nm && e.nm[l]) || (NAMES[e.n] || [])[l === 'pl' ? 0 : 1] || e.n);
const ORDER = ['inj', 'oral', 'pro', 'sarm', 'oth', 'mod', 'cort'];

// interface strings: [en, pl, es]
const UI = {
  nav: ['Steroids', 'Sterydy', 'Esteroides'],
  hubTitle: ['Steroids: what they are and what they do to the body', 'Sterydy: czym są i co robią z organizmem', 'Esteroides: qué son y qué le hacen al cuerpo'],
  hubLead: ['A reference to anabolic steroids and the drugs sold alongside them: what each one is, what it was made for, how it is regulated and what the evidence says about the risks. Education only, with no doses and no places to buy.', 'Przewodnik po steroidach anabolicznych i lekach sprzedawanych razem z nimi: czym jest każdy z nich, do czego powstał, jak jest regulowany i co mówią dowody o ryzyku. Wyłącznie edukacja, bez dawek i bez źródeł zakupu.', 'Una guía de los esteroides anabólicos y de los fármacos que se venden junto a ellos: qué es cada uno, para qué se creó, cómo está regulado y qué dicen las pruebas sobre los riesgos. Solo educación, sin dosis y sin sitios donde comprar.'],
  note: ['This section is information, not advice. We give no doses, no routes to buy and no instructions for use. Most of these drugs are controlled or prescription-only, and the safe way to any hormone treatment is a doctor.', 'Ta sekcja to informacja, nie porada. Nie podajemy dawek, miejsc zakupu ani instrukcji stosowania. Większość tych leków jest kontrolowana albo wydawana na receptę, a bezpieczna droga do leczenia hormonalnego prowadzi przez lekarza.', 'Esta sección es información, no consejo. No damos dosis, ni formas de comprar, ni instrucciones de uso. La mayoría de estos fármacos están controlados o requieren receta, y el camino seguro a cualquier tratamiento hormonal pasa por un médico.'],
  q1h: ['Two families, one name', 'Dwie rodziny, jedna nazwa', 'Dos familias, un solo nombre'],
  q1: ['“Steroid” means a molecule with a four-ring core. Anabolic steroids copy testosterone and build muscle; corticosteroids copy cortisol and calm inflammation. They are different drugs with different risks.', '„Steroid” to cząsteczka z czteropierścieniowym rdzeniem. Steroidy anaboliczne naśladują testosteron i budują mięśnie; kortykosteroidy naśladują kortyzol i hamują zapalenie. To różne leki o różnych zagrożeniach.', '“Esteroide” es una molécula con un núcleo de cuatro anillos. Los esteroides anabólicos imitan la testosterona y construyen músculo; los corticosteroides imitan el cortisol y calman la inflamación. Son fármacos distintos con riesgos distintos.'],
  q2h: ['Not the same as peptides', 'To nie to samo co peptydy', 'No son lo mismo que los péptidos'],
  q2: ['Peptides are short chains of amino acids. Steroids are fat-derived hormones. Some people lump them together because they appear in the same markets and the same banned lists.', 'Peptydy to krótkie łańcuchy aminokwasów. Steroidy to hormony pochodzące z tłuszczów. Część osób wrzuca je do jednego worka, bo trafiają na te same rynki i te same listy zakazanych substancji.', 'Los péptidos son cadenas cortas de aminoácidos. Los esteroides son hormonas derivadas de grasas. Hay quien los mezcla porque aparecen en los mismos mercados y en las mismas listas de sustancias prohibidas.'],
  q3h: ['Why the risks are real', 'Dlaczego ryzyko jest realne', 'Por qué los riesgos son reales'],
  q3: ['High, repeated use of anabolic steroids is linked to heart, liver, hormonal and mental-health problems. Medical doses given for a diagnosis are a different situation from doses taken for looks or sport.', 'Duże, powtarzane stosowanie steroidów anabolicznych wiąże się z problemami z sercem, wątrobą, hormonami i zdrowiem psychicznym. Dawki medyczne podawane przy rozpoznanej chorobie to inna sytuacja niż stosowanie dla wyglądu lub sportu.', 'El uso elevado y repetido de esteroides anabólicos se asocia con problemas cardíacos, hepáticos, hormonales y de salud mental. Las dosis médicas indicadas para un diagnóstico son una situación distinta de las que se toman por estética o deporte.'],
  cmpBtn: ['Compare all steroids', 'Porównaj wszystkie steroidy', 'Comparar todos los esteroides'],
  riskBtn: ['What steroids do to the body', 'Co steroidy robią z organizmem', 'Qué hacen los esteroides al cuerpo'],
  lawBtn: ['Steroids and the law', 'Steroidy a prawo', 'Los esteroides y la ley'],
  vsBtn: ['Steroids vs peptides', 'Steroidy a peptydy', 'Esteroides y péptidos'],
  allH: ['All entries', 'Wszystkie wpisy', 'Todas las fichas'],
  back: ['Steroids', 'Sterydy', 'Esteroides'],
  what: ['What it is', 'Czym jest', 'Qué es'],
  how: ['How it works', 'Jak działa', 'Cómo actúa'],
  med: ['Medical use', 'Zastosowanie medyczne', 'Uso médico'],
  mixH: ['What not to combine', 'Czego nie łączyć', 'Qué no combinar'],
  risk: ['Risks and side effects', 'Ryzyko i skutki uboczne', 'Riesgos y efectos secundarios'],
  legal: ['Legal status', 'Status prawny', 'Situación legal'],
  wadaH: ['Sport and anti-doping', 'Sport i antydoping', 'Deporte y antidopaje'],
  pros: ['Advantages', 'Zalety', 'Ventajas'],
  cons: ['Disadvantages', 'Wady', 'Desventajas'],
  srcs: ['Sources and further reading', 'Źródła i dalsza lektura', 'Fuentes y lecturas adicionales'],
  molCap: ['Chemical structure (PubChem)', 'Struktura chemiczna (PubChem)', 'Estructura química (PubChem)'],
  srcNote: ['These links open searches, not endorsements: a search result is not evidence on its own. We give no doses and no way to buy.', 'Te odnośniki otwierają wyszukiwania, a nie rekomendacje: wynik wyszukiwania sam w sobie nie jest dowodem. Nie podajemy dawek ani sposobu zakupu.', 'Estos enlaces abren búsquedas, no recomendaciones: un resultado de búsqueda no es una prueba por sí solo. No damos dosis ni formas de comprar.'],
  pubmed: ['PubMed: scientific publications', 'PubMed: publikacje naukowe', 'PubMed: publicaciones científicas'],
  daily: ['DailyMed: drug label', 'DailyMed: etykieta leku', 'DailyMed: etiqueta del medicamento'],
  trials: ['ClinicalTrials.gov: registered clinical trials', 'ClinicalTrials.gov: zarejestrowane badania kliniczne', 'ClinicalTrials.gov: ensayos clínicos registrados'],
  wadaList: ['WADA: Prohibited List', 'WADA: Lista substancji zabronionych', 'AMA: Lista de sustancias prohibidas'],
  related: ['Same group', 'Z tej samej grupy', 'Del mismo grupo'],
  errp: ['Report an error', 'Zgłoś błąd', 'Informar de un error'],
  form: { inj: ['Injectable', 'Iniekcyjny', 'Inyectable'], oral: ['Oral', 'Doustny', 'Oral'], top: ['Topical', 'Miejscowy', 'Tópico'], mix: ['Several forms', 'Kilka postaci', 'Varias formas'] },
  colName: ['Name', 'Nazwa', 'Nombre'], colClass: ['Group', 'Grupa', 'Grupo'], colForm: ['Form', 'Postać', 'Forma'],
  colUp: ['Main advantage', 'Główna zaleta', 'Ventaja principal'], colDown: ['Main disadvantage', 'Główna wada', 'Desventaja principal'],
  cmpTitle: ['Steroids compared: advantages and disadvantages', 'Steroidy porównane: zalety i wady', 'Esteroides comparados: ventajas y desventajas'],
  cmpLead: ['One row per compound: its group, form, the best thing it has going for it and the biggest drawback. Read the full entry before drawing a conclusion, because a single line cannot carry the whole picture.', 'Jeden wiersz na substancję: grupa, postać, największa zaleta i największa wada. Przeczytaj pełny wpis, zanim wyciągniesz wnioski, bo jedna linijka nie oddaje całego obrazu.', 'Una fila por sustancia: su grupo, su forma, lo mejor que tiene a su favor y su mayor inconveniente. Lee la ficha completa antes de sacar conclusiones, porque una sola línea no recoge todo el panorama.'],
  vsTitle: ['Steroids vs peptides: what is the difference?', 'Steroidy a peptydy: jaka jest różnica?', 'Esteroides y péptidos: ¿cuál es la diferencia?'],
  vsKick: ['Explainer', 'Wyjaśnienie', 'Explicación']
};
const i3 = l => ({ en: 0, pl: 1, es: 2 }[l]);
const U = (k, l) => UI[k][{ en: 0, pl: 1, es: 2 }[l]];

// the vs-peptides article: rows of [aspect, steroids, peptides] and the pros/cons lists
const VS = {
  intro: [
    ['“Are peptides steroids?” is one of the most common questions we get, and the answer is no. They are different kinds of molecule, they act through different routes, and they are regulated differently. They get mixed up because they share markets, forums and banned lists.', '„Czy peptydy to steroidy?” to jedno z najczęstszych pytań, jakie dostajemy, i odpowiedź brzmi: nie. To różne rodzaje cząsteczek, działają innymi drogami i są inaczej regulowane. Mylą się, bo mają wspólne rynki, fora i listy zakazanych substancji.', '“¿Los péptidos son esteroides?” es una de las preguntas más frecuentes que recibimos, y la respuesta es no. Son tipos de molécula distintos, actúan por vías distintas y se regulan de forma distinta. Se confunden porque comparten mercados, foros y listas de sustancias prohibidas.'],
    ['Being injected does not make something a steroid. Insulin and semaglutide are injected peptides, and neither is a steroid. What matters is the molecule and what it does inside the body.', 'To, że coś się wstrzykuje, nie czyni z tego steroidu. Insulina i semaglutyd to peptydy podawane w iniekcji i żaden z nich nie jest steroidem. Liczy się cząsteczka i to, co robi w organizmie.', 'Que algo se inyecte no lo convierte en esteroide. La insulina y la semaglutida son péptidos inyectados y ninguna es un esteroide. Lo que importa es la molécula y lo que hace dentro del cuerpo.']
  ],
  rows: [
    [['Chemistry', 'Budowa', 'Estructura química'], ['A fat-derived molecule with a four-ring core, made from cholesterol.', 'Cząsteczka pochodząca z tłuszczów, z czteropierścieniowym rdzeniem, wytwarzana z cholesterolu.', 'Una molécula derivada de grasas con un núcleo de cuatro anillos, fabricada a partir del colesterol.'], ['A short chain of amino acids, like a small protein.', 'Krótki łańcuch aminokwasów, jak małe białko.', 'Una cadena corta de aminoácidos, como una proteína pequeña.']],
    [['How it acts', 'Jak działa', 'Cómo actúa'], ['Passes into cells and switches genes on through hormone receptors inside them.', 'Wnika do komórek i włącza geny przez receptory hormonalne wewnątrz nich.', 'Entra en las células y activa genes mediante receptores hormonales internos.'], ['Binds a receptor on the cell surface and sends a signal inward.', 'Wiąże się z receptorem na powierzchni komórki i wysyła sygnał do wnętrza.', 'Se une a un receptor de la superficie de la célula y envía una señal hacia el interior.']],
    [['Taken by mouth?', 'Czy działa doustnie?', '¿Se puede tomar por vía oral?'], ['Often yes, because many steroids survive digestion, sometimes at a cost to the liver.', 'Często tak, bo wiele steroidów przeżywa trawienie, czasem kosztem wątroby.', 'A menudo sí, porque muchos esteroides sobreviven a la digestión, a veces a costa del hígado.'], ['Usually no, because digestion breaks peptides down, so most are injected.', 'Zwykle nie, bo trawienie rozkłada peptydy, więc większość podaje się w iniekcji.', 'Normalmente no, porque la digestión descompone los péptidos, así que la mayoría se inyecta.']],
    [['Best-known medical uses', 'Najlepiej znane zastosowania medyczne', 'Usos médicos más conocidos'], ['Testosterone replacement, delayed puberty, some anaemias and muscle loss in illness.', 'Terapia zastępcza testosteronem, opóźnione dojrzewanie, niektóre niedokrwistości i utrata mięśni w chorobie.', 'Reemplazo de testosterona, pubertad retrasada, algunas anemias y pérdida de músculo en enfermedades.'], ['Diabetes, obesity, osteoporosis, fertility treatment and growth disorders.', 'Cukrzyca, otyłość, osteoporoza, leczenie niepłodności i zaburzenia wzrastania.', 'Diabetes, obesidad, osteoporosis, tratamientos de fertilidad y trastornos del crecimiento.']],
    [['Regulation', 'Regulacja', 'Regulación'], ['Anabolic steroids are controlled drugs (Class C in the UK, Schedule III in the US).', 'Steroidy anaboliczne to substancje kontrolowane (klasa C w Wielkiej Brytanii, lista III w USA).', 'Los esteroides anabólicos son sustancias controladas (clase C en el Reino Unido, lista III en EE. UU.).'], ['Approved peptide drugs are prescription medicines. Unapproved “research” peptides sit in a grey zone and are not licensed for human use.', 'Zatwierdzone leki peptydowe to leki na receptę. „Research” peptydy bez zatwierdzenia są w szarej strefie i nie mają zgody na stosowanie u ludzi.', 'Los péptidos aprobados son medicamentos con receta. Los péptidos “de investigación” sin aprobar están en una zona gris y no tienen licencia para uso humano.']],
    [['Evidence for the “gym” uses', 'Dowody dla zastosowań „na siłownię”', 'Pruebas de los usos “de gimnasio”'], ['Large, well documented effect on muscle, and a long record of harm at high doses.', 'Duży, dobrze udokumentowany wpływ na mięśnie i długa historia szkód przy wysokich dawkach.', 'Efecto grande y bien documentado sobre el músculo, y un largo historial de daños con dosis altas.'], ['Mostly thin or animal-only for the unapproved ones, so both benefit and harm are largely unknown.', 'W przypadku niezatwierdzonych głównie skąpe albo tylko zwierzęce, więc zarówno korzyści, jak i szkody są w dużej mierze nieznane.', 'En los no aprobados es sobre todo escasa o solo animal, así que tanto el beneficio como el daño se desconocen en gran medida.']],
    [['Anti-doping', 'Antydoping', 'Antidopaje'], ['Anabolic agents, category S1, prohibited at all times.', 'Środki anaboliczne, kategoria S1, zakazane przez cały czas.', 'Agentes anabólicos, categoría S1, prohibidos en todo momento.'], ['Peptide hormones and growth factors, category S2, and some are in other categories. Prohibited at all times.', 'Hormony peptydowe i czynniki wzrostu, kategoria S2, a niektóre w innych kategoriach. Zakazane przez cały czas.', 'Hormonas peptídicas y factores de crecimiento, categoría S2, y algunas en otras categorías. Prohibidos en todo momento.']]
  ],
  rowH: [['Aspect', 'Aspekt', 'Aspecto'], ['Steroids', 'Steroidy', 'Esteroides'], ['Peptides', 'Peptydy', 'Péptidos']],
  proS: [['Well understood: decades of data on what they do and what they cost.', 'Dobrze poznane: dziesięciolecia danych o tym, co robią i ile kosztują.', 'Bien conocidos: décadas de datos sobre lo que hacen y lo que cuestan.'], ['Some are proven medicines, such as testosterone replacement for a diagnosed deficiency.', 'Niektóre to sprawdzone leki, jak terapia zastępcza testosteronem przy rozpoznanym niedoborze.', 'Algunos son medicamentos probados, como el reemplazo de testosterona en una deficiencia diagnosticada.'], ['Many can be taken by mouth.', 'Wiele można przyjmować doustnie.', 'Muchos pueden tomarse por vía oral.']],
  conS: [['Wide range of hormonal, heart, liver and mental-health risks at high or repeated use.', 'Szeroki wachlarz ryzyk hormonalnych, sercowych, wątrobowych i psychicznych przy dużym lub powtarzanym stosowaniu.', 'Un amplio abanico de riesgos hormonales, cardíacos, hepáticos y de salud mental con uso elevado o repetido.'], ['Switch off the body’s own hormone production, and recovery can be slow or incomplete.', 'Wyłączają własną produkcję hormonów w organizmie, a powrót do normy bywa wolny albo niepełny.', 'Apagan la producción hormonal propia del cuerpo y la recuperación puede ser lenta o incompleta.'], ['Controlled drugs, with legal consequences for supply and, in some countries, possession.', 'Substancje kontrolowane, z konsekwencjami prawnymi za dostarczanie, a w niektórych krajach i za posiadanie.', 'Sustancias controladas, con consecuencias legales por el suministro y, en algunos países, por la posesión.']],
  proP: [['Approved peptide drugs have large trials behind them, for diabetes, obesity and more.', 'Zatwierdzone leki peptydowe mają za sobą duże badania, w cukrzycy, otyłości i nie tylko.', 'Los péptidos aprobados cuentan con grandes ensayos, en diabetes, obesidad y más.'], ['They usually act on one specific signal, so effects are easier to explain.', 'Zwykle działają na jeden konkretny sygnał, więc skutki łatwiej wyjaśnić.', 'Suelen actuar sobre una señal concreta, así que sus efectos son más fáciles de explicar.'], ['Most are not controlled drugs, and approved ones are available through a doctor.', 'Większość nie jest substancjami kontrolowanymi, a zatwierdzone są dostępne przez lekarza.', 'La mayoría no son sustancias controladas, y los aprobados se obtienen a través de un médico.']],
  conP: [['Most “research” peptides have no human safety data at all.', 'Większość peptydów „research” nie ma żadnych danych o bezpieczeństwie u ludzi.', 'La mayoría de los péptidos “de investigación” no tiene ningún dato de seguridad en humanos.'], ['Almost all need injection, and products of unknown purity are a risk of their own.', 'Prawie wszystkie wymagają iniekcji, a produkty o nieznanej czystości to osobne ryzyko.', 'Casi todos requieren inyección, y los productos de pureza desconocida son un riesgo en sí mismos.'], ['Being unregulated is not the same as being safe.', 'Brak regulacji to nie to samo co bezpieczeństwo.', 'Que algo no esté regulado no significa que sea seguro.']],
  qH: ['Common mix-ups', 'Częste pomyłki', 'Confusiones frecuentes'],
  qa: [
    [['Do peptides have fewer risks than steroids?', 'Czy peptydy mają mniej ryzyka niż steroidy?', '¿Los péptidos tienen menos riesgos que los esteroides?'], ['Not by default. For steroids the risks are well mapped. For unapproved peptides they are mostly unmapped, and “we do not know” is not the same as “safe”.', 'Nie z założenia. Przy steroidach ryzyko jest dobrze opisane. Przy niezatwierdzonych peptydach jest w większości nieopisane, a „nie wiemy” to nie to samo co „bezpieczne”.', 'No por defecto. En los esteroides los riesgos están bien documentados. En los péptidos sin aprobar casi no lo están, y “no lo sabemos” no es lo mismo que “seguro”.']],
    [['Is semaglutide a steroid?', 'Czy semaglutyd to steroid?', '¿La semaglutida es un esteroide?'], ['No. It is a peptide drug that copies the gut hormone GLP-1. It has nothing to do with testosterone or muscle building.', 'Nie. To lek peptydowy naśladujący hormon jelitowy GLP-1. Nie ma nic wspólnego z testosteronem ani budowaniem mięśni.', 'No. Es un fármaco peptídico que imita la hormona intestinal GLP-1. No tiene nada que ver con la testosterona ni con ganar músculo.']],
    [['Are SARMs steroids?', 'Czy SARM-y to steroidy?', '¿Los SARM son esteroides?'], ['No, they are a separate class of small molecules designed to hit androgen receptors more selectively. They are not approved as medicines, and regulators warn about them.', 'Nie, to osobna klasa małych cząsteczek zaprojektowanych tak, by selektywniej działać na receptory androgenowe. Nie są zatwierdzone jako leki, a organy nadzoru przed nimi ostrzegają.', 'No, son una clase aparte de moléculas pequeñas diseñadas para actuar de forma más selectiva sobre los receptores de andrógenos. No están aprobados como medicamentos y los reguladores advierten sobre ellos.']],
    [['Are prednisone and dexamethasone the same as anabolic steroids?', 'Czy prednizon i deksametazon to to samo co steroidy anaboliczne?', '¿La prednisona y la dexametasona son lo mismo que los esteroides anabólicos?'], ['No. They are corticosteroids that calm inflammation and do not build muscle. Long use brings its own risks, such as weaker bones and higher blood sugar.', 'Nie. To kortykosteroidy, które hamują zapalenie i nie budują mięśni. Długie stosowanie niesie własne ryzyko, jak osłabienie kości i wyższy cukier we krwi.', 'No. Son corticosteroides que calman la inflamación y no construyen músculo. El uso prolongado tiene sus propios riesgos, como huesos más débiles y azúcar en sangre más alta.']]
  ]
};

module.exports = function build(ctx) {
  const { layout, esc, BASE, ARROW, clip, out, LANGS, SITE } = ctx;
  const data = load();
  const ARTS = loadArticles();
  const PAIRS = {};
  // fn(l) -> the text in language l; records EN->ES for tools/es.js and returns the text for the page being built
  const S = (L, fn) => { const en = fn('en'), es = fn('es'); if (en && es) PAIRS[norm(ESC(en))] = ESC(es); return L === 'pl' ? plFix(fn(L)) : fn(L); };
  const u = (L, k) => S(L, l => U(k, l));
  const tx = (L, o) => S(L, l => o[l]);           // o = {en,pl,es}
  const txA = (L, a) => S(L, l => a[{ en: 0, pl: 1, es: 2 }[l]]);   // a = [en, pl, es]
  const list = (L, o) => (o.en || []).map((_, i) => S(L, l => (o[l] || [])[i]));
  const first = s => { const m = /^(.+?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; };
  const sid = e => 's-' + e.id;
  // display name per language (EN name is the key; PL and ES spelling from NAMES when it differs)
  const nameOf = (L, e) => S(L, l => nmL(e, l));
  const altOf = (L, e) => e.alt ? tx(L, e.alt) : '';
  const url = (L, f) => `${BASE}${L}/${f}`;
  const formLab = (L, e) => u0(L, UI.form[e.form || 'inj']);
  const u0 = (L, a) => S(L, l => a[{ en: 0, pl: 1, es: 2 }[l]]);

  function sources(e, L) {
    const q = encodeURIComponent(e.q || e.n);
    const rows = [[UI.pubmed, 'https://pubmed.ncbi.nlm.nih.gov/?term=' + q], [UI.trials, 'https://clinicaltrials.gov/search?term=' + q]];
    if (e.label !== false) rows.splice(1, 0, [UI.daily, 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=' + q]);
    rows.push([UI.wadaList, 'https://www.wada-ama.org/en/prohibited-list']);
    return `<section class="blk reveal"><h2 class="kick">${esc(u(L, 'srcs'))}</h2><ul class="srcs-list">${rows.map(([lab, h]) => `<li><a href="${esc(h)}" rel="nofollow noopener" target="_blank">${esc(u0(L, lab))}</a></li>`).join('')}</ul><p class="small muted">${esc(u(L, 'srcNote'))}</p></section>`;
  }

  function cardPage(e, L) {
    const c = CLS[e.cls], sibs = data.filter(x => x.cls === e.cls && x.id !== e.id).slice(0, 4);
    const sec = (h, b) => b ? `<section class="blk reveal"><h2 class="kick">${esc(u(L, h))}</h2><p>${esc(b)}</p></section>` : '';
    const pros = list(L, e.pros), cons = list(L, e.cons);
    const status = e.status ? tx(L, e.status) : tx(L, c.status), wada = e.wada ? tx(L, e.wada) : tx(L, c.wada);
    const name = nameOf(L, e), clsName = tx(L, c.name);
    const lead = tx(L, e.what);
    const body = `
<article class="card-page">
  <div class="wrap">
    <p class="crumbs reveal"><a href="${url(L, 'steroids.html')}">${esc(u(L, 'back'))}</a> › <span>${esc(name)}</span></p>
    <div class="card-head"><div>
      <h1 class="display reveal">${esc(name)}</h1>
      ${e.alt ? `<p class="sub reveal">${esc(altOf(L, e))}</p>` : ''}
      <p class="pills reveal"><span class="pill neutral">${esc(clsName)}</span><span class="pill">${esc(formLab(L, e))}</span></p>
    </div>
    ${fs.existsSync(path.join(root, 'mol', e.id + '.png')) ? `<aside class="mol reveal"><img src="/mol/${e.id}.png" width="240" height="240" loading="lazy" alt="${esc(S(L, l => (l === 'en' ? 'Chemical structure of ' : l === 'pl' ? 'Struktura chemiczna: ' : 'Estructura química de ') + nmL(e, l)))}"><p class="small muted">${esc(u(L, 'molCap'))}</p></aside>` : ''}
    </div>
    <section class="blk note reveal"><p>${esc(u(L, 'note'))}</p></section>
    ${sec('what', lead)}${sec('how', e.how && tx(L, e.how))}${sec('med', e.med && tx(L, e.med))}${sec('risk', e.risk && tx(L, e.risk))}${sec('mixH', tx(L, e.mix || CLSMIX[e.cls]))}
    ${sec('legal', status)}${sec('wadaH', wada)}
    <section class="blk reveal pcgrid"><div class="pc"><h2 class="kick">${esc(u(L, 'pros'))}</h2><ul class="srcs-list">${pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="pc"><h2 class="kick">${esc(u(L, 'cons'))}</h2><ul class="srcs-list">${cons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></section>
    ${sources(e, L)}
    <p class="small muted reveal"><a href="${url(L, 'about.html')}#corrections">${esc(u(L, 'errp'))}</a></p>
    <p class="actions reveal"><a class="btn big" href="${url(L, 'steroids-compare.html')}">${esc(u(L, 'cmpBtn'))}${ARROW}</a> <a class="btn ghost big" href="${url(L, 'steroids-vs-peptides.html')}">${esc(u(L, 'vsBtn'))}</a> <a class="btn ghost big" href="${url(L, 'steroids-risks.html')}">${esc(u(L, 'riskBtn'))}</a> <a class="btn ghost big" href="${url(L, 'steroids-law.html')}">${esc(u(L, 'lawBtn'))}</a></p>
    ${sibs.length ? `<section class="blk reveal"><h2 class="kick">${esc(u(L, 'related'))}</h2><div class="grid-cards">${sibs.map(s => tile(s, L)).join('')}</div></section>` : ''}
  </div>
</article>`;
    return layout({
      lang: L, here: 't/' + sid(e) + '.html', twin: 't/' + sid(e) + '.html', body,
      title: S(L, l => `${nmL(e, l)} — ${CLS[e.cls].name[l]} | PepSafe`),
      desc: S(L, l => clip(`${nmL(e, l)}: ${first(e.what[l])}`, 155))
    });
  }

  function tile(e, L) {
    return `
    <a class="card tile reveal piece" href="${url(L, 't/' + sid(e) + '.html')}">
      <span><em class="kick">${esc(formLab(L, e))}</em><b>${esc(nameOf(L, e))}</b>
      <em>${esc(S(L, l => first(e.what[l])))}</em></span>${ARROW}</a>`;
  }

  function hub(L) {
    const fact = (h, b) => `<article class="tile glass reveal"><h2 class="gtitle sm">${esc(u(L, h))}</h2><p class="small ink2">${esc(u(L, b))}</p></article>`;
    const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(u(L, 'nav'))}</p>
    <h1 class="display reveal">${esc(u(L, 'hubTitle'))}</h1>
    <p class="lede reveal">${esc(u(L, 'hubLead'))}</p>
    <p class="actions reveal"><a class="btn big" href="${url(L, 'steroids-compare.html')}">${esc(u(L, 'cmpBtn'))}${ARROW}</a> <a class="btn ghost big" href="${url(L, 'steroids-vs-peptides.html')}">${esc(u(L, 'vsBtn'))}</a></p>
  </div>
</section>
<section><div class="wrap">
  <section class="blk note reveal"><p>${esc(u(L, 'note'))}</p></section>
  <div class="grid-cards">${fact('q1h', 'q1')}${fact('q2h', 'q2')}${fact('q3h', 'q3')}</div>
  ${ARTS.length ? `<div class="grid-cards" style="margin-top:22px">${ARTS.map(a => `
    <a class="card tile reveal piece" href="${url(L, 'steroids-' + a.id + '.html')}">
      <span><em class="kick">${esc(u(L, 'vsKick'))}</em><b>${esc(tx(L, a.title))}</b>
      <em>${esc(S(L, l => first(a.lead[l])))}</em></span>${ARROW}</a>`).join('')}</div>` : ''}
</div></section>
${ORDER.map(k => { const rows = data.filter(e => e.cls === k); if (!rows.length) return ''; return `
<section class="band" id="${k}"><div class="wrap">
  <p class="kick reveal">${esc(tx(L, CLS[k].name))}</p>
  <p class="lede reveal">${esc(tx(L, CLS[k].desc))}</p>
  <div class="grid-cards">${rows.map(e => tile(e, L)).join('')}</div>
</div></section>`; }).join('')}`;
    return layout({ lang: L, here: 'steroids.html', twin: 'steroids.html', body, title: S(L, l => U('hubTitle', l) + ' | PepSafe'), desc: S(L, l => clip(U('hubLead', l), 155)) });
  }

  function compare(L) {
    const rows = data.map(e => `<tr><td><a href="${url(L, 't/' + sid(e) + '.html')}">${esc(nameOf(L, e))}</a></td><td>${esc(tx(L, CLS[e.cls].name))}</td><td>${esc(formLab(L, e))}</td><td>${esc(list(L, e.pros)[0])}</td><td>${esc(list(L, e.cons)[0])}</td></tr>`).join('');
    const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap">
    <p class="kick reveal">${esc(u(L, 'nav'))}</p>
    <h1 class="display reveal">${esc(u(L, 'cmpTitle'))}</h1>
    <p class="lede reveal">${esc(u(L, 'cmpLead'))}</p>
  </div>
</section>
<section><div class="wrap">
  <section class="blk note reveal"><p>${esc(u(L, 'note'))}</p></section>
  <div class="tablewrap reveal"><table class="cmp"><thead><tr><th>${esc(u(L, 'colName'))}</th><th>${esc(u(L, 'colClass'))}</th><th>${esc(u(L, 'colForm'))}</th><th>${esc(u(L, 'colUp'))}</th><th>${esc(u(L, 'colDown'))}</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="actions reveal"><a class="btn big" href="${url(L, 'steroids.html')}">${esc(u(L, 'back'))}${ARROW}</a> <a class="btn ghost big" href="${url(L, 'steroids-vs-peptides.html')}">${esc(u(L, 'vsBtn'))}</a></p>
</div></section>`;
    return layout({ lang: L, here: 'steroids-compare.html', twin: 'steroids-compare.html', body, title: S(L, l => U('cmpTitle', l) + ' | PepSafe'), desc: S(L, l => clip(U('cmpLead', l), 155)) });
  }

  function vs(L) {
    const row = r => `<tr><th scope="row">${esc(txA(L, r[0]))}</th><td>${esc(txA(L, r[1]))}</td><td>${esc(txA(L, r[2]))}</td></tr>`;
    const ul = a => `<ul class="srcs-list">${a.map(x => `<li>${esc(txA(L, x))}</li>`).join('')}</ul>`;
    const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${esc(u(L, 'vsKick'))}</p>
    <h1 class="display reveal">${esc(u(L, 'vsTitle'))}</h1>
  </div>
</section>
<section><div class="wrap narrow">
  ${VS.intro.map(p => `<p class="lead reveal">${esc(txA(L, p))}</p>`).join('\n  ')}
  <div class="tablewrap reveal"><table class="cmp"><thead><tr>${VS.rowH.map(h => `<th>${esc(txA(L, h))}</th>`).join('')}</tr></thead><tbody>${VS.rows.map(row).join('')}</tbody></table></div>
  <div class="pcgrid reveal">
    <div class="pc"><h2 class="kick">${esc(S(L, l => VS.rowH[1][i3(l)] + ': ' + U('pros', l)))}</h2>${ul(VS.proS)}<h2 class="kick">${esc(S(L, l => VS.rowH[1][i3(l)] + ': ' + U('cons', l)))}</h2>${ul(VS.conS)}</div>
    <div class="pc"><h2 class="kick">${esc(S(L, l => VS.rowH[2][i3(l)] + ': ' + U('pros', l)))}</h2>${ul(VS.proP)}<h2 class="kick">${esc(S(L, l => VS.rowH[2][i3(l)] + ': ' + U('cons', l)))}</h2>${ul(VS.conP)}</div>
  </div>
  <section class="blk reveal"><h2 class="kick">${esc(txA(L, VS.qH))}</h2>${VS.qa.map(([q, a]) => `<details class="qa"><summary>${esc(txA(L, q))}</summary><p>${esc(txA(L, a))}</p></details>`).join('')}</section>
  <section class="blk note reveal"><p>${esc(u(L, 'note'))}</p></section>
  <p class="actions reveal"><a class="btn big" href="${url(L, 'steroids.html')}">${esc(u(L, 'back'))}${ARROW}</a> <a class="btn ghost big" href="${url(L, 'steroids-compare.html')}">${esc(u(L, 'cmpBtn'))}</a> <a class="btn ghost big" href="${url(L, 'catalog.html')}">${L === 'en' ? 'Peptide catalogue' : 'Katalog peptydów'}</a></p>
</div></section>`;
    return layout({ lang: L, here: 'steroids-vs-peptides.html', twin: 'steroids-vs-peptides.html', body, title: S(L, l => U('vsTitle', l) + ' | PepSafe'), desc: S(L, l => clip(VS.intro[0][{ en: 0, pl: 1, es: 2 }[l]], 155)) });
  }

  function article(a, L) {
    const body = `
<section class="page-head paper">
  <canvas id="chains" aria-hidden="true"></canvas>
  <div class="wrap narrow">
    <p class="kick reveal">${esc(u(L, 'vsKick'))}</p>
    <h1 class="display reveal">${esc(tx(L, a.title))}</h1>
  </div>
</section>
<section><div class="wrap narrow">
  <p class="lead reveal">${esc(tx(L, a.lead))}</p>
  ${a.sections.map(sc => `<section class="blk reveal"><h2 class="kick">${esc(tx(L, sc.h))}</h2>${(sc.p.en || []).map((_, i) => `<p>${esc(S(L, l => sc.p[l][i]))}</p>`).join('')}</section>`).join('\n  ')}
  <section class="blk note reveal"><p>${esc(u(L, 'note'))}</p></section>
  <p class="actions reveal"><a class="btn big" href="${url(L, 'steroids.html')}">${esc(u(L, 'back'))}${ARROW}</a> <a class="btn ghost big" href="${url(L, 'steroids-compare.html')}">${esc(u(L, 'cmpBtn'))}</a></p>
</div></section>`;
    return layout({ lang: L, here: 'steroids-' + a.id + '.html', twin: 'steroids-' + a.id + '.html', body, title: S(L, l => a.title[l] + ' | PepSafe'), desc: S(L, l => clip(a.lead[l], 155)) });
  }

  const pages = [];
  for (const L of LANGS) {
    const dir = path.join(out, L);
    fs.mkdirSync(path.join(dir, 't'), { recursive: true });
    const put = (f, h) => { fs.writeFileSync(path.join(dir, f), h); pages.push(L + '/' + f); };
    for (const a of ARTS) put('steroids-' + a.id + '.html', article(a, L));
    put('steroids.html', hub(L)); put('steroids-compare.html', compare(L)); put('steroids-vs-peptides.html', vs(L));
    for (const e of data) put('t/' + sid(e) + '.html', cardPage(e, L));
  }
  // Spanish needs the catalogue link label too
  PAIRS[norm('Peptide catalogue')] = 'Catálogo de péptidos';
  Object.assign(PAIRS, EXTRA);
  fs.writeFileSync(path.join(__dirname, 'sterydy-tm.json'), JSON.stringify(PAIRS));
  console.log(`sterydy: ${data.length} wpisow, ${pages.length} stron`);
  return pages;
};
module.exports.navLabel = UI.nav;
// rows for the magnifier list (window.PEP.extra): steroids searchable by their English, Polish and Spanish names
// first sentence of a field, with its EN->ES pair noted for the Spanish data file
const fs1 = (o, L) => { if (!o) return ''; const f = x => { const m = /^(.+?[.!?])(\s|$)/.exec(x); return m ? m[1] : x; }; const en = f(o.en), es = f(o.es); EXTRA[norm(ESC(en))] = ESC(es); return L === 'pl' ? plFix(f(o.pl)) : f(o[L]); };
module.exports.finder = function (L) {
  const i = { en: 0, pl: 1, es: 2 }[L], low = x => String(x || '').toLowerCase();
  return load().map(e => ({
    ev: fs1(e.med, L), w: fs1(e.risk, L),
    sy: [e.risk].concat(((e.cons || {}).en || []).map((_, k) => ({ en: e.cons.en[k], pl: e.cons.pl[k], es: e.cons.es[k] }))).map(o => { if (!o) return ''; if (o.en && o.es) EXTRA[norm(ESC(o.en))] = ESC(o.es); return L === 'pl' ? plFix(o.pl) : o[L]; }).join(' '),
    s: 's-' + e.id, x: 1, n: nmL(e, L), c: L === 'pl' ? plFix(CLS[e.cls].name[L]) : CLS[e.cls].name[L], st: UI.form[e.form || 'inj'][i],
    t: low(['en', 'pl', 'es'].map(l => nmL(e, l) + ' ' + (e.alt ? e.alt[l] : '') + ' ' + e.what[l].split('. ')[0]).join(' ') + ' ' + CLS[e.cls].name.en + ' steroid steryd sterydy esteroides')
  }));
};
module.exports.faqItems = function (L) {
  const f = path.join(root, 'sterydy', 'faq.json'); if (!fs.existsSync(f)) return [];
  const pair = (o) => { if (o.en && o.es) EXTRA[norm(ESC(o.en))] = ESC(o.es); return L === 'pl' ? plFix(o.pl) : o[L]; };
  return JSON.parse(fs.readFileSync(f, 'utf8')).map(x => [pair(x.q), pair(x.a)]);
};
