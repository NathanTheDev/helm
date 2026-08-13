import type { PresenceUser } from "@/hooks/useYjsEditor";

export function PresenceBar({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {users.map((user) => (
        <span
          key={user.clientId}
          title={user.isLocal ? `${user.name} (you)` : user.name}
          className="flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-xs font-medium"
          // Fixed dark text, not a themed token: peer badge colors (COLORS in
          // lib/presence.ts) are bright/pastel and theme-independent, so
          // `text-surface` (near-white in light themes) left them near
          // unreadable - e.g. #fbbf24 background is ~1.6:1 against paper's
          // surface color. A fixed dark ink clears 4.5:1+ against all of them.
          style={{ backgroundColor: user.color, color: "#1c1a16" }}
        >
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element -- remote avatar, not a build-time asset
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-4 w-4 rounded-full object-cover"
            />
          )}
          {user.name}
          {/* Full opacity, not dimmed: at 70% opacity this text drops as low
              as ~3.6:1 against several of the brighter peer colors, below
              WCAG AA. */}
          {user.isLocal && <span>(you)</span>}
        </span>
      ))}
    </div>
  );
}
