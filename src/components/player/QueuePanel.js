"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ListMusic,
  X,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Music2,
  Sparkles,
} from "lucide-react";
import { useAudio } from "@/context/audio-context";
import SongArtwork from "@/components/ui/SongArtwork";
import Link from "next/link";

export default function QueuePanel() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playSong,
    queue,
    isQueueOpen,
    setIsQueueOpen,
    removeFromQueue,
    reorderQueue,
    moveQueueItem,
    clearQueue,
  } = useAudio();

  if (!isQueueOpen) return null;

  const safeQueue = Array.isArray(queue) ? queue : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-end md:items-end justify-end pointer-events-none select-none">
        {/* Backdrop Scrim (Mobile only / tap outside to close) */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsQueueOpen(false)}
        />

        {/* Queue Window / Drawer */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="pointer-events-auto w-full md:w-[420px] max-h-[82vh] md:max-h-[620px] md:mr-6 md:mb-24 bg-card/95 backdrop-blur-2xl border border-line rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-title"
        >
          {/* Drawer Header */}
          <div className="p-4 md:p-5 border-b border-line/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4A32A]/15 border border-[#D4A32A]/30 flex items-center justify-center text-[#D4A32A]">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-title tracking-tight flex items-center gap-2">
                  <span>Play Queue</span>
                  {safeQueue.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-card-hover border border-line text-muted font-bold">
                      {safeQueue.length}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-muted font-medium">
                  {safeQueue.length === 0
                    ? "No upcoming tracks"
                    : `${safeQueue.length} track${safeQueue.length !== 1 ? "s" : ""} up next`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {safeQueue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="px-2.5 py-1.5 rounded-xl bg-card-hover hover:bg-red-500/10 text-muted hover:text-red-400 border border-line text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Clear upcoming songs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Queue</span>
                </button>
              )}
              <button
                onClick={() => setIsQueueOpen(false)}
                className="w-8 h-8 rounded-full bg-card-hover hover:bg-line text-muted hover:text-title flex items-center justify-center transition-colors cursor-pointer"
                title="Close Queue"
                aria-label="Close queue"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 space-y-5">
            {/* 1. NOW PLAYING SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
                  Now Playing
                </span>
                {isPlaying && (
                  <div className="flex items-end gap-[2px] h-3">
                    <span className="w-[2px] bg-[#D4A32A] rounded-full h-3 animate-music-bar-1" />
                    <span className="w-[2px] bg-[#D4A32A] rounded-full h-2 animate-music-bar-2" />
                    <span className="w-[2px] bg-[#D4A32A] rounded-full h-3 animate-music-bar-3" />
                  </div>
                )}
              </div>

              {currentSong ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-card-hover/90 border border-[#D4A32A]/30 shadow-md">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 bg-card">
                      <SongArtwork song={currentSong} className="w-full h-full object-cover" iconSize="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <Link
                        href={`/song/${encodeURIComponent(currentSong.slug || currentSong.id)}`}
                        onClick={() => setIsQueueOpen(false)}
                        className="text-xs md:text-sm font-bold text-title hover:text-[#D4A32A] block truncate transition-colors"
                      >
                        {currentSong.title || currentSong.teluguTitle}
                      </Link>
                      <span className="text-[11px] text-muted block truncate mt-0.5">
                        {typeof currentSong.artist === "object"
                          ? currentSong.artist?.name
                          : currentSong.artist || "Unknown Artist"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-[#D4A32A] hover:bg-[#c49527] text-black flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-card-hover/40 border border-line/40 text-center">
                  <p className="text-xs text-muted">No song currently playing</p>
                </div>
              )}
            </div>

            {/* 2. UP NEXT SECTION */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-dim">
                  Up Next ({safeQueue.length})
                </span>
                {safeQueue.length > 1 && (
                  <span className="text-[10px] text-dim">Drag or use arrows to reorder</span>
                )}
              </div>

              {safeQueue.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-card-hover/20 border border-line/30 space-y-2">
                  <Music2 className="w-8 h-8 text-dim mx-auto stroke-1" />
                  <h4 className="text-xs font-bold text-title">Your queue is empty</h4>
                  <p className="text-[11px] text-muted leading-relaxed max-w-[240px] mx-auto">
                    Browse songs and tap &ldquo;Play Next&rdquo; or &ldquo;Add to Queue&rdquo; to build your list.
                  </p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={safeQueue}
                  onReorder={reorderQueue}
                  className="space-y-1.5"
                >
                  {safeQueue.map((item, index) => {
                    const queueId = item.queueId || `q_${index}`;
                    const song = item.song || item;

                    return (
                      <Reorder.Item
                        key={queueId}
                        value={item}
                        className="group flex items-center justify-between p-2.5 rounded-2xl bg-card/60 hover:bg-card-hover border border-line/40 hover:border-line transition-colors shadow-sm select-none"
                      >
                        {/* Drag Handle & Index */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="cursor-grab active:cursor-grabbing text-dim hover:text-title p-1 shrink-0 touch-none">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <span className="w-4 text-center text-[10px] font-bold text-muted tabular-nums shrink-0">
                            {index + 1}
                          </span>

                          <div
                            onClick={() => {
                              playSong(song);
                              removeFromQueue(queueId);
                            }}
                            className="w-10 h-10 rounded-xl overflow-hidden border border-line/40 shrink-0 bg-card cursor-pointer"
                            title="Play this track now"
                          >
                            <SongArtwork song={song} className="w-full h-full object-cover" iconSize="w-4 h-4" />
                          </div>

                          <div
                            onClick={() => {
                              playSong(song);
                              removeFromQueue(queueId);
                            }}
                            className="min-w-0 flex-1 cursor-pointer pr-1"
                          >
                            <span className="text-xs font-bold text-title hover:text-[#D4A32A] block truncate transition-colors">
                              {song.title || song.teluguTitle}
                            </span>
                            <span className="text-[10px] text-muted block truncate mt-0.5">
                              {typeof song.artist === "object"
                                ? song.artist?.name
                                : song.artist || "Unknown Artist"}
                            </span>
                          </div>
                        </div>

                        {/* Reorder Buttons & Remove Action */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {/* Move Up */}
                          <button
                            onClick={() => moveQueueItem(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 rounded-lg text-muted hover:text-title hover:bg-card disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => moveQueueItem(index, index + 1)}
                            disabled={index === safeQueue.length - 1}
                            className="p-1 rounded-lg text-muted hover:text-title hover:bg-card disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove from Queue */}
                          <button
                            onClick={() => removeFromQueue(queueId)}
                            className="p-1 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-1"
                            title="Remove from queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
