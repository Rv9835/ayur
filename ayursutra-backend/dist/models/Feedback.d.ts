import { Document, Types } from "mongoose";
export interface IFeedback extends Document {
    by: Types.ObjectId;
    aboutAppointment: Types.ObjectId;
    rating: number;
    comment?: string;
}
export declare const Feedback: import("mongoose").Model<IFeedback, {}, {}, {}, Document<unknown, {}, IFeedback, {}, {}> & IFeedback & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Feedback.d.ts.map