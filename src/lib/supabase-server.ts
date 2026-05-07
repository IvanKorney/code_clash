import axios from "axios";

const broadcast = async (topic: string, event: string, payload: object = {}) => {
  await axios.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
    { messages: [{ topic, event, payload }] },
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const broadcastToRoom = (roomId: string, event: string, payload: object = {}) =>
  broadcast(`match:${roomId}`, event, payload);

export const broadcastToWaitingRoom = (roomId: string, event: string, payload: object = {}) =>
  broadcast(`room:${roomId}`, event, payload);
