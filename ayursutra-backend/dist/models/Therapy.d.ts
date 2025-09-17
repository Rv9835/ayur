import { Document } from "mongoose";
export interface ITherapy extends Document {
    name: string;
    description?: string;
    durationMinutes: number;
}
export declare const Therapy: import("mongoose").Model<ITherapy, {}, {}, {}, Document<unknown, {}, ITherapy, {}, {}> & ITherapy & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Therapy.d.ts.map