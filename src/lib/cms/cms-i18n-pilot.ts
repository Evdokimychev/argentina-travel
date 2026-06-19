import type { CmsSeedEntry } from "@/lib/cms/cms-ts-seed";

/** E43 pilot: es/en variants for one legal doc and one blog post. */
export function buildCmsI18nPilotEntries(): CmsSeedEntry[] {
  return [
    {
      docType: "legal",
      slug: "privacy",
      locale: "en",
      title: "Privacy Policy",
      body: {
        kind: "legal",
        description:
          "How we process personal data on the «Time for Argentina» marketplace platform.",
        sections: [
          {
            paragraphs: [
              "This policy describes how personal data of users of the «Time for Argentina» marketplace (the Platform) is processed.",
              "The operator processes data in accordance with applicable law. The current version is published on this page; the update date is shown above.",
            ],
          },
          {
            heading: "Data we may process",
            list: [
              "name and contact details during registration and booking;",
              "tourist or organizer profile data;",
              "history of requests, messages, and favorites;",
              "technical cookies for the interface and saved preferences.",
            ],
          },
          {
            heading: "Purposes of processing",
            list: [
              "processing and supporting tour booking requests;",
              "communication between tourists and organizers;",
              "interface personalization (language, currency);",
              "improving service quality and security.",
            ],
          },
          {
            heading: "Sharing with third parties",
            paragraphs: [
              "A tourist's contact details are shared with the organizer of the selected tour for a confirmed request. We do not sell personal data.",
              "Data is stored on secure servers (Supabase Postgres). Email provider Resend may be used for notifications and support. Card payment data is processed by a payment provider once online payments are enabled — the Platform does not store full card details.",
            ],
          },
          {
            heading: "Your rights",
            paragraphs: [
              "You may request clarification, correction, or deletion of data via the Contacts page form. If you have an account, part of your data is available in your personal cabinet.",
            ],
          },
        ],
      },
      seo: {
        description:
          "How we process personal data on the «Time for Argentina» marketplace platform.",
      },
    },
    {
      docType: "legal",
      slug: "privacy",
      locale: "es",
      title: "Política de privacidad",
      body: {
        kind: "legal",
        description:
          "Cómo tratamos los datos personales en la plataforma «Es hora de Argentina».",
        sections: [
          {
            paragraphs: [
              "Esta política describe el tratamiento de datos personales de los usuarios del marketplace «Es hora de Argentina» (la Plataforma).",
              "El operador procesa los datos conforme a la legislación aplicable. La versión actual se publica en esta página; la fecha de actualización figura arriba.",
            ],
          },
          {
            heading: "Datos que podemos procesar",
            list: [
              "nombre y datos de contacto al registrarse y reservar;",
              "datos del perfil de turista u organizador;",
              "historial de solicitudes, mensajes y favoritos;",
              "cookies técnicas para la interfaz y preferencias guardadas.",
            ],
          },
          {
            heading: "Finalidades del tratamiento",
            list: [
              "gestión y seguimiento de solicitudes de reserva de tours;",
              "comunicación entre turista y organizador;",
              "personalización de la interfaz (idioma, moneda);",
              "mejora de la calidad del servicio y la seguridad.",
            ],
          },
          {
            heading: "Transferencia a terceros",
            paragraphs: [
              "Los datos de contacto del turista se transfieren al organizador del tour seleccionado dentro de una solicitud confirmada. No vendemos datos personales.",
              "Los datos se almacenan en servidores seguros (Supabase Postgres). Para notificaciones y soporte puede usarse el proveedor de email Resend. Los datos de pago con tarjeta son procesados por un proveedor de pagos cuando se active el pago en línea — la Plataforma no almacena los datos completos de la tarjeta.",
            ],
          },
          {
            heading: "Sus derechos",
            paragraphs: [
              "Puede solicitar aclaración, corrección o eliminación de datos mediante el formulario en la página Contactos. Si tiene cuenta, parte de los datos está disponible en su área personal.",
            ],
          },
        ],
      },
      seo: {
        description:
          "Cómo tratamos los datos personales en la plataforma «Es hora de Argentina».",
      },
    },
    {
      docType: "blog",
      slug: "best-time-to-visit-argentina",
      locale: "en",
      title: "When to visit Argentina: seasons and climate",
      body: {
        kind: "blog",
        excerpt:
          "We explain the best time to visit Patagonia, Buenos Aires, and the northwest of the country.",
        featured: true,
        sections: [
          {
            title: "At a glance",
            body:
              "Argentina stretches from subtropics in the north to cold Patagonia in the south — there is no single «perfect month» for the whole country. Your choice depends on which regions you include: for glaciers and trekking, look at November–March; for the capital, most of the year works; for the northwest, spring and autumn are more comfortable.",
          },
          {
            title: "When to go by region",
            body:
              "Patagonia (El Calafate, El Chaltén, Ushuaia): the best window is November to March, with longer days and more stable weather for glaciers, trekking, and ferries. Buenos Aires is pleasant year-round, but autumn (March–May) is especially beautiful: less heat, green parks, and comfortable evenings. The northwest (Salta, Cafayate, Purmamarca) is easier in spring and autumn, avoiding summer heat and winter cold at altitude. Iguazú: waterfalls are fuller in the rainy season (November–March), but trails can be slippery; in the dry season walking is easier, but water flow is lower. In winter (June–August), accommodation in the capital is cheaper, but many southern routes are shortened due to weather.",
          },
          {
            title: "Planning tips",
            body:
              "Allow a spare day for each Patagonia flight — wind and fog sometimes cancel glacier excursions. If you combine several regions, build the route from south to north or vice versa to avoid extra returns through Buenos Aires. Watch local holidays: in January and during carnival (February–March), hotels and buses fill up faster. Check the weather guide and current national park rules before booking tickets.",
          },
        ],
      },
      seo: {
        title: "When to visit Argentina: seasons and climate | Time for Argentina",
        description:
          "We explain the best time to visit Patagonia, Buenos Aires, and the northwest of the country.",
      },
    },
    {
      docType: "blog",
      slug: "best-time-to-visit-argentina",
      locale: "es",
      title: "Cuándo visitar Argentina: estaciones y clima",
      body: {
        kind: "blog",
        excerpt:
          "Analizamos la mejor época para visitar Patagonia, Buenos Aires y el noroeste del país.",
        featured: true,
        sections: [
          {
            title: "En resumen",
            body:
              "Argentina se extiende desde el subtropical en el norte hasta la fría Patagonia en el sur: no existe un «mes ideal» para todo el país. La elección depende de las regiones del itinerario: para glaciares y trekking, mirá noviembre–marzo; para la capital, casi todo el año es adecuado; para el noroeste, primavera y otoño son más cómodos.",
          },
          {
            title: "Cuándo ir por región",
            body:
              "Patagonia (El Calafate, El Chaltén, Ushuaia): la mejor ventana es de noviembre a marzo, con días más largos y clima más estable para glaciares, trekking y ferris. Buenos Aires es agradable todo el año, pero el otoño (marzo–mayo) es especialmente hermoso: menos calor, parques verdes y noches cómodas. El noroeste (Salta, Cafayate, Purmamarca) conviene en primavera y otoño, evitando el calor del verano y el frío del invierno en altura. Iguazú: las cataratas tienen más agua en la temporada de lluvias (noviembre–marzo), pero los senderos pueden resbalar; en la temporada seca es más fácil caminar, pero el caudal es menor. En invierno (junio–agosto), el alojamiento en la capital es más barato, pero muchas rutas del sur se acortan por el clima.",
          },
          {
            title: "Consejos de planificación",
            body:
              "Reservá un día extra por cada vuelo a Patagonia: el viento y la niebla a veces cancelan excursiones a glaciares. Si combinas varias regiones, diseña el itinerario de sur a norte o viceversa para no volver innecesariamente a Buenos Aires. Ten en cuenta feriados locales: en enero y en carnaval (febrero–marzo), hoteles y buses se llenan más rápido. Consulta la guía de clima y las reglas actuales de parques nacionales antes de reservar entradas.",
          },
        ],
      },
      seo: {
        title: "Cuándo visitar Argentina: estaciones y clima | Es hora de Argentina",
        description:
          "Analizamos la mejor época para visitar Patagonia, Buenos Aires y el noroeste del país.",
      },
    },
  ];
}
