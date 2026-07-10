"use client";
import { CircleX, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, UserButton } from "@clerk/nextjs";
import Button from "./Button";
import { useRouter } from "next/navigation";

export default function MobileSidebar() {
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <>
      {/* Menu Button */}
      <div className="flex justify-center items-center gap-4">
        <button onClick={() => setShow(true)} className="p-2">
          <Menu className="text-white hover:scale-125 transition-transform" />
        </button>
      </div>

      {/* Sidebar */}
      {show && (
        <motion.div
          initial={{ translateX: 400 }}
          animate={{ translateX: 0 }}
          exit={{ translateX: 400 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 right-0 w-1/2 h-screen bg-gradient-to-b from-blue-900 via-gray-800 to-blue-900 shadow-2xl z-50"
        >
          {/* Close Button */}
          <div className="flex justify-end p-4">
            <button onClick={() => setShow(false)}>
              <CircleX className="stroke-white hover:scale-125 transition-transform" />
            </button>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-gray-900 rounded-full shadow-inner px-4 py-2 mx-4"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow text-white bg-transparent outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              className="text-white px-2 hover:text-blue-400 transition"
            >
              <Search />
            </button>
          </form>

          {/* Menu Links */}
          <ul className="flex flex-col gap-6 text-white text-lg font-semibold p-8 mt-6">
            {["Home", "Converter", "Contents", "Chatbot", "Contribute"].map(
              (item, index) => (
                <li
                  key={index}
                  className="hover:bg-gray-800 px-4 py-2 rounded-md transition-colors duration-300"
                >
                  <Link
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="block"
                    onClick={() => setShow(false)}
                  >
                    {item}
                  </Link>
                </li>
              )
            )}
          </ul>

          {/* Authentication */}
          <div className="flex justify-center items-center mt-8">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-16 h-16",
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
        </motion.div>
      )}
    </>
  );
}
