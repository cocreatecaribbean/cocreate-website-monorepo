import { defineQuery } from 'next-sanity'


// Example:
// export const POSTS_QUERY = defineQuery(`*[_type == "post"][0...12]{ _id, title, slug }`)