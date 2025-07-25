import request from "supertest";
import app from "../server.js";
import { adminSchema } from "../validations/Admins.validations.js";

// ✅ Prefix phải khớp với Joi trong validations
const validPrefixes = [
  '086','096','097','098','032','033','034','035','036','037','038','039',
  '088','091','094','083','084','085','081','082',
  '089','090','093','070','079','077','076','078',
  '092','056','058','099','059'
];

const getUniqueEmail = () => `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

// ✅ Đảm bảo tạo số điện thoại đúng định dạng
const getUniquePhone = () => {
  const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 8999999); // 7 số
  return `${prefix}${number}`;
};

describe("🧪 Admin Registration - Controller + Validation", () => {
  beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 500));
  });

  // ========== Happy Case ==========
  it("✅ should create admin successfully", async () => {
    const res = await request(app).post("/admins/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });

    console.log(res.body); // Gỡ nếu cần
    expect(res.statusCode).toBe(201);
    expect(res.body.adminId).toBeDefined();
    expect(res.body.employeeCode).toMatch(/^AD\d{4}$/);
  });

  // ========== Unhappy Cases (Controller) ==========
  it("❌ should return 400 if email already exists", async () => {
    const duplicateEmail = getUniqueEmail();

    await request(app).post("/admins/register").send({
      name: "Trung",
      email: duplicateEmail,
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1995-05-05",
      gender: "male"
    });

    const res = await request(app).post("/admins/register").send({
      name: "Trung",
      email: duplicateEmail,
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1995-05-05",
      gender: "male"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "email" })])
    );
  });

  it("❌ should return 400 if confirmPassword mismatched", async () => {
    const res = await request(app).post("/admins/register").send({
      name: "Sai Mat Khau",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Wrong@123",
      dob: "1985-05-05",
      gender: "female"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "confirmPassword" })])
    );
  });

  // ========== Unhappy Cases (Validation Joi) ==========
  it("❌ should fail validation - invalid name", () => {
    const { error } = adminSchema.validate({
      name: "john123",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Name must start with a capital letter/);
  });

  it("❌ should fail validation - email contains space", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin @example.com", // lỗi có space
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Email must not contain spaces/);
  });

  it("❌ should fail validation - invalid phone", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0123456789", // prefix không hợp lệ
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Phone number is invalid/);
  });

  it("❌ should fail validation - weak password", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "123456",
      confirmPassword: "123456",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ should fail validation - confirmPassword mismatch", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@321",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Confirm password does not match/);
  });

  it("❌ should fail validation - age under 18", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "2010-01-01",
      gender: "male"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Age must be between/);
  });

  it("❌ should fail validation - gender invalid", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "invalid"
    });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/Gender must be one of/);
  });
    // ========== Các trường hợp name không hợp lệ bổ sung ==========
  it("❌ name - does not capitalize the first letter", () => {
    const { error } = adminSchema.validate({
      name: "john Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Name must start with a capital letter/);
  });

  it("❌ name - the second word should not be capitalized", () => {
    const { error } = adminSchema.validate({
      name: "John doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Name must start with a capital letter/);
  });

  it("❌ name - contains numbers", () => {
    const { error } = adminSchema.validate({
      name: "John123",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Name must start with a capital letter/);
  });

  it("❌ name - contains special characters", () => {
    const { error } = adminSchema.validate({
      name: "John@Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Name must start with a capital letter/);
  });

  it("❌ name - has extra whitespace", () => {
    const { error } = adminSchema.validate({
      name: "John  Doe", // 2 dấu cách
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Name must start with a capital letter/);
  });
  it("❌ email - has a space", () => {
  const { error } = adminSchema.validate({
    name: "John Doe",
    email: "admin @example.com",
    phone: "0987654321",
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male"
  });
  expect(error?.details[0].message).toMatch(/Email must not contain spaces/);
});


  it("❌ email - has a space", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin @example.com", // có khoảng trắng
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Email must not contain spaces/);
  });

 it("❌ email - has a line break", () => {
  const { error } = adminSchema.validate({
    name: "John Doe",
    email: "admin@example.com\n", // xuống dòng
    phone: "0987654321",
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male"
  });
  expect(error?.details[0].message).toMatch(/Email must not contain new lines/);
});

  it("❌ password - missing uppercase letters", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "test@123", // toàn chữ thường
      confirmPassword: "test@123",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ password - missing special character", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test1234", // không có ký tự đặc biệt
      confirmPassword: "Test1234",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ password - has a space", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test 123", // có space
      confirmPassword: "Test 123",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ password - has a line break", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123\n", // có xuống dòng
      confirmPassword: "Test@123\n",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ password - contains a semicolon (;)", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test;123", // chứa dấu ;
      confirmPassword: "Test;123",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/must not contain the semicolon/);
  });
  it("❌ dob - date of birth in the future", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "2026-01-01", // năm tương lai
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Age must be between/);
  });
  it("❌ gender - invalid value", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "apache helicopter" // không nằm trong enum
    });
    expect(error?.details[0].message).toMatch(/Gender must be one of/);
  });
 it("❌ password - missing digit", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@abc", // thiếu số
      confirmPassword: "Test@abc",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });
  it("❌ should return 400 if phone number already exists", async () => {
  const duplicatePhone = getUniquePhone();

  await request(app).post("/admins/register").send({
    name: "Trung A",
    email: getUniqueEmail(),
    phone: duplicatePhone,
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1995-01-01",
    gender: "male"
  });

  const res = await request(app).post("/admins/register").send({
    name: "Trung B",
    email: getUniqueEmail(), // khác email
    phone: duplicatePhone, // giống phone
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1995-01-01",
    gender: "male"
  });

  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "phone" })])
  );
});
it("❌ password - missing digit", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@abc", // thiếu số
      confirmPassword: "Test@abc",
      dob: "1990-01-01",
      gender: "female"
    });
    expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
  });

  it("❌ phone - too short", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "098765432", // 9 chữ số
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Phone number is invalid/);
  });

  it("❌ phone - too long", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "09876543210", // 11 chữ số
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Phone number is invalid/);
  });

  it("❌ phone - contains letters", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "abcde12345",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Phone number is invalid/);
  });

  it("❌ phone - contains space", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "09876 54321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Phone number is invalid/);
  });

  it("❌ phone - contains special character", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "09876-54321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male"
    });
    expect(error?.details[0].message).toMatch(/Phone number is invalid/);
  });
 it("❌ email - contains multiple @", () => {
  const { error } = adminSchema.validate({
    name: "John Doe",
    email: "admin@@example.com",
    phone: "0987654321",
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male"
  });
  expect(error?.details[0].message).toMatch(/multiple @ characters/);
});
  it("❌ password - too long (more than 32 characters)", () => {
  const tooLong = "A1@" + "a".repeat(33); // Tổng cộng 33 ký tự
  console.log("password length:", tooLong.length); // nên in ra 33 để chắc chắn

  const { error } = adminSchema.validate({
    name: "John Doe",
    email: "admin@example.com",
    phone: "0987654321",
    password: tooLong,
    confirmPassword: tooLong,
    dob: "1990-01-01",
    gender: "male"
  });

  expect(error).toBeDefined();
  expect(error?.details[0].message).toMatch(/Password must be 5–32 characters/);
});


  it("✅ dob - exactly 18 years old", () => {
    const today = new Date();
    const year = today.getFullYear() - 18;
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    const dob = `${year}-${month}-${day}`;

    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob,
      gender: "male"
    });
    expect(error).toBeUndefined();
  });

  it("❌ gender - uppercase value", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "MALE"
    });
    expect(error).toBeDefined();
  });

  it("❌ gender - capitalized first letter", () => {
    const { error } = adminSchema.validate({
      name: "John Doe",
      email: "admin@example.com",
      phone: "0987654321",
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "Female"
    });
    expect(error).toBeDefined();
  });
});
