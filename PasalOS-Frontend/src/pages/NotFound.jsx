
import { Link } from "react-router-dom";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Search size={36} />
        </div>

        <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>

        <h2 className="mt-3 text-xl font-semibold text-gray-800">
          Page not found
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Sorry, the page you're looking for doesn't exist or may have been
          moved. Please return to your dashboard.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Go back
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Home size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}