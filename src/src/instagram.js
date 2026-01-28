// instagram.js

export async function handleInstagramFeed(env) {
  const res = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${env.IG_ACCESS_TOKEN}`
  );
  const data = await res.json();
  return new Response(JSON.stringify(data.data || []), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleInstagramReviews(env) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${env.IG_BUSINESS_ID}/mentions?fields=media_url,caption,username,timestamp&access_token=${env.IG_ACCESS_TOKEN}`
  );
  const data = await res.json();
  return new Response(JSON.stringify(data.data || []), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleInstagramAnalytics(env) {
  const metrics = "impressions,reach,profile_views,follower_count";
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${env.IG_BUSINESS_ID}/insights?metric=${metrics}&period=day&access_token=${env.IG_ACCESS_TOKEN}`
  );
  const data = await res.json();
  return new Response(JSON.stringify(data.data || []), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleInstagramPost(request, env, user) {
  // requireRole(user, ["admin", "staff"]); // call from main router
  const { caption, imageUrl } = await request.json();

  const createRes = await fetch(
    `https://graph.facebook.com/v18.0/${env.IG_BUSINESS_ID}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: env.IG_ACCESS_TOKEN
      })
    }
  );
  const createData = await createRes.json();

  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/${env.IG_BUSINESS_ID}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: createData.id,
        access_token: env.IG_ACCESS_TOKEN
      })
    }
  );
  const publishData = await publishRes.json();

  return new Response(JSON.stringify(publishData), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function handleInstagramDM(request, env, user) {
  // requireRole(user, ["admin", "staff"]); // call from main router
  const { igUserId, message } = await request.json();

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/messages`,
    {
      method: "POST",
      body: new URLSearchParams({
        message,
        access_token: env.IG_ACCESS_TOKEN
      })
    }
  );
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
