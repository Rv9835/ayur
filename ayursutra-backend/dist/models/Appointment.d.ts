import { Document, Types } from "mongoose";
export interface IAppointment extends Document {
    patient: Types.ObjectId;
    doctor: Types.ObjectId;
    therapy: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    rating?: number;
    duration?: number;
    painLevel?: number;
    energyLevel?: number;
    moodLevel?: number;
    sleepQuality?: number;
    overallWellness?: number;
    symptoms?: string[];
    improvements?: string[];
}
export declare const Appointment: import("mongoose").Model<IAppointment, {}, {}, {}, Document<unknown, {}, IAppointment, {}, {}> & IAppointment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Appointment.d.ts.map