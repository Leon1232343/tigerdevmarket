/**
 * "Join our Discord" call to action.
 *
 * The invite is public, so it comes from a VITE_ variable baked in at build
 * time. Without it the button is hidden instead of linking to a dead invite.
 */
function inviteUrl(): string | null {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const value = env?.["VITE_DISCORD_INVITE_URL"]?.trim();
  return value && value.startsWith("https://") ? value : null;
}

export function DiscordButton({
  label,
  className = "btn-ghost",
}: {
  label: string;
  className?: string;
}) {
  const href = inviteUrl();
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <span aria-hidden="true">◈</span> {label}
    </a>
  );
}
