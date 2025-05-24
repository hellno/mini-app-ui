import React, { useState } from "react";
import { viewProfile } from "@hellno/farcaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ViewFarcasterProfile() {
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleViewProfile = async () => {
    setLoading(true);
    try {
      const result = await viewProfile(input);
      setProfile(result);
    } catch (e) {
      console.error("Failed to fetch profile", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter username or FID"
        />
        <Button onClick={handleViewProfile} disabled={loading}>
          {loading ? "Loading..." : "View Profile"}
        </Button>
      </div>

      {profile && (
        <Card>
          <CardContent className="flex items-center space-x-4 p-4">
            <img
              src={profile.pfp_url}
              alt="avatar"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <div className="font-bold text-lg">{profile.display_name}</div>
              <div className="text-sm text-muted-foreground">
                @{profile.username}
              </div>
              <div className="mt-1">{profile.bio?.text}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
