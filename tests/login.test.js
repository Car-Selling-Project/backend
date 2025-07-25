import request from "supertest";
import app from "../server.js";
import mongoose from "mongoose";

const validPayload = {
  employeeCode: "AD1234",
  password: "Valid@123"
};

beforeAll(async () => {
  const res = await request(app).post("/admins/register").send({
    name: "Admin Test",
    employeeCode: validPayload.employeeCode,
    phone: "0988888811",
    password: validPayload.password,
    confirmPassword: validPayload.password,
    dob: "1990-01-01",
    gender: "male",
  });

  if (res.statusCode !== 201) {
    console.error("❌ Register setup failed:", res.body);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("POST /admins/login", () => {
  it("should login successfully with valid credentials", async () => {
    const res = await request(app).post("/admins/login").send(validPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("should return 400 if employeeCode is missing", async () => {
    const res = await request(app).post("/admins/login").send({ password: validPayload.password });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "employeeCode" })]));
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app).post("/admins/login").send({ employeeCode: validPayload.employeeCode });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "password" })]));
  });

  it("should return 401 if employeeCode does not exist", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: "AD9999",
      password: validPayload.password
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/employee code does not exist/i);
  });

  it("should return 400 if password is incorrect", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: validPayload.employeeCode,
      password: "Wrong@123"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "password" })]));
  });

  it("should return 400 if employeeCode format is invalid", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: "INVALID",
      password: validPayload.password
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "employeeCode" })]));
  });

  it("should return 400 if password contains space", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: validPayload.employeeCode,
      password: "Valid @123"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "password" })]));
  });

  it("should return 400 if password contains newline", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: validPayload.employeeCode,
      password: "Valid@123\n"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "password" })]));
  });

  it("should return 400 if password contains ; or ,", async () => {
    const res = await request(app).post("/admins/login").send({
      employeeCode: validPayload.employeeCode,
      password: "Valid@123;"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ key: "password" })]));
  });
});
