export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: "authenticated";
}
