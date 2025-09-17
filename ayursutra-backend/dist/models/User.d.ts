import { Document } from "mongoose";
export type UserRole = "patient" | "doctor" | "admin";
export interface IUser extends Document {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    specialty?: string;
    avatar?: string;
    isApproved?: boolean;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map