export function AuthField({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={name !== "ref"}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-card px-4 py-3 outline-none focus:border-lime/40"
      />
    </label>
  );
}
