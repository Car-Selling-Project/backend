import request from "supertest";
import app from "../server.js";
// Tạo email và phone hợp lệ, không trùng
const getUniqueEmail = () => `user_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

const getUniquePhone = () => {
  const validPrefixes = [
    '086','096','097','098','032','033','034','035','036','037','038','039',
    '088','091','094','083','084','085','081','082',
    '089','090','093','070','079','077','076','078',
    '092','056','058','099','059'
  ];
  const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 8999999); // 7 chữ số
  return `${prefix}${number}`;
};

describe("POST /customers/register", () => {
  beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 800)); // tránh rate limit
  });

  it("should register customer successfully", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1995-05-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });

  it("should return 400 if name is missing", async () => {
    const res = await request(app).post("/customers/register").send({
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "name" })])
    );
  });

  it("should return 400 for invalid email", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Invalid Email",
      email: "abc@@gmail",
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "email" })])
    );
  });

  it("should return 400 for weak password", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Weak Password",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "12345",
      confirmPassword: "12345",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("should accept gender with trailing space", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Gender Trim",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male ", // có khoảng trắng
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });

  it("should return 400 if confirm password doesn't match", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Wrong Confirm",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@124",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "confirmPassword" }),
      ])
    );
  });

  it("should return 400 for underage user", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Too Young",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "2010-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "dob" })])
    );
  });

  it("should return 400 for invalid gender", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Wrong Gender",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "alien",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "gender" })])
    );
  });

  it("should return 400 if email already exists", async () => {
    const duplicateEmail = getUniqueEmail();
    const phone1 = getUniquePhone();
    const phone2 = getUniquePhone(); // phải khác nhau nhưng hợp lệ

    await request(app).post("/customers/register").send({
      name: "Dupe Email",
      email: duplicateEmail,
      phone: phone1,
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    const res = await request(app).post("/customers/register").send({
      name: "Dupe Email",
      email: duplicateEmail,
      phone: phone2,
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "email" })])
    );
  });

  it("should return 400 if phone already exists", async () => {
    const duplicatePhone = getUniquePhone();
    const email1 = getUniqueEmail();
    const email2 = getUniqueEmail();

    await request(app).post("/customers/register").send({
      name: "Dupe Phone",
      email: email1,
      phone: duplicatePhone,
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    const res = await request(app).post("/customers/register").send({
      name: "Dupe Phone",
      email: email2,
      phone: duplicatePhone,
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "phone" })])
    );
  });
  it("❌ name - does not capitalize the first letter", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - the second word should not be capitalized", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - contains numbers", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van 1",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - contains special characters", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen @Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - has extra whitespace", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen  Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ email - has line break", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: "abc\n@example.com",
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "email" })])
  );
});

it("❌ email - contains multiple @", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: "admin@@example.com",
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "email" })])
  );
});

it("❌ password - missing uppercase letter", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "test@123",
    confirmPassword: "test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "password" })])
  );
});

it("❌ password - missing digit", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@abc",
    confirmPassword: "Test@abc",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "password" })])
  );
});
it("❌ name - does not capitalize the first letter", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - the second word should not be capitalized", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - contains numbers", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van 1",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - contains special characters", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen @Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ name - has extra whitespace", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen  Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "name" })])
  );
});

it("❌ email - has line break", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: "abc\n@example.com",
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "email" })])
  );
});

it("❌ email - contains multiple @", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: "admin@@example.com",
    phone: getUniquePhone(),
    password: "Test@123",
    confirmPassword: "Test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "email" })])
  );
});

it("❌ password - missing uppercase letter", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "test@123",
    confirmPassword: "test@123",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "password" })])
  );
});

it("❌ password - missing digit", async () => {
  const res = await request(app).post("/customers/register").send({
    name: "Nguyen Van A",
    email: getUniqueEmail(),
    phone: getUniquePhone(),
    password: "Test@abc",
    confirmPassword: "Test@abc",
    dob: "1990-01-01",
    gender: "male",
  });
  expect(res.statusCode).toBe(400);
  expect(res.body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ key: "password" })])
  );
});
it("❌ email - contains space", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: "admin @example.com",
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "email" })])
    );
  });

  it("❌ password - missing special character", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test1234",
      confirmPassword: "Test1234",
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("❌ password - has space", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@ 123",
      confirmPassword: "Test@ 123",
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("❌ password - has line break", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123\n",
      confirmPassword: "Test@123\n",
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("❌ password - contains semicolon", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123;",
      confirmPassword: "Test@123;",
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("❌ password - too long (more than 32 characters)", async () => {
    const longPassword = "A@" + "1".repeat(31);
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: longPassword,
      confirmPassword: longPassword,
      dob: "1990-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "password" })])
    );
  });

  it("❌ dob - date of birth in future", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "2999-01-01",
      gender: "male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "dob" })])
    );
  });

  it("✅ dob - exactly 18 years old", async () => {
    const now = new Date();
    const year = now.getFullYear() - 18;
    const dob = `${year}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob,
      gender: "male",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBeDefined();
  });

  it("❌ gender - uppercase value", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "MALE",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "gender" })])
    );
  });

  it("❌ gender - capitalized first letter", async () => {
    const res = await request(app).post("/customers/register").send({
      name: "Nguyen Van A",
      email: getUniqueEmail(),
      phone: getUniquePhone(),
      password: "Test@123",
      confirmPassword: "Test@123",
      dob: "1990-01-01",
      gender: "Male",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "gender" })])
    );
  });
});
