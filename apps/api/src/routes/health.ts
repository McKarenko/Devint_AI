import type { FastifyInstance } from "fastify"

/** Подключает проверку работоспособности. В ответе только статус. */
function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async () => {
    return { status: "ok" }
  })
}

export { registerHealthRoute }
