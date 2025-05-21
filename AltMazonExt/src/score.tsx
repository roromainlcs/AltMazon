import { useState } from "react";
import "./styles/score.css";
import { voteAltShop } from "./backRequest";

interface VoteButtonsProps {
  defaultUserVote: number;
  initialVotes: number;
  shopId: string;
  userId: string | undefined;
  setShowUserNotLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  // onVoteChange?: (newVote: number) => void;
  className?: string;
}

export default function VoteButtons({defaultUserVote, initialVotes, shopId, userId, setShowUserNotLoggedIn, className = ""}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(defaultUserVote === 1 ? "up" : defaultUserVote === -1 ? "down" : null);

  console.log(defaultUserVote);
  async function handleVote(voteType: "up" | "down") {
    let newVotes = votes;
    const oldUserVote = userVote;
    let sentVote = 0;

    if (!userId) {
      setShowUserNotLoggedIn(true);
      return;
    }
    if (userVote === voteType) {
      newVotes = voteType === "up" ? votes - 1 : votes + 1;
      setUserVote(null);
    } else if (userVote === "down" && voteType === "up") {
      newVotes = votes + 2;
      setUserVote("up");
      sentVote = 1;
    } else if (userVote === "up" && voteType === "down") {
      newVotes = votes - 2;
      setUserVote("down");
      sentVote = -1;
    } else {
      newVotes = voteType === "up" ? votes + 1 : votes - 1;
      setUserVote(voteType);
      sentVote = voteType === "up" ? 1 : -1;
    }

    try {
      // send either 1, -1 or 0
      await voteAltShop(shopId, sentVote);
    } catch (e) {
      setUserVote(oldUserVote);
      console.error(`error`, e);
      return;
    }
    setVotes(newVotes);
    // onVoteChange?.(newVotes);
  };

  return (
    <div className={`vote-buttons ${className}`}>
      <button
        className={`vote-button up ${userVote === "up" ? "active" : ""}`}
        onClick={() => handleVote("up")}
        aria-label="Upvote"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5L4 15H20L12 5Z" fill="currentColor" />
        </svg>
      </button>

      <span className="vote-count">{votes}</span>

      <button
        className={`vote-button down ${userVote === "down" ? "active" : ""}`}
        onClick={() => handleVote("down")}
        aria-label="Downvote"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19L4 9H20L12 19Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}