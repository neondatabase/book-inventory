export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

import { neon, neonConfig } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

neonConfig.poolQueryViaFetch = true;

function getExecutionPlanningTime(result: any[]) {
  const executionTimeLine = result.find((row) =>
    row["QUERY PLAN"].startsWith("Execution Time:")
  );
  const planningTimeLine = result.find((row) =>
    row["QUERY PLAN"].startsWith("Planning Time:")
  );
  return [executionTimeLine["QUERY PLAN"], planningTimeLine["QUERY PLAN"]];
}

export async function POST() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("Environment variable POSTGRES_URL is not defined");
  }
  const pool = neon(process.env.POSTGRES_URL);
  const queries = [
    `
            EXPLAIN ANALYZE  
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 0  
              AND num_pages <= 1000  
              AND image_url IS NOT NULL  
              AND book_id @@@ paradedb.match('title', 'diary', conjunction_mode => true)  
            ORDER BY book_id  
            LIMIT 12 OFFSET 1200;
        `,
    `
            EXPLAIN ANALYZE  
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 0  
              AND num_pages <= 1000  
              AND image_url IS NOT NULL  
              AND to_tsvector('english', title) @@ to_tsquery('english', 'diary')  
            ORDER BY book_id  
            LIMIT 12 OFFSET 1200;
        `,
    `
            EXPLAIN ANALYZE
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 2.5  
              AND num_pages <= 1000  
              AND book_id @@@ paradedb.match('title', 'Air', conjunction_mode => true)
            LIMIT 12 OFFSET 1200;
        `,
    `
            EXPLAIN ANALYZE
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 2.5
              AND num_pages <= 1000  
              AND to_tsvector('english', title) @@ to_tsquery('english', 'Air')  
            LIMIT 12 OFFSET 1200;
        `,
    `
            EXPLAIN ANALYZE
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 0
              AND num_pages <= 1000
              AND book_id @@@ paradedb.match('title', 'Air To', conjunction_mode => true)
            LIMIT 2000;
        `,
    `
            EXPLAIN ANALYZE
            SELECT book_id, title, image_url  
            FROM books  
            WHERE publication_year BETWEEN 1950 AND 2023  
              AND average_rating >= 0
              AND num_pages <= 1000
              AND to_tsvector('english', title) @@ to_tsquery('english', 'Air & To')
            LIMIT 2000;
        `,
  ];
  const results = await Promise.all(queries.map((query) => pool(query)));
  return NextResponse.json(
    results.map((rows, index) => ({
      query: queries[index],
      executionPlanningTime: getExecutionPlanningTime(rows),
    }))
  );
}
