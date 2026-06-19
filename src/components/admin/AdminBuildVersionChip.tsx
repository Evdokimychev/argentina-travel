import { getGitSha, getShortGitSha } from "@/lib/monitoring/build-info";

export default function AdminBuildVersionChip() {
  const sha = getGitSha();
  if (!sha) return null;

  const short = getShortGitSha(sha);

  return (
    <span
      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate"
      title={`Сборка ${sha}`}
    >
      {short}
    </span>
  );
}
