import {
  emptyDraft,
  normalizeArtistDraft,
  previewSession,
  type ArtistDraft,
  type SessionUser,
  type WorkDraft,
} from "@/lib/account/types";

const KEY = "hy-local-v2";

export type LocalAccount = {
  user: SessionUser;
  artist: ArtistDraft | null;
  works: WorkDraft[];
};

type Store = Record<string, LocalAccount>;

function seedApproved(): LocalAccount {
  const user = previewSession("preview-artist")!;
  return {
    user,
    artist: {
      ...emptyDraft(),
      slug: user.id,
      name: user.name,
      status: "approved",
    },
    works: [],
  };
}

function seedVisitor(): LocalAccount {
  return {
    user: previewSession("preview-visitor")!,
    artist: null,
    works: [],
  };
}

function seedAdmin(): LocalAccount {
  return {
    user: previewSession("preview-admin")!,
    artist: null,
    works: [],
  };
}

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
  const initial: Store = {
    "preview-visitor": seedVisitor(),
    "preview-artist": seedApproved(),
    "preview-admin": seedAdmin(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

function write(store: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

function withNormalizedArtist(account: LocalAccount): LocalAccount {
  const artist = account.artist ? normalizeArtistDraft(account.artist) : null;
  const artistStatus =
    account.user.artistStatus === "pending" || artist?.status === "pending"
      ? "approved"
      : account.user.artistStatus;
  return {
    ...account,
    user: {
      ...account.user,
      artistStatus,
      role:
        account.user.role === "admin"
          ? "admin"
          : artistStatus === "approved"
            ? "artist"
            : account.user.role,
    },
    artist: artist
      ? { ...artist, status: artist.status === "pending" ? "approved" : artist.status }
      : null,
  };
}

export function getLocalAccount(id: string) {
  const account = read()[id] ?? null;
  return account ? withNormalizedArtist(account) : null;
}

export function listLocalAccounts() {
  return Object.values(read()).map(withNormalizedArtist);
}

export function saveLocalAccount(account: LocalAccount) {
  const store = read();
  store[account.user.id] = account;
  write(store);
}

export function submitLocalApplication(id: string, draft: ArtistDraft) {
  const account = getLocalAccount(id);
  if (!account) return null;
  const registered: ArtistDraft = {
    ...draft,
    status: "approved",
    studioMapUrl: draft.studioMapUrl || draft.studioName,
    slug: draft.slug.trim() || `artist-${Date.now().toString(36)}`,
  };
  const next: LocalAccount = {
    ...account,
    user: {
      ...account.user,
      role: account.user.role === "admin" ? "admin" : "artist",
      artistStatus: "approved",
      name: draft.name,
    },
    artist: registered,
  };
  saveLocalAccount(next);
  return next;
}

export function setLocalArtistStatus(id: string, status: "approved" | "rejected") {
  const account = getLocalAccount(id);
  if (!account?.artist) return null;
  const next: LocalAccount = {
    ...account,
    user: {
      ...account.user,
      role:
        account.user.role === "admin" ? "admin" : status === "approved" ? "artist" : "visitor",
      artistStatus: status,
    },
    artist: { ...account.artist, status },
  };
  saveLocalAccount(next);
  return next;
}

export function saveLocalDraft(id: string, draft: ArtistDraft) {
  const account = getLocalAccount(id);
  if (!account) return null;
  const artistStatus = draft.status === "rejected" ? "rejected" : draft.status === "approved" ? "approved" : account.user.artistStatus;
  const next: LocalAccount = {
    ...account,
    user: {
      ...account.user,
      name: draft.name,
      artistStatus,
      role: account.user.role === "admin" ? "admin" : artistStatus === "approved" ? "artist" : "visitor",
    },
    artist: draft,
  };
  saveLocalAccount(next);
  return next;
}

export function listLocalArtists() {
  return listLocalAccounts()
    .filter((account): account is LocalAccount & { artist: ArtistDraft } => Boolean(account.artist))
    .map((account) => ({
      id: account.user.id,
      profileId: account.user.id,
      draft: account.artist,
    }));
}

export function findLocalArtist(slugOrId: string) {
  return (
    listLocalArtists().find((item) => item.draft.slug === slugOrId || item.id === slugOrId) ?? null
  );
}

export function createLocalArtist(draft: ArtistDraft) {
  const id = `admin-artist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const registered: ArtistDraft = {
    ...draft,
    studioMapUrl: draft.studioMapUrl || draft.studioName,
    slug: draft.slug.trim() || `artist-${Date.now().toString(36)}`,
    status: draft.status === "rejected" ? "rejected" : "approved",
  };
  saveLocalAccount({
    user: {
      id,
      email: "",
      name: registered.name,
      role: "artist",
      artistStatus: registered.status,
      artistSlug: registered.slug,
      source: "preview",
    },
    artist: registered,
    works: [],
  });
  return {
    id,
    profileId: id,
    draft: registered,
  };
}

export function saveLocalWorks(id: string, works: WorkDraft[]) {
  const account = getLocalAccount(id);
  if (!account) return null;
  const next = { ...account, works };
  saveLocalAccount(next);
  return next;
}

export function ensureLocalSeed() {
  read();
}

export { emptyDraft };
