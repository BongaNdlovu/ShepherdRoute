export type WorkspaceType = "church" | "ministry";

export function normalizeWorkspaceType(value: unknown): WorkspaceType {
  return value === "ministry" ? "ministry" : "church";
}

export function getWorkspaceLabel(type?: string) {
  return type === "ministry" ? "Ministry" : "Church";
}

export function getWorkspaceLabelLower(type?: string) {
  return type === "ministry" ? "ministry" : "church";
}

export function getWorkspaceNameLabel(type?: string) {
  return type === "ministry" ? "Ministry name" : "Church name";
}

export function getWorkspaceAccountLabel(type?: string) {
  return type === "ministry" ? "ministry account" : "church account";
}

export function isHealthRelatedEvent(eventType: string): boolean {
  const healthEventTypes = ["health_expo", "health_seminar", "cooking_class"];
  return healthEventTypes.includes(eventType);
}
