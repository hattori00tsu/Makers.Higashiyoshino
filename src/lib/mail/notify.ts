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
