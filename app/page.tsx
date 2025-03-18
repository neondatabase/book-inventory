import { Suspense } from "react";
import { BooksGrid } from "@/components/grid";
import { BookPagination } from "@/components/book-pagination";
import {
  estimateTotalBooks,
  fetchBooksWithPagination,
  ITEMS_PER_PAGE,
} from "@/lib/db/queries";
import { parseSearchParams } from "@/lib/url-state";

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const parsedSearchParams = parseSearchParams(searchParams);
  const [books_, estimatedTotal] = await Promise.all([
    fetchBooksWithPagination(parsedSearchParams),
    estimateTotalBooks(parsedSearchParams),
  ]);
  const [books, fetchTime] = books_;
  const totalPages = Math.ceil(estimatedTotal / ITEMS_PER_PAGE);
  const currentPage = Math.max(1, Number(parsedSearchParams.page) || 1);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto min-h-[200px]">
        <div className="group-has-[[data-pending]]:animate-pulse p-4">
          <div className="mb-4 text-sm text-gray-600">
            Search time: {fetchTime.toFixed(2)} ms
          </div>
          <BooksGrid books={books} />
        </div>
      </div>
      <div className="mt-auto p-4 border-t">
        <Suspense fallback={null}>
          <BookPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={estimatedTotal}
            searchParams={parsedSearchParams}
          />
        </Suspense>
      </div>
    </div>
  );
}
