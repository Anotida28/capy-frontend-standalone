import { Router, type Request } from "express";
import { create, findById, getCollection, remove, update } from "../db/store.js";
import {
  asObject,
  badRequest,
  created,
  generateId,
  noContent,
  notFound,
  ok,
  respond,
  type ApiResult
} from "./response.js";

type Body = Record<string, unknown> | null;

type CrudOptions = {
  method: string;
  resource: string;
  rest: string[];
  body: Body;
  collection: string;
  idKey?: string;
};

const KEY_BY_RESOURCE: Record<string, string> = {
  projects: "projects",
  assets: "assets",
  staff: "staff",
  vendors: "vendors",
  "daily-logs": "dailyLogs",
  "scope-items": "scopeItems",
  "material-catalog": "materialCatalog",
  "labor-norms": "laborNorms",
  "asset-allocations": "assetAllocations",
  "asset-media": "assetMedia",
  "team-assignments": "teamAssignments",
  "sheq-templates": "sheqTemplates",
  "project-milestones": "projectMilestones",
  "project-media": "projectMedia",
  timesheets: "timesheets"
};

function getBody(req: Request): Body {
  return asObject(req.body);
}

async function simpleCrud(options: CrudOptions): Promise<ApiResult> {
  const { method, resource, rest, body, collection, idKey = "id" } = options;

  if (method === "GET" && rest.length === 0) {
    return ok(await getCollection(collection));
  }

  if (method === "GET" && rest.length === 1) {
    const item = await findById(collection, rest[0], idKey);
    return item ? ok(item) : notFound(`${resource} not found`);
  }

  if (method === "POST" && rest.length === 0) {
    const payload = body ?? {};
    const sourceId = payload[idKey];
    const id = typeof sourceId === "string" && sourceId.trim() ? sourceId : generateId(resource);
    const next = { ...payload, [idKey]: id };
    return created(await create(collection, next));
  }

  if (method === "PUT" && rest.length === 1) {
    if (!body) return badRequest("Missing payload");
    const next = await update(collection, rest[0], body, idKey);
    return next ? ok(next) : notFound(`${resource} not found`);
  }

  if (method === "DELETE" && rest.length === 1) {
    const removed = await remove(collection, rest[0], idKey);
    return removed ? noContent() : notFound(`${resource} not found`);
  }

  return notFound("Unsupported operation");
}

function asRecord(value: unknown) {
  return asObject(value) ?? {};
}

export const operationsRouter = Router();

operationsRouter.all("*", async (req, res, next) => {
  try {
    const method = req.method.toUpperCase();
    const parts = req.path.split("/").filter(Boolean);
    const [resource, ...rest] = parts;

    if (!resource) {
      return respond(res, notFound("Missing resource"));
    }

    const collection = KEY_BY_RESOURCE[resource];
    const body = getBody(req);

    switch (resource) {
      case "projects":
      case "assets":
      case "staff":
      case "vendors":
      case "daily-logs":
      case "scope-items":
      case "asset-allocations":
      case "asset-media":
      case "team-assignments":
      case "sheq-templates":
      case "project-milestones":
      case "project-media":
      case "timesheets":
        break;
      case "material-catalog":
        return respond(
          res,
          await simpleCrud({
            method,
            resource,
            rest,
            body,
            collection,
            idKey: "itemCode"
          })
        );
      case "labor-norms":
        return respond(
          res,
          await simpleCrud({
            method,
            resource,
            rest,
            body,
            collection,
            idKey: "activityCode"
          })
        );
      default:
        return respond(res, notFound(`Unknown resource ${resource}`));
    }

    if (resource === "asset-media" && method === "GET" && rest[0] === "asset" && rest[1]) {
      const list = await getCollection("assetMedia");
      return respond(res, ok(list.filter((item) => item.assetId === rest[1])));
    }

    if (resource === "team-assignments" && method === "GET" && rest[0] === "project" && rest[1]) {
      const list = await getCollection("teamAssignments");
      return respond(
        res,
        ok(
          list.filter((assignment) => {
            const projectId = assignment.projectId ?? asRecord(assignment.project).id;
            return projectId === rest[1];
          })
        )
      );
    }

    if (resource === "project-milestones" && method === "GET" && rest[0] === "project" && rest[1]) {
      const list = await getCollection("projectMilestones");
      return respond(res, ok(list.filter((item) => item.projectId === rest[1])));
    }

    if (resource === "project-media" && method === "GET" && rest[0] === "project" && rest[1]) {
      const list = await getCollection("projectMedia");
      return respond(res, ok(list.filter((item) => item.projectId === rest[1])));
    }

    return respond(
      res,
      await simpleCrud({
        method,
        resource,
        rest,
        body,
        collection
      })
    );
  } catch (error) {
    return next(error);
  }
});
