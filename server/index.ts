import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ADS_EVERY_N_SEARCHES, DEFAULT_PINCODE, PORT, isProd } from './config.ts';
import { authRouter, requireAuth, type AuthedRequest } from './auth.ts';
import { store } from './store.ts';
import { fail, publicUser } from './http.ts';
import { PRODUCTS_BY_ID, TRENDING_IDS, findByExactName, toSummary } from './catalog/catalog.ts';
import { suggest } from './catalog/search.ts';
import { compare, fromPrice } from './pricing/index.ts';
import type { Comparison, SuggestionItem } from '../shared/types.ts';

export const MIN_QUERY_LENGTH = 3;

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const api = express.Router();
api.use('/auth', authRouter);
api.use(requireAuth);

const userOf = (req: express.Request) => (req as unknown as AuthedRequest).user;
const pincodeOf = (req: express.Request) => userOf(req).profile?.pincode ?? DEFAULT_PINCODE;

api.get('/me', (req, res) => res.json({ user: publicUser(userOf(req)) }));

api.put('/me/profile', (req, res) => {
  const name = String(req.body?.name ?? '').trim().replace(/\s+/g, ' ');
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const pincode = String(req.body?.pincode ?? '').trim();
  if (name.length < 2 || name.length > 60) return fail(res, 400, 'invalid_name', 'Enter your name (2–60 characters).');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email) || email.length > 120) return fail(res, 400, 'invalid_email', 'Enter a valid email address.');
  if (!/^[1-9]\d{5}$/.test(pincode)) return fail(res, 400, 'invalid_pincode', 'Enter a valid 6-digit pincode.');
  const user = userOf(req);
  user.profile = { name, email, pincode };
  store.saveUser(user);
  res.json({ user: publicUser(user) });
});

api.get('/suggest', (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 80);
  if (q.trim().length < MIN_QUERY_LENGTH) return res.json({ items: [], exactId: null });
  const pin = pincodeOf(req);
  const items: SuggestionItem[] = suggest(q).map((s) => ({
    ...toSummary(s.product),
    highlights: s.highlights,
    fromPrice: fromPrice(s.product, pin),
  }));
  res.json({ items, exactId: findByExactName(q)?.id ?? null });
});

api.get('/trending', (req, res) => {
  const pin = pincodeOf(req);
  res.json({
    items: TRENDING_IDS.map((id) => PRODUCTS_BY_ID[id]).map((p) => ({ ...toSummary(p), fromPrice: fromPrice(p, pin) })),
  });
});

api.get('/products/:id/compare', async (req, res) => {
  const product = PRODUCTS_BY_ID[req.params.id];
  if (!product) return fail(res, 404, 'not_found', "We couldn't find that product.");
  const user = userOf(req);
  const result = await compare(product, pincodeOf(req));
  // Every product comparison counts as one search; every Nth one carries an ad.
  user.searchCount = (user.searchCount ?? 0) + 1;
  store.saveUser(user);
  const body: Comparison = { ...result, showAd: user.searchCount % ADS_EVERY_N_SEARCHES === 0 };
  res.json(body);
});

app.use('/api', api);
app.use('/api', (_req, res) => fail(res, 404, 'not_found', 'Unknown endpoint'));

// In production the same server hosts the built PWA.
const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) {
  app.use(
    express.static(dist, {
      setHeaders: (res, path) => {
        if (path.includes(`${join('dist', 'assets')}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  fail(res, 500, 'server_error', 'Something went wrong. Please try again.');
});

app.listen(PORT, () => console.log(`QuickHai API on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`));
