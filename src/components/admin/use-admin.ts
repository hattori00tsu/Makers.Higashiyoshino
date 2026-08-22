"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/account/use-session";

export function useAdmin(options?: { skip?: boolean }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const skip = options?.skip ?? false;

  useEffect(() => {
    if (skip || loading) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (user.role !== "admin") router.replace("/admin/login?denied=1");
  }, [user, loading, router, skip]);

  return { user, loading, ready: Boolean(user && user.role === "admin") };
}
