import { db } from "@/lib/db";

export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const flag = await db.featureFlag.findUnique({ where: { key } });
    return flag?.published || false;
  } catch (_e) {
    return false;
  }
}

export async function getFeatureConfig(key: string): Promise<any> {
  try {
    const flag = await db.featureFlag.findUnique({ where: { key } });
    if (!flag?.published) return null;
    return flag.config;
  } catch (_e) {
    return null;
  }
}

export async function getPublishedFeatures(): Promise<string[]> {
  try {
    const flags = await db.featureFlag.findMany({ where: { published: true }, select: { key: true } });
    return flags.map(f => f.key);
  } catch (_e) {
    return [];
  }
}
