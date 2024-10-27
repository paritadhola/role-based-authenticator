import mongoose, { Document } from "mongoose";
export enum Roles {
    A = "admin",
    U = "user",
}

export interface IUserDoc extends Document {
    firstName: string,
    lastName: string,
    email: string,
    number: number,
    role: Roles,
    createdAt: Date,
    password: string,
    active: boolean,
    otp?: {
        otp: string
        expireDate: Date
    }
}

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    role: {
        type: Roles,
        required: true,
        default: Roles.U
    },
    password: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: false
    },
    otp: {
        otp: String,
        expireDate: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
    .index({ email: 1 }, { unique: 1 })
    .index({ number: 1 }, { unique: 1 });

export const UserModel = mongoose.model<IUserDoc>("users", userSchema, "users");

export default UserModel;