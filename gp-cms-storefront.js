/* Galaxy Point public storefront CMS reader.
   Only reads public published data. Admin edits require separate authenticated access. */
(function () {
  "use strict";
  var cfg = window.GP_CMS_CONFIG || {};
  if (!/^https:\/\/[^/]+/.test(cfg.url || "") || !cfg.anonKey) return;
  var base = cfg.url.replace(/\/+$/, "");
  var headers = {"apikey": cfg.anonKey, "Accept": "application/json"};
  if (cfg.anonKey.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.anonKey;
  var currentFingerprint = "";
  async function fetchContent() {
    try {
      var urls = [
        base + "/rest/v1/gp_site_content?select=*&id=eq.main",
        base + "/rest/v1/gp_products?select=id,name,brand,details,category,price,stock,photo_url,is_published,position&is_published=eq.true&order=position.asc,id.asc"
      ];
      var responses = await Promise.all(urls.map(url => fetch(url, {headers, cache:"no-store"})));
      if (responses.some(r => !r.ok)) throw new Error("CMS database is not yet configured");
      var data = await Promise.all(responses.map(r => r.json()));
      var payload = {site: data[0][0] || null, products: data[1]};
      var fp = JSON.stringify(payload);
      if (fp !== currentFingerprint) {
        currentFingerprint = fp;
        window.dispatchEvent(new CustomEvent("gp:content-ready", {detail: payload}));
      }
    } catch (err) {
      // Preserve the original Galaxy Point storefront when the CMS is not configured.
      console.warn("Galaxy Point CMS is unavailable; original website remains unchanged.", err.message);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fetchContent, {once:true});
  else fetchContent();
  setInterval(() => {if (!document.hidden) fetchContent()}, 60000);
  document.addEventListener("visibilitychange", () => {if (!document.hidden) fetchContent()});
})();
