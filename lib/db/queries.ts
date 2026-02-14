import { sql, and, gte, eq, lte, not, isNull, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { books, authors, bookToAuthor } from './schema';
import { SearchParams } from '@/lib/url-state';

export const ITEMS_PER_PAGE = 28;
export const EMPTY_IMAGE_URL =
  "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";

function buildFilters(searchParams: SearchParams) {
  const filters: string[] = [];
  const values: Array<string | number | string[]> = [];

  const pushValue = (value: string | number | string[]) => {
    values.push(value);
    return `$${values.length}`;
  };

  const parsedYear = Number(searchParams.yr);
  const maxYear = Number.isFinite(parsedYear)
    ? Math.max(1950, Math.min(2023, parsedYear))
    : 2023;
  filters.push(`publication_year BETWEEN 1950 AND ${pushValue(maxYear)}`);

  if (searchParams.rtg) {
    const minRating = Number(searchParams.rtg);
    if (Number.isFinite(minRating)) {
      filters.push(`average_rating >= ${pushValue(minRating)}`);
    }
  }

  if (searchParams.lng === "en") {
    filters.push(`language_code IN ('eng', 'en-US', 'en-GB')`);
  } else if (searchParams.lng) {
    filters.push(`language_code = ${pushValue(searchParams.lng)}`);
  }

  const parsedPages = Number(searchParams.pgs);
  const maxPages = Number.isFinite(parsedPages)
    ? Math.min(1000, parsedPages)
    : 1000;
  filters.push(`num_pages <= ${pushValue(maxPages)}`);

  filters.push(`image_url IS NOT NULL AND image_url != ${pushValue(EMPTY_IMAGE_URL)}`);

  if (searchParams.search) {
    filters.push(
      `book_id @@@ paradedb.match('title', ${pushValue(
        searchParams.search.toLowerCase()
      )}, conjunction_mode => true)`
    );
  }

const ratingFilter = (rtg?: string) => {
  if (rtg) {
    const minRating = Number(rtg);
    if (Number.isFinite(minRating)) {
      return sql`${books.average_rating} >= ${minRating}`;
    }
  }

const languageFilter = (lng?: string) => {
  if (lng === 'en') {
    return sql`${books.language_code} IN ('eng', 'en-US', 'en-GB')`;
  }
  return lng ? eq(books.language_code, lng) : undefined;
};

const pageFilter = (pgs?: string) => {
  if (pgs) {
    const parsedPages = Number(pgs);
    if (Number.isFinite(parsedPages)) {
      const maxPages = Math.min(1000, parsedPages);
      return lte(books.num_pages, maxPages);
    }
  }
  return lte(books.num_pages, 1000);
};

const searchFilter = (q?: string) => {
  const searchText = q?.trim().toLowerCase();
  if (searchText) {
    return sql`${books.title_tsv} @@ websearch_to_tsquery('english', ${searchText})`;
  }
  return undefined;
};

const imageFilter = () => {
  return and(
    not(isNull(books.image_url)),
    sql`${books.image_url} != ${EMPTY_IMAGE_URL}`
  );
};

const isbnFilter = (isbn?: string) => {
  if (isbn) {
    const isbnArray = isbn
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (isbnArray.length > 0) {
      return inArray(books.isbn, isbnArray);
    }
  }
  return undefined;
};

export async function fetchBooksWithPagination(searchParams: SearchParams) {
  let requestedPage = Math.max(1, Number(searchParams?.page) || 1);
  const { whereClause, values } = buildFilters(searchParams);
  const offset = (requestedPage - 1) * ITEMS_PER_PAGE;
  const startTime = performance.now();
  values.push(ITEMS_PER_PAGE, offset);
  const rows = await pool(
    `
    SELECT book_id, title, image_url
    FROM books
    ${whereClause}
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `,
    values
  );
  return [rows, performance.now() - startTime] as [
    Record<string, any>[],
    number,
  ];
}

export async function estimateTotalBooks(searchParams: SearchParams) {
  const { whereClause, values } = buildFilters(searchParams);
  const explainResult = await pool(
    `
    EXPLAIN (FORMAT JSON)
    SELECT image_url FROM books
    ${whereClause}
  `,
    values
  );
  return (explainResult[0] as any)["QUERY PLAN"][0]["Plan"]["Plan Rows"];
}
