import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HttpStatusCode } from "../common/constants/http-status";
import { createDb } from "../db/client";
import { jsonWithRevalidation } from "../lib/http-revalidation";
import { buildErrorResponse, buildSuccessResponse } from "../lib/responses";
import { ErrorCodes } from "../common/constants/error-codes";
import type { AppBindings } from "../middleware/auth";
import * as catalog from "../services/catalog.service";
import {
  consultationCreateSchema,
  contactMessageCreateSchema,
  storeOrderCreateSchema,
} from "../validators/schemas";

export const storeRoutes = new Hono<{ Bindings: AppBindings }>();

storeRoutes.get("/product-categories", async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listProductCategoriesPublic(db);
  return jsonWithRevalidation(c, buildSuccessResponse(data), {
    cacheControl: "public, max-age=60, stale-while-revalidate=120",
  });
});

storeRoutes.get("/products", async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listProductsPublic(db);
  return jsonWithRevalidation(c, buildSuccessResponse(data), {
    cacheControl: "public, max-age=60, stale-while-revalidate=120",
  });
});

storeRoutes.get("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        HttpStatusCode.BAD_REQUEST,
        "Invalid product id",
      ),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const db = createDb(c.env);
  const data = await catalog.getProductPublic(db, id);
  return jsonWithRevalidation(c, buildSuccessResponse(data), {
    cacheControl: "public, max-age=60, stale-while-revalidate=120",
  });
});

storeRoutes.post(
  "/orders",
  zValidator("json", storeOrderCreateSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env);
    const data = await catalog.createStoreOrder(db, body);
    return c.json(buildSuccessResponse(data), HttpStatusCode.CREATED);
  },
);

storeRoutes.get("/orders", (c) => {
  return c.json(
    buildErrorResponse(
      ErrorCodes.VALIDATION_FAILED,
      HttpStatusCode.METHOD_NOT_ALLOWED,
      "Method not allowed. Use POST /store/orders to create an order.",
    ),
    HttpStatusCode.METHOD_NOT_ALLOWED,
  );
});

storeRoutes.post(
  "/consultations",
  zValidator("json", consultationCreateSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env);
    const data = await catalog.createConsultationPublic(db, body);
    return c.json(buildSuccessResponse(data), HttpStatusCode.CREATED);
  },
);

storeRoutes.post(
  "/contact-messages",
  zValidator("json", contactMessageCreateSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env);
    const data = await catalog.createContactMessagePublic(c.env, db, body);
    return c.json(buildSuccessResponse(data), HttpStatusCode.CREATED);
  },
);

storeRoutes.get("/blogs", async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listBlogsPublic(db);
  return jsonWithRevalidation(c, buildSuccessResponse(data), {
    cacheControl: "public, max-age=120, stale-while-revalidate=300",
  });
});

storeRoutes.get("/blogs/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        HttpStatusCode.BAD_REQUEST,
        "Invalid blog id",
      ),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const db = createDb(c.env);
  const data = await catalog.getBlogPublic(db, id);
  return jsonWithRevalidation(c, buildSuccessResponse(data), {
    cacheControl: "public, max-age=120, stale-while-revalidate=300",
  });
});
