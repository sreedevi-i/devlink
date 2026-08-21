import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useTranslation } from "@/context/I18nContext";
import { TypoCaption, TypoHeading } from "@/components/shared/Typography";

interface ErrorLayoutProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
}

export function ErrorLayout({
  icon,
  title,
  description,
  primaryLabel,
  primaryTo = "/",
  secondaryLabel,
  onSecondaryClick,
}: ErrorLayoutProps) {
  // Defaults are resolved here rather than in the parameter list so they
  // follow the active locale; a default argument would freeze the English
  // string at module scope.
  const { t } = useTranslation();
  const primary = primaryLabel ?? t("common.goHome");
  const secondary = secondaryLabel ?? t("common.goBack");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">{icon}</div>

        <TypoHeading as="h1">{title}</TypoHeading>

        <TypoCaption as="p">{description}</TypoCaption>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to={primaryTo}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {primary}
          </Link>

          <button
            type="button"
            onClick={onSecondaryClick ?? (() => window.history.back())}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-transform hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {secondary}
          </button>
        </div>
      </div>
    </div>
  );
}
