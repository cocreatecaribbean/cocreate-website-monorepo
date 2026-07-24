import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home')
        .id('landingPage')
        .child(
          S.document()
            .schemaType('landingPage')
            .documentId('landingPage')
            .title('Landing page'),
        ),
      S.listItem()
        .title('Work page')
        .id('workPage')
        .child(
          S.document()
            .schemaType('workPage')
            .documentId('workPage')
            .title('Work page'),
        ),
      S.listItem()
        .title('About page')
        .id('aboutPage')
        .child(
          S.document()
            .schemaType('aboutPage')
            .documentId('aboutPage')
            .title('About page'),
        ),
      S.divider(),
      S.listItem()
        .title('Clients')
        .schemaType('client')
        .child(S.documentTypeList('client').title('Clients')),
      S.divider(),
      S.listItem()
        .title('Originals')
        .child(
          S.list()
            .title('Originals')
            .items([
              S.listItem()
                .title('All originals')
                .schemaType('original')
                .child(S.documentTypeList('original').title('Originals')),
              S.listItem()
                .title('Episodes')
                .schemaType('originalEpisode')
                .child(S.documentTypeList('originalEpisode').title('Episodes')),
            ]),
        ),
    ])
