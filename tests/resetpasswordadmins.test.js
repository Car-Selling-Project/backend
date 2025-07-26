import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import Admin from "../models/admins.schema.js";
import bcrypt from "bcrypt";

const createTestAdmin = async (override = {}) => {
  return await Admin.create({
    name: "Nguyen Van A",
    email: `admin_${Date.now()}@example.com`,
    phone: `0987654${Math.floor(100 + Math.random() * 899)}`,
    dob: "1990-01-01",
    gender: "male",
    employeeCode: override.employeeCode || `AD${Math.floor(1000 + Math.random() * 9000)}`,
    password: "OldP@ss1", // ❗️ Plain password để pre('save') hash
    ...override,
  });
};


const expectErrorMessage = (res, expectedMsg) => {
  const messages = res.body.errors.map((e) =>
    typeof e === "string" ? e : e.message
  );
  expect(messages).toContain(expectedMsg);
};

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterEach(async () => {
  await Admin.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("PATCH /admins/reset-password", () => {
  it("✅ should reset admin password successfully", async () => {
    const admin = await createTestAdmin();

    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin password reset successful");
  });

  it("❌ should fail if employeeCode not found", async () => {
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: "AD9999",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Employee code does not exist");
  });

  it("❌ should fail if password same as old", async () => {
  const admin = await createTestAdmin(); // Không override employeeCode nữa
  const res = await request(app).patch("/admins/reset-password").send({
    employeeCode: admin.employeeCode, // lấy đúng từ admin vừa tạo
    password: "OldP@ss1",
    confirmPassword: "OldP@ss1",
  });
  expect(res.status).toBe(400);
  expect(res.body.message).toBe("New password must be different from the old password");
});


  it("❌ should fail if confirmPassword does not match", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "NewP@ss1",
      confirmPassword: "WrongP@ss1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Confirm password does not match password");
  });

  it("❌ should fail if employeeCode contains whitespace", async () => {
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: "AD12 34",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Employee code must not contain spaces");
  });

  it("❌ should fail if employeeCode contains newline", async () => {
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: "AD12\n34",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Employee code must not contain new lines");
  });

  it("❌ should fail if employeeCode is invalid format", async () => {
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: "A1234",
      password: "NewP@ss1",
      confirmPassword: "NewP@ss1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Employee code must start with 'AD' followed by 4 digits (e.g., AD1234)");
  });

  it("❌ should fail if password is invalid (missing special char)", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "NewPass1",
      confirmPassword: "NewPass1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must contain at least one special character");
  });

  it("❌ should fail if password is invalid (missing digit)", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "NewPass@",
      confirmPassword: "NewPass@",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must contain at least one number");
  });

  it("❌ should fail if password is invalid (missing uppercase)", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "newpass@1",
      confirmPassword: "newpass@1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must contain at least one uppercase letter");
  });

  it("❌ should fail if password is invalid (contains ;)", async () => {
    const admin = await createTestAdmin();
    const value = "NewP@ss;1";
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: value,
      confirmPassword: value,
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must not contain the semicolon (;)");
  });

  it("❌ should fail if password is invalid (too short)", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "A@1",
      confirmPassword: "A@1",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must be at least 5 characters");
  });

  it("❌ should fail if password is invalid (too long)", async () => {
    const admin = await createTestAdmin();
    const longPass = "A@1".repeat(11) + "A";
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: longPass,
      confirmPassword: longPass,
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Password must be at most 32 characters");
  });

  it("❌ should fail if confirmPassword is missing", async () => {
    const admin = await createTestAdmin();
    const res = await request(app).patch("/admins/reset-password").send({
      employeeCode: admin.employeeCode,
      password: "Valid@1Pass",
    });
    expect(res.status).toBe(400);
    expectErrorMessage(res, "Confirm password is required");
  });

  it("❌ should fail if all fields missing", async () => {
    const res = await request(app).patch("/admins/reset-password").send({});
    expect(res.status).toBe(400);
    expectErrorMessage(res, "\"employeeCode\" is required");
    expectErrorMessage(res, "\"password\" is required");
    expectErrorMessage(res, "Confirm password is required");
  });
});
