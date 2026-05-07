import axios from "axios";

export const broadcastToRoom = async (roomId: string, event: string, payload: object = {}) => {
  await axios.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
    { messages: [{ topic: `match:${roomId}`, event, payload }] },
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        "Content-Type": "application/json",
      },
    },
  );
};
