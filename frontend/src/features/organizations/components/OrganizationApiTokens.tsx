import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../api";
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/confirm/ConfirmProvider";

interface Token {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface OrganizationApiTokensProps {
  orgId: string;
}

export const OrganizationApiTokens: React.FC<OrganizationApiTokensProps> = ({ orgId }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["org:read"]);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Single-use raw token display
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const confirm = useConfirm();

  const availableScopes = [
    {
      value: "org:read",
      label: "org:read",
      desc: "Read organization workspace details, projects, and members",
    },
    {
      value: "org:write",
      label: "org:write",
      desc: "Modify workspace configuration, update slug, hiring settings",
    },
    {
      value: "org:admin",
      label: "org:admin",
      desc: "Full administrative access including managing members and tokens",
    },
    {
      value: "project:read",
      label: "project:read",
      desc: "Read-only access to organization projects and tasks",
    },
    {
      value: "project:write",
      label: "project:write",
      desc: "Write access to create, update, and manage organization projects and tasks",
    },
  ];

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Token[]>(`/organizations/${orgId}/tokens`);
      setTokens(data);
      setError(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load API tokens.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const payload = {
        name: name.trim(),
        scopes: selectedScopes,
        expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : null,
      };

      const res = await api.post<{ token: string } & Token>(
        `/organizations/${orgId}/tokens`,
        payload,
      );

      setGeneratedToken(res.token);
      setName("");
      setSelectedScopes(["org:read"]);
      setExpiresInDays("");
      setShowCreateForm(false);
      fetchTokens();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create API token.";
      setError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    const ok = await confirm({
      title: "Revoke API token?",
      description: "This action is permanent and cannot be undone.",
      confirmText: "Revoke",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      setError(null);
      await api.delete(`/organizations/${orgId}/tokens/${tokenId}`);
      fetchTokens();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to revoke API token.";
      setError(errorMsg);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Workspace API Tokens</h2>
          <p className="text-sm text-gray-400">
            Generate secure tokens to access the DevLink API for automation and CI/CD pipelines.
          </p>
        </div>
        {!showCreateForm && !generatedToken && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Generate Token
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {/* Single-time raw token display */}
      {generatedToken && (
        <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 space-y-4">
          <div className="flex items-center gap-2 text-yellow-400 font-semibold text-base">
            <ShieldAlert size={20} className="text-yellow-400" />
            <h3>Copy your API token now</h3>
          </div>
          <p className="text-sm text-gray-300">
            For security reasons, we only show this token once. If you lose it, you will have to
            generate a new one.
          </p>

          <div className="flex items-center gap-2 bg-gray-950/80 p-3 rounded-lg border border-gray-800 font-mono text-sm break-all text-white select-all">
            <span className="flex-1">{generatedToken}</span>
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          <button
            onClick={() => setGeneratedToken(null)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition-colors"
          >
            I've copied it, close this alert
          </button>
        </div>
      )}

      {/* Create token form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateToken}
          className="p-6 rounded-xl border border-gray-800 bg-gray-900/20 space-y-6"
        >
          <h3 className="text-base font-semibold text-white">Generate a new API token</h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="token-name"
                className="block text-xs font-semibold uppercase text-gray-400 mb-2"
              >
                Token Name
              </label>
              <input
                id="token-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CI/CD Pipeline"
                className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-gray-950/80 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                Expiration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-800 bg-gray-950/80 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Never Expires</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase text-gray-400 mb-3">
                Select Scopes
              </span>
              <div className="space-y-3">
                {availableScopes.map((scope) => (
                  <label
                    key={scope.value}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 bg-gray-950/40 hover:bg-gray-950/80 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="mt-0.5 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-white">{scope.label}</span>
                      <span className="block text-xs text-gray-400">{scope.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              {creating && <Loader2 size={16} className="animate-spin" />}
              Generate Secret
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setName("");
                setSelectedScopes(["org:read"]);
                setExpiresInDays("");
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Listing tokens */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
          <p className="text-sm">Loading API tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-gray-800 bg-gray-900/10 text-gray-400 text-center space-y-3">
          <Key size={36} className="text-gray-600" />
          <div>
            <h4 className="text-sm font-semibold text-white">No API Tokens generated</h4>
            <p className="text-xs text-gray-400 mt-1">
              Create an API token to allow external tools to authenticate with this workspace.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-950/20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Token Name</th>
                <th className="px-4 py-3">Prefix</th>
                <th className="px-4 py-3">Scopes</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
              {tokens.map((token) => (
                <tr key={token.id} className="hover:bg-gray-900/20 transition-colors">
                  <td className="px-4 py-4 font-semibold text-white">{token.name}</td>
                  <td className="px-4 py-4 font-mono text-xs text-indigo-300">{token.prefix}...</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {token.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-gray-800 text-gray-300 border-gray-700"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-400">
                    {new Date(token.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-400">
                    {token.last_used_at
                      ? new Date(token.last_used_at).toLocaleDateString()
                      : "Never used"}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {token.expires_at ? (
                      <span
                        className={
                          new Date(token.expires_at) < new Date()
                            ? "text-red-400 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {new Date(token.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Revoke token"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
