// @ts-ignore - itty-router is a JS dependency
import { Router } from 'itty-router';
import { requireAuth } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const consultRouter = Router();

// In-memory slot store (replace with DB in production)
interface Slot {
  id: string;
  start: string;
  end: string;
  booked: boolean;
  client_id: number | null;
  fee: number;
}

const SLOT_DURATION_MIN = 30;
const SLOT_FEE = 50.00;

function getSlots(): Slot[] {
  // Generate slots for next 24 hours on each request (stateless)
  const slots: Slot[] = [];
  const now = new Date();
  for (let i = 0; i < 48; i++) {
    const slot = new Date(now.getTime() + i * SLOT_DURATION_MIN * 60000);
    slots.push({
      id: uuid(),
      start: slot.toISOString(),
      end: new Date(slot.getTime() + SLOT_DURATION_MIN * 60000).toISOString(),
      booked: false,
      client_id: null,
      fee: SLOT_FEE
    });
  }
  return slots;
}


// GET /api/consult/slots - List all available slots
consultRouter.get('/slots', async (req: Request, env: any) => {
  // Always generate fresh slots (stateless, demo only)
  const slots = getSlots();
  return new Response(JSON.stringify(slots.filter(s => !s.booked)), { headers: { 'Content-Type': 'application/json' } });
});

// POST /api/consult/book - Book a slot (auth required)
consultRouter.post('/book', async (req: Request, env: any) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const body = (await req.json()) as { slot_id?: string };
  const slot_id = body.slot_id;
  if (!slot_id) return new Response(JSON.stringify({ error: 'Missing slot_id' }), { status: 400 });
  // In a real app, booking would persist to DB. Here, just return the slot as booked.
  const slots = getSlots();
  const slot = slots.find((s: Slot) => s.id === slot_id && !s.booked);
  if (!slot) return new Response(JSON.stringify({ error: 'Slot unavailable' }), { status: 400 });
  slot.booked = true;
  slot.client_id = user.id;
  // TODO: Integrate payment gateway and require $50 payment
  // TODO: Send confirmation/notification
  return new Response(JSON.stringify({ success: true, slot }), { headers: { 'Content-Type': 'application/json' } });
});

export default consultRouter;
