import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        role?: string;
    };
}
export declare function verifyFirebaseUid(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function signAppJwt(uid: string, role: string): string;
export declare function verifyAppJwt(req: AuthRequest, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function requireRoles(roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map