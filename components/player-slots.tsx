"use client";

export function PlayerSlots({
  names,
  friends = [],
}: {
  names: string[];
  friends?: { name: string }[];
}) {
  const slots = [0, 1, 2, 3].map((i) => names[i] || "");
  return (
    <div>
      <p className="label">Who&apos;s playing?</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {slots.map((name, i) => (
          <label key={i} className="panel block p-4">
            <span className="label">Player {i + 1}</span>
            <input
              name={`p${i + 1}`}
              defaultValue={name}
              list={friends.length ? "friends-list" : undefined}
              placeholder="ADD PLAYER"
              className="mt-2 w-full bg-transparent font-display text-2xl outline-none placeholder:text-mute/40"
            />
          </label>
        ))}
      </div>
      {friends.length ? (
        <datalist id="friends-list">
          {friends.map((f) => (
            <option key={f.name} value={f.name} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
