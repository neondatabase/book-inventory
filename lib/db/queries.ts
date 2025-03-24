import { neon, neonConfig } from "@neondatabase/serverless";
import { SearchParams } from "@/lib/url-state";

neonConfig.poolQueryViaFetch = true;

if (!process.env.POSTGRES_URL)
  throw new Error("Environment variable POSTGRES_URL is not defined");
const pool = neon(process.env.POSTGRES_URL);

export const ITEMS_PER_PAGE = 28;
export const EMPTY_IMAGE_URL =
  "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";

const yearFilter = (yr?: string) => {
  if (yr) {
    const maxYear = Math.max(1950, Math.min(2023, Number(yr)));
    return `publication_year BETWEEN 1950 AND ${maxYear}`;
  }
  return `publication_year BETWEEN 1950 AND 2023`;
};

const ratingFilter = (rtg?: string) => {
  if (rtg) {
    const minRating = Number(rtg);
    return `average_rating >= ${minRating}`;
  }
  return "";
};

const languageFilter = (lng?: string) => {
  if (lng === "en") {
    return `language_code IN ('eng', 'en-US', 'en-GB')`;
  }
  return lng ? `language_code = '${lng}'` : "";
};

const pageFilter = (pgs?: string) => {
  if (pgs) {
    const maxPages = Math.min(1000, Number(pgs));
    return `num_pages <= ${maxPages}`;
  }
  return `num_pages <= 1000`;
};

const searchFilter = (q?: string) => {
  if (q)
    return `book_id @@@ paradedb.match('title', '${q.toLowerCase()}', conjunction_mode => true)`;
  return "";
};

const imageFilter = () => {
  return `image_url IS NOT NULL AND image_url != '${EMPTY_IMAGE_URL}'`;
};

const isbnFilter = (isbn?: string) => {
  if (isbn) {
    const isbnArray = isbn.split(",").map((id) => id.trim());
    return `isbn IN (${isbnArray.map((id) => `'${id}'`).join(", ")})`;
  }
  return "";
};

export async function fetchBooksWithPagination(searchParams: SearchParams) {
  let requestedPage = Math.max(1, Number(searchParams?.page) || 1);
  const filters = [
    yearFilter(searchParams.yr),
    ratingFilter(searchParams.rtg),
    languageFilter(searchParams.lng),
    pageFilter(searchParams.pgs),
    imageFilter(),
    searchFilter(searchParams.search),
    isbnFilter(searchParams.isbn),
  ]
    .filter(Boolean)
    .join(" AND ");
  const offset = (requestedPage - 1) * ITEMS_PER_PAGE;
  const startTime = performance.now();
  const rows = await pool(`
    SELECT book_id, title, image_url
    FROM books
    ${filters ? `WHERE ${filters}` : ""}
    LIMIT ${ITEMS_PER_PAGE}
    OFFSET ${offset}
  `);
  return [rows, performance.now() - startTime] as [
    Record<string, any>[],
    number,
  ];
}

export async function estimateTotalBooks(searchParams: SearchParams) {
  const filters = [
    yearFilter(searchParams.yr),
    ratingFilter(searchParams.rtg),
    languageFilter(searchParams.lng),
    pageFilter(searchParams.pgs),
    imageFilter(),
    searchFilter(searchParams.search),
    isbnFilter(searchParams.isbn),
  ]
    .filter(Boolean)
    .join(" AND ");
  const explainResult = await pool(`
    EXPLAIN (FORMAT JSON)
    SELECT image_url FROM books
    ${filters ? `WHERE ${filters}` : ""}
  `);
  return (explainResult[0] as any)["QUERY PLAN"][0]["Plan"]["Plan Rows"];
}
