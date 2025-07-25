import request from "supertest";
import mongoose from "mongoose";
import Admin from "../models/admins.schema.js";
import app from "../server.js";

const validPayload = {
  name: "Admin One",
  email: "admin1@test.com",
  phone: "0987654321",
  password: "Valid@123",
  confirmPassword: "Valid@123",
  dob: "1990-01-01",
  gender: "male",
};

let employeeCodeUsed = "";

beforeAll(async () => {
  const res = await request(app).post("/admins/register").send(validPayload);

  if (res.statusCode === 201 && res.body?.staff?.employeeCode) {
    employeeCodeUsed = res.body.staff.employeeCode;
  } else {
    const found = await Admin.findOne({ email: validPayload.email });
    if (found) {
      employeeCodeUsed = found.employeeCode;
    } else {
      console.error("❌ Setup failed: Không lấy được employeeCode", res.body);
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("POST /admins/login", () => {
  it("should login successfully with valid credentials", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
      password: validPayload.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("should return 400 if employeeCode is missing", async () => {
    const res = await request(app).post("/admins/login").send({
      password: validPayload.password,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "employeeCode" })])
    );
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("should return 401 if employeeCode does not exist", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: "AD9999",
      password: validPayload.password,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/employee code does not exist/i);
  });

  it("should return 400 if password is incorrect", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
      password: "Wrong@123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("should return 400 if employeeCode format is invalid", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: "bad_code",
      password: validPayload.password,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "employeeCode" })])
    );
  });

  it("should return 400 if password contains space", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
      password: "Valid @123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("should return 400 if password contains newline", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
      password: "Valid@123\n",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("should return 400 if password contains ; or ,", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: employeeCodeUsed,
      password: "Valid@123;",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });
});
