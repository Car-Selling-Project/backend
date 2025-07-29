import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Admin from '../models/admins.schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



let testEmail = `admin${Date.now()}@example.com`;
let accessToken = '';
let adminId = null;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Admin.deleteMany({ $or: [{ email: testEmail }, { phone: '0987654321' }] });

  const registerRes = await request(app).post('/admins/register').send({
    name: 'Test Admin',
    email: testEmail,
    phone: '0987654321',
    password: 'Test@123',
    confirmPassword: 'Test@123',
    dob: '1990-01-01',
    gender: 'male',
  });

  if (registerRes.statusCode !== 201 || !registerRes.body.employeeCode) {
    throw new Error(`❌ Đăng ký admin thất bại: ${registerRes.statusCode} - ${JSON.stringify(registerRes.body)}`);
  }

  adminId = (await Admin.findOne({ email: testEmail }))?._id;

  const loginRes = await request(app).post('/admins/login').send({
    employeeCode: registerRes.body.employeeCode,
    password: 'Test@123',
  });

  if (loginRes.statusCode !== 200 || !loginRes.body.accessToken) {
    throw new Error(`❌ Login thất bại: ${loginRes.statusCode} - ${JSON.stringify(loginRes.body)}`);
  }

  accessToken = loginRes.body.accessToken;
});

afterAll(async () => {
  await Admin.deleteMany({ $or: [{ email: testEmail }, { phone: '0987654321' }] });
  await mongoose.connection.close();
});


describe('POST /admins/cars', () => {
  it('✅ should create a car successfully with valid data', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'A car for testing',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: 'Gasoline',
        gasoline: '95',
        steering: 'Left',
        power: '120HP'
      }))
      .field('dimension', JSON.stringify({
        length: 3500,
        width: 1800,
        height: 1500,
        cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022,
        type: 'SUV',
        seat: 5,
        exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Car created successfully/i);
  });

  it('❌ should fail if car.title is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: '',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP'
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.description is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: '',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.brandId is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.locationId is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.model is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: ''
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if image is not attached', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('❌ should fail if all fields are missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
  it('❌ should fail if engine.fuelType is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: '', gasoline: '95', steering: 'Left', power: '120HP'
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.gasoline is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: 'Gasoline', gasoline: '', steering: 'Left', power: '120HP'
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.steering is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: 'Gasoline', gasoline: '95', steering: '', power: '120HP'
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.power is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({
        fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: ''
      }))
      .field('dimension', JSON.stringify({
        length: 3500, width: 1800, height: 1500, cargoCapacity: 500
      }))
      .field('detail', JSON.stringify({
        registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black'
      }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if dimension.length is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.width is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.height is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.cargoCapacity is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
  it('❌ should fail if detail.registrationYear is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: '', type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.type is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: '', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.seat is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: '', exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.exteriorColor is missing', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: '' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if car.brandId is not a valid hex', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: 'INVALID_HEX!',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.brandId is less than 24 chars', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d9',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.brandId is more than 24 chars', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1ABCD',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
  it('❌ should fail if car.locationId is not a valid hex', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: 'INVALID_HEX!',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.locationId is less than 24 chars', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d9',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if car.locationId is more than 24 chars', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2ABCD',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if brand does not exist in DB', async () => {
    const nonExistentBrandId = '64f98f2e16a4c61b9e000000';
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: nonExistentBrandId,
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid brandId/i);
  });

  it('❌ should fail if location does not exist in DB', async () => {
    const nonExistentLocationId = '64f98f2e16a4c61b9e000001';
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: nonExistentLocationId,
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid locationId/i);
  });
  it('❌ should fail if engine.fuelType is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 123, gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.gasoline is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: 95, steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.steering is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 1, power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if engine.power is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: 120 }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if dimension.length is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 'invalid', width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.width is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 'wide', height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.height is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 'tall', cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if dimension.cargoCapacity is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car',
        description: 'desc',
        brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2',
        model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 'big' }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if detail.registrationYear is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 'not-a-number', type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.type is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 12345, seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.seat is not a number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 'five', exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if detail.exteriorColor is not a string', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 5, exteriorColor: 123 }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
   it('❌ should fail if registrationYear is less than 1986', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 1980, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if registrationYear is greater than current year', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({
        title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1',
        locationId: '60e8b5401c4ae72f884d97c2', model: '2023'
      }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: new Date().getFullYear() + 1, type: 'SUV', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if type is not in allowed list', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'Bouba', seat: 5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if seat is less than 2', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 1, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if seat is greater than 20', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 25, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('❌ should fail if seat is a decimal number', async () => {
    const res = await request(app)
      .post('/admins/cars')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('car', JSON.stringify({ title: 'Test Car', description: 'desc', brandId: '60e8b5401c4ae72f884d97c1', locationId: '60e8b5401c4ae72f884d97c2', model: '2023' }))
      .field('engine', JSON.stringify({ fuelType: 'Gasoline', gasoline: '95', steering: 'Left', power: '120HP' }))
      .field('dimension', JSON.stringify({ length: 3500, width: 1800, height: 1500, cargoCapacity: 500 }))
      .field('detail', JSON.stringify({ registrationYear: 2022, type: 'SUV', seat: 4.5, exteriorColor: 'Black' }))
      .attach('images', path.resolve(__dirname, 'assets/test-car.jpg'));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});
