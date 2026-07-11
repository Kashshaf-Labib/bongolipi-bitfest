"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs"; // Correct hook for accessing user info
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";

export default function AfterSignUpPage() {
  const { user } = useUser(); // Access user details
  const router = useRouter();

  useEffect(() => {
    const saveUserToDatabase = async () => {
      if (!user) return;

      const { id, firstName, lastName, emailAddresses } = user;

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: id,
            firstName,
            lastName,
            email: emailAddresses[0].emailAddress, // Primary email address
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save user.");
        }

        // Redirect to dashboard or home after successful database entry
        router.push("/");
      } catch (error) {
        console.error("Error saving user:", error);
        alert("Failed to save user. Please try again.");
      }
    };

    saveUserToDatabase();
  }, [user, router]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 bg-background">
      <Loader size={32} />
      <p className="text-lg text-muted-foreground">Finalizing your setup…</p>
    </div>
  );
}
