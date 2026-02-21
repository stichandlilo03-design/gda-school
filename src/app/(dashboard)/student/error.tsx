"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StudentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Student portal error:", error);
  }, [error]);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          There was an error loading this page. This is usually temporary.
        </p>
        <div className="space-y-2">
          <button onClick={reset} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700">
            Try Again
          </button>
          <Link href="/student" className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200">
            Go to Dashboard
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-gray-300 mt-4">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
