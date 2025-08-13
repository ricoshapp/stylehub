export function searchParamsToWhere(params: Record<string, string | undefined>) {
  const where: any = {};
  if (params.role) where.role = params.role as any;
  if (params.q) where.title = { contains: params.q, mode: "insensitive" };
  return where;
}
