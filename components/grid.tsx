import { Book } from "@/lib/db/schema";
import { Photo } from "./photo";

export async function BooksGrid({
  books,
}: {
  books: Book[];
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {!books?.length ? (
        <p className="text-center text-muted-foreground col-span-full">
          No books found.
        </p>
      ) : (
        books
          .filter((book) => book.image_url)
          .map((book, index) => (
            <BookLink book={book} key={book.book_id} priority={index < 10} />
          ))
      )}
    </div>
  );
}

function BookLink({ priority, book }: { priority: boolean; book: Book }) {
  return (
    <div
      key={book.book_id}
      className="block transition ease-in-out md:hover:scale-105"
    >
      <Photo title={book.title} priority={priority} src={book.image_url} />
    </div>
  );
}
