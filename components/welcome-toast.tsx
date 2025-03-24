"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (!document.cookie.includes("books-toast=2")) {
      toast("📚 Welcome to Neon Books!", {
        id: "books-toast",
        duration: Infinity,
        onDismiss: () => {
          document.cookie = "books-toast=2; max-age=31536000; path=/";
        },
        description: (
          <>
            This is a demo of searching, filtering, and paginating 1M books from{" "}
            <a
              target="_blank"
              className="border-b hover:border-green-600"
              href="https://neon.tech/blog/pgsearch-on-neon"
            >
              Neon Postgres (powered by pg_search)
            </a>
            .
          </>
        ),
      });
    }
  }, []);
  return null;
}
