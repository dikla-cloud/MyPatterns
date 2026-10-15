/* MyPatterns – יצירת דוגמאות: הוראות כתובות, תרשים סמלים ומוזאיק קרושה.
   הקובץ נטען רק כשנכנסים ללשונית "יצירת דוגמה". */
'use strict';
(() => {
  /* ---------------- תרגומים ---------------- */
  // סדר השפות: he, en, ru, ar, de, es, it, fr
  const ORDER = ['he', 'en', 'ru', 'ar', 'de', 'es', 'it', 'fr'];
  const TR = {
    stHomeTitle: ['מה רוצים ליצור?', 'What would you like to create?', 'Что создадим?', 'ماذا تريد أن تنشئ؟', 'Was möchtest du erstellen?', '¿Qué quieres crear?', 'Cosa vuoi creare?', 'Que voulez-vous créer ?'],
    stSaveTo: ['יישמר בתיקייה: {name}', 'Will be saved in: {name}', 'Сохранится в папке: {name}', 'سيُحفظ في: {name}', 'Wird gespeichert in: {name}', 'Se guardará en: {name}', 'Verrà salvato in: {name}', 'Sera enregistré dans : {name}'],
    stWritten: ['הוראות כתובות', 'Written pattern', 'Текстовое описание', 'تعليمات مكتوبة', 'Schriftliche Anleitung', 'Patrón escrito', 'Schema scritto', 'Modèle écrit'],
    stWrittenHint: ['תבנית מסודרת: חומרים, דוגמית, מידות והוראות לפי שלבים', 'A tidy template: materials, gauge, sizes and step-by-step instructions', 'Шаблон: материалы, плотность, размеры и пошаговые инструкции', 'قالب منظم: المواد والعيّنة والمقاسات والتعليمات خطوة بخطوة', 'Vorlage: Material, Maschenprobe, Größen und Schritt-für-Schritt-Anleitung', 'Plantilla: materiales, muestra, tallas e instrucciones paso a paso', 'Modello: materiali, campione, taglie e istruzioni passo passo', 'Modèle : matériel, échantillon, tailles et instructions pas à pas'],
    stChart: ['תרשים סמלים', 'Symbol chart', 'Схема символами', 'مخطط رموز', 'Strickschrift / Häkelschrift', 'Gráfico de símbolos', 'Schema a simboli', 'Grille de symboles'],
    stChartHint: ['סריגה או קרושה – מסמנים סמלים וצבעים תא אחר תא', 'Knitting or crochet – symbols and colours cell by cell', 'Спицы или крючок – символы и цвета по клеткам', 'حياكة أو كروشيه – رموز وألوان خانة بخانة', 'Stricken oder Häkeln – Symbole und Farben Kästchen für Kästchen', 'Punto o ganchillo – símbolos y colores celda a celda', 'Maglia o uncinetto – simboli e colori casella per casella', 'Tricot ou crochet – symboles et couleurs case par case'],
    stMosaic: ['מוזאיק קרושה', 'Mosaic crochet', 'Мозаичное вязание крючком', 'كروشيه الموزاييك', 'Mosaikhäkeln', 'Ganchillo mosaico', 'Uncinetto mosaico', 'Crochet mosaïque'],
    stMosaicHint: ['מתמונה או מאפס – לפי כללי המוזאיק, עם X וצבע לכל שורה', 'From a photo or from scratch – follows the mosaic rules, with X marks and row colours', 'Из фото или с нуля – по правилам мозаики, с X и цветом рядов', 'من صورة أو من البداية – وفق قواعد الموزاييك مع X ولون لكل صف', 'Aus einem Foto oder neu – nach den Mosaikregeln, mit X und Reihenfarben', 'Desde una foto o desde cero – con las reglas del mosaico, X y color de cada vuelta', 'Da una foto o da zero – con le regole del mosaico, X e colore dei giri', 'À partir d\'une photo ou de zéro – selon les règles de la mosaïque, avec X et couleur des rangs'],
    stSave: ['💾 שמירה', '💾 Save', '💾 Сохранить', '💾 حفظ', '💾 Speichern', '💾 Guardar', '💾 Salva', '💾 Enregistrer'],
    stSaving: ['שומר בדרייב…', 'Saving to Drive…', 'Сохранение на Диск…', 'جارٍ الحفظ في Drive…', 'Wird in Drive gespeichert…', 'Guardando en Drive…', 'Salvataggio in Drive…', 'Enregistrement dans Drive…'],
    stSaved: ['נשמר בתיקייה "{name}" ✓', 'Saved in "{name}" ✓', 'Сохранено в «{name}» ✓', 'تم الحفظ في «{name}» ✓', 'Gespeichert in „{name}“ ✓', 'Guardado en «{name}» ✓', 'Salvato in «{name}» ✓', 'Enregistré dans « {name} » ✓'],
    stTitlePh: ['שם הדוגמה', 'Pattern name', 'Название схемы', 'اسم النموذج', 'Name der Anleitung', 'Nombre del patrón', 'Nome dello schema', 'Nom du modèle'],
    stUntitled: ['דוגמה חדשה', 'New pattern', 'Новая схема', 'نموذج جديد', 'Neue Anleitung', 'Patrón nuevo', 'Nuovo schema', 'Nouveau modèle'],
    stLeave: ['לצאת בלי לשמור את השינויים?', 'Leave without saving the changes?', 'Выйти без сохранения изменений?', 'الخروج دون حفظ التغييرات؟', 'Ohne Speichern verlassen?', '¿Salir sin guardar los cambios?', 'Uscire senza salvare le modifiche?', 'Quitter sans enregistrer les modifications ?'],
    stNoFolder: ['קודם בוחרים תיקיית דוגמאות', 'Choose a patterns folder first', 'Сначала выберите папку', 'اختر مجلد النماذج أولًا', 'Wähle zuerst einen Ordner', 'Primero elige una carpeta', 'Prima scegli una cartella', 'Choisissez d\'abord un dossier'],
    stEditLoad: ['טוען את העיצוב…', 'Loading the design…', 'Загрузка…', 'جارٍ تحميل التصميم…', 'Design wird geladen…', 'Cargando el diseño…', 'Caricamento del progetto…', 'Chargement du projet…'],
    stLegend: ['מקרא', 'Key', 'Условные обозначения', 'دليل الرموز', 'Legende', 'Leyenda', 'Legenda', 'Légende'],
    stCellSize: ['גודל תא', 'Cell size', 'Размер клетки', 'حجم الخانة', 'Kästchengröße', 'Tamaño de celda', 'Dimensione casella', 'Taille des cases'],
    stWidth: ['רוחב (עיניים)', 'Width (stitches)', 'Ширина (петли)', 'العرض (غرز)', 'Breite (Maschen)', 'Ancho (puntos)', 'Larghezza (maglie)', 'Largeur (mailles)'],
    stHeight: ['גובה (שורות)', 'Height (rows)', 'Высота (ряды)', 'الارتفاع (صفوف)', 'Höhe (Reihen)', 'Alto (vueltas)', 'Altezza (ferri)', 'Hauteur (rangs)'],
    stApplySize: ['עדכון גודל', 'Update size', 'Изменить размер', 'تحديث الحجم', 'Größe ändern', 'Cambiar tamaño', 'Aggiorna dimensioni', 'Changer la taille'],
    stEraser: ['🧽 מחק', '🧽 Eraser', '🧽 Ластик', '🧽 ممحاة', '🧽 Radierer', '🧽 Borrador', '🧽 Gomma', '🧽 Gomme'],
    stUndo: ['↶ ביטול', '↶ Undo', '↶ Отменить', '↶ تراجع', '↶ Rückgängig', '↶ Deshacer', '↶ Annulla', '↶ Annuler'],
    stCraft: ['מלאכה', 'Craft', 'Техника', 'الحرفة', 'Technik', 'Técnica', 'Tecnica', 'Technique'],
    stKnit: ['סריגה בשתי מסרגות', 'Knitting', 'Спицы', 'حياكة بالإبرتين', 'Stricken', 'Dos agujas', 'Maglia', 'Tricot'],
    stCrochet: ['קרושה', 'Crochet', 'Крючок', 'كروشيه', 'Häkeln', 'Ganchillo', 'Uncinetto', 'Crochet'],
    stSymbols: ['סמלים', 'Symbols', 'Символы', 'الرموز', 'Symbole', 'Símbolos', 'Simboli', 'Symboles'],
    stColors: ['צבעים', 'Colours', 'Цвета', 'الألوان', 'Farben', 'Colores', 'Colori', 'Couleurs'],
    stChartTip: ['בוחרים סמל או צבע ומסמנים בתרשים (אפשר לגרור). שורה 1 למטה; העיניים נספרות מימין.', 'Pick a symbol or colour and tap the chart (you can drag). Row 1 is at the bottom; stitches are counted from the right.', 'Выберите символ или цвет и нажимайте на схему (можно вести). Ряд 1 внизу, петли считаются справа.', 'اختر رمزًا أو لونًا وانقر على المخطط (يمكن السحب). الصف 1 في الأسفل والغرز تُعدّ من اليمين.', 'Symbol oder Farbe wählen und ins Diagramm tippen (Ziehen geht auch). Reihe 1 ist unten; Maschen werden von rechts gezählt.', 'Elige un símbolo o color y toca el gráfico (puedes arrastrar). La vuelta 1 está abajo; los puntos se cuentan desde la derecha.', 'Scegli un simbolo o un colore e tocca lo schema (puoi trascinare). Il ferro 1 è in basso; le maglie si contano da destra.', 'Choisissez un symbole ou une couleur et touchez la grille (vous pouvez glisser). Le rang 1 est en bas ; les mailles se comptent depuis la droite.'],
    // סמלי סריגה
    syK: ['ימין (בצד הימני)', 'Knit on RS', 'Лицевая', 'غرزة سادة', 'Rechte Masche', 'Punto del derecho', 'Maglia diritta', 'Maille endroit'],
    syP: ['שמאל (בצד הימני)', 'Purl on RS', 'Изнаночная', 'غرزة عكسية', 'Linke Masche', 'Punto del revés', 'Maglia rovescia', 'Maille envers'],
    syYo: ['ליפוף (yo)', 'Yarn over', 'Накид', 'لفة خيط', 'Umschlag', 'Lazada', 'Gettato', 'Jeté'],
    syK2tog: ['2 יחד ימין – נטייה ימינה (k2tog)', 'K2tog (right-leaning decrease)', '2 вместе лицевой (наклон вправо)', 'غرزتان معًا سادة (ميل لليمين)', '2 rechts zusammenstricken', 'Dos juntos del derecho', '2 insieme a diritto', '2 mailles ensemble à l\'endroit'],
    sySsk: ['ssk – נטייה שמאלה', 'SSK (left-leaning decrease)', 'Протяжка (наклон влево)', 'SSK (ميل لليسار)', 'Überzogene Abnahme (SSK)', 'Desliz, desliz, punto (SSK)', 'Accavallata semplice (SSK)', 'Surjet simple (SSK)'],
    sySl: ['החלקת עין', 'Slip stitch', 'Снять петлю', 'زلق غرزة', 'Masche abheben', 'Deslizar punto', 'Passare una maglia', 'Glisser une maille'],
    syM1: ['הוספה (M1)', 'Make one (M1)', 'Прибавка (M1)', 'زيادة (M1)', 'Zunahme (M1)', 'Aumento (M1)', 'Aumento (M1)', 'Augmentation (M1)'],
    syBobble: ['בובל', 'Bobble', 'Шишечка', 'كرية', 'Noppe', 'Bodoque', 'Nocciolina', 'Nope'],
    syCable: ['צמה (פירוט בהערות)', 'Cable (see notes)', 'Коса (см. примечания)', 'ضفيرة (انظر الملاحظات)', 'Zopf (siehe Notizen)', 'Ochos (ver notas)', 'Treccia (vedi note)', 'Torsade (voir notes)'],
    syNo: ['אין עין', 'No stitch', 'Нет петли', 'لا غرزة', 'Keine Masche', 'Sin punto', 'Nessuna maglia', 'Pas de maille'],
    // סמלי קרושה
    syCh: ['עין שרשרת (ch)', 'Chain (ch)', 'Воздушная петля', 'سلسلة (ch)', 'Luftmasche', 'Cadeneta', 'Catenella', 'Maille en l\'air'],
    sySlst: ['עין חיבור (sl st)', 'Slip stitch (sl st)', 'Соединительный столбик', 'غرزة منزلقة', 'Kettmasche', 'Punto raso', 'Maglia bassissima', 'Maille coulée'],
    sySc: ['חצי עמוד (sc)', 'Single crochet (sc)', 'Столбик без накида', 'حشوة قصيرة (sc)', 'Feste Masche', 'Punto bajo', 'Maglia bassa', 'Maille serrée'],
    syHdc: ['עמוד נמוך (hdc)', 'Half double crochet (hdc)', 'Полустолбик с накидом', 'نصف حشوة طويلة (hdc)', 'Halbes Stäbchen', 'Punto medio', 'Mezza maglia alta', 'Demi-bride'],
    syDc: ['עמוד (dc)', 'Double crochet (dc)', 'Столбик с накидом', 'حشوة طويلة (dc)', 'Stäbchen', 'Punto alto', 'Maglia alta', 'Bride'],
    syTr: ['עמוד כפול (tr)', 'Treble crochet (tr)', 'Столбик с 2 накидами', 'حشوة طويلة مزدوجة (tr)', 'Doppelstäbchen', 'Punto alto doble', 'Maglia alta doppia', 'Double bride'],
    syInc: ['הגדלה (2 בעין אחת)', 'Increase (2 in one)', 'Прибавка (2 в одну)', 'زيادة (2 في غرزة)', 'Zunahme (2 in eine)', 'Aumento (2 en uno)', 'Aumento (2 in una)', 'Augmentation (2 dans 1)'],
    syDec: ['הורדה (2 יחד)', 'Decrease (2 together)', 'Убавка (2 вместе)', 'نقصان (2 معًا)', 'Abnahme (2 zusammen)', 'Disminución (2 juntos)', 'Diminuzione (2 insieme)', 'Diminution (2 ensemble)'],
    syPuff: ['פאף', 'Puff stitch', 'Пышный столбик', 'غرزة منفوخة', 'Büschelmasche', 'Punto puff', 'Punto puff', 'Point puff'],
    // הוראות כתובות
    wDesigner: ['עיצוב', 'Designed by', 'Автор', 'تصميم', 'Design', 'Diseño', 'Design', 'Création'],
    wLevel: ['רמת קושי', 'Skill level', 'Уровень', 'مستوى الصعوبة', 'Schwierigkeit', 'Nivel', 'Livello', 'Niveau'],
    lvl1: ['מתחילים', 'Beginner', 'Начальный', 'مبتدئ', 'Anfänger', 'Principiante', 'Principiante', 'Débutant'],
    lvl2: ['קל', 'Easy', 'Лёгкий', 'سهل', 'Leicht', 'Fácil', 'Facile', 'Facile'],
    lvl3: ['בינוני', 'Intermediate', 'Средний', 'متوسط', 'Mittel', 'Intermedio', 'Intermedio', 'Intermédiaire'],
    lvl4: ['מתקדמים', 'Experienced', 'Сложный', 'متقدم', 'Fortgeschritten', 'Avanzado', 'Esperto', 'Confirmé'],
    wSizes: ['מידות', 'Sizes', 'Размеры', 'المقاسات', 'Größen', 'Tallas', 'Taglie', 'Tailles'],
    wMeasure: ['מידות סופיות', 'Finished measurements', 'Размеры готового изделия', 'القياسات النهائية', 'Fertigmaße', 'Medidas finales', 'Misure finite', 'Dimensions finales'],
    wYarn: ['חוטים (סוג, עובי, כמות, צבעים)', 'Yarn (type, weight, amount, colours)', 'Пряжа (вид, толщина, количество, цвета)', 'الخيوط (النوع، السماكة، الكمية، الألوان)', 'Garn (Art, Stärke, Menge, Farben)', 'Hilo (tipo, grosor, cantidad, colores)', 'Filato (tipo, peso, quantità, colori)', 'Fil (type, grosseur, quantité, couleurs)'],
    wTools: ['מסרגות / מסרגת קרושה', 'Needles / hook', 'Спицы / крючок', 'الإبر / إبرة الكروشيه', 'Nadeln / Häkelnadel', 'Agujas / ganchillo', 'Ferri / uncinetto', 'Aiguilles / crochet'],
    wGauge: ['דוגמית', 'Gauge', 'Плотность', 'العيّنة', 'Maschenprobe', 'Muestra', 'Campione', 'Échantillon'],
    wNotions: ['אביזרים נוספים', 'Notions', 'Дополнительно', 'لوازم إضافية', 'Zubehör', 'Accesorios', 'Accessori', 'Fournitures'],
    wAbbr: ['קיצורים', 'Abbreviations', 'Сокращения', 'الاختصارات', 'Abkürzungen', 'Abreviaturas', 'Abbreviazioni', 'Abréviations'],
    wAbbrStd: ['＋ קיצורים נפוצים', '＋ Common abbreviations', '＋ Частые сокращения', '＋ اختصارات شائعة', '＋ Häufige Abkürzungen', '＋ Abreviaturas comunes', '＋ Abbreviazioni comuni', '＋ Abréviations courantes'],
    wNotes: ['הערות', 'Notes', 'Примечания', 'ملاحظات', 'Hinweise', 'Notas', 'Note', 'Notes'],
    wInstructions: ['הוראות', 'Instructions', 'Описание', 'التعليمات', 'Anleitung', 'Instrucciones', 'Istruzioni', 'Instructions'],
    wSectionTitle: ['כותרת השלב (למשל: גוף, שרוולים)', 'Section title (e.g. Body, Sleeves)', 'Название части (например: перед, рукава)', 'عنوان الجزء (مثلًا: الجسم، الأكمام)', 'Abschnitt (z. B. Körper, Ärmel)', 'Título de la sección (p. ej.: cuerpo, mangas)', 'Titolo della sezione (es.: corpo, maniche)', 'Titre de la partie (ex. : corps, manches)'],
    wSectionText: ['ההוראות לשלב הזה…', 'Instructions for this section…', 'Описание этой части…', 'تعليمات هذا الجزء…', 'Anleitung für diesen Abschnitt…', 'Instrucciones de esta sección…', 'Istruzioni per questa sezione…', 'Instructions de cette partie…'],
    wAddSection: ['＋ הוספת שלב', '＋ Add section', '＋ Добавить часть', '＋ إضافة جزء', '＋ Abschnitt hinzufügen', '＋ Añadir sección', '＋ Aggiungi sezione', '＋ Ajouter une partie'],
    wCover: ['תמונת שער', 'Cover photo', 'Обложка', 'صورة الغلاف', 'Titelbild', 'Foto de portada', 'Foto di copertina', 'Photo de couverture'],
    wCoverPick: ['🖼️ בחירת תמונה', '🖼️ Choose photo', '🖼️ Выбрать фото', '🖼️ اختيار صورة', '🖼️ Foto wählen', '🖼️ Elegir foto', '🖼️ Scegli foto', '🖼️ Choisir une photo'],
    wCoverRemove: ['✕ הסרה', '✕ Remove', '✕ Убрать', '✕ إزالة', '✕ Entfernen', '✕ Quitar', '✕ Rimuovi', '✕ Retirer'],
    wDocNote: ['נשמר כמסמך Google Docs – אפשר לפתוח אותו כאן עם הסרגלים, או לערוך גם בגוגל.', 'Saved as a Google Doc – open it here with the rulers, or edit it in Google too.', 'Сохраняется как Google Документ – открывайте здесь с линейками или редактируйте в Google.', 'يُحفظ كمستند Google – افتحه هنا مع المساطر أو عدّله في Google.', 'Wird als Google-Dokument gespeichert – hier mit Linealen öffnen oder in Google bearbeiten.', 'Se guarda como documento de Google: ábrelo aquí con las reglas o edítalo también en Google.', 'Salvato come documento Google: aprilo qui con i righelli o modificalo anche in Google.', 'Enregistré comme document Google – ouvrez-le ici avec les règles ou modifiez-le aussi dans Google.'],
    // מוזאיק
    mFromImage: ['🖼️ יצירה מתמונה', '🖼️ From a photo', '🖼️ Из фото', '🖼️ من صورة', '🖼️ Aus einem Foto', '🖼️ Desde una foto', '🖼️ Da una foto', '🖼️ À partir d\'une photo'],
    mBlank: ['⬜ התחלה מאפס', '⬜ Start blank', '⬜ С нуля', '⬜ من البداية', '⬜ Leer beginnen', '⬜ Empezar en blanco', '⬜ Inizia da zero', '⬜ Commencer vide'],
    mThreshold: ['בהיר / כהה', 'Light / dark', 'Светлое / тёмное', 'فاتح / داكن', 'Hell / dunkel', 'Claro / oscuro', 'Chiaro / scuro', 'Clair / foncé'],
    mInvert: ['⇄ היפוך', '⇄ Invert', '⇄ Инвертировать', '⇄ عكس', '⇄ Umkehren', '⇄ Invertir', '⇄ Inverti', '⇄ Inverser'],
    mColorA: ['צבע א׳', 'Colour A', 'Цвет A', 'اللون أ', 'Farbe A', 'Color A', 'Colore A', 'Couleur A'],
    mColorB: ['צבע ב׳', 'Colour B', 'Цвет B', 'اللون ب', 'Farbe B', 'Color B', 'Colore B', 'Couleur B'],
    mA: ['א׳', 'A', 'A', 'أ', 'A', 'A', 'A', 'A'],
    mB: ['ב׳', 'B', 'B', 'ب', 'B', 'B', 'B', 'B'],
    mEdges: ['עין שוליים בכל צד', 'Edge stitch on each side', 'Кромочная петля с каждой стороны', 'غرزة حافة على كل جانب', 'Randmasche an jeder Seite', 'Punto de orillo a cada lado', 'Maglia di vivagno su ogni lato', 'Maille lisière de chaque côté'],
    mShowErr: ['סימון מקומות שהכללים לא מאפשרים', 'Mark spots the rules don\'t allow', 'Отмечать места, где правила не позволяют', 'تمييز الأماكن التي لا تسمح بها القواعد', 'Stellen markieren, die die Regeln nicht erlauben', 'Marcar puntos que las reglas no permiten', 'Segna i punti non consentiti dalle regole', 'Marquer les endroits interdits par les règles'],
    mPaint: ['צביעה:', 'Paint:', 'Рисовать:', 'تلوين:', 'Malen:', 'Pintar:', 'Dipingi:', 'Peindre :'],
    mStats: ['{x} תכי X · {e} תאים שלא אפשר לבצע בדיוק (מסומנים באדום)', '{x} X stitches · {e} cells can\'t match exactly (marked red)', 'X: {x} · {e} клеток нельзя выполнить точно (отмечены красным)', '{x} غرزة X · {e} خانات لا يمكن تنفيذها بدقة (باللون الأحمر)', '{x} X-Maschen · {e} Kästchen nicht exakt machbar (rot markiert)', '{x} puntos X · {e} celdas no se pueden lograr exactamente (en rojo)', '{x} maglie X · {e} caselle non realizzabili esattamente (in rosso)', '{x} mailles X · {e} cases impossibles à respecter exactement (en rouge)'],
    mStatsOk: ['{x} תכי X · התרשים עומד בכל כללי המוזאיק ✓', '{x} X stitches · the chart follows all mosaic rules ✓', 'X: {x} · схема соответствует всем правилам ✓', '{x} غرزة X · المخطط يلتزم بكل القواعد ✓', '{x} X-Maschen · das Diagramm erfüllt alle Regeln ✓', '{x} puntos X · el gráfico cumple todas las reglas ✓', '{x} maglie X · lo schema rispetta tutte le regole ✓', '{x} mailles X · la grille respecte toutes les règles ✓'],
    mRules: [
      'מוזאיק בשכבות (Overlay): כל שורה נסרגת בצבע אחד, והצבעים מתחלפים (א׳, ב׳, א׳…). ⨯ = עמוד בלולאה הקדמית של העין שתי שורות מתחת – הוא מכסה את העין שמתחתיו ומראה את הצבע של שתי שורות קודם. אין X מעל X, אין X בשתי שורות הבסיס ובעיני השוליים. האפליקציה ממקמת את ה-X לבד כדי שהתוצאה תהיה הכי קרובה לתמונה; צובעים בתרשים כדי לתקן.',
      'Overlay mosaic: each row is worked in one colour and the colours alternate (A, B, A…). ⨯ = a dc in the front loop of the stitch two rows below – it covers the stitch beneath and shows the colour from two rows earlier. No X above an X, no X in the two base rows or the edge stitches. The app places the X marks for you so the result is as close as possible to the picture; paint on the chart to adjust.',
      'Наложенная мозаика: каждый ряд вяжется одним цветом, цвета чередуются (A, B, A…). ⨯ = столбик с накидом за переднюю стенку петли двумя рядами ниже – он перекрывает петлю под ним и показывает цвет двумя рядами раньше. Нельзя X над X, нет X в двух базовых рядах и в кромочных петлях. Приложение само расставляет X максимально близко к картинке; рисуйте по схеме для правки.',
      'موزاييك متراكب: كل صف بلون واحد والألوان تتناوب (أ، ب، أ…). ⨯ = حشوة طويلة في الحلقة الأمامية للغرزة قبل صفين – تغطي الغرزة تحتها وتُظهر لون الصف قبل صفين. لا X فوق X، ولا X في صفي الأساس أو غرز الحافة. يضع التطبيق علامات X تلقائيًا لتقترب النتيجة من الصورة؛ لوّن المخطط للتعديل.',
      'Overlay-Mosaik: Jede Reihe wird in einer Farbe gehäkelt, die Farben wechseln (A, B, A…). ⨯ = Stäbchen ins vordere Maschenglied der Masche zwei Reihen tiefer – es verdeckt die Masche darunter und zeigt die Farbe von zwei Reihen vorher. Kein X über einem X, kein X in den zwei Grundreihen oder Randmaschen. Die App setzt die X so, dass das Ergebnis dem Bild möglichst nahekommt; zum Anpassen im Diagramm malen.',
      'Mosaico superpuesto: cada vuelta se teje en un color y los colores se alternan (A, B, A…). ⨯ = punto alto en la hebra delantera del punto dos vueltas más abajo – cubre el punto de debajo y muestra el color de dos vueltas antes. No hay X sobre X, ni X en las dos vueltas base ni en los puntos de orillo. La app coloca las X para que el resultado se parezca lo más posible a la imagen; pinta en el gráfico para ajustar.',
      'Mosaico overlay: ogni giro si lavora in un colore e i colori si alternano (A, B, A…). ⨯ = maglia alta nell\'asola anteriore della maglia due giri sotto – copre la maglia sottostante e mostra il colore di due giri prima. Niente X sopra una X, niente X nei due giri di base né nelle maglie di vivagno. L\'app posiziona le X per avvicinarsi il più possibile all\'immagine; dipingi sullo schema per correggere.',
      'Mosaïque superposée : chaque rang se crochète d\'une seule couleur et les couleurs alternent (A, B, A…). ⨯ = bride dans le brin avant de la maille deux rangs plus bas – elle couvre la maille du dessous et montre la couleur de deux rangs plus tôt. Pas de X sur un X, pas de X dans les deux rangs de base ni dans les mailles lisières. L\'application place les X pour se rapprocher au mieux de l\'image ; peignez sur la grille pour ajuster.'],
    mWritten: ['גם הוראות כתובות, שורה אחר שורה (מסמך Google Docs)', 'Also written row-by-row instructions (Google Doc)', 'Также текстовое описание по рядам (Google Документ)', 'وأيضًا تعليمات مكتوبة صفًا بصف (مستند Google)', 'Auch schriftliche Anleitung Reihe für Reihe (Google-Dokument)', 'También instrucciones escritas vuelta a vuelta (documento de Google)', 'Anche istruzioni scritte giro per giro (documento Google)', 'Aussi les explications écrites rang par rang (document Google)'],
    mRow: ['שורה {r} (צבע {c}): {s}', 'Row {r} (colour {c}): {s}', 'Ряд {r} (цвет {c}): {s}', 'الصف {r} (اللون {c}): {s}', 'Reihe {r} (Farbe {c}): {s}', 'Vuelta {r} (color {c}): {s}', 'Giro {r} (colore {c}): {s}', 'Rang {r} (couleur {c}) : {s}'],
    mFoundation: ['{n} עיני שרשרת; חצי עמוד בעין השנייה מהמסרגה ובכל העיניים ({m} עיניים). חותכים את החוט.', 'Ch {n}; sc in 2nd ch from hook and in each ch across ({m} sts). Fasten off.', '{n} в. п.; столбики без накида со 2-й петли от крючка ({m} п.). Обрезать нить.', '{n} سلسلة؛ حشوة قصيرة في الغرزة الثانية من الإبرة وفي كل غرزة ({m} غرزة). اقطع الخيط.', '{n} Lm; ab der 2. Lm ab Nadel in jede Lm 1 fM ({m} M). Faden abschneiden.', '{n} cad; punto bajo en la 2.ª cad desde el ganchillo y en cada cad ({m} p). Cortar el hilo.', '{n} cat; maglia bassa nella 2ª cat dall\'uncinetto e in ogni cat ({m} m). Tagliare il filo.', '{n} ml ; ms dans la 2e ml à partir du crochet et dans chaque ml ({m} m). Couper le fil.'],
    mPlain: ['חצי עמוד בלולאה האחורית בכל העיניים ({n}). חותכים את החוט.', 'sc in back loop of each st across ({n}). Fasten off.', 'Столбики без накида за заднюю стенку по всему ряду ({n}). Обрезать нить.', 'حشوة قصيرة في الحلقة الخلفية لكل غرزة ({n}). اقطع الخيط.', 'In jede M 1 fM ins hintere Maschenglied ({n}). Faden abschneiden.', 'Punto bajo por la hebra trasera en cada punto ({n}). Cortar el hilo.', 'Maglia bassa nell\'asola posteriore di ogni maglia ({n}). Tagliare il filo.', 'ms dans le brin arrière de chaque maille ({n}). Couper le fil.'],
    mAbbrLine: ['sc = חצי עמוד בלולאה האחורית · dc (⨯) = עמוד בלולאה הקדמית של העין שתי שורות מתחת', 'sc = single crochet in the back loop · dc (⨯) = double crochet in the front loop of the stitch two rows below', 'sc = столбик без накида за заднюю стенку · dc (⨯) = столбик с накидом за переднюю стенку петли двумя рядами ниже', 'sc = حشوة قصيرة في الحلقة الخلفية · dc (⨯) = حشوة طويلة في الحلقة الأمامية للغرزة قبل صفين', 'sc = feste Masche ins hintere Glied · dc (⨯) = Stäbchen ins vordere Glied der Masche zwei Reihen tiefer', 'sc = punto bajo por la hebra trasera · dc (⨯) = punto alto por la hebra delantera del punto dos vueltas más abajo', 'sc = maglia bassa nell\'asola posteriore · dc (⨯) = maglia alta nell\'asola anteriore della maglia due giri sotto', 'sc = maille serrée dans le brin arrière · dc (⨯) = bride dans le brin avant de la maille deux rangs plus bas'],
    mMethod: ['כל השורות נסרגות מהצד הקדמי, מימין לשמאל. בתחילת כל שורה מחברים את הצבע שלה, ובסוף חותכים את החוט.', 'All rows are worked on the right side, from right to left. Join the row\'s colour at the start of each row and fasten off at the end.', 'Все ряды вяжутся с лицевой стороны справа налево. В начале ряда присоедините его цвет, в конце обрежьте нить.', 'تُحاك كل الصفوف من الوجه الأمامي من اليمين إلى اليسار. صِل لون الصف في بدايته واقطع الخيط في نهايته.', 'Alle Reihen werden auf der Vorderseite von rechts nach links gehäkelt. Zu Beginn jeder Reihe die Farbe anschlingen, am Ende abschneiden.', 'Todas las vueltas se tejen por el derecho, de derecha a izquierda. Une el color al empezar cada vuelta y corta al terminar.', 'Tutti i giri si lavorano sul diritto, da destra a sinistra. Unire il colore all\'inizio di ogni giro e tagliare alla fine.', 'Tous les rangs se crochètent sur l\'endroit, de droite à gauche. Joindre la couleur au début de chaque rang et couper le fil à la fin.'],
    mChartTitle: ['תרשים', 'Chart', 'Схема', 'المخطط', 'Diagramm', 'Gráfico', 'Schema', 'Grille'],
    mSize: ['{w} עיניים × {h} שורות', '{w} sts × {h} rows', '{w} п. × {h} р.', '{w} غرزة × {h} صف', '{w} M × {h} R', '{w} p × {h} v', '{w} m × {h} giri', '{w} m × {h} rgs'],
    mPhotoTip: ['תמונה עם צורה ברורה וניגודיות טובה (לוגו, ציור, צללית) נותנת את התוצאה הכי יפה.', 'A photo with a clear shape and good contrast (logo, drawing, silhouette) gives the best result.', 'Лучше всего подходит изображение с чёткой формой и контрастом (логотип, рисунок, силуэт).', 'الصورة ذات الشكل الواضح والتباين الجيد (شعار، رسم، ظل) تعطي أفضل نتيجة.', 'Ein Bild mit klarer Form und gutem Kontrast (Logo, Zeichnung, Silhouette) ergibt das schönste Ergebnis.', 'Una imagen con forma clara y buen contraste (logo, dibujo, silueta) da el mejor resultado.', 'Un\'immagine con forma chiara e buon contrasto (logo, disegno, silhouette) dà il risultato migliore.', 'Une image avec une forme nette et un bon contraste (logo, dessin, silhouette) donne le meilleur résultat.'],
    stFolderBtn: ['📁 {name}', '📁 {name}', '📁 {name}', '📁 {name}', '📁 {name}', '📁 {name}', '📁 {name}', '📁 {name}'],
    stChooseFolder: ['באיזו תיקייה לשמור?', 'Which folder to save in?', 'В какую папку сохранить?', 'في أي مجلد تريد الحفظ؟', 'In welchem Ordner speichern?', '¿En qué carpeta guardar?', 'In quale cartella salvare?', 'Dans quel dossier enregistrer ?'],
    stSaveHere: ['✓ שמירה בתיקייה "{name}"', '✓ Save in "{name}"', '✓ Сохранить в «{name}»', '✓ الحفظ في «{name}»', '✓ In „{name}“ speichern', '✓ Guardar en «{name}»', '✓ Salva in «{name}»', '✓ Enregistrer dans « {name} »'],
    stNoSub: ['אין כאן תת-תיקיות', 'No subfolders here', 'Нет вложенных папок', 'لا توجد مجلدات فرعية', 'Keine Unterordner', 'No hay subcarpetas', 'Nessuna sottocartella', 'Aucun sous-dossier'],
    tabChart: ['🎨 תרשים', '🎨 Chart', '🎨 Схема', '🎨 المخطط', '🎨 Diagramm', '🎨 Gráfico', '🎨 Schema', '🎨 Grille'],
    tabInfo: ['📋 פרטים והוראות', '📋 Details & instructions', '📋 Детали и описание', '📋 التفاصيل والتعليمات', '📋 Details & Anleitung', '📋 Detalles e instrucciones', '📋 Dettagli e istruzioni', '📋 Détails et instructions'],
    wImages: ['תמונות נוספות', 'More photos', 'Ещё фото', 'صور إضافية', 'Weitere Fotos', 'Más fotos', 'Altre foto', 'Autres photos'],
    wAddImages: ['＋ הוספת תמונות', '＋ Add photos', '＋ Добавить фото', '＋ إضافة صور', '＋ Fotos hinzufügen', '＋ Añadir fotos', '＋ Aggiungi foto', '＋ Ajouter des photos'],
    wLinks: ['קישורים (סרטוני יוטיוב, מדריכים)', 'Links (YouTube videos, tutorials)', 'Ссылки (видео YouTube, уроки)', 'روابط (فيديوهات يوتيوب، دروس)', 'Links (YouTube-Videos, Anleitungen)', 'Enlaces (vídeos de YouTube, tutoriales)', 'Link (video YouTube, tutorial)', 'Liens (vidéos YouTube, tutoriels)'],
    wLinkTitle: ['כותרת (למשל: איך סורגים צמה)', 'Title (e.g. How to knit a cable)', 'Название (например: как вязать косу)', 'العنوان (مثلًا: كيف تُحاك الضفيرة)', 'Titel (z. B. Zopf stricken)', 'Título (p. ej.: cómo tejer ochos)', 'Titolo (es.: come fare una treccia)', 'Titre (ex. : tricoter une torsade)'],
    wAddLink: ['＋ הוספת קישור', '＋ Add link', '＋ Добавить ссылку', '＋ إضافة رابط', '＋ Link hinzufügen', '＋ Añadir enlace', '＋ Aggiungi link', '＋ Ajouter un lien'],
    wGeneralNotes: ['הוראות כלליות והערות', 'General instructions & notes', 'Общие указания и примечания', 'تعليمات عامة وملاحظات', 'Allgemeine Hinweise', 'Instrucciones generales y notas', 'Istruzioni generali e note', 'Instructions générales et notes'],
    exportPdf: ['📄 גם קובץ PDF מלא (הוראות, תרשים, תמונות וקישורים)', '📄 Also a full PDF (instructions, chart, photos and links)', '📄 Также полный PDF (описание, схема, фото и ссылки)', '📄 وأيضًا ملف PDF كامل (التعليمات والمخطط والصور والروابط)', '📄 Auch ein komplettes PDF (Anleitung, Diagramm, Fotos, Links)', '📄 También un PDF completo (instrucciones, gráfico, fotos y enlaces)', '📄 Anche un PDF completo (istruzioni, schema, foto e link)', '📄 Aussi un PDF complet (instructions, grille, photos et liens)'],
    pdfMaking: ['יוצר את קובץ ה-PDF…', 'Creating the PDF…', 'Создаём PDF…', 'جارٍ إنشاء PDF…', 'PDF wird erstellt…', 'Creando el PDF…', 'Creazione del PDF…', 'Création du PDF…'],
    cWorkFlat: ['הלוך-חזור (שורות בצד ימין ובצד שמאל)', 'Worked flat (RS and WS rows)', 'Поворотными рядами (лицевые и изнаночные)', 'ذهابًا وإيابًا (صفوف أمامية وخلفية)', 'In Hin- und Rückreihen', 'En plano (vueltas por el derecho y el revés)', 'In piano (ferri diritto e rovescio)', 'À plat (rangs endroit et envers)'],
    cWorkRound: ['בעיגול (כל השורות מהצד הימני)', 'In the round (all rows on RS)', 'По кругу (все ряды лицевые)', 'دائريًا (كل الصفوف من الأمام)', 'In Runden (alle Runden von vorne)', 'En redondo (todas por el derecho)', 'In tondo (tutti i giri sul diritto)', 'En rond (tous les rangs sur l\'endroit)'],
    cRowRS: ['שורה {r} (צד ימין, מימין לשמאל): {s}', 'Row {r} (RS, right to left): {s}', 'Ряд {r} (лицевой, справа налево): {s}', 'الصف {r} (الوجه، من اليمين لليسار): {s}', 'Reihe {r} (Hinreihe, von rechts nach links): {s}', 'Vuelta {r} (derecho, de derecha a izquierda): {s}', 'Ferro {r} (diritto, da destra a sinistra): {s}', 'Rang {r} (endroit, de droite à gauche) : {s}'],
    cRowWS: ['שורה {r} (צד שמאל, משמאל לימין): {s}', 'Row {r} (WS, left to right): {s}', 'Ряд {r} (изнаночный, слева направо): {s}', 'الصف {r} (الظهر، من اليسار لليمين): {s}', 'Reihe {r} (Rückreihe, von links nach rechts): {s}', 'Vuelta {r} (revés, de izquierda a derecha): {s}', 'Ferro {r} (rovescio, da sinistra a destra): {s}', 'Rang {r} (envers, de gauche à droite) : {s}'],
    cRowRound: ['סיבוב {r}: {s}', 'Round {r}: {s}', 'Круг {r}: {s}', 'الدورة {r}: {s}', 'Runde {r}: {s}', 'Vuelta {r}: {s}', 'Giro {r}: {s}', 'Tour {r} : {s}'],
    colorName: ['שם הצבע במקרא', 'Colour name in the key', 'Название цвета', 'اسم اللون في الدليل', 'Farbname in der Legende', 'Nombre del color', 'Nome del colore', 'Nom de la couleur'],
    hChart: ['תרשים', 'Chart', 'Схема', 'المخطط', 'Diagramm', 'Gráfico', 'Schema', 'Grille'],
    hRows: ['הוראות שורה אחר שורה', 'Row-by-row instructions', 'Описание по рядам', 'التعليمات صفًا بصف', 'Anleitung Reihe für Reihe', 'Instrucciones vuelta a vuelta', 'Istruzioni giro per giro', 'Explications rang par rang'],
    hImages: ['תמונות', 'Photos', 'Фото', 'الصور', 'Fotos', 'Fotos', 'Foto', 'Photos'],
    hLinks: ['קישורים וסרטונים', 'Links & videos', 'Ссылки и видео', 'روابط وفيديوهات', 'Links & Videos', 'Enlaces y vídeos', 'Link e video', 'Liens et vidéos'],
    hGeneral: ['הוראות כלליות', 'General instructions', 'Общие указания', 'تعليمات عامة', 'Allgemeine Hinweise', 'Instrucciones generales', 'Istruzioni generali', 'Instructions générales'],
    hAttach: ['נספחים', 'Appendix', 'Приложения', 'ملاحق', 'Anhang', 'Anexos', 'Allegati', 'Annexes'],
    dBtn: ['⚙️ פרטים קבועים לכל הדוגמאות', '⚙️ Details for all patterns', '⚙️ Общие данные для всех схем', '⚙️ تفاصيل ثابتة لكل النماذج', '⚙️ Feste Angaben für alle Anleitungen', '⚙️ Datos fijos para todos los patrones', '⚙️ Dati fissi per tutti gli schemi', '⚙️ Infos fixes pour tous les modèles'],
    dHint: ['מצורפים אוטומטית לכל PDF שנוצר: שם המעצבת, זכויות יוצרים, הוראות כלליות וקבצים כלליים.', 'Added automatically to every PDF: designer name, copyright, general instructions and general files.', 'Автоматически добавляются в каждый PDF: автор, авторские права, общие указания и файлы.', 'تُضاف تلقائيًا لكل PDF: اسم المصمم وحقوق النشر والتعليمات العامة والملفات العامة.', 'Werden automatisch jedem PDF hinzugefügt: Designname, Urheberrecht, allgemeine Hinweise und Dateien.', 'Se añaden automáticamente a cada PDF: diseñador, derechos de autor, instrucciones y archivos generales.', 'Aggiunti automaticamente a ogni PDF: designer, copyright, istruzioni e file generali.', 'Ajoutés automatiquement à chaque PDF : créateur, droits d\'auteur, instructions et fichiers généraux.'],
    dCopyright: ['זכויות יוצרים (טקסט קבוע)', 'Copyright (fixed text)', 'Авторские права (постоянный текст)', 'حقوق النشر (نص ثابت)', 'Urheberrecht (fester Text)', 'Derechos de autor (texto fijo)', 'Copyright (testo fisso)', 'Droits d\'auteur (texte fixe)'],
    dCopyrightDefault: ['© {year} {designer}. כל הזכויות שמורות. הדוגמה מיועדת לשימוש אישי בלבד; אין להעתיק, למכור או להפיץ אותה. מותר למכור פריטים שנסרגו לפיה בהיקף קטן, עם קרדיט לעיצוב.', '© {year} {designer}. All rights reserved. This pattern is for personal use only; do not copy, sell or distribute it. Small-scale sale of finished items is allowed with credit to the design.', '© {year} {designer}. Все права защищены. Схема только для личного использования; запрещено копировать, продавать и распространять. Продажа готовых изделий в небольшом объёме разрешена с указанием автора.', '© {year} {designer}. جميع الحقوق محفوظة. النموذج للاستخدام الشخصي فقط؛ يُمنع نسخه أو بيعه أو توزيعه. يُسمح ببيع القطع المنجزة بكميات صغيرة مع ذكر التصميم.', '© {year} {designer}. Alle Rechte vorbehalten. Nur für den privaten Gebrauch; Kopieren, Verkauf und Weitergabe sind nicht erlaubt. Verkauf fertiger Stücke in kleinem Umfang mit Nennung des Designs erlaubt.', '© {year} {designer}. Todos los derechos reservados. Patrón solo para uso personal; no se permite copiarlo, venderlo ni distribuirlo. Se permite vender prendas terminadas a pequeña escala citando el diseño.', '© {year} {designer}. Tutti i diritti riservati. Schema solo per uso personale; vietato copiarlo, venderlo o distribuirlo. È consentita la vendita su piccola scala dei capi finiti citando il design.', '© {year} {designer}. Tous droits réservés. Modèle réservé à un usage personnel ; ne pas copier, vendre ni diffuser. La vente d\'ouvrages terminés en petite quantité est autorisée en citant le modèle.'],
    dGeneral: ['הוראות כלליות לכל הדוגמאות (למשל: טיפול בפריט, טיפים)', 'General instructions for all patterns (e.g. care, tips)', 'Общие указания (например: уход, советы)', 'تعليمات عامة لكل النماذج (مثلًا: العناية، نصائح)', 'Allgemeine Hinweise (z. B. Pflege, Tipps)', 'Instrucciones generales (p. ej.: cuidado, consejos)', 'Istruzioni generali (es.: cura, consigli)', 'Instructions générales (ex. : entretien, astuces)'],
    dFiles: ['קבצים כלליים שיצורפו לכל דוגמה (תמונות או PDF)', 'General files added to every pattern (images or PDF)', 'Общие файлы для каждой схемы (изображения или PDF)', 'ملفات عامة تُرفق بكل نموذج (صور أو PDF)', 'Allgemeine Dateien für jede Anleitung (Bilder oder PDF)', 'Archivos generales para cada patrón (imágenes o PDF)', 'File generali per ogni schema (immagini o PDF)', 'Fichiers généraux pour chaque modèle (images ou PDF)'],
    dAddFiles: ['＋ הוספת קבצים', '＋ Add files', '＋ Добавить файлы', '＋ إضافة ملفات', '＋ Dateien hinzufügen', '＋ Añadir archivos', '＋ Aggiungi file', '＋ Ajouter des fichiers'],
    dSaved: ['הפרטים הקבועים נשמרו', 'Saved', 'Сохранено', 'تم الحفظ', 'Gespeichert', 'Guardado', 'Salvato', 'Enregistré'],
    dPages: ['{n} עמודים', '{n} pages', 'стр.: {n}', '{n} صفحات', '{n} Seiten', '{n} páginas', '{n} pagine', '{n} pages'],
    cpTitle: ['תכנון צבעים', 'Colour planner', 'Подбор цветов', 'تخطيط الألوان', 'Farbplaner', 'Planificador de colores', 'Pianificatore colori', 'Planificateur de couleurs'],
    cpHint: ['ריבוע סבתא ופסים – כולל חוטים מחליפי צבעים ופלטה צפויה', 'Granny squares and stripes – including self-striping yarns and the expected palette', 'Бабушкин квадрат и полосы – с секционной пряжей и ожидаемой палитрой', 'مربع الجدة والخطوط – مع خيوط متغيرة الألوان واللوحة المتوقعة', 'Granny Squares und Streifen – mit Farbverlaufsgarn und erwarteter Palette', 'Granny squares y rayas – con hilos multicolor y la paleta prevista', 'Granny square e righe – con filati multicolore e la palette prevista', 'Granny squares et rayures – avec fils multicolores et palette prévue'],
    cpMode: ['סוג', 'Type', 'Тип', 'النوع', 'Art', 'Tipo', 'Tipo', 'Type'],
    cpGranny: ['ריבוע סבתא', 'Granny square', 'Бабушкин квадрат', 'مربع الجدة', 'Granny Square', 'Granny square', 'Granny square', 'Granny square'],
    cpStripes: ['פסים בשורות', 'Stripes in rows', 'Полосы по рядам', 'خطوط بالصفوف', 'Streifen in Reihen', 'Rayas por vueltas', 'Righe per ferri', 'Rayures par rangs'],
    cpRounds: ['סיבובים', 'Rounds', 'Круги', 'الدورات', 'Runden', 'Vueltas', 'Giri', 'Tours'],
    cpYarns: ['חוטים', 'Yarns', 'Пряжа', 'الخيوط', 'Garne', 'Hilos', 'Filati', 'Fils'],
    cpAddYarn: ['＋ חוט', '＋ Yarn', '＋ Пряжа', '＋ خيط', '＋ Garn', '＋ Hilo', '＋ Filato', '＋ Fil'],
    cpSolid: ['חלק', 'Solid', 'Однотонная', 'سادة', 'Uni', 'Liso', 'Tinta unita', 'Uni'],
    cpVari: ['מחליף צבעים', 'Self-striping', 'Секционная', 'متغير الألوان', 'Farbwechsel', 'Multicolor', 'Multicolore', 'Multicolore'],
    cpGrad: ['גרדיאנט (מעבר הדרגתי)', 'Gradient', 'Градиент', 'تدرج', 'Farbverlauf', 'Degradado', 'Sfumato', 'Dégradé'],
    cpLen: ['עיניים לכל צבע', 'Stitches per colour', 'Петель на цвет', 'غرز لكل لون', 'Maschen pro Farbe', 'Puntos por color', 'Maglie per colore', 'Mailles par couleur'],
    cpAddColor: ['＋ צבע', '＋ Colour', '＋ Цвет', '＋ لون', '＋ Farbe', '＋ Color', '＋ Colore', '＋ Couleur'],
    cpSeq: ['צבע לכל שורה / סיבוב', 'Colour of each row / round', 'Цвет каждого ряда / круга', 'لون كل صف / دورة', 'Farbe jeder Reihe / Runde', 'Color de cada vuelta', 'Colore di ogni ferro / giro', 'Couleur de chaque rang / tour'],
    cpSeqHint: ['בוחרים חוט ולוחצים על השורות כדי לצבוע אותן.', 'Pick a yarn and tap rows to colour them.', 'Выберите пряжу и нажимайте на ряды.', 'اختر خيطًا وانقر على الصفوف لتلوينها.', 'Garn wählen und Reihen antippen.', 'Elige un hilo y toca las vueltas para colorearlas.', 'Scegli un filato e tocca i ferri per colorarli.', 'Choisissez un fil et touchez les rangs pour les colorer.'],
    cpSwapMode: ['⇄ החלפה בין שורות', '⇄ Swap rows', '⇄ Поменять ряды', '⇄ تبديل الصفوف', '⇄ Reihen tauschen', '⇄ Intercambiar vueltas', '⇄ Scambia ferri', '⇄ Échanger des rangs'],
    cpSwapHint: ['לוחצים על שתי שורות כדי להחליף ביניהן', 'Tap two rows to swap them', 'Нажмите на два ряда, чтобы поменять их', 'انقر على صفين لتبديلهما', 'Zwei Reihen antippen zum Tauschen', 'Toca dos vueltas para intercambiarlas', 'Tocca due ferri per scambiarli', 'Touchez deux rangs pour les échanger'],
    cpSwapYarns: ['החלפת צבעים בכל התרשים:', 'Swap colours everywhere:', 'Поменять цвета везде:', 'تبديل الألوان في كل المخطط:', 'Farben überall tauschen:', 'Intercambiar colores en todo:', 'Scambia i colori ovunque:', 'Échanger les couleurs partout :'],
    cpDoSwap: ['⇄ החלפה', '⇄ Swap', '⇄ Поменять', '⇄ تبديل', '⇄ Tauschen', '⇄ Intercambiar', '⇄ Scambia', '⇄ Échanger'],
    cpReverse: ['↕ היפוך סדר', '↕ Reverse order', '↕ Обратный порядок', '↕ عكس الترتيب', '↕ Reihenfolge umkehren', '↕ Invertir orden', '↕ Inverti ordine', '↕ Inverser l\'ordre'],
    cpRepeat: ['רצף חוזר (למשל ABAC)', 'Repeat sequence (e.g. ABAC)', 'Повтор (например ABAC)', 'تسلسل متكرر (مثلًا ABAC)', 'Wiederholung (z. B. ABAC)', 'Secuencia (p. ej. ABAC)', 'Sequenza (es. ABAC)', 'Séquence (ex. ABAC)'],
    cpApply: ['החלה', 'Apply', 'Применить', 'تطبيق', 'Anwenden', 'Aplicar', 'Applica', 'Appliquer'],
    cpPalette: ['פלטת הצבעים הצפויה', 'Expected palette', 'Ожидаемая палитра', 'اللوحة المتوقعة', 'Erwartete Palette', 'Paleta prevista', 'Palette prevista', 'Palette prévue'],
    cpRound: ['סיבוב {n}', 'Round {n}', 'Круг {n}', 'الدورة {n}', 'Runde {n}', 'Vuelta {n}', 'Giro {n}', 'Tour {n}'],
    cpRowN: ['שורה {n}', 'Row {n}', 'Ряд {n}', 'الصف {n}', 'Reihe {n}', 'Vuelta {n}', 'Ferro {n}', 'Rang {n}'],
    cpYarnName: ['שם החוט', 'Yarn name', 'Название пряжи', 'اسم الخيط', 'Garnname', 'Nombre del hilo', 'Nome del filato', 'Nom du fil'],
    cpPro: ['PRO', 'PRO', 'PRO', 'PRO', 'PRO', 'PRO', 'PRO', 'PRO'],
    cpMosaicColors: ['🎨 צבע לכל שורה (תכנון צבעים)', '🎨 Colour per row (colour planner)', '🎨 Цвет каждого ряда', '🎨 لون لكل صف', '🎨 Farbe pro Reihe', '🎨 Color por vuelta', '🎨 Colore per giro', '🎨 Couleur par rang'],
    cpUsePlan: ['צבע נפרד לכל שורה, כולל חוטים מחליפי צבעים', 'A separate yarn for each row, including self-striping yarns', 'Своя пряжа для каждого ряда, включая секционную', 'خيط مختلف لكل صف، بما فيه الخيوط متغيرة الألوان', 'Eigenes Garn je Reihe, auch Farbverlaufsgarn', 'Un hilo para cada vuelta, incluidos multicolor', 'Un filato per ogni giro, anche multicolore', 'Un fil par rang, y compris multicolores'],
    cpPooling: ['בחוטים מחליפי צבעים התוצאה תלויה בכיוון הסריגה ובמספר העיניים בשורה – התצוגה מדמה את מה שצפוי לצאת.', 'With self-striping yarns the result depends on the working direction and stitches per row – the preview simulates the expected outcome.', 'У секционной пряжи результат зависит от направления и числа петель в ряду – превью показывает ожидаемое.', 'مع الخيوط متغيرة الألوان تعتمد النتيجة على اتجاه العمل وعدد الغرز – المعاينة تحاكي النتيجة المتوقعة.', 'Bei Farbverlaufsgarn hängt das Ergebnis von Strickrichtung und Maschenzahl ab – die Vorschau simuliert es.', 'Con hilos multicolor el resultado depende de la dirección y de los puntos por vuelta: la vista previa lo simula.', 'Con i filati multicolore il risultato dipende da direzione e numero di maglie: l\'anteprima lo simula.', 'Avec un fil multicolore, le résultat dépend du sens et du nombre de mailles : l\'aperçu le simule.'],
  };
  ORDER.forEach((l, i) => { for (const [k, arr] of Object.entries(TR)) I18N[l][k] = arr[i]; });

  /* ---------------- כלים משותפים ---------------- */
  const PNG = 'image/png';
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  };
  const ink = (hex) => (lum(hex) > 140 ? '#1d1d1d' : '#ffffff');
  const isRtl = () => LANGS[LANG].dir === 'rtl';
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
  const canvasBlob = (c) => new Promise((res) => c.toBlob(res, PNG));
  const blobDataUrl = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });

  function currentFolder() {
    return nav.current();
  }

  // בחירת תיקייה לשמירה (התיקייה הראשית ותתי-התיקיות שלה)
  function chooseFolder(start) {
    return new Promise((resolve) => {
      const root = nav.root();
      const trail = start && start.id !== root.id ? [{ id: root.id, name: root.name }, start] : [{ id: root.id, name: root.name }];
      const body = el('div');
      const render = async () => {
        const cur = trail[trail.length - 1];
        body.innerHTML = '';
        const crumbs = el('div', { class: 'crumbs' });
        trail.forEach((x, i) => {
          if (i) crumbs.append(el('span', { class: 'sep' }, '›'));
          crumbs.append(i === trail.length - 1 ? el('span', { class: 'cur' }, x.name) : el('button', { onclick: () => { trail.length = i + 1; render(); } }, x.name));
        });
        const ul = el('ul', { class: 'folder-list' }, el('li', { class: 'muted' }, t('loading')));
        body.append(crumbs, ul);
        let list = [];
        try { list = await drive.list(cur.id, true); } catch (e) { err(e); }
        ul.innerHTML = '';
        if (!list.length) ul.append(el('li', { class: 'muted' }, t('stNoSub')));
        for (const f of list) ul.append(el('li', {}, el('button', { onclick: () => { trail.push({ id: f.id, name: f.name }); render(); } }, '📁 ', f.name)));
        foot.textContent = t('stSaveHere', { name: cur.name });
      };
      const foot = el('button', { class: 'btn primary', onclick: () => { closeModal(); resolve(trail[trail.length - 1]); } });
      const mk = el('button', { class: 'btn', onclick: async () => {
        const name = prompt(t('newFolderPrompt')); if (!name) return;
        const f = await busy(t('creatingFolder'), () => drive.mkdir(name, trail[trail.length - 1].id));
        trail.push({ id: f.id, name: f.name }); render();
      } }, t('newFolder'));
      openModal(t('stChooseFolder'), body, [foot, mk]);
      $('#modalClose').onclick = () => { closeModal(); $('#modalClose').onclick = closeModal; resolve(null); };
      render();
    });
  }

  // מסך עריכה במסך מלא: כותרת, שם הדוגמה, תיקיית שמירה ושמירה
  function editorShell(titleText, initialName, existing, onSave) {
    const wrap = el('section', { class: 'studio-editor' });
    let dirty = false;
    const ed = { wrap, folder: null, setDirty: () => { dirty = true; } };
    const cur = currentFolder();
    ed.folder = existing && existing.folderId ? { id: existing.folderId, name: existing.folderName || '…' } : { id: cur.id, name: cur.name };
    const nameIn = el('input', { class: 'studio-name', type: 'text', placeholder: t('stTitlePh'), value: initialName || '' });
    nameIn.addEventListener('input', () => { dirty = true; });
    const close = () => { wrap.remove(); document.body.classList.remove('studio-open'); };
    const back = el('button', { class: 'icon-btn back-arrow', title: t('back'), onclick: () => { if (!dirty || confirm(t('stLeave'))) close(); } }, isRtl() ? '→' : '←');
    const folderBtn = el('button', { class: 'btn small studio-folder-btn', onclick: async () => {
      const f = await chooseFolder(ed.folder); if (f) { ed.folder = f; folderBtn.textContent = t('stFolderBtn', { name: f.name }); dirty = true; }
    } }, t('stFolderBtn', { name: ed.folder.name }));
    if (existing && existing.folderId && !existing.folderName) drive.get(existing.folderId).then((f) => { ed.folder.name = f.name; folderBtn.textContent = t('stFolderBtn', { name: f.name }); }).catch(() => {});
    const saveBtn = el('button', { class: 'btn studio-save', onclick: async () => {
      try { await onSave(nameIn.value.trim() || t('stUntitled')); dirty = false; close(); } catch (e) { err(e); }
    } }, t('stSave'));
    const head = el('header', { class: 'topbar studio-top' }, back, el('div', { class: 'studio-kind' }, titleText), nameIn, folderBtn, saveBtn);
    const body = el('div', { class: 'studio-body' });
    wrap.append(head, body);
    document.body.append(wrap);
    document.body.classList.add('studio-open');
    ed.body = body; ed.nameIn = nameIn;
    return ed;
  }

  // לשוניות בתוך עורך: תרשים / פרטים והוראות
  function editorTabs(ed, panes) {
    const bar = el('div', { class: 'mode-tabs studio-tabs' });
    const btns = panes.map(([label, pane], i) => {
      const b = el('button', { class: 'mode-tab' + (i ? '' : ' on'), onclick: () => {
        btns.forEach((x) => x.classList.remove('on')); b.classList.add('on');
        panes.forEach(([, p2]) => p2.classList.add('hidden')); pane.classList.remove('hidden');
      } }, label);
      if (i) pane.classList.add('hidden');
      return b;
    });
    bar.append(...btns);
    ed.body.append(bar, ...panes.map(([, p2]) => p2));
  }

  // יצירת PDF: מסמך Google זמני מתוך HTML ← ייצוא ל-PDF ← מחיקת הזמני
  async function htmlToPdf(html, folderId) {
    const tmp = await drive.upload(new Blob([html], { type: 'text/html' }), { name: '_tmp_pdf', parents: [folderId], mimeType: 'application/vnd.google-apps.document', appProperties: { kpRole: 'design' } });
    try { return new Blob([await drive.exportPdf(tmp.id)], { type: 'application/pdf' }); } finally { drive.remove(tmp.id).catch(() => {}); }
  }

  // שמירה בדרייב: קובץ נתונים (לעריכה חוזרת) + קבצי התוצאה שמוצגים ברשימת הדוגמאות
  async function saveDesign({ type, name, data, outputs, existing, folderId }) {
    existing = existing || {};
    const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    let jsonId = existing.jsonId;
    if (jsonId) {
      await drive.updateMedia(jsonId, jsonBlob);
      await drive.patch(jsonId, { name: name + '.mypattern.json' });
    } else {
      jsonId = (await drive.upload(jsonBlob, { name: name + '.mypattern.json', parents: [folderId], mimeType: 'application/json', appProperties: { kpRole: 'design', kpType: type } })).id;
    }
    const ids = { ...(existing.ids || {}) };
    for (const out of outputs) {
      const props = { kpDesign: jsonId, kpType: type };
      const oldId = ids[out.key];
      let done = null;
      if (oldId) {
        try {
          await drive.updateMedia(oldId, out.blob);
          await drive.patch(oldId, { name: out.name, appProperties: props });
          idb.del('blobs', 'img:' + oldId); imgUrlCache.delete(oldId);
          done = oldId;
        } catch (e) { console.warn('update failed, creating new', e); }
      }
      if (!done) {
        const meta = { name: out.name, parents: [folderId], appProperties: props };
        if (out.doc) meta.mimeType = 'application/vnd.google-apps.document';
        else if (out.blob.type) meta.mimeType = out.blob.type;
        done = (await drive.upload(out.blob, meta)).id;
        if (oldId) drive.patch(oldId, { trashed: true }).catch(() => {});
      }
      ids[out.key] = done;
    }
    await drive.patch(jsonId, { appProperties: { kpMain: ids.main || null, kpPdf: ids.pdf || null, kpDoc: ids.doc || null } });
    return { jsonId, ids };
  }

  function afterSave(folder) {
    toast(t('stSaved', { name: folder.name }), 4000);
    setTab('patterns');
    dash.load(true);
  }

  /* ---------------- קנבס עם תאים (משותף לתרשים ולמוזאיק) ---------------- */
  // ציור רשת: שורה 0 למטה, העיניים ממוספרות מימין
  function drawGrid(ctx, o) {
    const { W, H, cs, x0, y0 } = o;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < H; r++) {
      const y = y0 + (H - 1 - r) * cs;
      for (let c = 0; c < W; c++) o.cell(r, c, x0 + c * cs, y);
    }
    // קווי רשת
    for (let c = 0; c <= W; c++) {
      const n = W - c; // מספר עין מימין
      ctx.strokeStyle = n % 10 === 0 ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.18)';
      ctx.lineWidth = n % 10 === 0 ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(x0 + c * cs + .5, y0); ctx.lineTo(x0 + c * cs + .5, y0 + H * cs); ctx.stroke();
    }
    for (let r = 0; r <= H; r++) {
      ctx.strokeStyle = r % 10 === 0 ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.18)';
      ctx.lineWidth = r % 10 === 0 ? 1.4 : 1;
      const y = y0 + (H - r) * cs + .5;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + W * cs, y); ctx.stroke();
    }
    // מספרי שורות מימין, מספרי עיניים למטה
    const fs = Math.max(9, Math.min(13, cs * .7));
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    ctx.fillStyle = '#333';
    const every = cs >= 13 ? 1 : cs >= 8 ? 5 : 10;
    for (let r = 0; r < H; r++) {
      if ((r + 1) % every && r !== 0) continue;
      const y = y0 + (H - 1 - r) * cs + cs / 2;
      ctx.fillText(String(r + 1), x0 + W * cs + (o.rowSwatch ? 30 : 16), y);
    }
    for (let c = 0; c < W; c++) {
      const n = W - c;
      if (n % (cs >= 13 ? 5 : 10) && n !== 1) continue;
      ctx.fillText(String(n), x0 + c * cs + cs / 2, y0 + H * cs + 11);
    }
    ctx.restore();
  }
  function cellFromEvent(canvas, e, o) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    const x = (e.clientX - r.left) * sx / o.dpr, y = (e.clientY - r.top) * sy / o.dpr;
    const c = Math.floor((x - o.x0) / o.cs), row = o.H - 1 - Math.floor((y - o.y0) / o.cs);
    if (c < 0 || c >= o.W || row < 0 || row >= o.H) return null;
    return { r: row, c };
  }
  // ציור בגרירה על קנבס
  function paintable(canvas, getO, onCell, onEnd) {
    let down = false, last = '';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => {
      down = true; last = ''; canvas.setPointerCapture(e.pointerId);
      const p = cellFromEvent(canvas, e, getO()); if (p) { last = p.r + ',' + p.c; onCell(p, true); }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!down) return;
      const p = cellFromEvent(canvas, e, getO()); if (!p) return;
      const k = p.r + ',' + p.c; if (k === last) return; last = k; onCell(p, false);
    });
    const up = () => { if (down) { down = false; onEnd && onEnd(); } };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  /* =========================================================
     מוזאיק קרושה (Overlay)
     ========================================================= */
  // כללים: שורה r בצבע C(r) = (start + r) % 2. X בשורה r מכסה את התא שמתחתיו (r-1)
  // ומראה בו את הצבע של שורה r (= הצבע של r-2). אין X מעל X, אין X בשורות 0–1 ובעיני השוליים.
  // לכל עמודה מחשבים בתכנון דינמי את מיקום ה-X שממזער את ההבדל מהתמונה הרצויה.
  function mosaicSolve(m) {
    const { W, H, T } = m;
    const C = (r) => (m.start + r) % 2;
    const X = new Uint8Array(W * H);
    const INF = 1e9;
    const d0 = new Float64Array(H), d1 = new Float64Array(H);
    const b0 = new Uint8Array(H), b1 = new Uint8Array(H);
    for (let c = 0; c < W; c++) {
      if (m.edges && (c === 0 || c === W - 1)) continue;
      const cost = (r, xNext) => (((xNext ? C(r + 1) : C(r)) !== T[r * W + c]) ? 1 : 0);
      d0[0] = 0; d1[0] = INF;
      for (let k = 1; k < H; k++) {
        // x_k = 0
        const a = d0[k - 1] + cost(k - 1, 0), b = d1[k - 1] + cost(k - 1, 0);
        if (a <= b) { d0[k] = a; b0[k] = 0; } else { d0[k] = b; b0[k] = 1; }
        // x_k = 1 (רק משורה 2, ולא מעל X)
        d1[k] = k < 2 ? INF : d0[k - 1] + cost(k - 1, 1);
        b1[k] = 0;
      }
      let s = (d0[H - 1] + cost(H - 1, 0) <= d1[H - 1] + cost(H - 1, 0)) ? 0 : 1;
      for (let k = H - 1; k >= 0; k--) {
        X[k * W + c] = s;
        s = s ? b1[k] : b0[k];
      }
    }
    // התוצאה הנראית ושגיאות
    const D = new Uint8Array(W * H);
    let errors = 0, xs = 0;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const i = r * W + c;
        const covered = r + 1 < H && X[(r + 1) * W + c];
        D[i] = covered ? C(r + 1) : C(r);
        if (X[i]) xs++;
        const edge = m.edges && (c === 0 || c === W - 1);
        if (!edge && r >= 2 && D[i] !== T[i]) errors++;
      }
    }
    return { X, D, errors, xs };
  }

  function otsu(values) {
    const hist = new Array(256).fill(0);
    for (const v of values) hist[v | 0]++;
    const total = values.length;
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) ** 2;
      if (between > best) { best = between; thr = i; }
    }
    return thr;
  }
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  // תמונה ← ערכי בהירות ברזולוציית התרשים
  function sampleImage(img, inner) {
    const rows = Math.max(4, Math.round(inner * img.height / img.width));
    const cv = document.createElement('canvas');
    cv.width = inner; cv.height = rows;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, inner, rows);
    ctx.drawImage(img, 0, 0, inner, rows);
    const px = ctx.getImageData(0, 0, inner, rows).data;
    const L = new Uint8Array(inner * rows), rgb = new Uint8Array(inner * rows * 3);
    for (let i = 0; i < inner * rows; i++) {
      L[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
      rgb[i * 3] = px[i * 4]; rgb[i * 3 + 1] = px[i * 4 + 1]; rgb[i * 3 + 2] = px[i * 4 + 2];
    }
    return { L, rgb, inner, rows };
  }

  function buildTarget(m) {
    const s = m.src;
    const inner = s.inner, W = inner + (m.edges ? 2 : 0), H = s.rows + 2;
    const T = new Uint8Array(W * H);
    const C = (r) => (m.start + r) % 2;
    const sum = [[0, 0, 0, 0], [0, 0, 0, 0]];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const ic = c - (m.edges ? 1 : 0);
        if (r < 2 || ic < 0 || ic >= inner) { T[r * W + c] = C(r); continue; }
        const i = (s.rows - 1 - (r - 2)) * inner + ic;
        let v = s.L[i] < m.threshold ? 1 : 0;
        if (m.invert) v = 1 - v;
        T[r * W + c] = v;
        const acc = sum[v]; acc[0] += s.rgb[i * 3]; acc[1] += s.rgb[i * 3 + 1]; acc[2] += s.rgb[i * 3 + 2]; acc[3]++;
      }
    }
    m.W = W; m.H = H; m.T = T;
    if (!m.userColors) m.colors = sum.map((a, k) => (a[3] ? hex(a[0] / a[3], a[1] / a[3], a[2] / a[3]) : (k ? '#2f3e46' : '#f4ede1')));
  }

  function renderMosaic(canvas, m, res, cs, opts = {}) {
    const dpr = opts.dpr || Math.min(2, window.devicePixelRatio || 1);
    const x0 = 6, y0 = 6, W = m.W, H = m.H;
    const width = x0 + W * cs + 46, height = y0 + H * cs + 22;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    const C = (r) => (m.start + r) % 2;
    const o = { W, H, cs, x0, y0, dpr, rowSwatch: true };
    drawGrid(ctx, { ...o, cell: (r, c, x, y) => {
      const i = r * W + c;
      const sr = r + 1 < H && res.X[(r + 1) * W + c] ? r + 1 : r; // השורה שהעין שלה נראית כאן
      const col = m.plan ? m._rowCols[sr][c] : m.colors[res.D[i]];
      ctx.fillStyle = col; ctx.fillRect(x, y, cs, cs);
      if (res.X[i]) {
        ctx.strokeStyle = ink(col); ctx.lineWidth = Math.max(1.2, cs * .12); ctx.lineCap = 'round';
        const p = cs * .24;
        ctx.beginPath(); ctx.moveTo(x + p, y + p); ctx.lineTo(x + cs - p, y + cs - p);
        ctx.moveTo(x + cs - p, y + p); ctx.lineTo(x + p, y + cs - p); ctx.stroke();
      }
      const edge = m.edges && (c === 0 || c === W - 1);
      if (opts.showErr && !edge && r >= 2 && res.D[i] !== m.T[i]) {
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x + cs * .78, y + cs * .22, Math.max(1.8, cs * .14), 0, 7); ctx.fill();
      }
    } });
    // צבע כל שורה בצד
    for (let r = 0; r < H; r++) {
      const y = y0 + (H - 1 - r) * cs;
      if (m.plan) { const yn = m.plan.yarns[m.plan.seq[r]] || m.plan.yarns[0]; const n = yn.colors.length; yn.colors.forEach((cc, j) => { ctx.fillStyle = cc; ctx.fillRect(x0 + W * cs + 4, y + 1 + j * (cs - 2) / n, 12, (cs - 2) / n); }); }
      else { ctx.fillStyle = m.colors[C(r)]; ctx.fillRect(x0 + W * cs + 4, y + 1, 12, cs - 2); }
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.strokeRect(x0 + W * cs + 4.5, y + 1.5, 11, cs - 3);
    }
    return o;
  }

  function mosaicInstructions(m, res) {
    const C = (r) => (m.start + r) % 2;
    const rowName = (r) => (m.plan ? yarnLabel(m.plan.yarns[m.plan.seq[r]], m.plan.seq[r]) : (C(r) ? t('mB') : t('mA')));
    const lines = [];
    lines.push(t('mRow', { r: 1, c: rowName(0), s: t('mFoundation', { n: m.W + 1, m: m.W }) }));
    lines.push(t('mRow', { r: 2, c: rowName(1), s: t('mPlain', { n: m.W }) }));
    for (let r = 2; r < m.H; r++) {
      const runs = [];
      for (let c = m.W - 1; c >= 0; c--) { // מימין לשמאל
        const k = m.X ? 0 : 0; void k;
        const st = res.X[r * m.W + c] ? 'dc' : 'sc';
        if (runs.length && runs[runs.length - 1][0] === st) runs[runs.length - 1][1]++; else runs.push([st, 1]);
      }
      lines.push(t('mRow', { r: r + 1, c: rowName(r), s: runs.map(([st, n]) => `${n} ${st}`).join(', ') }));
    }
    return lines;
  }

  async function exportMosaicPng(m, res, title) {
    const cs = Math.max(10, Math.min(22, Math.floor(2400 / Math.max(m.W, m.H))));
    const chart = document.createElement('canvas');
    renderMosaic(chart, m, res, cs, { dpr: 1 });
    const pad = 24, head = 70, foot = 70;
    const out = document.createElement('canvas');
    out.width = chart.width + pad * 2; out.height = chart.height + head + foot;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    ctx.direction = isRtl() ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl() ? 'right' : 'left';
    const tx = isRtl() ? out.width - pad : pad;
    ctx.fillStyle = '#10282a'; ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(title, tx, 34);
    ctx.font = '15px system-ui, sans-serif'; ctx.fillStyle = '#555';
    ctx.fillText(`${t('stMosaic')} · ${t('mSize', { w: m.W, h: m.H })}`, tx, 58);
    ctx.drawImage(chart, pad, head);
    // מקרא
    const ly = head + chart.height + 22;
    ctx.font = '14px system-ui, sans-serif'; ctx.fillStyle = '#222';
    ctx.fillText(t('mAbbrLine'), tx, ly + 12);
    const sw = (x, col, label) => { ctx.fillStyle = col; ctx.fillRect(x, ly + 26, 18, 18); ctx.strokeStyle = '#999'; ctx.strokeRect(x + .5, ly + 26.5, 17, 17); ctx.fillStyle = '#222'; ctx.textAlign = 'left'; ctx.direction = 'ltr'; ctx.fillText(label, x + 24, ly + 40); };
    sw(pad, m.colors[0], `${t('mColorA')} ${m.colors[0]}`);
    sw(pad + 200, m.colors[1], `${t('mColorB')} ${m.colors[1]}`);
    return canvasBlob(out);
  }

  function mosaicDocHtml(title, m, res, pngDataUrl) {
    const dir = isRtl() ? 'rtl' : 'ltr';
    const rows = mosaicInstructions(m, res).map((l) => `<p style="margin:2px 0">${esc(l)}</p>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"></head><body dir="${dir}" style="font-family:Arial,sans-serif">
<h1>${esc(title)}</h1>
<p><b>${esc(t('stMosaic'))}</b> · ${esc(t('mSize', { w: m.W, h: m.H }))}</p>
<p><span style="background:${m.colors[0]};border:1px solid #999">&nbsp;&nbsp;&nbsp;&nbsp;</span> ${esc(t('mColorA'))} (${m.colors[0]}) &nbsp; <span style="background:${m.colors[1]};border:1px solid #999">&nbsp;&nbsp;&nbsp;&nbsp;</span> ${esc(t('mColorB'))} (${m.colors[1]})</p>
<h2>${esc(t('wAbbr'))}</h2><p>${esc(t('mAbbrLine'))}</p><p>${esc(t('mMethod'))}</p>
<h2>${esc(t('mChartTitle'))}</h2>${pngDataUrl ? `<p><img src="${pngDataUrl}" style="max-width:100%"></p>` : ''}
<h2>${esc(t('wInstructions'))}</h2>${rows}
</body></html>`;
  }

  async function mosaicEditor(data, existing) {
    const { d: defaults } = await busy(t('loading'), loadDefaults);
    const info = data && data.info ? { ...emptyInfo('crochet'), ...data.info } : { ...emptyInfo('crochet'), designer: defaults.designer || '' };
    info.craft = 'crochet';
    const m = data ? {
      W: data.W, H: data.H, start: data.start || 0, edges: !!data.edges, colors: data.colors, userColors: true,
      T: fromB64(data.T), threshold: 128, invert: false, src: null,
    } : { W: 40, H: 30, start: 0, edges: true, colors: ['#f4ede1', '#0f5e63'], userColors: false, threshold: 128, invert: false, src: null };
    if (!data) { m.T = new Uint8Array(m.W * m.H); for (let r = 0; r < m.H; r++) for (let c = 0; c < m.W; c++) m.T[r * m.W + c] = (m.start + r) % 2; }
    m.plan = data && data.plan ? data.plan : null;
    const planFit = () => {
      if (!m.plan) return;
      while (m.plan.seq.length < m.H) m.plan.seq.push((m.start + m.plan.seq.length) % 2);
      m.plan.seq.length = m.H;
      m._rowCols = rowStitchColors(m.plan.yarns, m.plan.seq, m.W, m.H, 'round'); // במוזאיק כל השורות מהצד הקדמי
    };
    planFit();
    let res = mosaicSolve(m);
    let cs = 16, brush = 1, showErr = true, withPdf = !existing || !!(existing.ids && existing.ids.pdf);
    const ed = editorShell('🟪 ' + t('stMosaic'), (data && data.title) || '', existing, save);

    const canvas = el('canvas', { class: 'studio-canvas' });
    const stats = el('div', { class: 'studio-stats' });
    let o = null;
    const redraw = () => {
      o = renderMosaic(canvas, m, res, cs, { showErr });
      stats.textContent = res.errors ? t('mStats', { x: res.xs, e: res.errors }) : t('mStatsOk', { x: res.xs });
      stats.classList.toggle('ok', !res.errors);
      sizeLbl.textContent = t('mSize', { w: m.W, h: m.H });
    };
    const solve = () => { planFit(); res = mosaicSolve(m); redraw(); };

    // --- מקור: תמונה או ריק ---
    const widthIn = el('input', { type: 'number', min: '10', max: '250', value: String(m.W), class: 'num' });
    const heightIn = el('input', { type: 'number', min: '6', max: '300', value: String(m.H), class: 'num' });
    const thr = el('input', { type: 'range', min: '10', max: '245', value: '128' });
    const imgRow = el('div', { class: 'studio-row hidden' }, el('span', {}, t('mThreshold')), thr,
      el('button', { class: 'btn small', onclick: () => { m.invert = !m.invert; rebuild(); } }, t('mInvert')));
    const rebuild = () => {
      if (m.src) { m.threshold = Number(thr.value); buildTarget(m); colorA.value = m.colors[0]; colorB.value = m.colors[1]; widthIn.value = m.W; heightIn.value = m.H; }
      ed.setDirty(); solve();
    };
    thr.addEventListener('input', rebuild);
    const fromImage = el('button', { class: 'btn primary', onclick: async () => {
      const f = await pickFile($('#imageInput'));
      if (!f) return;
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(t('invalidImage'))); i.src = URL.createObjectURL(f); });
      const inner = Math.max(8, Number(widthIn.value) - (m.edges ? 2 : 0));
      m.img = img; m.src = sampleImage(img, inner); m.userColors = false;
      m.threshold = otsu(m.src.L); thr.value = String(m.threshold);
      imgRow.classList.remove('hidden');
      rebuild();
    } }, t('mFromImage'));
    const blank = el('button', { class: 'btn', onclick: () => {
      m.src = null; m.img = null; imgRow.classList.add('hidden');
      resize(Number(widthIn.value), Number(heightIn.value), true);
    } }, t('mBlank'));
    const resize = (w, h, clear) => {
      w = Math.max(10, Math.min(250, w | 0)); h = Math.max(6, Math.min(300, h | 0));
      if (m.src && m.img && !clear) { m.src = sampleImage(m.img, w - (m.edges ? 2 : 0)); rebuild(); return; }
      const T = new Uint8Array(w * h);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
        T[r * w + c] = (!clear && r < m.H && c < m.W) ? m.T[r * m.W + c] : (m.start + r) % 2;
      }
      m.W = w; m.H = h; m.T = T; widthIn.value = w; heightIn.value = h; ed.setDirty(); solve();
    };
    const applySize = el('button', { class: 'btn small', onclick: () => resize(Number(widthIn.value), Number(heightIn.value), false) }, t('stApplySize'));

    // --- צבעים ומברשת ---
    const colorA = el('input', { type: 'color', value: m.colors[0] });
    const colorB = el('input', { type: 'color', value: m.colors[1] });
    colorA.oninput = () => { m.colors[0] = colorA.value; m.userColors = true; ed.setDirty(); redraw(); updBrush(); };
    colorB.oninput = () => { m.colors[1] = colorB.value; m.userColors = true; ed.setDirty(); redraw(); updBrush(); };
    const bA = el('button', { class: 'brush', onclick: () => { brush = 0; updBrush(); } }, t('mA'));
    const bB = el('button', { class: 'brush', onclick: () => { brush = 1; updBrush(); } }, t('mB'));
    const updBrush = () => {
      bA.style.background = m.colors[0]; bA.style.color = ink(m.colors[0]); bA.classList.toggle('on', brush === 0);
      bB.style.background = m.colors[1]; bB.style.color = ink(m.colors[1]); bB.classList.toggle('on', brush === 1);
    };
    const edges = el('input', { type: 'checkbox' }); edges.checked = m.edges;
    edges.onchange = () => {
      m.edges = edges.checked;
      if (m.src) { rebuild(); return; }
      ed.setDirty(); solve();
    };
    const errChk = el('input', { type: 'checkbox' }); errChk.checked = showErr;
    errChk.onchange = () => { showErr = errChk.checked; redraw(); };
    const docChk = el('input', { type: 'checkbox' }); docChk.checked = withPdf;
    docChk.onchange = () => { withPdf = docChk.checked; };
    const zoom = el('input', { type: 'range', min: '6', max: '34', value: String(cs) });
    zoom.oninput = () => { cs = Number(zoom.value); redraw(); };
    const sizeLbl = el('span', { class: 'muted' });

    paintable(canvas, () => o, (p) => {
      if (p.r < 2 || (m.edges && (p.c === 0 || p.c === m.W - 1))) return;
      m.T[p.r * m.W + p.c] = brush; ed.setDirty();
      solve();
    });

    // תכנון צבעים לפי שורות (PRO)
    const usePlan = el('input', { type: 'checkbox' }); usePlan.checked = !!m.plan;
    const planHolder = el('div', {});
    const buildPlan = () => {
      planHolder.innerHTML = '';
      if (!m.plan) return;
      planHolder.append(planEditor(m.plan, (r) => t('cpRowN', { n: r + 1 }), () => { ed.setDirty(); planFit(); redraw(); }));
    };
    usePlan.onchange = () => {
      m.plan = usePlan.checked ? { yarns: [{ ...newYarn(m.colors[0]), name: '' }, { ...newYarn(m.colors[1]), name: '' }], seq: [] } : null;
      planFit(); buildPlan(); ed.setDirty(); redraw();
    };
    const planWrap = el('details', { class: 'studio-help', open: m.plan ? '' : null },
      el('summary', {}, t('cpMosaicColors'), ' ', el('span', { class: 'pro-badge' }, t('cpPro'))),
      el('label', { class: 'chk' }, usePlan, t('cpUsePlan')), planHolder);
    buildPlan();
    const chartPane = el('div', {});
    editorTabs(ed, [[t('tabChart'), chartPane], [t('tabInfo'), infoForm(info, ed, { fixedCraft: true })]]);
    chartPane.append(
      el('div', { class: 'studio-panel' },
        el('div', { class: 'studio-row' }, fromImage, blank),
        el('p', { class: 'muted small-note' }, t('mPhotoTip')),
        el('div', { class: 'studio-row' }, el('label', {}, t('stWidth'), widthIn), el('label', {}, t('stHeight'), heightIn), applySize, sizeLbl),
        imgRow,
        el('div', { class: 'studio-row' }, el('label', {}, t('mColorA'), colorA), el('label', {}, t('mColorB'), colorB),
          el('span', {}, t('mPaint')), bA, bB),
        el('div', { class: 'studio-row' }, el('label', { class: 'chk' }, edges, t('mEdges')), el('label', { class: 'chk' }, errChk, t('mShowErr'))),
        el('div', { class: 'studio-row' }, el('label', {}, t('stCellSize'), zoom), el('label', { class: 'chk' }, docChk, t('exportPdf'))),
        el('details', { class: 'studio-help' }, el('summary', {}, 'ℹ️ ' + t('stMosaic')), el('p', {}, t('mRules'))),
        planWrap),
      stats,
      el('div', { class: 'studio-canvas-wrap' }, canvas));
    updBrush(); redraw();

    async function save(name) {
      const png = await exportMosaicPng(m, res, name);
      const data2 = { type: 'mosaic', v: 2, title: name, W: m.W, H: m.H, start: m.start, edges: m.edges, colors: m.colors, T: toB64(m.T), info, plan: m.plan };
      await busy(t('stSaving'), async () => {
        const outputs = [{ key: 'main', blob: png, name: name + '.png' }];
        if (withPdf) {
          $('#busyText').textContent = t('pdfMaking');
          const rows = [t('mAbbrLine'), t('mMethod'), ...mosaicInstructions(m, res)];
          const html = patternHtml({ title: name, w: info, chartUrl: await blobDataUrl(png), rows, defaults, kind: t('stMosaic') });
          outputs.push({ key: 'pdf', blob: await htmlToPdf(html, ed.folder.id), name: name + '.pdf' });
        }
        return saveDesign({ type: 'mosaic', name, data: data2, outputs, existing, folderId: ed.folder.id });
      });
      afterSave(ed.folder);
    }
  }

  /* =========================================================
     תרשים סמלים – סריגה וקרושה
     ========================================================= */
  const SYMBOLS = {
    knit: ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl', 'm1', 'bobble', 'cable', 'no'],
    crochet: ['ch', 'slst', 'sc', 'hdc', 'dc', 'tr', 'inc', 'dec', 'puff', 'no'],
  };
  const SYM_NAME = { k: 'syK', p: 'syP', yo: 'syYo', k2tog: 'syK2tog', ssk: 'sySsk', sl: 'sySl', m1: 'syM1', bobble: 'syBobble', cable: 'syCable', no: 'syNo',
    ch: 'syCh', slst: 'sySlst', sc: 'sySc', hdc: 'syHdc', dc: 'syDc', tr: 'syTr', inc: 'syInc', dec: 'syDec', puff: 'syPuff' };

  function drawSymbol(ctx, id, x, y, s, col) {
    const cx = x + s / 2, cy = y + s / 2, p = s * .2;
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, s * .1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (...pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
    const T = (bars) => { // T עם קווים אלכסוניים (עמודים בקרושה)
      line(x + p, y + p, x + s - p, y + p); line(cx, y + p, cx, y + s - p);
      for (let i = 0; i < bars; i++) { const yy = y + s * (.42 + i * .16); line(cx - s * .17, yy + s * .07, cx + s * .17, yy - s * .07); }
    };
    switch (id) {
      case 'k': break;
      case 'p': ctx.beginPath(); ctx.arc(cx, cy, s * .14, 0, 7); ctx.fill(); break;
      case 'yo': ctx.beginPath(); ctx.arc(cx, cy, s * .28, 0, 7); ctx.stroke(); break;
      case 'k2tog': line(x + p, y + s - p, x + s - p, y + p); break;
      case 'ssk': line(x + p, y + p, x + s - p, y + s - p); break;
      case 'sl': line(x + p, y + p, cx, y + s - p, x + s - p, y + p); break;
      case 'm1': line(x + p, y + s - p, x + p, y + p, cx, cy, x + s - p, y + p, x + s - p, y + s - p); break;
      case 'bobble': ctx.beginPath(); ctx.arc(cx, cy, s * .3, 0, 7); ctx.fill(); break;
      case 'cable': line(x + p, y + s - p, x + s - p, y + p); line(x + p, y + p, cx - s * .08, cy - s * .08); line(cx + s * .08, cy + s * .08, x + s - p, y + s - p); break;
      case 'no': ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x, y, s, s); break;
      case 'ch': ctx.beginPath(); ctx.ellipse(cx, cy, s * .32, s * .18, 0, 0, 7); ctx.stroke(); break;
      case 'slst': ctx.beginPath(); ctx.ellipse(cx, cy, s * .2, s * .12, 0, 0, 7); ctx.fill(); break;
      case 'sc': line(x + p, y + p, x + s - p, y + s - p); line(x + s - p, y + p, x + p, y + s - p); break;
      case 'hdc': T(0); break;
      case 'dc': T(1); break;
      case 'tr': T(2); break;
      case 'inc': line(x + p, y + p, cx, y + s - p, x + s - p, y + p); line(cx - s * .1, y + s * .45, cx - s * .26, y + s * .32); line(cx + s * .1, y + s * .45, cx + s * .26, y + s * .32); break;
      case 'dec': line(x + p, y + s - p, cx, y + p, x + s - p, y + s - p); break;
      case 'puff': ctx.beginPath(); ctx.ellipse(cx, cy, s * .2, s * .34, 0, 0, 7); ctx.fill(); break;
      default: break;
    }
    ctx.restore();
  }

  function renderChart(canvas, ch, cs, dprIn) {
    const dpr = dprIn || Math.min(2, window.devicePixelRatio || 1);
    const x0 = 6, y0 = 6, W = ch.W, H = ch.H;
    const width = x0 + W * cs + 34, height = y0 + H * cs + 22;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    const o = { W, H, cs, x0, y0, dpr };
    drawGrid(ctx, { ...o, cell: (r, c, x, y) => {
      const i = r * W + c, col = ch.Cc[i] || '#ffffff';
      ctx.fillStyle = col; ctx.fillRect(x, y, cs, cs);
      if (ch.S[i]) drawSymbol(ctx, ch.S[i], x, y, cs, ink(col));
    } });
    return o;
  }

  async function exportChartPng(ch, title) {
    const cs = Math.max(14, Math.min(28, Math.floor(2200 / Math.max(ch.W, ch.H))));
    const chart = document.createElement('canvas');
    renderChart(chart, ch, cs, 1);
    const used = [...new Set(ch.S.filter(Boolean))];
    const colors = [...new Set(ch.Cc.filter(Boolean))];
    const pad = 24, head = 70, lineH = 30;
    const legendRows = used.length + colors.length;
    const out = document.createElement('canvas');
    out.width = Math.max(chart.width + pad * 2, 520); out.height = head + chart.height + 40 + legendRows * lineH + 20;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    const rtl = isRtl();
    ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
    const tx = rtl ? out.width - pad : pad;
    ctx.fillStyle = '#10282a'; ctx.font = '700 24px system-ui, sans-serif'; ctx.fillText(title, tx, 34);
    ctx.font = '15px system-ui, sans-serif'; ctx.fillStyle = '#555';
    ctx.fillText(`${ch.craft === 'crochet' ? t('stCrochet') : t('stKnit')} · ${t('mSize', { w: ch.W, h: ch.H })}`, tx, 58);
    ctx.drawImage(chart, pad, head);
    let y = head + chart.height + 30;
    ctx.font = '700 16px system-ui, sans-serif'; ctx.fillStyle = '#222'; ctx.fillText(t('stLegend'), tx, y); y += 12;
    ctx.font = '15px system-ui, sans-serif';
    for (const id of used) {
      const bx = rtl ? out.width - pad - 22 : pad;
      ctx.fillStyle = '#fff'; ctx.fillRect(bx, y, 22, 22); ctx.strokeStyle = '#999'; ctx.strokeRect(bx + .5, y + .5, 21, 21);
      drawSymbol(ctx, id, bx, y, 22, '#222');
      ctx.fillStyle = '#222'; ctx.fillText(t(SYM_NAME[id]), rtl ? bx - 10 : bx + 32, y + 16);
      y += lineH;
    }
    const names = colorLabels(ch);
    for (const c of colors) {
      const bx = rtl ? out.width - pad - 22 : pad;
      ctx.fillStyle = c; ctx.fillRect(bx, y, 22, 22); ctx.strokeStyle = '#999'; ctx.strokeRect(bx + .5, y + .5, 21, 21);
      ctx.fillStyle = '#222'; ctx.fillText(names[c], rtl ? bx - 10 : bx + 32, y + 16);
      y += lineH;
    }
    return canvasBlob(out);
  }

  // תיאור מילולי של התרשים, שורה אחר שורה
  const SYM_ABBR = { k: 'k', p: 'p', yo: 'yo', k2tog: 'k2tog', ssk: 'ssk', sl: 'sl', m1: 'M1', bobble: 'MB', cable: 'C', no: '—',
    ch: 'ch', slst: 'sl st', sc: 'sc', hdc: 'hdc', dc: 'dc', tr: 'tr', inc: 'inc', dec: 'dec', puff: 'puff' };
  const WS_SWAP = { k: 'p', p: 'k' };
  function colorLabels(ch) {
    const used = [...new Set(ch.Cc.filter(Boolean))];
    const names = {};
    used.forEach((c, i) => { names[c] = (ch.colorNames && ch.colorNames[c]) || String.fromCharCode(65 + (i % 26)); });
    return names;
  }
  function chartInstructions(ch) {
    const names = colorLabels(ch);
    const hasSym = ch.S.some(Boolean);
    const lines = [];
    for (let r = 0; r < ch.H; r++) {
      const ws = ch.work === 'flat' && r % 2 === 1;
      const cols = [];
      for (let k = 0; k < ch.W; k++) cols.push(ws ? k : ch.W - 1 - k); // צד ימין: מימין לשמאל; צד שמאל: משמאל לימין
      const runs = [];
      for (const c of cols) {
        const i = r * ch.W + c;
        let sym = ch.S[i] || (hasSym || !ch.Cc[i] ? (ch.craft === 'crochet' ? 'sc' : 'k') : '');
        if (sym === 'no') continue;
        if (ws && ch.craft === 'knit' && WS_SWAP[sym]) sym = WS_SWAP[sym];
        let tok = sym ? SYM_ABBR[sym] : '';
        if (ch.Cc[i]) tok = tok ? `${tok} (${names[ch.Cc[i]]})` : names[ch.Cc[i]];
        if (!tok) tok = ch.craft === 'crochet' ? 'sc' : 'k';
        if (runs.length && runs[runs.length - 1][0] === tok) runs[runs.length - 1][1]++; else runs.push([tok, 1]);
      }
      const txt = runs.map(([tok, n]) => `${n} ${tok}`).join(', ');
      const key = ch.work === 'round' ? 'cRowRound' : ws ? 'cRowWS' : 'cRowRS';
      lines.push(t(key, { r: r + 1, s: txt }));
    }
    const legend = Object.entries(names).map(([c, n]) => `${n} = ${c}`);
    return legend.length ? [legend.join(' · '), ...lines] : lines;
  }

  async function chartEditor(data, existing) {
    const { d: defaults } = await busy(t('loading'), loadDefaults);
    const ch = data ? { W: data.W, H: data.H, craft: data.craft || 'knit', S: data.S, Cc: data.Cc, palette: data.palette || [], colorNames: data.colorNames || {}, work: data.work || 'flat' }
      : { W: 20, H: 16, craft: 'knit', S: new Array(320).fill(''), Cc: new Array(320).fill(''), palette: [], colorNames: {}, work: 'flat' };
    const info = data && data.info ? { ...emptyInfo(ch.craft), ...data.info } : { ...emptyInfo(ch.craft), designer: defaults.designer || '' };
    let cs = 24, tool = { kind: 'color', c: '#0f5e63' };
    let withPdf = !existing || !!(existing.ids && existing.ids.pdf);
    const undo = [];
    const ed = editorShell('🎨 ' + t('stChart'), (data && data.title) || '', existing, save);
    const canvas = el('canvas', { class: 'studio-canvas' });
    let o = null;
    const redraw = () => { o = renderChart(canvas, ch, cs); };

    const craftSel = el('select', {}, el('option', { value: 'knit' }, t('stKnit')), el('option', { value: 'crochet' }, t('stCrochet')));
    craftSel.value = ch.craft;
    const setCraft = (c) => { ch.craft = c; info.craft = c; craftSel.value = c; if (tool.kind === 'sym') tool = { kind: 'sym', id: SYMBOLS[c][1] }; buildPalette(); ed.setDirty(); };
    craftSel.onchange = () => setCraft(craftSel.value);
    const workSel = el('select', {}, el('option', { value: 'flat' }, t('cWorkFlat')), el('option', { value: 'round' }, t('cWorkRound')));
    workSel.value = ch.work; workSel.onchange = () => { ch.work = workSel.value; ed.setDirty(); };
    const widthIn = el('input', { type: 'number', min: '2', max: '200', value: String(ch.W), class: 'num' });
    const heightIn = el('input', { type: 'number', min: '2', max: '300', value: String(ch.H), class: 'num' });
    const applySize = el('button', { class: 'btn small', onclick: () => {
      const w = Math.max(2, Math.min(200, Number(widthIn.value) | 0)), h = Math.max(2, Math.min(300, Number(heightIn.value) | 0));
      const S = new Array(w * h).fill(''), Cc = new Array(w * h).fill('');
      for (let r = 0; r < Math.min(h, ch.H); r++) for (let c = 0; c < Math.min(w, ch.W); c++) {
        const oc = ch.W - 1 - c, nc = w - 1 - c; // שומרים על עין 1 (מימין) במקומה
        S[r * w + nc] = ch.S[r * ch.W + oc]; Cc[r * w + nc] = ch.Cc[r * ch.W + oc];
      }
      ch.W = w; ch.H = h; ch.S = S; ch.Cc = Cc; ed.setDirty(); redraw();
    } }, t('stApplySize'));

    const palBox = el('div', { class: 'sym-palette' });
    const colBox = el('div', { class: 'sym-palette' });
    const customColor = el('input', { type: 'color', value: '#f6c453' });
    const nameIn = el('input', { type: 'text', class: 'color-name', placeholder: t('colorName') });
    nameIn.oninput = () => { if (tool.kind === 'color') { ch.colorNames[tool.c] = nameIn.value; ed.setDirty(); } };
    const symName = el('div', { class: 'sym-name' });
    const setTool = (t2) => { tool = t2; buildPalette(); };
    function buildPalette() {
      colBox.innerHTML = '';
      const cols = ['#ffffff', ...new Set([...ch.palette, ...ch.Cc.filter(Boolean), '#0f5e63', '#f6c453', '#ff7a59', '#8a4f7d', '#2e86de', '#27ae60', '#e84393', '#1d1d1d'])].slice(0, 16);
      for (const c of cols) colBox.append(el('button', { class: 'sym-btn color' + (tool.kind === 'color' && tool.c === c ? ' on' : ''), style: `background:${c}`, title: c, onclick: () => setTool({ kind: 'color', c }) }));
      colBox.append(customColor);
      palBox.innerHTML = '';
      for (const id of SYMBOLS[ch.craft]) {
        const cv = el('canvas', { width: '34', height: '34' });
        const c2 = cv.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, 34, 34); drawSymbol(c2, id, 3, 3, 28, '#222');
        palBox.append(el('button', { class: 'sym-btn' + (tool.kind === 'sym' && tool.id === id ? ' on' : ''), title: t(SYM_NAME[id]), onclick: () => setTool({ kind: 'sym', id }) }, cv));
      }
      palBox.append(el('button', { class: 'sym-btn wide' + (tool.kind === 'erase' ? ' on' : ''), onclick: () => setTool({ kind: 'erase' }) }, t('stEraser')));
      symName.textContent = tool.kind === 'sym' ? t(SYM_NAME[tool.id]) : tool.kind === 'erase' ? t('stEraser') : '';
      nameIn.classList.toggle('hidden', !(tool.kind === 'color' && tool.c !== '#ffffff'));
      if (tool.kind === 'color') nameIn.value = ch.colorNames[tool.c] || '';
    }
    customColor.oninput = () => { if (!ch.palette.includes(customColor.value)) ch.palette.unshift(customColor.value); setTool({ kind: 'color', c: customColor.value }); };
    const undoBtn = el('button', { class: 'btn small', onclick: () => { const u = undo.pop(); if (u) { ch.S = u.S; ch.Cc = u.Cc; redraw(); } } }, t('stUndo'));
    const zoom = el('input', { type: 'range', min: '10', max: '44', value: String(cs) });
    zoom.oninput = () => { cs = Number(zoom.value); redraw(); };
    const pdfChk = el('input', { type: 'checkbox' }); pdfChk.checked = withPdf; pdfChk.onchange = () => { withPdf = pdfChk.checked; };

    paintable(canvas, () => o, (p, first) => {
      if (first) { undo.push({ S: ch.S.slice(), Cc: ch.Cc.slice() }); if (undo.length > 40) undo.shift(); }
      const i = p.r * ch.W + p.c;
      if (tool.kind === 'sym') ch.S[i] = tool.id;
      else if (tool.kind === 'color') ch.Cc[i] = tool.c === '#ffffff' ? '' : tool.c;
      else { ch.S[i] = ''; ch.Cc[i] = ''; }
      ed.setDirty(); redraw();
    });

    const chartPane = el('div', {},
      el('div', { class: 'studio-panel' },
        el('div', { class: 'studio-row' }, el('label', {}, t('stCraft'), craftSel), el('label', {}, workSel)),
        el('div', { class: 'studio-row' }, el('label', {}, t('stWidth'), widthIn), el('label', {}, t('stHeight'), heightIn), applySize),
        el('div', { class: 'studio-sub' }, t('stColors')), colBox, nameIn,
        el('div', { class: 'studio-sub' }, t('stSymbols')), palBox,
        el('div', { class: 'studio-row' }, symName, undoBtn, el('label', {}, t('stCellSize'), zoom)),
        el('label', { class: 'chk' }, pdfChk, t('exportPdf')),
        el('p', { class: 'muted small-note' }, t('stChartTip'))),
      el('div', { class: 'studio-canvas-wrap' }, canvas));
    editorTabs(ed, [[t('tabChart'), chartPane], [t('tabInfo'), infoForm(info, ed, { onCraft: (c) => setCraft(c) })]]);
    buildPalette(); redraw();

    async function save(name) {
      const png = await exportChartPng(ch, name);
      const data2 = { type: 'chart', v: 2, title: name, W: ch.W, H: ch.H, craft: ch.craft, S: ch.S, Cc: ch.Cc, palette: ch.palette, colorNames: ch.colorNames, work: ch.work, info };
      await busy(t('stSaving'), async () => {
        const outputs = [{ key: 'main', blob: png, name: name + '.png' }];
        if (withPdf) {
          $('#busyText').textContent = t('pdfMaking');
          const html = patternHtml({ title: name, w: info, chartUrl: await blobDataUrl(png), rows: chartInstructions(ch), defaults, kind: t('stChart') });
          outputs.push({ key: 'pdf', blob: await htmlToPdf(html, ed.folder.id), name: name + '.pdf' });
        }
        return saveDesign({ type: 'chart', name, data: data2, outputs, existing, folderId: ed.folder.id });
      });
      afterSave(ed.folder);
    }
  }

  /* =========================================================
     תכנון צבעים – חוטים חלקים, מחליפי צבעים וגרדיאנט
     ========================================================= */
  const LETTER = (i) => String.fromCharCode(65 + (i % 26));
  const yarnLabel = (y, i) => (y.name ? `${LETTER(i)} – ${y.name}` : LETTER(i));
  const newYarn = (c) => ({ name: '', kind: 'solid', colors: [c || '#0f5e63'], len: 6 });
  const mix = (a, b, f) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    return hex(((x >> 16) * (1 - f)) + ((y >> 16) * f), (((x >> 8) & 255) * (1 - f)) + (((y >> 8) & 255) * f), ((x & 255) * (1 - f)) + ((y & 255) * f)); };
  function yarnColorAt(y, k) {
    if (!y) return '#cccccc';
    const n = y.colors.length;
    if (y.kind === 'solid' || n < 2) return y.colors[0];
    const len = Math.max(1, y.len | 0), seg = Math.floor(k / len), i = seg % n;
    if (y.kind === 'grad') return mix(y.colors[i], y.colors[(i + 1) % n], (k % len) / len);
    return y.colors[i];
  }
  // צבע כל עין בכל שורה, לפי סדר העבודה. החוט ממשיך מאותה נקודה בכל שורה שבה משתמשים בו.
  function rowStitchColors(yarns, rowYarn, W, H, work) {
    const counters = new Array(yarns.length).fill(0), rows = [];
    for (let r = 0; r < H; r++) {
      const yi = rowYarn[r] | 0, y = yarns[yi], row = new Array(W);
      const ltr = work === 'flat' && r % 2 === 1;
      for (let k = 0; k < W; k++) { const c = ltr ? k : W - 1 - k; row[c] = yarnColorAt(y, counters[yi]++); }
      rows.push(row);
    }
    return rows;
  }
  function paletteOf(colors) {
    const m = new Map(); let total = 0;
    for (const c of colors) { m.set(c, (m.get(c) || 0) + 1); total++; }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, p: n / total }));
  }
  function paletteBars(box, pal) {
    box.innerHTML = '';
    const top = pal.slice(0, 14);
    const bar = el('div', { class: 'pal-bar' });
    for (const x of top) bar.append(el('span', { style: `background:${x.c};flex:${x.p}`, title: `${x.c} ${(x.p * 100).toFixed(1)}%` }));
    box.append(bar, el('div', { class: 'pal-list' }, ...top.map((x) => el('span', { class: 'pal-chip' }, el('i', { style: `background:${x.c}` }), `${Math.round(x.p * 100)}%`))));
  }

  // עורך חוטים + רצף צבעים לשורות (משותף לתכנון הצבעים ולמוזאיק)
  function planEditor(plan, rowLabel, onChange) {
    const box = el('div', { class: 'plan' });
    let brush = 0, swapMode = false, swapFirst = -1;
    const yarnsBox = el('div', { class: 'yarns' });
    const seqBox = el('div', { class: 'seq' });
    const selA = el('select'), selB = el('select');
    const changed = () => { onChange(); renderSeq(); };
    function renderYarns() {
      yarnsBox.innerHTML = '';
      plan.yarns.forEach((y, i) => {
        const nameIn = el('input', { type: 'text', placeholder: t('cpYarnName'), value: y.name || '' });
        nameIn.oninput = () => { y.name = nameIn.value; renderSeq(); fillSelects(); };
        const kind = el('select', {}, el('option', { value: 'solid' }, t('cpSolid')), el('option', { value: 'vari' }, t('cpVari')), el('option', { value: 'grad' }, t('cpGrad')));
        kind.value = y.kind;
        kind.onchange = () => { y.kind = kind.value; if (y.kind !== 'solid' && y.colors.length < 2) y.colors.push('#f6c453'); renderYarns(); changed(); };
        const cols = el('div', { class: 'yarn-cols' });
        y.colors.forEach((c, j) => {
          if (y.kind === 'solid' && j > 0) return;
          const ci = el('input', { type: 'color', value: c });
          ci.oninput = () => { y.colors[j] = ci.value; changed(); };
          cols.append(ci);
          if (y.kind !== 'solid' && y.colors.length > 2) cols.append(el('button', { class: 'mini-x', onclick: () => { y.colors.splice(j, 1); renderYarns(); changed(); } }, '✕'));
        });
        if (y.kind !== 'solid') cols.append(el('button', { class: 'btn small', onclick: () => { y.colors.push('#ffffff'); renderYarns(); changed(); } }, t('cpAddColor')));
        const len = el('input', { type: 'number', min: '1', max: '200', value: String(y.len || 6), class: 'num' });
        len.oninput = () => { y.len = Math.max(1, Number(len.value) | 0); changed(); };
        const pick = el('button', { class: 'yarn-letter' + (brush === i ? ' on' : ''), style: `background:${y.colors[0]};color:${ink(y.colors[0])}`, onclick: () => { brush = i; swapMode = false; renderYarns(); renderSeq(); } }, LETTER(i));
        const rm = plan.yarns.length > 1 ? el('button', { class: 'btn small danger', onclick: () => {
          plan.yarns.splice(i, 1);
          plan.seq = plan.seq.map((v) => (v === i ? 0 : v > i ? v - 1 : v));
          brush = 0; renderYarns(); fillSelects(); changed();
        } }, '✕') : null;
        yarnsBox.append(el('div', { class: 'yarn' }, pick, nameIn, kind, cols,
          y.kind !== 'solid' ? el('label', {}, t('cpLen'), len) : null, rm));
      });
    }
    function fillSelects() {
      for (const s2 of [selA, selB]) {
        const v = s2.value; s2.innerHTML = '';
        plan.yarns.forEach((y, i) => s2.append(el('option', { value: String(i) }, yarnLabel(y, i))));
        if (v) s2.value = v;
      }
      if (!selB.value || selB.value === selA.value) selB.value = String(Math.min(1, plan.yarns.length - 1));
    }
    function renderSeq() {
      seqBox.innerHTML = '';
      for (let r = plan.seq.length - 1; r >= 0; r--) { // השורה העליונה למעלה
        const yi = plan.seq[r], y = plan.yarns[yi] || plan.yarns[0];
        const g = y.kind === 'solid' ? y.colors[0] : `linear-gradient(90deg, ${y.colors.join(',')})`;
        const chip = el('button', { class: 'seq-row' + (swapFirst === r ? ' sel' : ''), onclick: () => {
          if (swapMode) {
            if (swapFirst < 0) { swapFirst = r; renderSeq(); return; }
            const a = plan.seq[swapFirst]; plan.seq[swapFirst] = plan.seq[r]; plan.seq[r] = a; swapFirst = -1; changed(); return;
          }
          plan.seq[r] = brush; changed();
        } }, el('span', { class: 'seq-label' }, rowLabel(r)), el('span', { class: 'seq-sw', style: `background:${g}` }), el('span', {}, yarnLabel(y, yi)));
        seqBox.append(chip);
      }
    }
    const addYarn = el('button', { class: 'btn small', onclick: () => {
      if (plan.yarns.length >= 12) return;
      plan.yarns.push(newYarn(['#f6c453', '#ff7a59', '#8a4f7d', '#2e86de', '#27ae60', '#e84393', '#1d1d1d', '#f4ede1'][plan.yarns.length % 8]));
      renderYarns(); fillSelects();
    } }, t('cpAddYarn'));
    const swapBtn = el('button', { class: 'btn small', onclick: () => { swapMode = !swapMode; swapFirst = -1; swapBtn.classList.toggle('primary', swapMode); swapHint.classList.toggle('hidden', !swapMode); renderSeq(); } }, t('cpSwapMode'));
    const swapHint = el('span', { class: 'muted hidden' }, t('cpSwapHint'));
    const doSwap = el('button', { class: 'btn small', onclick: () => {
      const a = Number(selA.value), b = Number(selB.value); if (a === b) return;
      plan.seq = plan.seq.map((v) => (v === a ? b : v === b ? a : v)); changed();
    } }, t('cpDoSwap'));
    const reverse = el('button', { class: 'btn small', onclick: () => { plan.seq.reverse(); changed(); } }, t('cpReverse'));
    const rep = el('input', { type: 'text', dir: 'ltr', placeholder: t('cpRepeat'), class: 'rep' });
    const applyRep = el('button', { class: 'btn small', onclick: () => {
      const seq = rep.value.toUpperCase().replace(/[^A-Z]/g, '').split('').map((ch) => ch.charCodeAt(0) - 65).filter((i) => i < plan.yarns.length);
      if (!seq.length) return;
      plan.seq = plan.seq.map((_, i) => seq[i % seq.length]); changed();
    } }, t('cpApply'));
    renderYarns(); fillSelects(); renderSeq();
    box.append(
      el('div', { class: 'studio-sub' }, t('cpYarns')), yarnsBox, addYarn,
      el('p', { class: 'muted small-note' }, t('cpPooling')),
      el('div', { class: 'studio-sub' }, t('cpSeq')),
      el('p', { class: 'muted small-note' }, t('cpSeqHint')),
      el('div', { class: 'studio-row' }, swapBtn, swapHint),
      el('div', { class: 'studio-row' }, el('span', {}, t('cpSwapYarns')), selA, el('span', {}, '⇄'), selB, doSwap, reverse),
      el('div', { class: 'studio-row' }, rep, applyRep),
      seqBox);
    box.refresh = () => { renderYarns(); fillSelects(); renderSeq(); };
    return box;
  }

  // ריבוע סבתא: בכל סיבוב k יש 4k קבוצות של 3 עמודים, מפוזרות באופן שווה לאורך הסיבוב (עם כיוון השעון)
  function renderGranny(canvas, plan, N) {
    const size = 520, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr; canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f7f3ec'; ctx.fillRect(0, 0, size, size);
    const u = (size - 24) / (2 * N), cx = size / 2, cy = size / 2;
    const counters = new Array(plan.yarns.length).fill(0), used = [];
    for (let k = 1; k <= N; k++) {
      const yi = plan.seq[k - 1] | 0, y = plan.yarns[yi];
      const h = (k - 0.5) * u, L = 2 * h, P = 4 * L, groups = 4 * k;
      const gap = P / groups, stp = Math.min(0.55 * u, gap / 3.4), bw = stp * 0.9, bh = u * 0.86;
      for (let q = 0; q < groups; q++) {
        const center = (q + 0.5) * gap;
        for (let st = 0; st < 3; st++) {
          const col = yarnColorAt(y, counters[yi]++); used.push(col);
          let sp = (center + (st - 1) * stp + P) % P;
          const side = Math.floor(sp / L) % 4, tt = sp - side * L;
          ctx.fillStyle = col;
          if (side === 0) ctx.fillRect(cx - h + tt - bw / 2, cy - h - bh / 2, bw, bh);
          else if (side === 1) ctx.fillRect(cx + h - bh / 2, cy - h + tt - bw / 2, bh, bw);
          else if (side === 2) ctx.fillRect(cx + h - tt - bw / 2, cy + h - bh / 2, bw, bh);
          else ctx.fillRect(cx - h - bh / 2, cy + h - tt - bw / 2, bh, bw);
        }
      }
    }
    return used;
  }
  function renderStripes(canvas, plan, W, H, work) {
    const cs = Math.max(4, Math.min(18, Math.floor(560 / Math.max(W, H)))), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = W * cs + 40, h = H * cs + 4;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    const rows = rowStitchColors(plan.yarns, plan.seq, W, H, work), used = [];
    ctx.font = `600 ${Math.max(8, Math.min(12, cs * .8))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < H; r++) {
      const y = 2 + (H - 1 - r) * cs;
      for (let c = 0; c < W; c++) { ctx.fillStyle = rows[r][c]; used.push(rows[r][c]); ctx.fillRect(c * cs, y, cs, cs); }
      if (cs >= 8 && ((r + 1) % (cs >= 12 ? 1 : 5) === 0 || r === 0)) { ctx.fillStyle = '#333'; ctx.fillText(String(r + 1), W * cs + 20, y + cs / 2); }
    }
    return used;
  }

  async function colorEditor(data, existing) {
    const { d: defaults } = await busy(t('loading'), loadDefaults);
    const plan = data ? { ...data.plan } : {
      mode: 'granny', N: 6, W: 40, H: 30, work: 'flat',
      yarns: [newYarn('#0f5e63'), newYarn('#f6c453'), { name: '', kind: 'vari', colors: ['#ff7a59', '#8a4f7d', '#f4ede1'], len: 5 }],
      seq: [],
    };
    const info = data && data.info ? { ...emptyInfo('crochet'), ...data.info } : { ...emptyInfo('crochet'), designer: defaults.designer || '' };
    let withPdf = !existing || !!(existing.ids && existing.ids.pdf);
    const fitSeq = () => {
      const n = plan.mode === 'granny' ? plan.N : plan.H;
      while (plan.seq.length < n) plan.seq.push(plan.seq.length % plan.yarns.length);
      plan.seq.length = n;
    };
    fitSeq();
    const ed = editorShell('🌈 ' + t('cpTitle'), (data && data.title) || '', existing, save);
    const canvas = el('canvas', { class: 'studio-canvas' });
    const palBox = el('div', { class: 'pal' });
    const redraw = () => {
      const used = plan.mode === 'granny' ? renderGranny(canvas, plan, plan.N) : renderStripes(canvas, plan, plan.W, plan.H, plan.work);
      paletteBars(palBox, paletteOf(used));
    };
    const label = (r) => (plan.mode === 'granny' ? t('cpRound', { n: r + 1 }) : t('cpRowN', { n: r + 1 }));
    const pe = planEditor(plan, label, () => { ed.setDirty(); redraw(); });
    const mode = el('select', {}, el('option', { value: 'granny' }, t('cpGranny')), el('option', { value: 'stripes' }, t('cpStripes')));
    mode.value = plan.mode;
    const nIn = el('input', { type: 'number', min: '1', max: '30', value: String(plan.N), class: 'num' });
    const wIn = el('input', { type: 'number', min: '4', max: '200', value: String(plan.W), class: 'num' });
    const hIn = el('input', { type: 'number', min: '2', max: '200', value: String(plan.H), class: 'num' });
    const work = el('select', {}, el('option', { value: 'flat' }, t('cWorkFlat')), el('option', { value: 'round' }, t('cWorkRound')));
    work.value = plan.work;
    const grannyRow = el('div', { class: 'studio-row' }, el('label', {}, t('cpRounds'), nIn));
    const stripeRow = el('div', { class: 'studio-row' }, el('label', {}, t('stWidth'), wIn), el('label', {}, t('stHeight'), hIn), work);
    const sync = () => {
      grannyRow.classList.toggle('hidden', plan.mode !== 'granny'); stripeRow.classList.toggle('hidden', plan.mode !== 'stripes');
      fitSeq(); pe.refresh(); redraw();
    };
    mode.onchange = () => { plan.mode = mode.value; ed.setDirty(); sync(); };
    nIn.onchange = () => { plan.N = Math.max(1, Math.min(30, Number(nIn.value) | 0)); ed.setDirty(); sync(); };
    wIn.onchange = () => { plan.W = Math.max(4, Math.min(200, Number(wIn.value) | 0)); ed.setDirty(); sync(); };
    hIn.onchange = () => { plan.H = Math.max(2, Math.min(200, Number(hIn.value) | 0)); ed.setDirty(); sync(); };
    work.onchange = () => { plan.work = work.value; ed.setDirty(); redraw(); };
    const pdfChk = el('input', { type: 'checkbox' }); pdfChk.checked = withPdf; pdfChk.onchange = () => { withPdf = pdfChk.checked; };
    const planPane = el('div', {},
      el('div', { class: 'studio-panel' },
        el('div', { class: 'studio-row' }, el('label', {}, t('cpMode'), mode), el('span', { class: 'pro-badge' }, t('cpPro'))),
        grannyRow, stripeRow,
        el('label', { class: 'chk' }, pdfChk, t('exportPdf'))),
      el('div', { class: 'studio-panel' }, el('div', { class: 'studio-sub' }, t('cpPalette')), palBox),
      el('div', { class: 'studio-canvas-wrap' }, canvas),
      el('div', { class: 'studio-panel' }, pe));
    editorTabs(ed, [[t('tabChart'), planPane], [t('tabInfo'), infoForm(info, ed)]]);
    sync();

    async function save(name) {
      // תמונה: התצוגה + הפלטה + מקרא החוטים
      const out = document.createElement('canvas');
      const pad = 24, legendH = 40 + plan.yarns.length * 28;
      out.width = Math.max(canvas.width, 640) + pad * 2; out.height = canvas.height + 120 + legendH;
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
      const rtl = isRtl(); ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
      const tx = rtl ? out.width - pad : pad;
      ctx.fillStyle = '#10282a'; ctx.font = '700 26px system-ui'; ctx.fillText(name, tx, 36);
      ctx.font = '16px system-ui'; ctx.fillStyle = '#555'; ctx.fillText(`${t('cpTitle')} · ${plan.mode === 'granny' ? t('cpGranny') : t('cpStripes')}`, tx, 62);
      ctx.drawImage(canvas, pad, 80);
      let y = 80 + canvas.height + 30;
      const pal = paletteOf(plan.mode === 'granny' ? renderGranny(document.createElement('canvas'), plan, plan.N) : renderStripes(document.createElement('canvas'), plan, plan.W, plan.H, plan.work));
      let x = pad; const bw = out.width - pad * 2;
      for (const p2 of pal.slice(0, 14)) { ctx.fillStyle = p2.c; ctx.fillRect(x, y, bw * p2.p, 18); x += bw * p2.p; }
      y += 40; ctx.font = '15px system-ui';
      plan.yarns.forEach((yn, i) => {
        const bx = rtl ? out.width - pad - 60 : pad;
        yn.colors.forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(bx + j * (60 / yn.colors.length), y, 60 / yn.colors.length, 18); });
        ctx.fillStyle = '#222'; ctx.fillText(yarnLabel(yn, i) + (yn.kind !== 'solid' ? ` (${t(yn.kind === 'grad' ? 'cpGrad' : 'cpVari')})` : ''), rtl ? bx - 10 : bx + 70, y + 14);
        y += 28;
      });
      const png = await canvasBlob(out);
      const rows = plan.seq.map((yi, r) => `${label(r)}: ${yarnLabel(plan.yarns[yi], yi)}`);
      const data2 = { type: 'colors', v: 1, title: name, plan, info };
      await busy(t('stSaving'), async () => {
        const outputs = [{ key: 'main', blob: png, name: name + '.png' }];
        if (withPdf) {
          $('#busyText').textContent = t('pdfMaking');
          const html = patternHtml({ title: name, w: info, chartUrl: await blobDataUrl(png), rowsTitle: t('cpSeq'), rows, defaults, kind: t('cpTitle') });
          outputs.push({ key: 'pdf', blob: await htmlToPdf(html, ed.folder.id), name: name + '.pdf' });
        }
        return saveDesign({ type: 'colors', name, data: data2, outputs, existing, folderId: ed.folder.id });
      });
      afterSave(ed.folder);
    }
  }

  /* =========================================================
     פרטים קבועים לכל הדוגמאות (נשמרים בדרייב בתיקייה הראשית)
     ========================================================= */
  let defaultsCache = null;
  async function loadDefaults() {
    if (defaultsCache) return defaultsCache;
    const root = nav.root();
    let d = { designer: '', copyright: '', general: '', files: [] }, id = null;
    try {
      const list = await drive.list(root.id);
      const f = list.find((x) => x.appProperties && x.appProperties.kpType === 'defaults');
      if (f) { id = f.id; d = { ...d, ...JSON.parse(await (await drive.media(f.id)).text()) }; }
    } catch (e) { console.warn(e); }
    defaultsCache = { d, id };
    return defaultsCache;
  }
  async function saveDefaults(d) {
    const blob = new Blob([JSON.stringify(d)], { type: 'application/json' });
    const c = await loadDefaults();
    if (c.id) await drive.updateMedia(c.id, blob);
    else c.id = (await drive.upload(blob, { name: '_mypatterns_defaults.json', parents: [nav.root().id], mimeType: 'application/json', appProperties: { kpRole: 'design', kpType: 'defaults' } })).id;
    c.d = d;
  }
  const copyrightText = (d, designer) => (d.copyright || t('dCopyrightDefault')).replace('{year}', new Date().getFullYear()).replace('{designer}', designer || d.designer || '');

  // קבצים כלליים: תמונות נשמרות כמו שהן, ו-PDF הופך לתמונות של העמודים (עד 12)
  async function filesToImages(files) {
    const out = [];
    for (const f of files) {
      if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        const pages = [];
        for (let i = 1; i <= Math.min(12, pdf.numPages); i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1100 / page.getViewport({ scale: 1 }).width });
          const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          pages.push(c.toDataURL('image/jpeg', 0.82));
        }
        pdf.destroy();
        out.push({ name: f.name, pages });
      } else if (f.type.startsWith('image/')) {
        try { out.push({ name: f.name, pages: [await blobDataUrl(await resizeImage(f, 1400))] }); } catch { /* ignore */ }
      }
    }
    return out;
  }

  async function defaultsEditor() {
    const { d } = await busy(t('loading'), loadDefaults);
    const draft = { ...d, files: [...(d.files || [])] };
    const designer = el('input', { type: 'text', value: draft.designer || '' });
    const copy = el('textarea', { rows: '4' }); copy.value = draft.copyright || t('dCopyrightDefault');
    const general = el('textarea', { rows: '5' }); general.value = draft.general || '';
    const filesBox = el('div', { class: 'files-list' });
    const fileInput = el('input', { type: 'file', multiple: '', accept: 'image/*,.pdf,application/pdf', hidden: '' });
    const renderFiles = () => {
      filesBox.innerHTML = '';
      draft.files.forEach((f, i) => filesBox.append(el('div', { class: 'file-chip' },
        el('span', {}, (f.pages.length > 1 ? '📄 ' : '🖼️ ') + f.name + (f.pages.length > 1 ? ` (${t('dPages', { n: f.pages.length })})` : '')),
        el('button', { class: 'btn small danger', onclick: () => { draft.files.splice(i, 1); renderFiles(); } }, '✕'))));
    };
    const add = el('button', { class: 'btn small', onclick: async () => {
      const files = await pickFile(fileInput); if (!files || !files.length) return;
      draft.files.push(...await busy(t('loading'), () => filesToImages(files))); renderFiles();
    } }, t('dAddFiles'));
    renderFiles();
    openModal(t('dBtn'), el('div', { class: 'studio-panel written' },
      el('p', { class: 'muted small-note' }, t('dHint')),
      el('label', { class: 'w-field' }, el('span', {}, t('wDesigner')), designer),
      el('label', { class: 'w-field' }, el('span', {}, t('dCopyright')), copy),
      el('label', { class: 'w-field' }, el('span', {}, t('dGeneral')), general),
      el('div', { class: 'studio-sub' }, t('dFiles')), filesBox, add, fileInput),
    [el('button', { class: 'btn primary', onclick: async () => {
      draft.designer = designer.value.trim(); draft.copyright = copy.value.trim(); draft.general = general.value.trim();
      try { await busy(t('saving'), () => saveDefaults(draft)); closeModal(); toast(t('dSaved')); } catch (e) { err(e); }
    } }, t('save'))]);
  }

  /* =========================================================
     פרטי הדוגמה – משותף לכל סוגי העיצוב
     ========================================================= */
  const ABBR = {
    knit: {
      he: 'ימ׳ = ימין · שמ׳ = שמאל · 2 יחד ימ׳ = סריגת 2 עיניים יחד בימין · ליפוף = הנחת החוט על המסרגה · החל׳ = החלקת עין · צ״י = צד ימין · צ״ש = צד שמאל · ח״ז = חזרה',
      en: 'k = knit · p = purl · k2tog = knit 2 together · ssk = slip, slip, knit · yo = yarn over · sl = slip · RS = right side · WS = wrong side · rep = repeat · st(s) = stitch(es)',
    },
    crochet: {
      he: 'ע״ש = עין שרשרת (ch) · ע״ח = עין חיבור (sl st) · ח״ע = חצי עמוד (sc) · ע״נ = עמוד נמוך (hdc) · ע׳ = עמוד (dc) · ע״כ = עמוד כפול (tr) · הגד׳ = הגדלה · הור׳ = הורדה · ח״ז = חזרה',
      en: 'ch = chain · sl st = slip stitch · sc = single crochet · hdc = half double crochet · dc = double crochet · tr = treble · inc = increase · dec = decrease · rep = repeat · st(s) = stitch(es)',
    },
  };
  const emptyInfo = (craft) => ({ craft: craft || 'knit', level: '', designer: '', sizes: '', measure: '', yarn: '', tools: '', gauge: '', notions: '', abbr: '', notes: '', sections: [{ title: '', text: '' }], cover: '', images: [], links: [] });

  function infoForm(w, ed, opts = {}) {
    w.sections = w.sections && w.sections.length ? w.sections : [{ title: '', text: '' }];
    w.images = w.images || []; w.links = w.links || [];
    const field = (key, label, multi) => {
      const inp = multi ? el('textarea', { rows: '3' }) : el('input', { type: 'text' });
      inp.value = w[key] || '';
      inp.addEventListener('input', () => { w[key] = inp.value; ed.setDirty(); });
      return el('label', { class: 'w-field' }, el('span', {}, t(label)), inp);
    };
    const craft = el('select', {}, el('option', { value: 'knit' }, t('stKnit')), el('option', { value: 'crochet' }, t('stCrochet')));
    craft.value = w.craft; craft.onchange = () => { w.craft = craft.value; ed.setDirty(); if (opts.onCraft) opts.onCraft(w.craft); };
    if (opts.fixedCraft) craft.disabled = true;
    const level = el('select', {}, el('option', { value: '' }, '—'), ...[1, 2, 3, 4].map((n) => el('option', { value: String(n) }, t('lvl' + n))));
    level.value = String(w.level || ''); level.onchange = () => { w.level = level.value; ed.setDirty(); };
    const abbrField = field('abbr', 'wAbbr', true);
    const abbrBtn = el('button', { class: 'btn small', onclick: () => {
      const ta = abbrField.querySelector('textarea');
      const std = ABBR[w.craft][LANG === 'he' ? 'he' : 'en'];
      ta.value = ta.value ? ta.value + '\n' + std : std; w.abbr = ta.value; ed.setDirty();
    } }, t('wAbbrStd'));

    // תמונת שער
    const coverImg = el('div', { class: 'search-preview' }, '🖼️');
    const rmCover = el('button', { class: 'btn small danger', onclick: () => { w.cover = ''; ed.setDirty(); showCover(); } }, t('wCoverRemove'));
    const showCover = () => {
      coverImg.style.backgroundImage = w.cover ? `url("${w.cover}")` : '';
      coverImg.classList.toggle('has-img', !!w.cover); coverImg.textContent = w.cover ? '' : '🖼️';
      rmCover.classList.toggle('hidden', !w.cover);
    };
    const pickCover = el('button', { class: 'btn small', onclick: async () => {
      const f = await pickFile($('#imageInput')); if (!f) return;
      try { w.cover = await blobDataUrl(await resizeImage(f, 1000)); } catch { toast(t('invalidImage')); }
      ed.setDirty(); showCover();
    } }, t('wCoverPick'));

    // תמונות נוספות
    const imgsBox = el('div', { class: 'thumbs' });
    const multiImg = el('input', { type: 'file', accept: 'image/*', multiple: '', hidden: '' });
    const renderImgs = () => {
      imgsBox.innerHTML = '';
      w.images.forEach((src, i) => imgsBox.append(el('div', { class: 'thumb-item', style: `background-image:url("${src}")` },
        el('button', { class: 'thumb-x', onclick: () => { w.images.splice(i, 1); ed.setDirty(); renderImgs(); } }, '✕'))));
    };
    const addImgs = el('button', { class: 'btn small', onclick: async () => {
      const files = await pickFile(multiImg); if (!files || !files.length) return;
      for (const f of files) { try { w.images.push(await blobDataUrl(await resizeImage(f, 1000))); } catch { /* ignore */ } }
      ed.setDirty(); renderImgs();
    } }, t('wAddImages'));

    // קישורים
    const linksBox = el('div', { class: 'w-links' });
    const renderLinks = () => {
      linksBox.innerHTML = '';
      w.links.forEach((l, i) => {
        const ti = el('input', { type: 'text', placeholder: t('wLinkTitle') }); ti.value = l.title || '';
        const ur = el('input', { type: 'url', dir: 'ltr', placeholder: 'https://youtu.be/…' }); ur.value = l.url || '';
        ti.oninput = () => { l.title = ti.value; ed.setDirty(); };
        ur.oninput = () => { l.url = ur.value; ed.setDirty(); };
        linksBox.append(el('div', { class: 'w-link' }, ti, ur, el('button', { class: 'btn small danger', onclick: () => { w.links.splice(i, 1); ed.setDirty(); renderLinks(); } }, '✕')));
      });
    };
    const addLink = el('button', { class: 'btn small', onclick: () => { w.links.push({ title: '', url: '' }); renderLinks(); } }, t('wAddLink'));

    // שלבי הוראות
    const secBox = el('div', { class: 'w-sections' });
    const renderSections = () => {
      secBox.innerHTML = '';
      w.sections.forEach((sec, i) => {
        const ti = el('input', { type: 'text', placeholder: t('wSectionTitle') }); ti.value = sec.title;
        const tx = el('textarea', { rows: '6', placeholder: t('wSectionText') }); tx.value = sec.text;
        ti.oninput = () => { sec.title = ti.value; ed.setDirty(); };
        tx.oninput = () => { sec.text = tx.value; ed.setDirty(); };
        const rm = el('button', { class: 'btn small danger', onclick: () => { w.sections.splice(i, 1); if (!w.sections.length) w.sections.push({ title: '', text: '' }); ed.setDirty(); renderSections(); } }, '✕');
        secBox.append(el('div', { class: 'w-section' }, el('div', { class: 'studio-row' }, ti, rm), tx));
      });
    };
    const addSec = el('button', { class: 'btn small', onclick: () => { w.sections.push({ title: '', text: '' }); renderSections(); } }, t('wAddSection'));

    renderSections(); renderImgs(); renderLinks(); showCover();
    return el('div', { class: 'studio-panel written' },
      el('div', { class: 'studio-row' }, el('label', {}, t('stCraft'), craft), el('label', {}, t('wLevel'), level)),
      field('designer', 'wDesigner'),
      el('div', { class: 'studio-row' }, coverImg, el('div', { class: 'search-pick-btns' }, el('b', {}, t('wCover')), pickCover, rmCover)),
      field('tools', 'wTools'), field('yarn', 'wYarn', true), field('gauge', 'wGauge'),
      field('sizes', 'wSizes'), field('measure', 'wMeasure'), field('notions', 'wNotions'),
      abbrField, abbrBtn,
      field('notes', 'wGeneralNotes', true),
      el('div', { class: 'studio-sub' }, t('wInstructions')), secBox, addSec,
      el('div', { class: 'studio-sub' }, t('wImages')), imgsBox, addImgs, multiImg,
      el('div', { class: 'studio-sub' }, t('wLinks')), linksBox, addLink);
  }

  // מסמך הדוגמה המלא (HTML ← Google Docs ← PDF)
  function patternHtml({ title, w, chartUrl, rowsTitle, rows, defaults, kind }) {
    const dir = isRtl() ? 'rtl' : 'ltr';
    const br = (v) => esc(v).replace(/\n/g, '<br>');
    const row = (k, v) => (v ? `<p><b>${esc(t(k))}:</b> ${br(v)}</p>` : '');
    const designer = w.designer || (defaults && defaults.designer) || '';
    const sections = (w.sections || []).filter((x) => x.title || x.text).map((x) => `${x.title ? `<h3>${esc(x.title)}</h3>` : ''}<p>${br(x.text)}</p>`).join('');
    const links = (w.links || []).filter((l) => /^https?:\/\//.test((l.url || '').trim())).map((l) => {
      const url = l.url.trim(), yt = youtubeInfo(url);
      const thumb = yt && yt.id ? `<a href="${esc(url)}"><img src="https://img.youtube.com/vi/${yt.id}/mqdefault.jpg" width="240"></a><br>` : '';
      return `<p>${thumb}▶ <a href="${esc(url)}">${esc(l.title || url)}</a></p>`;
    }).join('');
    const imgs = (w.images || []).map((src) => `<p><img src="${src}" style="max-width:480px"></p>`).join('');
    const attach = ((defaults && defaults.files) || []).map((f) => f.pages.map((pg) => `<p><img src="${pg}" style="max-width:100%"></p>`).join('')).join('');
    const levels = { 1: 'lvl1', 2: 'lvl2', 3: 'lvl3', 4: 'lvl4' };
    return `<!doctype html><html><head><meta charset="utf-8"></head><body dir="${dir}" style="font-family:Arial,sans-serif">
<h1>${esc(title)}</h1>
${designer ? `<p>${esc(t('wDesigner'))}: ${esc(designer)}</p>` : ''}
${w.cover ? `<p><img src="${w.cover}" style="max-width:440px"></p>` : ''}
<p><b>${esc(kind)}</b> · ${esc(w.craft === 'crochet' ? t('stCrochet') : t('stKnit'))}${w.level ? ` · <b>${esc(t('wLevel'))}:</b> ${esc(t(levels[w.level]))}` : ''}</p>
${row('wTools', w.tools)}${row('wYarn', w.yarn)}${row('wGauge', w.gauge)}${row('wSizes', w.sizes)}${row('wMeasure', w.measure)}${row('wNotions', w.notions)}
${w.abbr ? `<h2>${esc(t('wAbbr'))}</h2><p>${br(w.abbr)}</p>` : ''}
${w.notes ? `<h2>${esc(t('wGeneralNotes'))}</h2><p>${br(w.notes)}</p>` : ''}
${chartUrl ? `<h2>${esc(t('hChart'))}</h2><p><img src="${chartUrl}" style="max-width:100%"></p>` : ''}
${rows && rows.length ? `<h2>${esc(rowsTitle || t('hRows'))}</h2>${rows.map((l) => `<p style="margin:2px 0">${esc(l)}</p>`).join('')}` : ''}
${sections ? `<h2>${esc(t('wInstructions'))}</h2>${sections}` : ''}
${imgs ? `<h2>${esc(t('hImages'))}</h2>${imgs}` : ''}
${links ? `<h2>${esc(t('hLinks'))}</h2>${links}` : ''}
${defaults && defaults.general ? `<h2>${esc(t('hGeneral'))}</h2><p>${br(defaults.general)}</p>` : ''}
${attach ? `<h2>${esc(t('hAttach'))}</h2>${attach}` : ''}
<hr><p style="font-size:9pt;color:#555">${br(copyrightText(defaults || {}, designer))}</p>
</body></html>`;
  }

  /* =========================================================
     הוראות כתובות
     ========================================================= */
  async function writtenEditor(data, existing) {
    const { d: defaults } = await busy(t('loading'), loadDefaults);
    const w = data ? { ...emptyInfo(), ...data } : { ...emptyInfo(), designer: defaults.designer || '' };
    let withPdf = !existing || !!(existing.ids && existing.ids.pdf);
    const ed = editorShell('📝 ' + t('stWritten'), (data && data.title) || '', existing, save);
    const pdfChk = el('input', { type: 'checkbox' }); pdfChk.checked = withPdf; pdfChk.onchange = () => { withPdf = pdfChk.checked; };
    ed.body.append(infoForm(w, ed), el('div', { class: 'studio-panel' },
      el('label', { class: 'chk' }, pdfChk, t('exportPdf')), el('p', { class: 'muted small-note' }, t('wDocNote'))));

    async function save(name) {
      w.title = name;
      const html = patternHtml({ title: name, w, defaults, kind: t('stWritten') });
      const r = await busy(t('stSaving'), async () => {
        const outputs = [{ key: 'main', blob: new Blob([html], { type: 'text/html' }), name, doc: true }];
        if (withPdf) { $('#busyText').textContent = t('pdfMaking'); outputs.push({ key: 'pdf', blob: await htmlToPdf(html, ed.folder.id), name: name + '.pdf' }); }
        return saveDesign({ type: 'written', name, data: { type: 'written', v: 2, ...w }, outputs, existing, folderId: ed.folder.id });
      });
      afterSave(ed.folder);
    }
  }

  /* ---------------- דף הבית של "יצירת דוגמה" ---------------- */
  function home(container) {
    container.innerHTML = '';
    const cur = currentFolder();
    const card = (icon, title, hint, fn) => el('button', { class: 'studio-card', onclick: () => { if (!currentFolder()) { toast(t('stNoFolder')); return; } fn(); } },
      el('span', { class: 'studio-card-icon' }, icon), el('span', { class: 'sheet-text' }, el('b', {}, title), el('small', {}, hint)));
    container.append(
      el('h2', { class: 'section-title' }, t('stHomeTitle')),
      el('div', { class: 'studio-cards' },
        card('📝', t('stWritten'), t('stWrittenHint'), () => writtenEditor(null, null).catch(err)),
        card('🎨', t('stChart'), t('stChartHint'), () => chartEditor(null, null).catch(err)),
        card('🟪', t('stMosaic'), t('stMosaicHint'), () => mosaicEditor(null, null).catch(err)),
        card('🌈', t('cpTitle') + ' · ' + t('cpPro'), t('cpHint'), () => colorEditor(null, null).catch(err))),
      el('div', { class: 'studio-defaults' }, el('button', { class: 'btn', onclick: () => defaultsEditor().catch(err) }, t('dBtn'))),
      el('p', { class: 'muted small-note studio-folder' }, cur ? t('stSaveTo', { name: cur.name }) : t('stNoFolder')));
  }

  // עריכה חוזרת של עיצוב שנשמר
  async function edit(f) {
    const jsonId = f.appProperties.kpDesign;
    const { data, meta } = await busy(t('stEditLoad'), async () => {
      const [blob, meta2] = await Promise.all([drive.media(jsonId), drive.get(jsonId)]);
      return { data: JSON.parse(await blob.text()), meta: meta2 };
    });
    const ap = meta.appProperties || {};
    const ids = {};
    if (ap.kpMain) ids.main = ap.kpMain; if (ap.kpPdf) ids.pdf = ap.kpPdf; if (ap.kpDoc) ids.doc = ap.kpDoc;
    if (!ids.main) ids.main = f.id;
    const existing = { jsonId, ids, folderId: (meta.parents && meta.parents[0]) || (f.parents && f.parents[0]) };
    if (data.type === 'mosaic') await mosaicEditor(data, existing);
    else if (data.type === 'chart') await chartEditor(data, existing);
    else if (data.type === 'colors') await colorEditor(data, existing);
    else await writtenEditor(data, existing);
  }

  window.Studio = { home, edit, _mosaicSolve: mosaicSolve };
})();
