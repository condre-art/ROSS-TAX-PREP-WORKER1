// --- Instagram API Integration ---
// Handles Instagram feed, reviews, analytics, posting, and DM functionality

export async function handleInstagramFeed(env) {
  try {
    const feed = {
      posts: [
        {
          id: "ig-1",
          caption: "Tax season is here! Get your documents organized 📋 #TaxPrep2026",
          image_url: "https://placehold.co/400",
          likes: 245,
          comments: 18,
          timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
        },
        {
          id: "ig-2",
          caption: "Did you know? You can claim home office deductions! 🏠💼 #TaxTips",
          image_url: "https://placehold.co/400",
          likes: 189,
          comments: 12,
          timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
        },
        {
          id: "ig-3",
          caption: "Meet our team of expert tax preparers! 👥 Ready to help you save! #RossTaxPrep",
          image_url: "https://placehold.co/400",
          likes: 312,
          comments: 24,
          timestamp: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
        }
      ]
    };
    return new Response(JSON.stringify(feed), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram feed error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram feed" }), { status: 500 });
  }
}

export async function handleInstagramReviews(env) {
  try {
    const reviews = {
      total_reviews: 156,
      average_rating: 4.7,
      reviews: [
        {
          id: "rev-1",
          reviewer: "John Smith",
          rating: 5,
          text: "Excellent service! Got my refund quickly.",
          timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
        },
        {
          id: "rev-2",
          reviewer: "Maria Garcia",
          rating: 5,
          text: "Very professional and helpful team!",
          timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
        },
        {
          id: "rev-3",
          reviewer: "David Lee",
          rating: 4,
          text: "Great service, would recommend.",
          timestamp: new Date(Date.now() - 6 * 24 * 3600000).toISOString()
        }
      ]
    };
    return new Response(JSON.stringify(reviews), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram reviews error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram reviews" }), { status: 500 });
  }
}

export async function handleInstagramAnalytics(env) {
  try {
    const analytics = {
      followers: 4250,
      engagement_rate: 6.8,
      reach_this_month: 12500,
      impressions_this_month: 45300,
      posts_this_month: 12,
      saves_this_month: 834,
      shares_this_month: 312,
      profile_visits_this_month: 3400,
      top_post: {
        id: "ig-3",
        engagement: 348,
        reach: 2100
      }
    };
    return new Response(JSON.stringify(analytics), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram analytics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram analytics" }), { status: 500 });
  }
}

export async function handleInstagramPost(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json();
    const { caption, imageUrl } = body;

    if (!caption || !imageUrl) {
      return new Response(JSON.stringify({ error: "Missing caption or imageUrl" }), { status: 400 });
    }

    // Mock Instagram API call
    const postId = `ig-${Date.now()}`;
    const response = {
      success: true,
      post_id: postId,
      caption: caption,
      image_url: imageUrl,
      posted_at: new Date().toISOString(),
      platform: "instagram"
    };

    // Log to database if available
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO social_posts (id, platform, content, media_urls, posted_at, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        postId,
        "instagram",
        caption,
        JSON.stringify([imageUrl]),
        new Date().toISOString(),
        "published",
        user.id
      ).run();
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram post error:", error);
    return new Response(JSON.stringify({ error: "Failed to post to Instagram" }), { status: 500 });
  }
}

export async function handleInstagramDM(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json();
    const { recipient_id, message } = body;

    if (!recipient_id || !message) {
      return new Response(JSON.stringify({ error: "Missing recipient_id or message" }), { status: 400 });
    }

    // Mock Instagram DM API call
    const dmId = `dm-${Date.now()}`;
    const response = {
      success: true,
      dm_id: dmId,
      recipient_id: recipient_id,
      message: message,
      sent_at: new Date().toISOString(),
      platform: "instagram"
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram DM error:", error);
    return new Response(JSON.stringify({ error: "Failed to send Instagram DM" }), { status: 500 });
  }
}
