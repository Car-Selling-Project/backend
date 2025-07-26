import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../server.js";
import Customer from "../models/customers.schema.js";

// Helper tạo user hợp lệ
const createTestCustomer = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash("OldP@ss1", 10);
  return await Customer.create({
    name: "Nguyen Van A",
    email: "test@example.com",
    phone: "0987654321",
    dob: new Date("2000-01-01"),
    gender: "male",
    password: hashedPassword,
    ...overrides,
  });
};

// Helper kiểm tra message trong array object
const expectErrorMessage = (res, expectedMsg) => {
  const messages = res.body.errors.map((e) =>
    typeof e === "string" ? e : e.message
  );
  expect(messages).toContain(expectedMsg);
};

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/car-buy-sell-test"
    );
  }
});

afterEach(async () => {
  await Customer.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("PATCH /customers/reset-password", () => {
  it("✅ should reset password successfully", async () => {
    await createTestCustomer();

    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successful");
  });

  it("❌ should return 404 if email does not exist", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "notfound@example.com",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Email does not exist");
  });

 it("❌ should return 400 if password same as old", async () => {
  const samePass = "SameP@ss1";
  await Customer.insertMany([
    {
      name: "Test",
      email: "test@example.com",
      phone: "0987654321",
      dob: new Date("2000-01-01"),
      gender: "male",
      password: await bcrypt.hash(samePass, 10), // đã hash
    },
  ]);

  const res = await request(app).patch("/customers/reset-password").send({
    email: "test@example.com",
    password: samePass,
    confirmPassword: samePass,
  });

  expect(res.status).toBe(400);
  expect(res.body.message).toBe(
    "New password must be different from the old password"
  );
});


  it("❌ should fail if confirmPassword does not match", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "NewP@ss1",
      confirmPassword: "WrongP@ss1",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Confirm password does not match password");
  });

  it("❌ should fail with invalid email format", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "invalid@@email.com",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Email must not contain multiple @ characters");
  });

  it("❌ should fail if password has no special character", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "NoSpecial1",
      confirmPassword: "NoSpecial1",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(
      res,
      "Password must contain at least one special character"
    );
  });

  it("❌ should fail if password has no uppercase letter", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "lowercase1!",
      confirmPassword: "lowercase1!",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(
      res,
      "Password must contain at least one uppercase letter"
    );
  });

  it("❌ should fail if password has no number", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "NoNumber!",
      confirmPassword: "NoNumber!",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must contain at least one number");
  });

  it("❌ should fail if password is shorter than 5 characters", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "A1!",
      confirmPassword: "A1!",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must be at least 5 characters");
  });

  it("❌ should fail if password is longer than 32 characters", async () => {
    const longPassword = "A1!".repeat(11) + "A";
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: longPassword,
      confirmPassword: longPassword,
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must be at most 32 characters");
  });

  it("❌ should fail if email contains whitespace", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "white space@example.com",
      password: "A1!pass",
      confirmPassword: "A1!pass",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Email must not contain spaces");
  });

  it("❌ should fail if email contains line break", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "line\nbreak@example.com",
      password: "A1!pass",
      confirmPassword: "A1!pass",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "Email must not contain new lines");
  });

  it("❌ should fail if email is a number", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: 123456,
      password: "A1!pass",
      confirmPassword: "A1!pass",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "\"email\" must be a string");
  });

  it("❌ should fail if email is special characters", async () => {
  const res = await request(app).patch("/customers/reset-password").send({
    email: "a@@b.com", // ✅ đổi lại cho Joi bắt lỗi đúng
    password: "A1!pass",
    confirmPassword: "A1!pass",
  });

  expect(res.status).toBe(400);
  expectErrorMessage(res, "Email must not contain multiple @ characters");
});


  it("❌ should fail if confirmPassword is missing", async () => {
    const res = await request(app).patch("/customers/reset-password").send({
      email: "test@example.com",
      password: "A1!valid",
    });

    expect(res.status).toBe(400);
    expectErrorMessage(res, "\"confirmPassword\" is required");
  });

  it("❌ should fail if all fields are missing", async () => {
    const res = await request(app).patch("/customers/reset-password").send({});

    expect(res.status).toBe(400);
    expectErrorMessage(res, "\"email\" is required");
    expectErrorMessage(res, "\"password\" is required");
    expectErrorMessage(res, "\"confirmPassword\" is required");
  });
});
