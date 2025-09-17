import { Document, Types } from "mongoose";
export interface IChatMessage {
    sender: Types.ObjectId;
    text: string;
    createdAt: Date;
}
export interface IChat extends Document {
    participants: Types.ObjectId[];
    messages: IChatMessage[];
}
export declare const Chat: import("mongoose").Model<IChat, {}, {}, {}, Document<unknown, {}, IChat, {}, {}> & IChat & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Chat.d.ts.map