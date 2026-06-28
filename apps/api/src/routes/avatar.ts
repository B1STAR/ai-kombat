/**
 * Avatar proxy — contourne le CORS de t.me/i/userpic
 * GET /api/avatar/:telegramId
 *
 * Telegram bloque le chargement direct des userpics depuis un browser externe.
 * Ce proxy recupere l'image cote serveur et la retransmet au client avec les bons headers.
 * Cache 10 min dans les headers HTTP pour eviter les appels repetitifs.
 */
import { Hono } from 'hono';
import { db } from '../db/knex';

const avatar = new Hono();

avatar.get('/:telegramId', async (c) => {
  const telegramId = Number(c.req.param('telegramId'));
  if (isNaN(telegramId)) return c.text('Invalid ID', 400);

  // Recuperer l'URL stockee en DB
  const user = await db('users')
    .where({ telegram_id: telegramId })
    .select('photo_url')
    .first();

  if (!user?.photo_url) {
    // Pas de photo : renvoyer une image SVG de fallback (initiale)
    return c.notFound();
  }

  try {
    const res = await fetch(user.photo_url, {
      headers: {
        // Simuler un user-agent browser pour que t.me renvoie bien l'image
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Kombat-Bot/1.0)',
        'Accept': 'image/svg+xml,image/webp,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return c.notFound();
    }

    const contentType = res.headers.get('content-type') || 'image/svg+xml';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=600', // cache 10 min
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return c.notFound();
  }
});

export default avatar;
