'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NewsEntry, type NewsItem } from './NewsEntry';

export function NewsFeed({ posts }: { posts: NewsItem[] }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12 md:py-24 flex flex-col">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
          }
        }}
        className="flex flex-col"
      >
        {posts.map((post) => (
          <motion.div
            key={post.id}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
              }
            }}
          >
            <NewsEntry item={post} />
          </motion.div>
        ))}
        {posts.length === 0 && (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 1 } }
            }}
            className="font-mono text-[#ECEEDF] text-[12px] uppercase tracking-[0.3em] opacity-50 text-center py-12 mt-24"
          >
            NO UPDATES ATM LOL
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
