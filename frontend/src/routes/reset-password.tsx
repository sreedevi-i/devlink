import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { APP_LOGO } from "@/lib/logo";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { BackButton } from "@/components/shared/BackButton";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { authApi } from "@/api/modules/auth";
import { TypoCaption, TypoHeading } from "@/components/shared/Typography";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DevLink" },
      { name: "description", content: "Create a new password for your DevLink account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { token?: string };
  const token = search.token || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setSubmitting(true);
      try {
        await authApi.resetPassword(token, password);
        toast.success("Password has been reset successfully. You can now log in.");
        navigate({ to: "/auth" });
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to reset password");
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, password, confirmPassword, token, navigate],
  );

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-3 flex items-center gap-2">
        <img src={APP_LOGO} alt="DevLink" className="h-12 w-12 rounded-full" />
        <span className="text-[36px] font-bold tracking-tight text-foreground">DevLink</span>
      </Link>

      <div className="w-full max-w-[440px] rounded-md border border-border bg-surface px-8 py-6">
        <TypoHeading as="h1">Create new password</TypoHeading>
        <TypoCaption as="p">
          Enter your new password below to regain access to your account.
        </TypoCaption>

        <form onSubmit={handleSubmit} className="mt-5">
          <label className="mb-1 block text-[13px] font-semibold text-foreground">
            New Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-[8px] text-[14px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mb-1 block text-[13px] font-semibold text-foreground">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-[8px] text-[14px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <LoadingButton
            type="submit"
            loading={submitting}
            loadingText="Resetting..."
            className="mt-4 w-full py-[9px] text-[14px]"
          >
            Reset password
          </LoadingButton>
        </form>

        <BackButton to="/auth" label="Back to sign in" />
      </div>
    </div>
  );
}
