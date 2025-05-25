import React, { useEffect, useState } from "react";
import { Client as FarcasterClient, Cast } from "@standard-crypto/farcaster-js";

export interface FarcasterFeedBlockProps {
  fid?: number;
  username?: string;
  channel?: string;
  limit?: number;
}

const FarcasterFeedBlock: React.FC<FarcasterFeedBlockProps> = ({
  fid,
  username,
  channel,
  limit = 10,
}) => {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = new FarcasterClient();
        let result: Cast[] = [];

        if (fid) {
          result = await client.fetchCastsByFid(fid, { limit });
        } else if (username) {
          const user = await client.fetchUserByUsername(username);
          result = await client.fetchCastsByFid(user.fid, { limit });
        } else if (channel) {
          result = await client.fetchChannelCasts(channel, { limit });
        } else {
          setError("Please provide fid, username, or channel.");
          setCasts([]);
          setLoading(false);
          return;
        }
        setCasts(result);
      } catch (err: any) {
        setError("Failed to fetch Farcaster feed.");
        setCasts([]);
      }
      setLoading(false);
    };
    fetchFeed();
  }, [fid, username, channel, limit]);

  if (loading) return <div>Loading Farcaster feed…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (casts.length === 0) return <div>No posts found.</div>;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
      <h3>Farcaster Feed</h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {casts.map((cast) => (
          <li key={cast.hash} style={{ marginBottom: 16, borderBottom: "1px solid #f0f0f0", paddingBottom: 8 }}>
            <div style={{ fontWeight: "bold" }}>{cast.author.username || `FID: ${cast.author.fid}`}</div>
            <div>{cast.text}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {new Date(cast.timestamp * 1000).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FarcasterFeedBlock;
