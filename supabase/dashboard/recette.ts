// Version à coller dans l'éditeur de fonctions Supabase (copie de supabase/functions/recette/index.ts).
// Nom de la fonction : recette

// Lit une page de recette (Marmiton, 750g, Cuisine AZ, Journal des Femmes…) et renvoie son nom et ses ingrédients.
// Ces sites décrivent leurs recettes dans un bloc « application/ld+json » de type Recipe : c'est lui qu'on lit.
// Appel : POST { url } avec la session de l'app. Réponse : { name, ingredients: string[], steps: string[] } ou { error }.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const MAX_BYTES = 3_000_000;

function publicHttpsUrl(raw: string): URL | undefined {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return undefined;
    const h = u.hostname.toLowerCase();
    // Pas d'adresses internes ni d'adresses IP : seulement de vrais sites.
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.')) return undefined;
    if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return undefined;
    return u;
  } catch {
    return undefined;
  }
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// deno-lint-ignore no-explicit-any
function findRecipe(node: any): any {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return undefined;
  }
  const t = node['@type'];
  if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return node;
  return findRecipe(node['@graph']) ?? findRecipe(node.mainEntity);
}

/** Étapes : texte, liste de textes, HowToStep ou HowToSection. */
// deno-lint-ignore no-explicit-any
function stepsOf(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string')
    return decode(node.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n'))
      ? node
          .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
          .split(/\n+/)
          .map(decode)
          .filter(Boolean)
      : [];
  if (Array.isArray(node)) return node.flatMap(stepsOf);
  if (node.itemListElement) return stepsOf(node.itemListElement);
  if (node.text) return stepsOf(String(node.text));
  if (node.name) return stepsOf(String(node.name));
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let url: URL | undefined;
  try {
    url = publicHttpsUrl(String((await req.json()).url ?? ''));
  } catch {
    url = undefined;
  }
  if (!url) return reply({ error: 'Ce lien n’est pas valide. Copiez l’adresse complète de la page (https://…).' }, 400);

  let html = '';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NosCourses/1.0)', 'Accept-Language': 'fr-FR,fr;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000)
    });
    if (!res.ok) return reply({ error: `Le site a refusé la lecture (erreur ${res.status}).` }, 502);
    const buf = new Uint8Array(await res.arrayBuffer());
    html = new TextDecoder().decode(buf.slice(0, MAX_BYTES));
  } catch {
    return reply({ error: 'Impossible d’ouvrir cette page. Vérifiez le lien.' }, 502);
  }

  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const b of blocks) {
    let json: unknown;
    try {
      json = JSON.parse(b.trim());
    } catch {
      continue;
    }
    const r = findRecipe(json);
    if (!r) continue;
    const raw = r.recipeIngredient ?? r.ingredients ?? [];
    const ingredients = (Array.isArray(raw) ? raw : [raw]).map((x: unknown) => decode(String(x))).filter(Boolean).slice(0, 60);
    if (!ingredients.length) continue;
    const steps = stepsOf(r.recipeInstructions).slice(0, 40);
    return reply({ name: decode(String(r.name ?? '')).slice(0, 120), ingredients, steps });
  }
  return reply({ error: 'Je n’ai pas trouvé de liste d’ingrédients sur cette page.' }, 422);
});
