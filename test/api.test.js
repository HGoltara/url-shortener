const request = require("supertest");
const app = require("../src/app");
const db = require("../src/db");

beforeEach(() => {
  db.exec("DELETE FROM links");
});

describe("POST /api/shorten", () => {
  it("cria um link curto para uma URL válida", async () => {
    const res = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com/pagina-longa" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      originalUrl: "https://exemplo.com/pagina-longa",
    });
    expect(res.body.code).toHaveLength(6);
    expect(res.body.shortUrl).toBe(`http://localhost:3000/${res.body.code}`);
  });

  it("aceita um alias personalizado", async () => {
    const res = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com", customCode: "meu-link" });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe("meu-link");
  });

  it("rejeita URL inválida", async () => {
    const res = await request(app)
      .post("/api/shorten")
      .send({ url: "não-é-uma-url" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejeita alias com caracteres inválidos", async () => {
    const res = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com", customCode: "a" });

    expect(res.status).toBe(400);
  });

  it("rejeita alias já usado por outro link", async () => {
    await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com/1", customCode: "duplicado" });

    const res = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com/2", customCode: "duplicado" });

    expect(res.status).toBe(409);
  });
});

describe("GET /api/links", () => {
  it("lista os links criados, mais recentes primeiro", async () => {
    await request(app).post("/api/shorten").send({ url: "https://exemplo.com/1" });
    await request(app).post("/api/shorten").send({ url: "https://exemplo.com/2" });

    const res = await request(app).get("/api/links");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].original_url).toBe("https://exemplo.com/2");
  });
});

describe("GET /:code", () => {
  it("redireciona para a URL original e conta o clique", async () => {
    const created = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com/destino", customCode: "clique" });

    const redirect = await request(app).get(`/${created.body.code}`);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.location).toBe("https://exemplo.com/destino");

    const links = await request(app).get("/api/links");
    expect(links.body[0].clicks).toBe(1);
  });

  it("retorna 404 para código inexistente", async () => {
    const res = await request(app).get("/codigo-inexistente");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/links/:code", () => {
  it("remove um link existente", async () => {
    const created = await request(app)
      .post("/api/shorten")
      .send({ url: "https://exemplo.com", customCode: "apagar-me" });

    const del = await request(app).delete(`/api/links/${created.body.code}`);
    expect(del.status).toBe(204);

    const links = await request(app).get("/api/links");
    expect(links.body).toHaveLength(0);
  });

  it("retorna 404 ao tentar remover um link inexistente", async () => {
    const res = await request(app).delete("/api/links/nao-existe");
    expect(res.status).toBe(404);
  });
});
