'use client';

import { useState, useTransition } from 'react';
import { vote } from '@/app/vote/actions';

interface VoteButtonsProps {
  trackId: string;
  initialUserVote?: 1 | -1 | 0; // 0 = no vote
  initialCount?: number;
  className?: string;
}

export default function VoteButtons({ trackId, initialUserVote = 0, initialCount = 0, className = '' }: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [userVote, setUserVote] = useState(initialUserVote);
  // const [count, setCount] = useState(initialCount); // Optional: if we want to show count 

  const handleVote = (value: 1 | -1) => {
    // Optimistic Update
    const nextVote = userVote === value ? 0 : value; // Toggle off if same
    setUserVote(nextVote);

    startTransition(async () => {
      const res = await vote(trackId, value);
      if (!res.success) {
        // Rollback on error
        setUserVote(userVote);
        console.error(res.error);
        if (res.error?.includes('login')) {
          alert(res.error); // Simple feedback for now
        }
      }
    });
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Upvote */}
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        className={`p-1 rounded-full transition-colors ${userVote === 1 ? 'text-[#ECEEDF]' : 'text-[#ECEEDF]/20 hover:text-[#ECEEDF]/60'
          }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* Count */}
      <span className="font-mono text-[10px] text-[#ECEEDF]/50">{initialCount + (userVote - initialUserVote)}</span>

      {/* Downvote */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className={`p-1 rounded-full transition-colors ${userVote === -1 ? 'text-[#ECEEDF]' : 'text-[#ECEEDF]/20 hover:text-[#ECEEDF]/60'
          }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
