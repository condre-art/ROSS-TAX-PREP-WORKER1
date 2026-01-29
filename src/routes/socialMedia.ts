// --- Social Media Integration Handler ---
// Manages posting, monitoring, and reviews across Instagram, X/Twitter, Facebook, and Google

import { SOCIAL_MEDIA_HANDLES } from "../index";

// Business info structure - should match actual data in index.ts
const BUSINESS_INFO = {
  display_name: "Ross Tax Prep",
  legal_name: "Ross Tax Preparation Services LLC",
  ein: "XX-XXXXXXX",
  category: "Tax Preparation Service",
  address: "123 Main Street",
  city: "Your City",
  state: "ST",
  zip: "12345",
  phone_formatted: "(555) 123-4567",
  email: "info@rosstaxprep.com",
  website_url: "https://rosstaxprep.com",
  google_business_verified: true,
  google_verification_date: "2024-01-15"
};

export interface SocialPost {
  id: string;
  platform: "instagram" | "twitter" | "facebook" | "google";
  content: string;
  media_urls?: string[];
  posted_at: string;
  engagement_count?: number;
  status: "draft" | "scheduled" | "published";
}

export interface GoogleReview {
  id: string;
  reviewer_name: string;
  reviewer_email?: string;
  rating: number; // 1-5 stars
  review_text: string;
  review_date: string;
  response?: string;
  response_date?: string;
  helpful_count?: number;
}

export interface SocialMetrics {
  platform: string;
  followers: number;
  engagement_rate: number;
  posts_this_month: number;
  top_post: string;
  average_rating?: number;
}

/**
 * GET /api/social/google/reviews - Get Google reviews
 */
export async function handleGoogleReviews(req: Request, env: any): Promise<Response> {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const rating = url.searchParams.get("rating");

  try {
    // Mock Google reviews - in production, fetch from Google My Business API
    let reviews: GoogleReview[] = [
      {
        id: "gr-1",
        reviewer_name: "Sarah Johnson",
        rating: 5,
        review_text: "Excellent service! They made tax season stress-free. Highly recommend!",
        review_date: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        helpful_count: 12
      },
      {
        id: "gr-2",
        reviewer_name: "Mike Chen",
        rating: 5,
        review_text: "Professional, knowledgeable, and affordable. Best tax prep service in town.",
        review_date: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        helpful_count: 8
      },
      {
        id: "gr-3",
        reviewer_name: "Jennifer Martinez",
        rating: 4,
        review_text: "Great service overall. Very organized and timely. Minor follow-up would have been better.",
        review_date: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
        helpful_count: 5
      },
      {
        id: "gr-4",
        reviewer_name: "David Wilson",
        rating: 5,
        review_text: "Finally found a tax prep service I can trust completely. Excellent attention to detail.",
        review_date: new Date(Date.now() - 12 * 24 * 3600000).toISOString(),
        helpful_count: 15,
        response: "Thank you David! We appreciate your trust and look forward to serving you next year.",
        response_date: new Date(Date.now() - 11 * 24 * 3600000).toISOString()
      }
    ];

    // Filter by rating if specified
    if (rating) {
      const ratingNum = parseInt(rating);
      reviews = reviews.filter(r => r.rating === ratingNum);
    }

    return new Response(JSON.stringify({
      total_reviews: reviews.length,
      average_rating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
      reviews: reviews.slice(0, limit)
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google reviews error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Google reviews" }), { status: 500 });
  }
}

/**
 * POST /api/social/google/reply - Reply to a Google review
 */
export async function handleGoogleReplyReview(req: Request, env: any, user: any): Promise<Response> {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json() as {
      review_id: string;
      reply_text: string;
    };

    if (!body.review_id || !body.reply_text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const replyId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO google_review_replies (id, review_id, reply_text, created_by, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        replyId,
        body.review_id,
        body.reply_text,
        user.id,
        now
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      reply_id: replyId,
      reply_date: now
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google reply error:", error);
    return new Response(JSON.stringify({ error: "Failed to post review reply" }), { status: 500 });
  }
}

/**
 * GET /api/social/google/stats - Get Google Business stats
 */
export async function handleGoogleStats(req: Request, env: any): Promise<Response> {
  try {
    const stats = {
      business_name: BUSINESS_INFO.display_name,
      legal_name: BUSINESS_INFO.legal_name,
      ein: BUSINESS_INFO.ein,
      category: BUSINESS_INFO.category,
      address: `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}`,
      phone: BUSINESS_INFO.phone_formatted,
      email: BUSINESS_INFO.email,
      website: BUSINESS_INFO.website_url,
      verified: BUSINESS_INFO.google_business_verified,
      verification_date: BUSINESS_INFO.google_verification_date,
      total_reviews: 47,
      average_rating: 4.8,
      rating_distribution: {
        5: 42,
        4: 4,
        3: 1,
        2: 0,
        1: 0
      },
      views_this_month: 1240,
      calls_this_month: 89,
      directions_this_month: 156,
      website_clicks: 234,
      reviews_this_month: 7,
      response_rate: 95,
      average_response_time_hours: 4
    };

    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google stats error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Google stats" }), { status: 500 });
  }
}

/**
 * POST /api/social/post - Create and post to social media
 * Supports cross-posting to multiple platforms
 */
export async function handleSocialPost(req: Request, env: any, user: any): Promise<Response> {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json() as {
      content: string;
      platforms: ("instagram" | "twitter" | "facebook")[];
      media_urls?: string[];
      schedule_time?: string;
    };

    if (!body.content || !body.platforms || body.platforms.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields: content, platforms" }), { status: 400 });
    }

    const postId = crypto.randomUUID();
    const now = new Date().toISOString();
    const results: Record<string, any> = {};

    // Post to each platform
    for (const platform of body.platforms) {
      try {
        let postUrl = "";
        let platformHandle = "";

        switch (platform) {
          case "instagram":
            platformHandle = SOCIAL_MEDIA_HANDLES.INSTAGRAM;
            postUrl = await postToInstagram(env, body.content, body.media_urls || []);
            results.instagram = { success: true, url: postUrl };
            break;
          case "twitter":
            platformHandle = SOCIAL_MEDIA_HANDLES.X_TWITTER;
            postUrl = await postToTwitter(env, body.content, body.media_urls || []);
            results.twitter = { success: true, url: postUrl };
            break;
          case "facebook":
            platformHandle = SOCIAL_MEDIA_HANDLES.FACEBOOK;
            postUrl = await postToFacebook(env, body.content, body.media_urls || []);
            results.facebook = { success: true, url: postUrl };
            break;
        }

        // Log to database if available
        if (env.DB) {
          await env.DB.prepare(
            `INSERT INTO social_posts (id, platform, content, media_urls, posted_at, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            postId,
            platform,
            body.content,
            body.media_urls ? JSON.stringify(body.media_urls) : null,
            now,
            "published",
            user.id
          ).run();
        }
      } catch (err) {
        results[platform] = { success: false, error: String(err) };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      post_id: postId,
      platforms: results
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social post error:", error);
    return new Response(JSON.stringify({ error: "Failed to create social post" }), { status: 500 });
  }
}

/**
 * GET /api/social/feed - Get aggregated social media feed
 */
export async function handleSocialFeed(req: Request, env: any): Promise<Response> {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  const limit = Number(url.searchParams.get("limit") ?? 20);

  try {
    const feed: SocialPost[] = [];

    if (!platform || platform === "all") {
      // Get from all platforms
      const instaFeed = await getInstagramFeed(env, limit);
      const twitterFeed = await getTwitterFeed(env, limit);
      const fbFeed = await getFacebookFeed(env, limit);
      
      feed.push(...instaFeed, ...twitterFeed, ...fbFeed);
    } else {
      // Get from specific platform
      switch (platform) {
        case "instagram":
          return new Response(JSON.stringify(await getInstagramFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
        case "twitter":
          return new Response(JSON.stringify(await getTwitterFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
        case "facebook":
          return new Response(JSON.stringify(await getFacebookFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
      }
    }

    // Sort by date descending
    feed.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

    return new Response(JSON.stringify(feed.slice(0, limit)), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social feed error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch social feed" }), { status: 500 });
  }
}

/**
 * GET /api/social/metrics - Get social media metrics
 */
export async function handleSocialMetrics(req: Request, env: any): Promise<Response> {
  try {
    const metrics: SocialMetrics[] = [
      {
        platform: "Instagram",
        followers: 1250,
        engagement_rate: 4.2,
        posts_this_month: 8,
        top_post: "Tax filing deadline reminders post"
      },
      {
        platform: "Twitter/X",
        followers: 890,
        engagement_rate: 3.8,
        posts_this_month: 15,
        top_post: "IRS announcement retweet"
      },
      {
        platform: "Facebook",
        followers: 2340,
        engagement_rate: 5.1,
        posts_this_month: 6,
        top_post: "Customer testimonial post"
      }
    ];

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      total_followers: metrics.reduce((sum, m) => sum + m.followers, 0),
      average_engagement: (metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length).toFixed(1)
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social metrics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch metrics" }), { status: 500 });
  }
}

/**
 * POST /api/social/schedule - Schedule a post for later
 */
export async function handleSchedulePost(req: Request, env: any, user: any): Promise<Response> {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json() as {
      content: string;
      platforms: string[];
      media_urls?: string[];
      scheduled_for: string;
    };

    if (!body.content || !body.platforms || !body.scheduled_for) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const postId = crypto.randomUUID();
    const scheduledTime = new Date(body.scheduled_for).toISOString();

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO scheduled_social_posts (id, content, platforms, media_urls, scheduled_for, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        postId,
        body.content,
        JSON.stringify(body.platforms),
        body.media_urls ? JSON.stringify(body.media_urls) : null,
        scheduledTime,
        user.id
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      post_id: postId,
      scheduled_for: scheduledTime
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Schedule post error:", error);
    return new Response(JSON.stringify({ error: "Failed to schedule post" }), { status: 500 });
  }
}

/**
 * GET /api/social/mentions - Get mentions across platforms
 */
export async function handleSocialMentions(req: Request, env: any): Promise<Response> {
  try {
    const mentions = [
      {
        platform: "twitter",
        handle: "@client123",
        text: "Just filed my taxes with @rosstaxprep - great service!",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        sentiment: "positive"
      },
      {
        platform: "instagram",
        handle: "@localcpa",
        text: "Love the quick turnaround from Ross Tax Prep!",
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        sentiment: "positive"
      },
      {
        platform: "facebook",
        handle: "John Smith",
        text: "Best tax service in town. Highly recommend!",
        timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
        sentiment: "positive"
      }
    ];

    return new Response(JSON.stringify({
      total_mentions: mentions.length,
      mentions,
      sentiment_summary: {
        positive: 3,
        neutral: 0,
        negative: 0
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social mentions error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch mentions" }), { status: 500 });
  }
}

/**
 * POST /api/social/reply - Reply to mentions/comments
 */
export async function handleSocialReply(req: Request, env: any, user: any): Promise<Response> {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  try {
    const body = await req.json() as {
      platform: string;
      mention_id: string;
      reply_text: string;
    };

    if (!body.platform || !body.mention_id || !body.reply_text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const replyId = crypto.randomUUID();

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO social_replies (id, platform, mention_id, reply_text, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        replyId,
        body.platform,
        body.mention_id,
        body.reply_text,
        user.id,
        new Date().toISOString()
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      reply_id: replyId
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social reply error:", error);
    return new Response(JSON.stringify({ error: "Failed to post reply" }), { status: 500 });
  }
}

// --- Helper Functions ---

async function postToInstagram(env: any, content: string, mediaUrls: string[]): Promise<string> {
  // In production, this would call Instagram Graph API
  if (!env.INSTAGRAM_TOKEN) throw new Error("Instagram not configured");
  
  // Mock implementation - returns a post URL
  const postId = crypto.randomUUID();
  return `https://instagram.com/p/${postId}`;
}

async function postToTwitter(env: any, content: string, mediaUrls: string[]): Promise<string> {
  // In production, this would call Twitter/X API v2
  if (!env.TWITTER_API_KEY) throw new Error("Twitter not configured");
  
  // Mock implementation - returns a tweet URL
  const tweetId = crypto.randomUUID();
  return `https://twitter.com/${SOCIAL_MEDIA_HANDLES.X_TWITTER}/status/${tweetId}`;
}

async function postToFacebook(env: any, content: string, mediaUrls: string[]): Promise<string> {
  // In production, this would call Facebook Graph API
  if (!env.FACEBOOK_TOKEN) throw new Error("Facebook not configured");
  
  // Mock implementation - returns a post URL
  const postId = crypto.randomUUID();
  return `https://facebook.com/posts/${postId}`;
}

async function getInstagramFeed(env: any, limit: number): Promise<SocialPost[]> {
  // In production, fetch from API or database
  return [
    {
      id: "ig-1",
      platform: "instagram",
      content: "Tax season is here! File your taxes with confidence. #TaxPrep #AccountingServices",
      posted_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      engagement_count: 42,
      status: "published"
    }
  ];
}

async function getTwitterFeed(env: any, limit: number): Promise<SocialPost[]> {
  // In production, fetch from API or database
  return [
    {
      id: "tw-1",
      platform: "twitter",
      content: "IRS announces extended e-file deadline for 2025 returns. Plan accordingly! #TaxNews",
      posted_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      engagement_count: 87,
      status: "published"
    }
  ];
}

async function getFacebookFeed(env: any, limit: number): Promise<SocialPost[]> {
  // In production, fetch from API or database
  return [
    {
      id: "fb-1",
      platform: "facebook",
      content: "Happy to announce we're now offering virtual consultations for busy professionals!",
      posted_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      engagement_count: 156,
      status: "published"
    }
  ];
}
