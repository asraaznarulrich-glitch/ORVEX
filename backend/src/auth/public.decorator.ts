import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "orvex:isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
