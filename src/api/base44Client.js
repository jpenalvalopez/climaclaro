import { normalizeEntityList } from "@/lib/entity-list";

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || response.statusText || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function paramsToQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

function entityClient(entityName) {
  const basePath = `/api/entities/${entityName}`;

  return {
    async list(sort, limit, skip, fields) {
      return normalizeEntityList(await request(`${basePath}${paramsToQuery({ sort, limit, skip, fields })}`));
    },

    async filter(query, sort, limit, skip, fields) {
      return normalizeEntityList(await request(`${basePath}${paramsToQuery({
        q: JSON.stringify(query || {}),
        sort,
        limit,
        skip,
        fields,
      })}`));
    },

    get(id) {
      return request(`${basePath}/${encodeURIComponent(id)}`);
    },

    create(data) {
      return request(basePath, {
        method: "POST",
        body: JSON.stringify(data || {}),
      });
    },

    update(id, data) {
      return request(`${basePath}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data || {}),
      });
    },

    delete(id) {
      return request(`${basePath}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    deleteMany(query) {
      return request(basePath, {
        method: "DELETE",
        body: JSON.stringify(query || {}),
      });
    },

    bulkCreate(data) {
      return request(`${basePath}/bulk`, {
        method: "POST",
        body: JSON.stringify(data || []),
      });
    },

    bulkUpdate(data) {
      return request(`${basePath}/bulk`, {
        method: "PUT",
        body: JSON.stringify(data || []),
      });
    },

    updateMany(query, data) {
      return request(`${basePath}/update-many`, {
        method: "PATCH",
        body: JSON.stringify({ query, data }),
      });
    },

    subscribe() {
      return () => {};
    },
  };
}

function appendDefined(formData, key, value) {
  if (value !== undefined && value !== null && value !== "") formData.append(key, String(value));
}

async function uploadFileToStorage({ file, type = "public_web_asset", ...fields } = {}) {
  if (!file) {
    throw new Error("No se ha recibido ningun archivo.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  Object.entries(fields).forEach(([key, value]) => appendDefined(formData, key, value));

  const asset = await request("/api/files/upload", {
    method: "POST",
    body: formData,
  });

  return {
    file_id: asset.id,
    file_url: asset.public_url || null,
    file_asset: asset,
  };
}

const entities = new Proxy({}, {
  get(_target, entityName) {
    if (typeof entityName !== "string" || entityName === "then") return undefined;
    return entityClient(entityName);
  },
});

export const base44 = {
  entities,

  auth: {
    async me() {
      return null;
    },

    async logout() {
      window.localStorage?.removeItem("base44_access_token");
      window.localStorage?.removeItem("token");
      return null;
    },

    async updateMe(data) {
      return data || null;
    },
  },

  appLogs: {
    async logUserInApp() {
      return null;
    },
  },

  functions: {
    invoke(name, payload) {
      return request(`/api/functions/${encodeURIComponent(name)}`, {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
    },
  },

  integrations: {
    Core: {
      UploadFile: uploadFileToStorage,

      async InvokeLLM() {
        throw new Error("El asistente IA todavia no esta conectado a un proveedor propio.");
      },
    },
  },
};
