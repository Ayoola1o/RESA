export type AssignmentCandidate = {
  userId: string;
  status: string;
  roles: string[];
  scope?: { scopeType: string; region?: string; assignedResourceIds?: string[] };
};

export function isEligibleAssignee(candidate: AssignmentCandidate, requiredRole: string, region: string, resourceId: string): boolean {
  if (candidate.status !== 'ACTIVE' || !candidate.roles.includes(requiredRole)) return false;
  if (candidate.scope?.scopeType === 'REGIONAL') {
    return Boolean(candidate.scope.region && region && candidate.scope.region.toLowerCase() === region.toLowerCase());
  }
  if (candidate.scope?.scopeType === 'ASSIGNED_ONLY') return Boolean(candidate.scope.assignedResourceIds?.includes(resourceId));
  return true;
}

export function selectLeastLoadedAssignee<T extends AssignmentCandidate>(candidates: T[], workload: Map<string, number>): T | undefined {
  return [...candidates].sort((a, b) => (workload.get(a.userId) || 0) - (workload.get(b.userId) || 0)
    || a.userId.localeCompare(b.userId))[0];
}
