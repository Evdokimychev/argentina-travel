export type DeployEnvName = "staging" | "production" | "development" | "unknown";

export type DeployEnvironmentLabel = {
  nodeEnv: string;
  deployEnv: DeployEnvName;
};

/** Runtime environment labels for health checks and ops dashboards. */
export function getDeployEnvironment(): DeployEnvironmentLabel {
  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  const raw = process.env.DEPLOY_ENV?.trim().toLowerCase();

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();

  let deployEnv: DeployEnvName = "unknown";
  if (raw === "staging" || raw === "production") {
    deployEnv = raw;
  } else if (vercelEnv === "production") {
    deployEnv = "production";
  } else if (vercelEnv === "preview") {
    deployEnv = "staging";
  } else if (nodeEnv === "development") {
    deployEnv = "development";
  } else if (nodeEnv === "production" && !raw) {
    deployEnv = "unknown";
  }

  return { nodeEnv, deployEnv };
}
