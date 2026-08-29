/**
 * Tell the IndexNow engines about our public pages.
 *
 * IndexNow is a single ping that notifies Bing, Yahoo (which runs on Bing),
 * Yandex, Seznam and others at once, so a new or changed page gets crawled in
 * hours instead of waiting to be discovered. Google does not use IndexNow;
 * Google finds pages through the sitemap and Search Console.
 *
 * This reads the LIVE sitemap and submits exactly what is deployed, so run it
 * after a deploy:
 *
 *   npx tsx scripts/indexnow.mts
 *
 * The key file must be reachable at https://chumley.app/<KEY>.txt, which it is
 * because it lives in public/. If IndexNow cannot fetch and match that file,
 * it rejects the whole batch.
 */
const SITE = "https://chumley.app";
const KEY = "12d0103a70c41e0d0b1ed955783db640";

const sitemapRes = await fetch(`${SITE}/sitemap.xml`);
if (!sitemapRes.ok) {
  console.error(`Could not read ${SITE}/sitemap.xml (HTTP ${sitemapRes.status}).`);
  process.exit(1);
}
const xml = await sitemapRes.text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (urlList.length === 0) {
  console.error("No URLs found in the sitemap. Nothing submitted.");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList,
  }),
});

console.log(`IndexNow: submitted ${urlList.length} urls, HTTP ${res.status}`);
if (res.status === 200 || res.status === 202) {
  console.log("Accepted. Bing and Yahoo will crawl these shortly.");
} else {
  console.error("Not accepted:", await res.text());
  process.exitCode = 1;
}
