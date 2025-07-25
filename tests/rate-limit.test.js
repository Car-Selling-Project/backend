import request from "supertest";
import app from "../server.js";

describe("Rate limit", () => {
  it("should block 6th registration request", async () => {
    const basePayload = {
      name: "Rate Limited",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    };

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/customers/register")
        .send({
          ...basePayload,
          email: `ratelimit${i}@example.com`,
          phone: `09876543${i}0`
        });

      expect(res.statusCode).toBe(201);
    }

    // Lần 6 bị block
    const res6 = await request(app)
      .post("/customers/register")
      .send({
        ...basePayload,
        email: "ratelimit6@example.com",
        phone: "0987654399"
      });

    expect(res6.statusCode).toBe(429);
    expect(res6.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "ip" })
      ])
    );
  });
});
