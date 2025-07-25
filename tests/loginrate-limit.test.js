import request from "supertest";
import app from "../server.js";
import mongoose from "mongoose";

beforeAll(async () => {
  const res = await request(app).post("/customers/register").send({
    name: "RateLimit Test",
    email: "ratelimit@test.com",
    phone: "0987654112",
    password: "ValidPass@1",
    confirmPassword: "ValidPass@1",
    dob: "1996-01-01",
    gender: "male"
  });

  if (res.statusCode !== 201 && res.body.message !== "Email is already in use") {
    console.error("❌ Register setup failed:", res.body);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("POST /customers/login - Rate Limit", () => {
  it("should block 6th login attempt due to rate-limit", async () => {
    const email = "ratelimit@test.com";
    const wrongPassword = "Wrong123!";

    for (let i = 0; i < 5; i++) {
      await request(app).post("/customers/login").send({ email, password: wrongPassword });
    }

    const res6 = await request(app).post("/customers/login").send({ email, password: wrongPassword });

    expect(res6.statusCode).toBe(429);
    expect(res6.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "ip" })])
    );
  });
});
