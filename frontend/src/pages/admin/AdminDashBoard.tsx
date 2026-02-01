import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetAllUserQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from "../../store/api/authApi";
import { createAdminColumns } from "../../layouts/AdminLayout";
import { RmsTable } from "../../components/RmsTable";
import type { User } from "../../store/api/authApi";
import { RmsButton } from "../../components";
import { Pagination } from "@heroui/react";
import { PAGE_SIZE } from "../../../constant";

export default function AdminDashBoard() {
  const { user: currentUser } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [updateUserRole, { isLoading: isUpdating }] =
    useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();
  const { data: users, isLoading, error, refetch } = useGetAllUserQuery();

  const pages = Math.ceil(users?.length || 0 / PAGE_SIZE);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return users?.slice(start, end) || [];
  }, [page, users]);

  const filteredData = useMemo(() => {
    return pageItems?.filter((user) => user.role !== "admin") || [];
  }, [pageItems]);

  const handleRoleChange = async (
    userId: number,
    newRole: string,
    isSuperuser: boolean,
  ) => {
    setSelectedUserId(userId);

    try {
      await updateUserRole({
        userId,
        role: newRole,
        is_superuser: newRole === "admin" ? true : isSuperuser,
      });

      alert("User role updated successfully");
      refetch();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role. Please try again.");
    } finally {
      setSelectedUserId(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    try {
      await deleteUser(userId).unwrap();
      alert(`User ${userName} deleted successfully`);
      refetch();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setSelectedUserId(null);
    }
  };

  const columns = createAdminColumns({
    currentUser,
    isUpdating,
    selectedUserId,
    handleRoleChange,
    handleDeleteUser,
  });

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Error Loading Users
          </h2>
          <p className="text-gray-600">
            {"data" in error && error.data
              ? (error.data as { detail?: string }).detail ||
                "An error occurred"
              : "Failed to load users"}
          </p>
          <RmsButton
            onClick={() => refetch()}
            className="mt-4"
            variant="secondary"
          >
            Retry
          </RmsButton>
        </div>
      </div>
    );
  }

  console.log(filteredData);

  return (
    <div className="flex flex-col gap-4 px-4 py-8 mt-10">
      <RmsTable<User>
        columns={columns}
        data={filteredData || []}
        // data={pageItems}
        isLoading={isLoading}
        className="max-h-[648px]"
        emptyContent={
          <div className="text-center py-8 text-gray-500">No users found</div>
        }
      />
      <div className="flex justify-end py-4">
        <Pagination
          showControls
          showShadow
          color="success"
          page={page}
          total={pages}
          onChange={(page) => setPage(page)}
        />
      </div>
    </div>
  );
}
