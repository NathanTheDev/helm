import type { PresenceUser } from "@/hooks/useYjsEditor";

export function PresenceBar({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {users.map((user) => (
        <span
          key={user.clientId}
          title={user.isLocal ? `${user.name} (you)` : user.name}
          className="flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-xs font-medium text-surface"
          style={{ backgroundColor: user.color }}
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
          {user.isLocal && <span className="opacity-70">(you)</span>}
        </span>
      ))}
    </div>
  );
}
