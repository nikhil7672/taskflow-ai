export type DependencyEdge = { taskId: string; dependsOnId: string };

export function wouldCreateDependencyCycle(
  edges: DependencyEdge[],
  taskId: string,
  dependsOnId: string,
) {
  if (taskId === dependsOnId) return true;
  const dependenciesByTask = new Map<string, string[]>();
  for (const edge of edges) {
    const dependencies = dependenciesByTask.get(edge.taskId) ?? [];
    dependencies.push(edge.dependsOnId);
    dependenciesByTask.set(edge.taskId, dependencies);
  }
  const pending = [dependsOnId];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    if (current === taskId) return true;
    visited.add(current);
    pending.push(...(dependenciesByTask.get(current) ?? []));
  }
  return false;
}
