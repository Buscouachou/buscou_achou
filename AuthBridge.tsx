import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { setTokenGetter } from "@/lib/api";

// Hands Clerk's session token to the fetch layer and drops cached data when the account changes.
export default function AuthBridge() {
  const { isLoaded, userId, getToken } = useAuth();
  const qc = useQueryClient();
  const prev = useRef<string | null | undefined>(undefined);

  if (isLoaded) setTokenGetter(() => getToken());

  useEffect(() => {
    if (!isLoaded) return;
    if (prev.current !== undefined && prev.current !== userId) qc.clear();
    prev.current = userId ?? null;
  }, [isLoaded, userId, qc]);

  return null;
}
