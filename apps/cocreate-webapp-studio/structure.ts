import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Work Projects')
        .schemaType('workProject')
        .child(S.documentTypeList('workProject').title('Work Projects')),
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
