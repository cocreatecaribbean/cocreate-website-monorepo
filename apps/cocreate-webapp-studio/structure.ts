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
        .schemaType('original')
        .child(S.documentTypeList('original').title('Originals')),
    ])
