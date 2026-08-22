export async function notifyOps(input: {
  type: "artist" | "event";
  name: string;
  eventTitle?: string;
  eventSlug?: string;
}) {
  const path = input.type === "event" ? "/api/mail/admin-event" : "/api/mail/admin-pending";
  try {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        eventTitle: input.eventTitle,
        eventSlug: input.eventSlug,
      }),
    });
  } catch {
    /* 登録そのものは止めない */
  }
}

export async function notifyArtistDecision(input: {
  name: string;
  artistId: string;
  status: "approved" | "rejected";
}) {
  try {
    await fetch("/api/mail/artist-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    /* 公開切替そのものは止めない */
  }
}
