import request from "supertest";
import app from "../server.js";
import mongoose from "mongoose";

const basePayload = {
  email: "login@test.com",
  password: "Test@123"
};

beforeAll(async () => {
  // tạo user test trước khi login
  await request(app).post("/customers/register").send({
    name: "Login Test",
    email: basePayload.email,
    phone: "0988888811",
    password: basePayload.password,
    confirmPassword: basePayload.password,
    dob: "1995-01-01",
    gender: "male"
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("POST /customers/login", () => {
  // ✅ Happy case
  it("should login successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/customers/login")
      .send(basePayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.customer).toBeDefined();
  });

  // ❌ Thiếu email
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/customers/login")
      .send({ password: basePayload.password });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "email" })
      ])
    );
  });

  // ❌ Thiếu password
  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/customers/login")
      .send({ email: basePayload.email });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "password" })
      ])
    );
  });

  // ❌ Email không tồn tại
  it("should return 401 if email does not exist", async () => {
    const res = await request(app)
      .post("/customers/login")
      .send({ email: "nonexistent@test.com", password: "Test@123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/email does not exist/i);
  });

  // ❌ Mật khẩu sai
  it("should return 401 if password is incorrect", async () => {
    const res = await request(app)
      .post("/customers/login")
      .send({ email: basePayload.email, password: "WrongPass123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/incorrect password/i);
  });

  // ❌ Gửi quá 5 lần → bị rate-limit
  it("should block 6th login attempt due to rate-limit", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/customers/login")
        .send({ email: "ratelogin@test.com", password: "Wrong123!" });

      // Không quan tâm pass hay sai, miễn gửi là tính quota
    }

    const res6 = await request(app)
      .post("/customers/login")
      .send({ email: "ratelogin@test.com", password: "Wrong123!" });

    expect(res6.statusCode).toBe(429);
    expect(res6.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "ip" })
      ])
    );
  });
});
