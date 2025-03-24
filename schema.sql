-- https://neon.tech/blog/pgsearch-on-neon
CREATE EXTENSION IF NOT EXISTS pg_search;

-- https://neon.tech/docs/extensions/pg_prewarm
CREATE EXTENSION IF NOT EXISTS pg_prewarm;

-- Create the books table
CREATE TABLE public.books (
    title_without_series text,
    url text,
    asin text,
    link text,
    description text,
    isbn13 text,
    average_rating numeric,
    isbn text,
    language_code text,
    country_code text,
    num_pages bigint,
    authors text,
    format text,
    popular_shelves text,
    title text,
    publication_day bigint,
    text_reviews_count text,
    book_id bigint NOT NULL,
    is_ebook boolean,
    similar_books text,
    publisher text,
    publication_month bigint,
    publication_year bigint,
    ratings_count text,
    kindle_asin text,
    work_id bigint,
    series text,
    edition_information text,
    image_url text
);

-- Set book_id as the primary key in the books table
ALTER TABLE ONLY public.books ADD CONSTRAINT books_pkey PRIMARY KEY (book_id);

-- Create BM25 index on books table
-- CREATE INDEX book_search_idx ON public.books USING bm25 (book_id, url, link, description, isbn13, isbn, language_code, num_pages, title, publication_day, publication_month, publication_year, publisher, work_id, image_url) WITH (key_field=book_id);
