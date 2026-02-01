import React, { useEffect, useState } from "react";

export default function SocialFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/social/feed")
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => {
        setFeed(data.feed || []);
        setLoading(false);
      })
      .catch(e => {
        setError("Unable to load social feed.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading social feed…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!feed.length) return <div>No recent social posts.</div>;

  return (
    <div className="social-feed" style={{ margin: '32px 0' }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Latest Social Updates</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {feed.map(post => (
          <li key={post.id} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{post.author || 'Ross Tax & Bookkeeping'}</div>
            <div style={{ color: '#444', margin: '6px 0' }}>{post.content}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{new Date(post.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
