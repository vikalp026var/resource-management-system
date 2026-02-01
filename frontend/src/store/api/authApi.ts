import { baseApi } from "./baseApi";
import type { RmsRowType } from "../../types/components_type";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface User extends RmsRowType {
  id: number;
  email: string;
  fullName: string | null;
  is_active: boolean;
  role: string;
  is_superuser: boolean;
}

export interface ChangePasswordRequest {
  email: string;
  old_password: string;
  new_password: string;
}

export interface UpdateUserRoleRequest {
  userId: number;
  role: string;
  is_superuser?: boolean;
}

export interface UpdateUserRoleResponse {
  message: string;
  user: User;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    register: builder.mutation<void, RegisterRequest>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          localStorage.clear();
          window.location.href = "/login";
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    changePassword: builder.mutation<
      { message: string },
      ChangePasswordRequest
    >({
      query: (credentials) => ({
        url: "/auth/change_password",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    getAllUser: builder.query<User[], void>({
      query: () => ({
        url: "/auth/users",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    updateUserRole: builder.mutation<
      UpdateUserRoleResponse,
      UpdateUserRoleRequest
    >({
      query: (credentials) => ({
        url: `/auth/users/${credentials.userId}/role`,
        method: "PATCH",
        params: {
          role: credentials.role,
          is_superuser: credentials.is_superuser || false,
        },
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (userId) => ({
        url: `/auth/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useGetAllUserQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = authApi;
