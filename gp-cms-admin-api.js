/* Authorized staff data adapter for the EXISTING Galaxy Point editor UI.
   This file does not change the editor design. Include it after supabase-js + gp-cms-config.js.
   Requires Supabase Auth email/password + a row in public.gp_admin_users. */
(function () {
  "use strict";
  window.GPAdminCMS = function createCMS() {
    var cfg = window.GP_CMS_CONFIG || {};
    if (!window.supabase || !cfg.url || !cfg.anonKey) throw new Error("Connect Supabase first.");
    var client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
    });
    async function ok(query) {
      var r = await query;
      if (r.error) throw r.error;
      return r.data;
    }
    async function requireEditor() {
      var res = await client.auth.getUser();
      if (res.error || !res.data.user) throw new Error("Please sign in.");
      var admins = await ok(client.from("gp_admin_users").select("role").eq("user_id",res.data.user.id).limit(1));
      if (!admins.length) throw new Error("Your account is not authorized to edit this website.");
      return {user:res.data.user, role:admins[0].role};
    }
    return {
      client:client,
      signIn: async (email,password) => {
        var r = await client.auth.signInWithPassword({email,password});
        if (r.error) throw r.error;
        await requireEditor();
        return r.data;
      },
      signOut: () => client.auth.signOut(),
      session: () => client.auth.getSession(),
      requireEditor,
      loadSite: async () => {await requireEditor();var rows=await ok(client.from("gp_site_content").select("*").eq("id","main").limit(1));return rows[0]||null;},
      publishSite: async patch => {await requireEditor();return ok(client.from("gp_site_content").upsert({...patch,id:"main"},{onConflict:"id"}).select().single());},
      listProducts: async () => {await requireEditor();return ok(client.from("gp_products").select("*").order("position").order("id"));},
      addProduct: async product => {await requireEditor();return ok(client.from("gp_products").insert(product).select().single());},
      updateProduct: async (id,patch) => {await requireEditor();return ok(client.from("gp_products").update(patch).eq("id",id).select().single());},
      deleteProduct: async id => {await requireEditor();return ok(client.from("gp_products").delete().eq("id",id));},
      uploadMedia: async (file,folder) => {
        var auth=await requireEditor();
        if (!file || !file.size || file.size>100*1024*1024) throw new Error("Please select a file under 100MB.");
        if (!/^(image\/(jpeg|png|webp)|video\/(mp4|webm))$/.test(file.type)) throw new Error("Only JPG, PNG, WebP, MP4 and WebM are supported.");
        var path=auth.user.id+"/"+(folder||"media")+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
        var r=await client.storage.from("gp-site-media").upload(path,file,{upsert:false,contentType:file.type});
        if (r.error) throw r.error;
        return client.storage.from("gp-site-media").getPublicUrl(path).data.publicUrl;
      }
    };
  };
})();
