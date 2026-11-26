/**
 * Content for the /hire landing pages. Both languages live here so the routes
 * stay thin and the copy can be reviewed in one place.
 *
 * `category` must match the marketplace category names (see
 * CANONICAL_CATEGORIES in offers.server.ts); it is what the live offer list on
 * each landing page filters by.
 */

export type HireLocale = "en" | "de";

export type HireFaq = { q: string; a: string };

export type HireCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  scopeTitle: string;
  scope: string[];
  faq: HireFaq[];
};

export type HirePage = {
  slug: string;
  category: string;
  icon: string;
  en: HireCopy;
  de: HireCopy;
};

type HireLabels = {
  home: string;
  hire: string;
  langSwitch: string;
  offersTitle: (category: string) => string;
  offersNote: string;
  emptyOffers: (category: string) => string;
  postOffer: string;
  browseAll: string;
  discord: string;
  faqTitle: string;
  relatedTitle: string;
  allRoles: string;
  ctaTitle: string;
  ctaBody: string;
  indexH1: string;
  indexIntro: string;
  browseRole: string;
};

export const HIRE_LABELS: Record<HireLocale, HireLabels> = {
  en: {
    home: "Home",
    hire: "Hire developers",
    langSwitch: "Deutsch",
    offersTitle: (category) => `Live ${category} offers`,
    offersNote: "Pulled from the marketplace, newest first.",
    emptyOffers: (category) => `No live ${category} offers right now.`,
    postOffer: "Post your offer",
    browseAll: "Browse all offers",
    discord: "Join our Discord",
    faqTitle: "Frequently asked questions",
    relatedTitle: "Other roles you can hire",
    allRoles: "All roles",
    ctaTitle: "Ready to hire?",
    ctaBody:
      "Post your request and let developers come to you — or message a seller directly from their offer.",
    indexH1: "Hire Roblox developers",
    indexIntro:
      "Pick the role you need. Each page lists live offers from that category, what the role usually covers and the questions buyers ask most.",
    browseRole: "View offers",
  },
  de: {
    home: "Start",
    hire: "Entwickler finden",
    langSwitch: "English",
    offersTitle: (category) => `Aktuelle Angebote: ${category}`,
    offersNote: "Live aus dem Marktplatz, neueste zuerst.",
    emptyOffers: (category) => `Zurzeit keine Live-Angebote für ${category}.`,
    postOffer: "Angebot posten",
    browseAll: "Alle Angebote ansehen",
    discord: "Discord beitreten",
    faqTitle: "Häufige Fragen",
    relatedTitle: "Weitere Rollen",
    allRoles: "Alle Rollen",
    ctaTitle: "Bereit zu engagieren?",
    ctaBody:
      "Poste deine Anfrage und lass Entwickler auf dich zukommen — oder schreib direkt über das Angebot.",
    indexH1: "Roblox-Entwickler engagieren",
    indexIntro:
      "Wähle die Rolle, die du brauchst. Jede Seite zeigt aktuelle Angebote dieser Kategorie, typische Leistungen und die häufigsten Fragen von Auftraggebern.",
    browseRole: "Angebote ansehen",
  },
};

export const HIRE_PAGES: HirePage[] = [
  {
    slug: "roblox-scripter",
    category: "Scripting",
    icon: "⌘",
    en: {
      metaTitle: "Hire a Roblox Scripter — Tiger Market",
      metaDescription:
        "Hire a Roblox scripter for gameplay systems, DataStores and anti-cheat. Browse live offers, compare ratings and contact developers directly.",
      eyebrow: "Scripting",
      h1: "Hire a Roblox scripter",
      intro: [
        "Scripters turn your game design into working systems: combat, progression, pets, tycoons, shops and the server logic behind them.",
        "Every offer below comes from a developer listing on Tiger Market. Compare price, ratings and posting date before you commit — and never pay the full amount up front.",
      ],
      scopeTitle: "What Roblox scripters on Tiger Market build",
      scope: [
        "Gameplay systems — combat, progression, pets, tycoons and shops",
        "DataStores and saving logic that survives server restarts and dupes",
        "Anti-cheat, hardened remote events and performance passes on existing games",
      ],
      faq: [
        {
          q: "How much does a Roblox scripter cost?",
          a: "Rates depend on scope and experience. Offers list prices in Robux, USD or EUR; small fixes are cheap, full systems with saving and anti-cheat cost more. Ask for a milestone-based quote so you pay for delivered work.",
        },
        {
          q: "How do I check that a scripter is reliable?",
          a: "Open the seller profile: ratings from other buyers, verified badge, how long they have been listing and how many offers they have. Ask for past work you can test. Use a trusted middleman for anything large.",
        },
        {
          q: "Can I hire someone for a small fix or a one-off script?",
          a: "Yes. Many listings are explicitly for small jobs. Describe the bug or the feature in one message and ask whether they take short commissions.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox Scripter engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-Scripter für Gameplay-Systeme, DataStores und Anti-Cheat. Aktuelle Angebote, echte Bewertungen und direkter Kontakt.",
      eyebrow: "Scripting",
      h1: "Roblox-Scripter engagieren",
      intro: [
        "Scripter setzen dein Gamedesign in funktionierende Systeme um: Combat, Progression, Pets, Tycoons, Shops und die Serverlogik dahinter.",
        "Alle Angebote unten stammen von Entwicklern, die auf Tiger Market inserieren. Vergleiche Preis, Bewertungen und Datum, bevor du zusagst — und zahle nie den vollen Betrag im Voraus.",
      ],
      scopeTitle: "Was Roblox-Scripter auf Tiger Market bauen",
      scope: [
        "Gameplay-Systeme — Combat, Progression, Pets, Tycoons und Shops",
        "DataStores und Speicherlogik, die Server-Neustarts und Dupes übersteht",
        "Anti-Cheat, abgesicherte RemoteEvents und Performance-Pässe für bestehende Spiele",
      ],
      faq: [
        {
          q: "Was kostet ein Roblox-Scripter?",
          a: "Das hängt von Umfang und Erfahrung ab. Preise stehen in Robux, USD oder EUR im Angebot; kleine Fixes sind günstig, komplette Systeme mit Speicherung und Anti-Cheat kosten mehr. Lass dir einen Plan mit Meilensteinen geben.",
        },
        {
          q: "Woran erkenne ich, ob ein Scripter seriös ist?",
          a: "Öffne das Verkäuferprofil: Bewertungen anderer Käufer, Verified-Badge, wie lange die Person schon inseriert und wie viele Angebote es gibt. Frag nach Arbeitsproben, die du testen kannst, und nutze bei größeren Summen einen vertrauenswürdigen Middleman.",
        },
        {
          q: "Kann ich auch nur einen kleinen Fix beauftragen?",
          a: "Ja. Viele Angebote sind ausdrücklich für kleine Jobs gedacht. Beschreibe den Fehler oder das Feature in einer Nachricht und frag, ob kurze Aufträge angenommen werden.",
        },
      ],
    },
  },
  {
    slug: "roblox-builder",
    category: "Building",
    icon: "▦",
    en: {
      metaTitle: "Hire a Roblox Builder — Tiger Market",
      metaDescription:
        "Hire a Roblox builder for maps, lobbies, interiors and modular kits. Browse live building offers and check seller ratings before you hire.",
      eyebrow: "Building",
      h1: "Hire a Roblox builder",
      intro: [
        "Builders create the world players actually walk through: spawn areas, maps, interiors, props and the modular kits your team reuses for every update.",
        "The offers below are live listings from Tiger Market. Look at the screenshots, ask for a walkthrough place file and agree on revisions before work starts.",
      ],
      scopeTitle: "What Roblox builders on Tiger Market deliver",
      scope: [
        "Full maps and level layouts with a clear gameplay flow",
        "Lobbies, shops and interiors built around your game loop",
        "Modular kits and optimisation passes so the map still runs on mobile",
      ],
      faq: [
        {
          q: "How much does a Roblox map cost?",
          a: "Small props and rooms are inexpensive; a full map with custom models costs significantly more. Price depends on size, detail level and how much optimisation you need for mobile.",
        },
        {
          q: "Do I own the models after delivery?",
          a: "Agree on ownership in writing before work starts. Many builders hand over the place file and full rights once the final payment is made; some keep the right to show the work in their portfolio.",
        },
        {
          q: "How long does a build take?",
          a: "Ask for a milestone plan: blockout, detail pass, optimisation. Builders who give you those three dates are usually the ones who deliver on time.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox Builder engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-Builder für Maps, Lobbys, Interiors und modulare Kits. Aktuelle Building-Angebote und Bewertungen vor dem Auftrag prüfen.",
      eyebrow: "Building",
      h1: "Roblox-Builder engagieren",
      intro: [
        "Builder bauen die Welt, durch die Spieler tatsächlich laufen: Spawn-Bereiche, Maps, Interiors, Props und modulare Kits, die dein Team bei jedem Update weiterverwendet.",
        "Die Angebote unten sind Live-Inserate auf Tiger Market. Schau dir die Screenshots an, frag nach einer Place-Datei zum Testen und kläre Revisionen, bevor die Arbeit beginnt.",
      ],
      scopeTitle: "Was Roblox-Builder auf Tiger Market liefern",
      scope: [
        "Komplette Maps und Level-Layouts mit klarem Gameplay-Fluss",
        "Lobbys, Shops und Interiors, passend zu deinem Game-Loop",
        "Modulare Kits und Optimierung, damit die Map auch auf Mobile läuft",
      ],
      faq: [
        {
          q: "Was kostet eine Roblox-Map?",
          a: "Kleine Props und Räume sind günstig; eine komplette Map mit eigenen Modellen kostet deutlich mehr. Der Preis hängt von Größe, Detailgrad und dem Optimierungsaufwand für Mobile ab.",
        },
        {
          q: "Gehören mir die Modelle nach der Lieferung?",
          a: "Kläre die Rechte schriftlich vorher. Viele Builder übergeben Place-Datei und alle Rechte nach der Schlusszahlung; manche behalten das Recht, die Arbeit im Portfolio zu zeigen.",
        },
        {
          q: "Wie lange dauert ein Build?",
          a: "Frag nach einem Plan mit Meilensteinen: Blockout, Detail-Pass, Optimierung. Builder, die dir diese drei Termine nennen, liefern meist auch pünktlich.",
        },
      ],
    },
  },
  {
    slug: "roblox-ui-designer",
    category: "UI/GUI Design",
    icon: "◲",
    en: {
      metaTitle: "Hire a Roblox UI Designer — Tiger Market",
      metaDescription:
        "Hire a Roblox UI designer for HUDs, shops, inventories and mobile-friendly interfaces. Browse live UI and GUI offers on Tiger Market.",
      eyebrow: "UI / GUI Design",
      h1: "Hire a Roblox UI designer",
      intro: [
        "A UI designer makes your game readable: HUDs, inventories, shops, settings and the menus players see before they ever move.",
        "Good Roblox UI also has to scale from a phone to a desktop without breaking. Ask for screenshots at both sizes before you sign off.",
      ],
      scopeTitle: "What Roblox UI designers on Tiger Market deliver",
      scope: [
        "HUDs, inventories, shop and settings screens",
        "Responsive layouts tested on mobile, tablet and desktop",
        "Implementation in Roblox Studio or a hand-off file your scripter can build",
      ],
      faq: [
        {
          q: "Do I get a Figma file or working Roblox UI?",
          a: "Both exist on the marketplace. Say up front whether you need a design file only or a UI that already works in Studio — it changes the price and the timeline.",
        },
        {
          q: "How much does a Roblox UI designer cost?",
          a: "A single screen is usually a small job; a full game interface with several states costs more. Many designers price per screen with a fixed number of revisions.",
        },
        {
          q: "Can the designer also animate the UI?",
          a: "Often yes — open/close tweens, notifications and hover states. If animation matters, ask for it in the brief so it is part of the quote.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox UI-Designer engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-UI-Designer für HUDs, Shops, Inventare und mobile Interfaces. Aktuelle UI/GUI-Angebote auf Tiger Market.",
      eyebrow: "UI / GUI Design",
      h1: "Roblox-UI-Designer engagieren",
      intro: [
        "Ein UI-Designer macht dein Spiel lesbar: HUDs, Inventare, Shops, Einstellungen und die Menüs, die Spieler sehen, bevor sie sich überhaupt bewegen.",
        "Gutes Roblox-UI muss außerdem vom Handy bis zum Desktop skalieren, ohne zu brechen. Lass dir Screenshots in beiden Größen zeigen, bevor du abnimmst.",
      ],
      scopeTitle: "Was Roblox-UI-Designer auf Tiger Market liefern",
      scope: [
        "HUDs, Inventare, Shop- und Einstellungs-Screens",
        "Responsive Layouts, getestet auf Mobile, Tablet und Desktop",
        "Umsetzung in Roblox Studio oder eine Übergabedatei, die dein Scripter baut",
      ],
      faq: [
        {
          q: "Bekomme ich eine Figma-Datei oder fertiges Roblox-UI?",
          a: "Beides gibt es auf dem Marktplatz. Sag vorher, ob du nur eine Designdatei brauchst oder ein UI, das in Studio schon funktioniert — das ändert Preis und Zeitplan.",
        },
        {
          q: "Was kostet ein Roblox-UI-Designer?",
          a: "Ein einzelner Screen ist meist ein kleiner Auftrag; ein komplettes Spielinterface mit mehreren Zuständen kostet mehr. Viele Designer rechnen pro Screen mit einer festen Zahl an Revisionen.",
        },
        {
          q: "Animiert der Designer das UI auch?",
          a: "Oft ja — Öffnen/Schließen-Tweens, Benachrichtigungen, Hover-States. Wenn Animation wichtig ist, schreib es ins Briefing, damit es im Angebot enthalten ist.",
        },
      ],
    },
  },
  {
    slug: "roblox-3d-modeler",
    category: "3D Modeling",
    icon: "◈",
    en: {
      metaTitle: "Hire a Roblox 3D Modeler — Tiger Market",
      metaDescription:
        "Hire a Roblox 3D modeler for game-ready props, weapons, vehicles and low-poly assets. Live 3D modeling offers, ratings and prices.",
      eyebrow: "3D Modeling",
      h1: "Hire a Roblox 3D modeler",
      intro: [
        "Modelers create the assets your game is built from: weapons, vehicles, pets, tools and environment props that match your art direction.",
        "Ask for the mesh stats and a screenshot in Studio, not only a Blender render — a model that looks good but has 40k triangles will hurt your game.",
      ],
      scopeTitle: "What Roblox 3D modelers on Tiger Market deliver",
      scope: [
        "Game-ready props, weapons, vehicles, pets and tools",
        "Low-poly meshes with clean UVs, textures and LOD variants",
        "Optimised triangle counts so the asset runs on low-end phones",
      ],
      faq: [
        {
          q: "What counts as a game-ready Roblox model?",
          a: "A clean mesh, reasonable triangle count, UVs, a texture or palette and an export that imports into Studio with the right scale. Ask for the poly count before you accept.",
        },
        {
          q: "How much does a custom Roblox model cost?",
          a: "Small props are cheap, complex rigged assets are expensive. Custom art with several revisions costs more than a recolour of an existing model.",
        },
        {
          q: "Can the modeler texture and rig it too?",
          a: "Some do the full pipeline (model, texture, rig), others only the mesh. Check the offer wording or ask — rigging is usually quoted separately.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox-3D-Modeler engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-3D-Modeler für game-ready Props, Waffen, Fahrzeuge und Low-Poly-Assets. Aktuelle 3D-Modeling-Angebote mit Preisen und Bewertungen.",
      eyebrow: "3D Modeling",
      h1: "Roblox-3D-Modeler engagieren",
      intro: [
        "Modeler erstellen die Assets, aus denen dein Spiel besteht: Waffen, Fahrzeuge, Pets, Tools und Umgebungs-Props, die zu deiner Art Direction passen.",
        "Frag nach Polygonzahl und einem Screenshot aus Studio, nicht nur nach einem Blender-Render — ein Modell mit 40.000 Dreiecken sieht gut aus und ruiniert trotzdem deine Performance.",
      ],
      scopeTitle: "Was Roblox-3D-Modeler auf Tiger Market liefern",
      scope: [
        "Game-ready Props, Waffen, Fahrzeuge, Pets und Tools",
        "Low-Poly-Meshes mit sauberen UVs, Texturen und LOD-Varianten",
        "Optimierte Polygonzahlen, damit das Asset auch auf schwachen Handys läuft",
      ],
      faq: [
        {
          q: "Was ist ein „game-ready“ Roblox-Modell?",
          a: "Ein sauberes Mesh, sinnvolle Polygonzahl, UVs, eine Textur oder Palette und ein Export, der in Studio in der richtigen Größe ankommt. Lass dir die Polygonzahl vor der Abnahme nennen.",
        },
        {
          q: "Was kostet ein individuelles Roblox-Modell?",
          a: "Kleine Props sind günstig, komplexe geriggte Assets teuer. Individuelle Kunst mit mehreren Revisionen kostet mehr als eine Umfärbung eines bestehenden Modells.",
        },
        {
          q: "Texturiert und riggt der Modeler auch?",
          a: "Manche machen die komplette Pipeline (Modell, Textur, Rig), andere nur das Mesh. Steht meist im Angebot — Rigging wird oft separat berechnet.",
        },
      ],
    },
  },
  {
    slug: "roblox-gfx-artist",
    category: "Graphics/GFX",
    icon: "◐",
    en: {
      metaTitle: "Hire a Roblox GFX Artist — Tiger Market",
      metaDescription:
        "Hire a Roblox GFX artist for game icons, thumbnails, logos and ad creatives. Browse live graphics offers and boost your click-through rate.",
      eyebrow: "Graphics / GFX",
      h1: "Hire a Roblox GFX artist",
      intro: [
        "Your icon and thumbnails decide whether anyone clicks your game at all. GFX artists build those images: renders, logos, banners and ad creatives.",
        "Ask for the export sizes you need — Roblox icons are square, thumbnails are 16:9, and ads have their own formats.",
      ],
      scopeTitle: "What Roblox GFX artists on Tiger Market deliver",
      scope: [
        "Game icons, thumbnails and store art sized for Roblox",
        "Logos, banners and Discord or social creatives",
        "Renders with your characters, props and lighting direction",
      ],
      faq: [
        {
          q: "What size should Roblox icons and thumbnails be?",
          a: "Icons are square (512×512 or 1024×1024 works well); thumbnails are 16:9 (1920×1080). Ask for both a square and a wide export so you can reuse the artwork.",
        },
        {
          q: "How much does Roblox GFX cost?",
          a: "A single icon is a small job; a full set with logo, icon and several thumbnails costs more. Revisions are usually included up to a fixed number — confirm how many.",
        },
        {
          q: "Can the artist match my game's style?",
          a: "Send references and one or two screenshots from your game. Artists who ask for references before quoting usually deliver a closer match.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox-GFX-Artist engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-GFX-Artist für Game-Icons, Thumbnails, Logos und Ad-Creatives. Aktuelle Grafik-Angebote für mehr Klicks auf dein Spiel.",
      eyebrow: "Graphics / GFX",
      h1: "Roblox-GFX-Artist engagieren",
      intro: [
        "Dein Icon und deine Thumbnails entscheiden, ob überhaupt jemand auf dein Spiel klickt. GFX-Artists erstellen genau diese Bilder: Renders, Logos, Banner und Ad-Creatives.",
        "Frag nach den Exportgrößen, die du brauchst — Roblox-Icons sind quadratisch, Thumbnails 16:9, und Ads haben eigene Formate.",
      ],
      scopeTitle: "Was Roblox-GFX-Artists auf Tiger Market liefern",
      scope: [
        "Game-Icons, Thumbnails und Store-Art in Roblox-Größen",
        "Logos, Banner und Creatives für Discord oder Social Media",
        "Renders mit deinen Charakteren, Props und passender Beleuchtung",
      ],
      faq: [
        {
          q: "Welche Größe brauchen Roblox-Icon und Thumbnail?",
          a: "Icons sind quadratisch (512×512 oder 1024×1024 funktioniert gut), Thumbnails 16:9 (1920×1080). Lass dir einen quadratischen und einen breiten Export geben, dann kannst du beides wiederverwenden.",
        },
        {
          q: "Was kostet Roblox-GFX?",
          a: "Ein einzelnes Icon ist ein kleiner Auftrag; ein komplettes Set aus Logo, Icon und mehreren Thumbnails kostet mehr. Revisionen sind meist bis zu einer festen Zahl enthalten — kläre wie viele.",
        },
        {
          q: "Trifft der Artist meinen Stil?",
          a: "Schick Referenzen und ein bis zwei Screenshots aus deinem Spiel. Artists, die vor dem Angebot nach Referenzen fragen, treffen den Stil meist besser.",
        },
      ],
    },
  },
  {
    slug: "roblox-animator",
    category: "Animation",
    icon: "➤",
    en: {
      metaTitle: "Hire a Roblox Animator — Tiger Market",
      metaDescription:
        "Hire a Roblox animator for character animations, emotes, cutscenes and R15 rigs. Live animation offers with prices and seller ratings.",
      eyebrow: "Animation",
      h1: "Hire a Roblox animator",
      intro: [
        "Animation is what makes a game feel alive: idle poses, attacks, emotes, NPC movement and cutscenes.",
        "Specify the rig (R6 or R15), the frame rate and how the animation will be triggered — that is what separates a usable asset from a nice video.",
      ],
      scopeTitle: "What Roblox animators on Tiger Market deliver",
      scope: [
        "Character animations for R6 and R15 rigs",
        "Emotes, NPC idles and combat sets",
        "Cutscenes and camera work for trailers or intros",
      ],
      faq: [
        {
          q: "R6 or R15 — which rig should I ask for?",
          a: "Most modern games use R15 because it allows better deformation. If your game already uses R6, say so before the quote — the animation has to be built for the rig you ship.",
        },
        {
          q: "How much does a Roblox animation cost?",
          a: "Single emotes are cheap, full combat sets and cutscenes cost more. Price usually depends on length, number of keyframes and whether the animator also implements it in Studio.",
        },
        {
          q: "Do I get the animation IDs or the project file?",
          a: "Ask for both: the published animation IDs your script uses, and the source file in case you need changes later. Ownership should be agreed before work starts.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox-Animator engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-Animator für Charakter-Animationen, Emotes, Cutscenes und R15-Rigs. Aktuelle Animations-Angebote mit Preisen und Bewertungen.",
      eyebrow: "Animation",
      h1: "Roblox-Animator engagieren",
      intro: [
        "Animation lässt dein Spiel lebendig wirken: Idle-Posen, Angriffe, Emotes, NPC-Bewegung und Cutscenes.",
        "Nenne das Rig (R6 oder R15), die Framerate und wie die Animation ausgelöst wird — das unterscheidet ein nutzbares Asset von einem schönen Video.",
      ],
      scopeTitle: "Was Roblox-Animatoren auf Tiger Market liefern",
      scope: [
        "Charakter-Animationen für R6- und R15-Rigs",
        "Emotes, NPC-Idles und Combat-Sets",
        "Cutscenes und Kameraführung für Trailer oder Intros",
      ],
      faq: [
        {
          q: "R6 oder R15 — was soll ich anfragen?",
          a: "Die meisten modernen Spiele nutzen R15, weil die Deformation besser ist. Wenn dein Spiel R6 verwendet, sag das vor dem Angebot — die Animation muss zum Rig passen, das du auslieferst.",
        },
        {
          q: "Was kostet eine Roblox-Animation?",
          a: "Einzelne Emotes sind günstig, komplette Combat-Sets und Cutscenes teurer. Der Preis hängt meist von Länge, Anzahl der Keyframes und davon ab, ob der Animator sie auch in Studio einbaut.",
        },
        {
          q: "Bekomme ich Animation-IDs oder die Projektdatei?",
          a: "Frag nach beidem: die veröffentlichten Animation-IDs für dein Script und die Quelldatei für spätere Änderungen. Die Rechte solltest du vor Arbeitsbeginn klären.",
        },
      ],
    },
  },
  {
    slug: "roblox-vfx-artist",
    category: "VFX",
    icon: "◆",
    en: {
      metaTitle: "Hire a Roblox VFX Artist — Tiger Market",
      metaDescription:
        "Hire a Roblox VFX artist for ability effects, particles, trails and impact effects that stay performant on mobile.",
      eyebrow: "VFX",
      h1: "Hire a Roblox VFX artist",
      intro: [
        "VFX sells the impact: ability effects, hit sparks, auras, trails and the small details that make combat feel expensive.",
        "The hard part on Roblox is doing that without killing frame rate. Ask how many emitters and particles a single effect uses.",
      ],
      scopeTitle: "What Roblox VFX artists on Tiger Market deliver",
      scope: [
        "Ability, hit and impact effects for combat",
        "Auras, trails and ambient effects",
        "Particle budgets tuned for mobile devices",
      ],
      faq: [
        {
          q: "How do I keep VFX performant?",
          a: "Fewer, longer-lived emitters with small particle counts beat dozens of short bursts. Ask the artist for the emitter and particle count per effect and test on a low-end phone.",
        },
        {
          q: "How much does Roblox VFX cost?",
          a: "A single hit effect is a small job; a full ability set with several stages costs more. Price depends on complexity and how much of it is scripted rather than purely visual.",
        },
        {
          q: "Can the VFX artist hook it into my combat system?",
          a: "Some can, some only deliver the effect. If you need it wired to your abilities, say so — it changes the quote and often needs your script structure.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox-VFX-Artist engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-VFX-Artist für Fähigkeiten-Effekte, Partikel, Trails und Impact-Effekte, die auch auf Mobile performant bleiben.",
      eyebrow: "VFX",
      h1: "Roblox-VFX-Artist engagieren",
      intro: [
        "VFX verkauft den Impact: Fähigkeiten-Effekte, Trefferfunken, Auren, Trails und die kleinen Details, die Combat teuer wirken lassen.",
        "Der schwierige Teil auf Roblox ist, das ohne Framerate-Verlust hinzubekommen. Frag, wie viele Emitter und Partikel ein Effekt verwendet.",
      ],
      scopeTitle: "Was Roblox-VFX-Artists auf Tiger Market liefern",
      scope: [
        "Fähigkeiten-, Treffer- und Impact-Effekte für Combat",
        "Auren, Trails und Ambient-Effekte",
        "Partikel-Budgets, abgestimmt auf Mobilgeräte",
      ],
      faq: [
        {
          q: "Wie bleibt VFX performant?",
          a: "Wenige, länger laufende Emitter mit kleiner Partikelzahl sind besser als Dutzende kurze Bursts. Lass dir Emitter- und Partikelzahl pro Effekt nennen und teste auf einem schwachen Handy.",
        },
        {
          q: "Was kostet Roblox-VFX?",
          a: "Ein einzelner Treffer-Effekt ist ein kleiner Auftrag; ein komplettes Fähigkeiten-Set mit mehreren Stufen kostet mehr. Der Preis hängt von Komplexität und Scripting-Anteil ab.",
        },
        {
          q: "Baut der VFX-Artist den Effekt auch in mein Combat-System ein?",
          a: "Manche ja, manche liefern nur den Effekt. Wenn er an deine Fähigkeiten angebunden werden soll, sag es — das ändert das Angebot und braucht oft Einblick in deine Script-Struktur.",
        },
      ],
    },
  },
  {
    slug: "roblox-audio-engineer",
    category: "Sound/Music",
    icon: "♪",
    en: {
      metaTitle: "Hire a Roblox Audio Engineer — Tiger Market",
      metaDescription:
        "Hire a Roblox audio engineer for sound effects, music loops and in-game audio implementation. Live sound and music offers on Tiger Market.",
      eyebrow: "Sound / Music",
      h1: "Hire a Roblox audio engineer",
      intro: [
        "Sound is the cheapest way to make a game feel polished: UI clicks, footsteps, weapon hits, ambience and the music loop players hear for hours.",
        "Roblox has strict upload limits, so ask whether the files are already prepared for the asset library (length, loudness, format).",
      ],
      scopeTitle: "What Roblox audio engineers on Tiger Market deliver",
      scope: [
        "SFX packs — UI, weapons, footsteps and impacts",
        "Music loops and ambient beds that survive repetition",
        "Prepared files that upload cleanly to Roblox",
      ],
      faq: [
        {
          q: "Can I upload any audio file to Roblox?",
          a: "No — Roblox has length, size and loudness limits, and uploaded audio has to be owned by you or licensed. Ask the engineer for files that already fit those limits.",
        },
        {
          q: "How much does custom game audio cost?",
          a: "A small SFX pack is cheap; an original music loop takes real studio time and costs more. Buying an existing track with a licence is a cheaper option for prototypes.",
        },
        {
          q: "Does the engineer implement the sounds in Studio?",
          a: "Some offer implementation (SoundGroups, volume mixing, triggering from scripts), some deliver files only. Say which one you need before the quote.",
        },
      ],
    },
    de: {
      metaTitle: "Roblox-Audio-Engineer engagieren — Tiger Market",
      metaDescription:
        "Finde einen Roblox-Audio-Engineer für Soundeffekte, Musik-Loops und In-Game-Audio. Aktuelle Sound- und Musik-Angebote auf Tiger Market.",
      eyebrow: "Sound / Music",
      h1: "Roblox-Audio-Engineer engagieren",
      intro: [
        "Sound ist der günstigste Weg, ein Spiel poliert wirken zu lassen: UI-Klicks, Schritte, Waffentreffer, Ambience und der Musik-Loop, den Spieler stundenlang hören.",
        "Roblox hat strikte Upload-Limits — frag, ob die Dateien schon für die Asset-Bibliothek vorbereitet sind (Länge, Lautheit, Format).",
      ],
      scopeTitle: "Was Roblox-Audio-Engineers auf Tiger Market liefern",
      scope: [
        "SFX-Pakete — UI, Waffen, Schritte und Impacts",
        "Musik-Loops und Ambient-Betten, die Wiederholung aushalten",
        "Vorbereitete Dateien, die sauber zu Roblox hochgeladen werden",
      ],
      faq: [
        {
          q: "Kann ich jede Audiodatei zu Roblox hochladen?",
          a: "Nein — Roblox hat Limits für Länge, Größe und Lautheit, und hochgeladenes Audio muss dir gehören oder lizenziert sein. Lass dir Dateien geben, die diese Limits schon einhalten.",
        },
        {
          q: "Was kostet individuelles Game-Audio?",
          a: "Ein kleines SFX-Paket ist günstig; ein eigener Musik-Loop kostet echte Studiozeit. Für Prototypen ist ein vorhandener Track mit Lizenz die günstigere Option.",
        },
        {
          q: "Baut der Engineer die Sounds auch in Studio ein?",
          a: "Manche übernehmen die Implementierung (SoundGroups, Lautstärke-Mix, Auslösen per Script), andere liefern nur Dateien. Sag vorher, was du brauchst.",
        },
      ],
    },
  },
];

export function findHirePage(slug: string): HirePage | undefined {
  return HIRE_PAGES.find((page) => page.slug === slug);
}

export function hireIndexPath(locale: HireLocale): "/hire" | "/de/hire" {
  return locale === "de" ? "/de/hire" : "/hire";
}

export function hirePath(page: HirePage, locale: HireLocale): string {
  return `${hireIndexPath(locale)}/${page.slug}`;
}

/** Same page in the other language, for the DE/EN switch and hreflang links. */
export function otherLocale(locale: HireLocale): HireLocale {
  return locale === "en" ? "de" : "en";
}

/** FAQPage structured data so the questions can show up in search results. */
export function faqJsonLd(faq: HireFaq[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((entry) => ({
        "@type": "Question",
        name: entry.q,
        acceptedAnswer: { "@type": "Answer", text: entry.a },
      })),
    }),
  };
}
