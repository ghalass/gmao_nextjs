// app/api/utils/routeParams.ts
import { NextRequest } from "next/server";

export async function getRouteParams(
  request: NextRequest
): Promise<{ id: string }> {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  console.log("🔍 getRouteParams Debug:");
  console.log("URL pathname:", url.pathname);
  console.log("Path segments:", pathSegments);
  console.log("Extracted ID:", id);

  if (!id || id === "[id]" || id === "permissions") {
    throw new Error("ID non trouvé dans l'URL");
  }

  return { id };
}
