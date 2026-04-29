import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { normalizeEntityList } from '@/lib/entity-list';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

const entityProxyCache = new Map();
const originalEntities = base44.entities;

function normalizeEntityReader(entityName, entity) {
  if (!entity || typeof entity !== "object") return entity;
  if (entityProxyCache.has(entityName)) return entityProxyCache.get(entityName);

  const normalizedEntity = new Proxy(entity, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if ((prop === "list" || prop === "filter") && typeof value === "function") {
        return async (...args) => normalizeEntityList(await value.apply(target, args));
      }
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  entityProxyCache.set(entityName, normalizedEntity);
  return normalizedEntity;
}

base44.entities = new Proxy(originalEntities, {
  get(target, entityName, receiver) {
    return normalizeEntityReader(entityName, Reflect.get(target, entityName, receiver));
  },
});
