import { createServerFn } from "@tanstack/react-start";
import { sanitizeSavedSearchParams } from "@/lib/library-params";

export const fetchSavedSearches = createServerFn({ method: "GET" }).handler(async () => {
  const { optionalSessionUser } = await import("./session-user.server");
  const user = await optionalSessionUser();
  if (!user) return [];

  const { listSavedSearches } = await import("./library.server");
  return listSavedSearches(user.publicId);
});

export const createSavedSearch = createServerFn({ method: "POST" })
  .inputValidator((input: { params?: unknown }) => ({
    params: sanitizeSavedSearchParams(input?.params),
  }))
  .handler(async ({ data }) => {
    const { requireSessionUser } = await import("./session-user.server");
    const user = await requireSessionUser();
    const { createSavedSearch: create } = await import("./library.server");
    return create(user.publicId, data.params);
  });

export const deleteSavedSearch = createServerFn({ method: "POST" })
  .inputValidator((input: { id?: unknown }) => ({
    id: typeof input?.id === "string" ? input.id.slice(0, 64) : "",
  }))
  .handler(async ({ data }) => {
    if (!/^[0-9a-fA-F-]{8,64}$/.test(data.id)) throw new Error("Invalid search.");

    const { requireSessionUser } = await import("./session-user.server");
    const user = await requireSessionUser();
    const { deleteSavedSearch: remove } = await import("./library.server");
    await remove(user.publicId, data.id);
    return { id: data.id };
  });
