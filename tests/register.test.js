import request from "supertest";
import app from "../server.js";

describe("POST /customers/register", () => {
  // ✅ 1. Happy case
  it("should register customer successfully", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Nguyen Van A",
        email: "test1@example.com",
        phone: "0987654100",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1995-05-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });

  // ❌ 2. Thiếu name
  it("should return 400 if name is missing", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        email: "noname@example.com",
        phone: "0987654101",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "name" })
      ])
    );
  });

  // ❌ 3. Email sai định dạng
  it("should return 400 for invalid email", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Invalid Email",
        email: "abc@@gmail",
        phone: "0987654102",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "email" })
      ])
    );
  });

  // ❌ 4. Password yếu
  it("should return 400 for weak password", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Weak Password",
        email: "weakpass@example.com",
        phone: "0987654103",
        password: "12345",
        confirmPassword: "12345",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "password" })
      ])
    );
  });

  // ✅ 5. Gender dư dấu cách
  it("should accept gender with trailing space", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Gender Trim",
        email: "gender.trim@example.com",
        phone: "0987654104",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male " // dư dấu cách
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });

  // ❌ 6. Confirm password sai
  it("should return 400 if confirm password doesn't match", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Wrong Confirm",
        email: "wrongconfirm@example.com",
        phone: "0987654105",
        password: "Test@123",
        confirmPassword: "Test@124",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "confirmPassword" })
      ])
    );
  });

  // ❌ 7. Tuổi < 18
  it("should return 400 for underage user", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Too Young",
        email: "young@example.com",
        phone: "0987654106",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "2010-01-01", // < 18 tuổi
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "dob" })
      ])
    );
  });

  // ❌ 8. Gender sai giá trị
  it("should return 400 for invalid gender", async () => {
    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Wrong Gender",
        email: "wronggender@example.com",
        phone: "0987654107",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "alien" // không nằm trong enum
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "gender" })
      ])
    );
  });

  // ❌ 9. Trùng email
  it("should return 400 if email already exists", async () => {
    await request(app)
      .post("/customers/register")
      .send({
        name: "Dupe Email",
        email: "dupe@example.com",
        phone: "0987654108",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Dupe Email",
        email: "dupe@example.com", // trùng
        phone: "0987654109",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "email" })
      ])
    );
  });

  // ❌ 10. Trùng phone
  it("should return 400 if phone already exists", async () => {
    await request(app)
      .post("/customers/register")
      .send({
        name: "Dupe Phone",
        email: "dupephone1@example.com",
        phone: "0987654110",
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    const res = await request(app)
      .post("/customers/register")
      .send({
        name: "Dupe Phone",
        email: "dupephone2@example.com",
        phone: "0987654110", // trùng
        password: "Test@123",
        confirmPassword: "Test@123",
        dob: "1990-01-01",
        gender: "male"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "phone" })
      ])
    );
  });  
});
