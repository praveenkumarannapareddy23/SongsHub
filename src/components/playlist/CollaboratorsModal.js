"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  Share2,
  X,
  Crown,
  Edit3,
  Eye,
  Trash2,
  Shield,
  UserPlus,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAudio } from "@/context/audio-context";
import { updatePlaylistDoc } from "@/lib/firestore-service";

export default function CollaboratorsModal({ playlist, isOpen, onClose }) {
  const { user } = useAuth();
  const { editPlaylist, updatePlaylistInState } = useAudio();
  const [copied, setCopied] = useState(false);
  const [defaultRole, setDefaultRole] = useState("editor");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (playlist?.linkDefaultRole) {
      setDefaultRole(playlist.linkDefaultRole);
    } else {
      setDefaultRole("editor");
    }
  }, [playlist]);

  if (!isOpen || !playlist) return null;

  const currentUserId = user?.uid;
  const isOwner = playlist.ownerId === currentUserId || (!playlist.ownerId && !currentUserId);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/playlist/${playlist.id}`
      : `https://youworship.world/playlist/${playlist.id}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${playlist.name} | YouWorship Playlist`,
          text: `Join and collaborate on "${playlist.name}" on YouWorship!`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        if (e.name !== "AbortError") {
          console.debug("Share error:", e);
        }
      }
    }
    await handleCopyLink();
  };

  const handleRoleChange = async (newRole) => {
    setDefaultRole(newRole);
    setSavingRole(true);
    try {
      await editPlaylist(playlist.id, { linkDefaultRole: newRole });
    } catch (err) {
      console.error("Error updating default link role:", err);
    } finally {
      setSavingRole(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorUid) => {
    if (!isOwner) return;
    if (!window.confirm("Remove this collaborator from the playlist?")) return;

    try {
      const updatedCollaborators = { ...(playlist.collaborators || {}) };
      delete updatedCollaborators[collaboratorUid];
      const updatedUids = (playlist.collaboratorUids || []).filter(
        (id) => id !== collaboratorUid
      );

      const updates = {
        collaborators: updatedCollaborators,
        collaboratorUids: updatedUids,
      };

      await updatePlaylistDoc(playlist.id, updates);
      updatePlaylistInState({ ...playlist, ...updates });
    } catch (err) {
      console.error("Error removing collaborator:", err);
    }
  };

  const handleUpdateCollaboratorRole = async (collaboratorUid, newRole) => {
    if (!isOwner) return;
    try {
      const currentEntry = playlist.collaborators?.[collaboratorUid];
      const updatedEntry =
        typeof currentEntry === "object"
          ? { ...currentEntry, role: newRole }
          : newRole;

      const updatedCollaborators = {
        ...(playlist.collaborators || {}),
        [collaboratorUid]: updatedEntry,
      };

      const updates = {
        collaborators: updatedCollaborators,
      };

      await updatePlaylistDoc(playlist.id, updates);
      updatePlaylistInState({ ...playlist, ...updates });
    } catch (err) {
      console.error("Error updating collaborator role:", err);
    }
  };

  // Build list of collaborators
  const collaboratorsList = Object.entries(playlist.collaborators || {}).map(
    ([uid, data]) => {
      const role = typeof data === "object" ? data.role : data;
      const name = typeof data === "object" ? data.name : "Team Member";
      const email = typeof data === "object" ? data.email : null;
      return { uid, role, name, email };
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-card border border-line rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-line flex items-center justify-between bg-card-hover/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A32A]/15 border border-[#D4A32A]/30 flex items-center justify-center text-[#D4A32A]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-title flex items-center gap-2">
                <span>Collaborate</span>
              </h2>
              <p className="text-xs text-muted truncate max-w-[240px] sm:max-w-xs font-medium">
                {playlist.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-card-hover text-muted hover:text-title transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto">
          {/* Share Link Card */}
          <div className="p-4 rounded-2xl bg-card-hover/40 border border-line/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-title">
                <LinkIcon className="w-4 h-4 text-[#D4A32A]" />
                <span>Invite with Link</span>
              </div>
              {isOwner && (
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                  Link Settings
                </span>
              )}
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Anyone with this link can join this playlist and listen together.
            </p>

            {/* Default Role Switcher (Owner Only) */}
            {isOwner && (
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/60 p-2.5 rounded-xl border border-line/40">
                <span className="text-xs text-copy font-semibold">
                  People who join can:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRoleChange("editor")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      defaultRole === "editor"
                        ? "bg-[#D4A32A] text-black shadow-sm"
                        : "text-muted hover:text-title hover:bg-card-hover"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Add & Remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("viewer")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      defaultRole === "viewer"
                        ? "bg-[#D4A32A] text-black shadow-sm"
                        : "text-muted hover:text-title hover:bg-card-hover"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions: Copy Link & Share */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4A32A] hover:bg-[#c49527] active:scale-95 text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>COPIED LINK!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPY SHARE LINK</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl bg-card-hover hover:bg-line border border-line text-title transition-all cursor-pointer"
                title="Share via other apps"
              >
                <Share2 className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center justify-between">
              <span>Members ({collaboratorsList.length + 1})</span>
              <span className="text-[10px] text-dim lowercase">
                real-time sync
              </span>
            </h3>

            <div className="divide-y divide-line/30 rounded-2xl border border-line/50 bg-card-hover/20 overflow-hidden">
              {/* Owner Item */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-xs shadow-sm">
                    {playlist.ownerName?.charAt(0)?.toUpperCase() || "O"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-title truncate flex items-center gap-1.5">
                      <span>{playlist.ownerName || "Playlist Owner"}</span>
                      {playlist.ownerId === currentUserId && (
                        <span className="text-[10px] text-muted font-normal">
                          (You)
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] text-muted">Created this playlist</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4A32A]/15 border border-[#D4A32A]/30 text-[#D4A32A] text-[10px] font-black uppercase tracking-wider">
                  <Crown className="w-3 h-3 fill-current" />
                  <span>Owner</span>
                </div>
              </div>

              {/* Collaborators */}
              {collaboratorsList.map((collab) => {
                const isSelf = collab.uid === currentUserId;
                const isCollabEditor = collab.role === "editor";

                return (
                  <div
                    key={collab.uid}
                    className="p-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-card-hover border border-line flex items-center justify-center text-copy font-bold text-xs">
                        {collab.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-title truncate flex items-center gap-1.5">
                          <span>{collab.name}</span>
                          {isSelf && (
                            <span className="text-[10px] text-muted font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        {collab.email && (
                          <span className="text-[10px] text-muted truncate block">
                            {collab.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <select
                          value={collab.role}
                          onChange={(e) =>
                            handleUpdateCollaboratorRole(collab.uid, e.target.value)
                          }
                          className="px-2 py-1 rounded-lg bg-card border border-line text-[11px] font-bold text-title focus:outline-none focus:border-[#D4A32A]"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isCollabEditor
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}
                        >
                          {collab.role}
                        </span>
                      )}

                      {isOwner && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.uid)}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors cursor-pointer"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-card-hover/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-card border border-line text-xs font-bold text-title hover:bg-card-hover transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
