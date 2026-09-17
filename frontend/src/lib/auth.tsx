import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ApiError, authApi, teamApi, type User, type Team } from "./api";

export const meQueryKey = ["auth", "me"] as const;
export const myTeamQueryKey = ["team", "mine"] as const;

/**
 * Current session state.
 *
 * Deliberately client-only (`enabled` is gated on `typeof window`): the
 * session lives in an httpOnly cookie on the API's origin, and during SSR
 * this app has no way to forward it. Rendering the signed-out shell first
 * and resolving auth on the client keeps the two from disagreeing.
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await authApi.me();
        return user;
      } catch (err) {
        // 401 is the normal signed-out answer, not a failure worth retrying.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    enabled: typeof window !== "undefined",
    retry: false,
    staleTime: 30_000,
  });

  const teamQuery = useQuery({
    queryKey: [...myTeamQueryKey, query.data?.id],
    queryFn: async (): Promise<Team | null> => {
      if (!query.data) return null;
      try {
        const res = await teamApi.getMine();
        return res?.team ?? null;
      } catch {
        return null;
      }
    },
    enabled: typeof window !== "undefined" && !!query.data,
    staleTime: 30_000,
  });

  const signOut = useMutation({
    mutationFn: () => authApi.signout(),
    // Clear local session state even if the call failed - the user asked to
    // leave, and a stale "signed in" UI is worse than an orphaned cookie.
    onSettled: () => {
      queryClient.setQueryData(meQueryKey, null);
      queryClient.setQueryData(myTeamQueryKey, null);
    },
  });

  const hasTeam = Boolean(teamQuery.data);
  const isAdmin =
    query.data?.role === "SUPER_ADMIN" ||
    query.data?.role === "ADMIN" ||
    query.data?.role === "RESOURCE";
  const hasRegisteredTeamOrAdmin = hasTeam || isAdmin;

  return {
    user: query.data ?? null,
    myTeam: teamQuery.data ?? null,
    hasTeam,
    isAdmin,
    hasRegisteredTeamOrAdmin,
    isLoading: query.isLoading,
    isSignedIn: !!query.data,
    /** Re-read the session - call after signin/OTP verify sets the cookie. */
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: meQueryKey });
      queryClient.invalidateQueries({ queryKey: myTeamQueryKey });
    },
    setUser: (user: User | null) => queryClient.setQueryData(meQueryKey, user),
    signOut: signOut.mutateAsync,
  };
}

/**
 * Gate for pages that need a signed-in, email-verified user - mirrors the
 * `requireAuth` + `requireVerifiedEmail` pair the backend puts in front of
 * every `/api/register/*` route. This is UX, not security: the server check
 * is the one that matters.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/signin" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[#ff4d4f] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (user.emailVerified === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900">Verify your email first</h1>
          <p className="mt-2 text-sm text-gray-500">
            Team registration opens once your email address is confirmed.
          </p>
          {/* /signin, not /signup: the account already exists, so re-submitting
              the signup form just 409s. Signing in with an unverified account
              returns 403, which AuthPage turns into the OTP screen. */}
          <Link
            to="/signin"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-[#ff5a5f] px-5 text-sm font-semibold text-white"
          >
            Verify now
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
