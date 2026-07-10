"use client";

import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import { Search, User, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import Button from "./Button";
import { useRouter } from "next/navigation";

type SearchResult = {
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  caption?: string;
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser(); // Correct way to access user metadata on the client-side
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.publicMetadata?.role === "admin"; // Validate admin role

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]); // Close dropdown when clicking outside
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setSearchResults([...data.users, ...data.contents]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <div className="flex px-6 py-3 shadow-lg bg-gradient-to-r from-blue-900 via-gray-800 to-blue-900 text-white gap-4 justify-between items-center">
        {/* Logo */}
        <Link href={"/"}>
          <h1 className="text-bold text-3xl font-balooda tracking-wide hover:scale-110 transition-transform">
            বঙ্গলিপি
          </h1>
        </Link>

        {/* Search Bar */}
        <div className="relative w-1/2">
          <form className="hidden lg:flex items-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-full shadow-inner overflow-hidden">
            <input
              type="text"
              placeholder="Search for PDFs, profiles, or content..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-grow px-4 py-2 text-white bg-transparent text-sm outline-none placeholder-gray-300"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:from-blue-700 hover:to-blue-500 transition"
            >
              <Search />
            </button>
          </form>

          {/* Dropdown */}
          {searchResults.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute mt-2 w-full bg-white text-gray-800 shadow-lg rounded-md max-h-60 overflow-auto z-50"
            >
              {searchResults.map((result: SearchResult, index) => (
                <Link
                  href={
                    result.userId
                      ? `/profiles/${result.userId}`
                      : `/contents/${result._id}`
                  }
                  key={index}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-200"
                >
                  <div>
                    {result.firstName
                      ? `${result.firstName} ${result.lastName} (${result.email})`
                      : `${result.title}: ${result.caption}`}
                  </div>
                  <div>
                    {result.firstName ? (
                      <User className="text-gray-500" size={20} />
                    ) : (
                      <FileText className="text-blue-500" size={20} />
                    )}
                  </div>
                </Link>
              ))}
              {isLoading && (
                <p className="px-4 py-2 text-sm text-gray-500">Loading...</p>
              )}
            </div>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex gap-6 items-center">
          <ul className="flex gap-6 pr-4 text-sm items-center">
            {["Home", "Converter", "Contents", "Chatbot", "Contribute"].map(
              (item, index) => (
                <li
                  key={index}
                  className="font-semibold hover:text-blue-400 transition-colors duration-300"
                >
                  <Link href={`/${item.toLowerCase()}`}>{item}</Link>
                </li>
              )
            )}
            {/* Admin Option */}
            {isAdmin && (
              <li className="font-semibold hover:text-blue-400 transition-colors duration-300">
                <Link href="/admin">Admin</Link>
              </li>
            )}
          </ul>

          {/* Authentication */}
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10",
                  userButtonPopoverCard: "w-72 h-auto",
                },
              }}
            />
          ) : (
            <Button
              type="button"
              title="Login"
              icon="/user.svg"
              variant="btn_primary"
              onClick={() => router.push("/sign-in")}
            />
          )}
        </div>

        <div className="lg:hidden z-20">
          <MobileSidebar />
        </div>
      </div>
    </div>
  );
}
