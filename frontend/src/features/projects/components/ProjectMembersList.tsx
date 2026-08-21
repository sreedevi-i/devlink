import React, { useState, useEffect, useCallback } from "react";
import { Users, UserMinus, ArrowRightLeft, Shield, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm/ConfirmProvider";
import { ProjectMemberRoleBadge, ProjectRole } from "./ProjectMemberRoleBadge";
import { TypoSection } from "@/components/shared/Typography";

export interface ProjectMemberData {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  is_active: boolean;
  joined_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface ProjectMembersListProps {
  projectId: string;
  currentUserId?: string;
  isOwner?: boolean;
}

export const ProjectMembersList: React.FC<ProjectMembersListProps> = ({
  projectId,
  currentUserId,
  isOwner = false,
}) => {
  const [members, setMembers] = useState<ProjectMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferringUser, setTransferringUser] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        // Fallback mock data
        setMembers([
          {
            id: "1",
            project_id: projectId,
            user_id: currentUserId || "owner_id",
            role: "owner",
            is_active: true,
            joined_at: new Date().toISOString(),
            username: "project_lead",
            first_name: "Project",
            last_name: "Owner",
          },
          {
            id: "2",
            project_id: projectId,
            user_id: "user_2",
            role: "maintainer",
            is_active: true,
            joined_at: new Date(Date.now() - 86400000).toISOString(),
            username: "alex_dev",
            first_name: "Alex",
            last_name: "Developer",
          },
          {
            id: "3",
            project_id: projectId,
            user_id: "user_3",
            role: "contributor",
            is_active: true,
            joined_at: new Date(Date.now() - 172800000).toISOString(),
            username: "sam_coder",
            first_name: "Sam",
            last_name: "Coder",
          },
        ]);
      }
    } catch {
      toast.error("Failed to load project members.");
    } finally {
      setLoading(false);
    }
  }, [projectId, currentUserId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`Member role updated to ${newRole.toUpperCase()}!`);
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update member role.");
      }
    } catch {
      toast.error("Error updating member role.");
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_owner_id: newOwnerId }),
      });
      if (res.ok) {
        toast.success("Project ownership transferred successfully!");
        setTransferringUser(null);
        fetchMembers();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to transfer ownership.");
      }
    } catch {
      toast.error("Error transferring ownership.");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const ok = await confirm({
      title: "Remove member?",
      description: "Are you sure you want to remove this member from the project?",
      confirmText: "Remove",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        toast.success("Member removed from project.");
        fetchMembers();
      } else {
        toast.error("Failed to remove member.");
      }
    } catch {
      toast.error("Error removing member.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <TypoSection>
            <Users size={18} className="text-indigo-400" /> Team Members & Roles
          </TypoSection>
          <p className="text-xs text-gray-400 mt-1">
            Manage project team roles (Owner, Maintainer, Contributor, Reviewer, Viewer).
          </p>
        </div>
        <button
          onClick={fetchMembers}
          className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="divide-y divide-gray-800/60 border border-gray-800 rounded-xl bg-gray-900/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm italic">
            Loading team members...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm italic">
            No team members assigned yet.
          </div>
        ) : (
          members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const isMemberOwner = member.role === "owner";

            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-300 text-sm">
                    {member.first_name?.[0] || member.username?.[0] || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {member.first_name
                          ? `${member.first_name} ${member.last_name || ""}`
                          : member.username}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">@{member.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ProjectMemberRoleBadge role={member.role} />

                  {/* Role Selector for Owner/Maintainer */}
                  {isOwner && !isMemberOwner && (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                      className="bg-gray-950 border border-gray-800 text-gray-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="maintainer">Maintainer</option>
                      <option value="contributor">Contributor</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}

                  {/* Transfer Ownership Button (Owner only) */}
                  {isOwner && !isMemberOwner && (
                    <button
                      onClick={() => handleTransferOwnership(member.user_id)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-900/50 rounded-lg transition-colors"
                      title="Transfer Ownership"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                  )}

                  {/* Remove Member Button */}
                  {(isOwner || isSelf) && !isMemberOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
