import request from "supertest";
import app from "../server.js"; // file server export default app

describe("POST /customers/register", () => {
  it("should register customer successfully", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Nguyen Van A",
        email: "test@example.com",
        phone: "0987654321",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1995-05-01",
        gender: "nam"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });
});
