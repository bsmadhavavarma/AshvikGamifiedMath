import { adminOnly } from '../../src/shared/middleware/adminOnly';
import { Request, Response, NextFunction } from 'express';

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
const mockRes = {} as Response;

function makeReq(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

beforeEach(() => mockNext.mockClear());

describe('adminOnly middleware', () => {
  it('allows 127.0.0.1', () => {
    adminOnly(makeReq('127.0.0.1'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // no args = allowed
  });

  it('allows ::1 (IPv6 localhost)', () => {
    adminOnly(makeReq('::1'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('blocks external IP', () => {
    adminOnly(makeReq('192.168.1.100'), mockRes, mockNext);
    const [err] = mockNext.mock.calls[0]!;
    expect(err).toBeDefined();
    expect((err as unknown as { statusCode: number }).statusCode).toBe(403);
  });
});
