// frontend/src/layouts/AdminLayout.tsx
import type { RmsColumnType } from "../types/components_type";
import type { User } from "../store/api/authApi";
import {
  Chip,
  DropdownItem,
  DropdownMenu,
  Dropdown,
  DropdownTrigger,
  Skeleton,
  Tooltip,
  PopoverTrigger,
  Popover,
  PopoverContent,
} from "@heroui/react";
import { MdModeEdit } from "react-icons/md";
import {
  IoMailOutline,
  IoPersonOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { RmsButton } from "../components";
import { ROLES } from "../../constant";
import { renderUser } from "../componentUtils";
import { useState } from "react";

interface UserColumnParams {
  currentUser: User | undefined;
}

interface RoleColumnParams {
  currentUser: User | undefined;
  isUpdating: boolean;
  selectedUserId: number | null;
  handleRoleChange: (
    userId: number,
    newRole: string,
    isSuperuser: boolean,
  ) => void;
}

interface ActionsColumnParams {
  currentUser: User | undefined;
  isUpdating: boolean;
  handleDeleteUser: (userId: number, userName: string) => void;
}

interface UserActionCellProps {
  row: User;
  onDelete: (id: number, name: string) => void;
  isUpdating: boolean;
}

export const employeeIdLayout = (params: UserColumnParams) => {
  return {
    label: "Employee ID",
    key: "employee_id",
    renderer: (row: User) => (
      <div className="flex items-center gap-2 justify-center">
        <Chip
          color="default"
          variant="flat"
          size="md"
          startContent={<IoPersonOutline className="w-4 h-4 mr-2" />}
          className="text-sm text-foreground truncate"
        >
          {row.employee_id ? String(row.employee_id) : "N/A"}
        </Chip>
      </div>
    ),
    loadingRenderer: () => (
      <div className="flex items-center justify-center">
        <Skeleton className="w-32 h-6 rounded-full" />
      </div>
    ),
  } as RmsColumnType<User>;
};

export const userNameLayout = (params: UserColumnParams) => {
  return {
    label: "Name",
    key: "fullName",
    renderer: (row: User) => (
      <div className="flex items-center gap-2 justify-center">
        {row.id === params.currentUser?.id ? (
          <Tooltip content="You" placement="top">
            <div className="text-sm text-foreground cursor-pointer justify-center items-center space-x-2">
              {renderUser(row.fullName || "")}
            </div>
          </Tooltip>
        ) : (
          <div className="text-sm text-foreground cursor-pointer justify-center items-center space-x-2">
            {renderUser(row.fullName || "")}
          </div>
        )}
      </div>
    ),
    loadingRenderer: () => (
      <div className="flex items-center justify-center">
        <Skeleton className="w-32 h-6 rounded-full" />
        <Skeleton className="w-48 h-6 rounded-md" />
      </div>
    ),
  } as RmsColumnType<User>;
};

/**
 * Email Column Layout
 */
export const emailLayout = () => {
  return {
    label: "Email",
    key: "email",
    renderer: (row: User) => (
      <Chip
        color="default"
        variant="flat"
        size="sm"
        startContent={<IoMailOutline className="w-4 h-4 mr-2" />}
        className="text-sm text-foreground truncate"
      >
        {row.email}
      </Chip>
    ),
    loadingRenderer: () => <Skeleton className="w-48 h-6 rounded-md" />,
  } as RmsColumnType<User>;
};

/**
 * Role Column Layout with Select Dropdown
 */
export const roleLayout = (params: RoleColumnParams) => {
  return {
    label: "Role",
    key: "role",
    width: "20%",
    align: "center",
    renderer: (row: User) => {
      const getRoleColor = (
        role: string,
      ): "danger" | "warning" | "success" | "default" => {
        switch (role) {
          case "admin":
            return "danger";
          case "hr":
            return "warning";
          case "employee":
            return "success";
          default:
            return "default";
        }
      };

      const canEdit = row.id !== params.currentUser?.id;
      const isLoading = params.isUpdating && params.selectedUserId === row.id;

      return (
        <div className="flex items-center justify-center gap-2">
          {canEdit ? (
            <Dropdown>
              <DropdownTrigger>
                <Chip
                  color={getRoleColor(row.role)}
                  variant="flat"
                  size="md"
                  startContent={<MdModeEdit className="w-4 h-4 mr-2" />}
                  className="cursor-pointer hover:scale-105 transition-transform capitalize text-sm"
                  isDisabled={isLoading}
                >
                  {isLoading ? "Updating..." : row.role}
                </Chip>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Role selection"
                selectedKeys={new Set([row.role])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selectedRole = Array.from(keys)[0] as string;
                  if (selectedRole && selectedRole !== row.role) {
                    params.handleRoleChange(
                      row.id,
                      selectedRole,
                      row.is_superuser,
                    );
                  }
                }}
              >
                {ROLES.map((role) => (
                  <DropdownItem key={role.key}>{role.label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Chip
              color={getRoleColor(row.role)}
              variant="flat"
              size="md"
              className="capitalize font-semibold"
            >
              {row.role} (You)
            </Chip>
          )}
        </div>
      );
    },
    loadingRenderer: () => (
      <div className="flex justify-center">
        <Skeleton className="w-24 h-7 rounded-full" />
      </div>
    ),
  } as RmsColumnType<User>;
};

/**
 * Actions Column Layout (Delete Button for Employees)
 */

const UserActionCell = ({ row, onDelete, isUpdating }: UserActionCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      showArrow={true}
      placement="left"
      backdrop="opaque"
    >
      <PopoverTrigger>
        <RmsButton
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          isDisabled={isUpdating}
          className="text-red-500 w-10 h-10"
        >
          <IoTrashOutline className="w-6 h-6 bg-red-500 text-white rounded-full p-1" />
        </RmsButton>
      </PopoverTrigger>
      <PopoverContent className="p-5 max-w-xs">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">
            Delete Employee?
          </p>
          <p className="text-sm text-foreground-500">
            Has <strong>{row.fullName || row.email}</strong> quit the company?
          </p>
          <div className="flex gap-2 justify-end">
            <RmsButton
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </RmsButton>
            <RmsButton
              size="sm"
              variant="danger"
              onClick={() => onDelete(row.id, row.fullName || row.email)}
            >
              Yes, Delete
            </RmsButton>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
export const actionsLayout = (params: ActionsColumnParams) => {
  return {
    label: "Actions",
    key: "actions",
    renderer: (row: User) => (
      <div className="flex items-center gap-2 justify-center">
        {row.role === "employee" && row.id !== params.currentUser?.id ? (
          <UserActionCell
            row={row}
            onDelete={params.handleDeleteUser}
            isUpdating={params.isUpdating}
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    ),
    loadingRenderer: () => <Skeleton className="w-20 h-8 rounded-md" />,
  } as RmsColumnType<User>;
};

/**
 * Status Column Layout
 */
export const statusLayout = (status_column: string = "is_active") => {
  return {
    label: "Status",
    key: status_column,
    renderer: (row: User) => {
      const isActive = row[status_column as keyof User] as boolean;
      return (
        <Chip color={isActive ? "success" : "danger"} variant="solid" size="sm">
          {isActive ? "Active" : "Inactive"}
        </Chip>
      );
    },
    loadingRenderer: () => <Skeleton className="w-16 h-6 rounded-md" />,
  } as RmsColumnType<User>;
};

/**
 * Helper function to create all admin columns at once
 */
export const createAdminColumns = (params: {
  currentUser: User | undefined;
  isUpdating: boolean;
  selectedUserId: number | null;
  handleRoleChange: (
    userId: number,
    newRole: string,
    isSuperuser: boolean,
  ) => void;
  handleDeleteUser: (userId: number, userName: string) => void;
}): RmsColumnType<User>[] => [
  employeeIdLayout({ currentUser: params.currentUser }),
  userNameLayout({ currentUser: params.currentUser }),
  emailLayout(),
  roleLayout({
    currentUser: params.currentUser,
    isUpdating: params.isUpdating,
    selectedUserId: params.selectedUserId,
    handleRoleChange: params.handleRoleChange,
  }),
  statusLayout(),
  actionsLayout({
    currentUser: params.currentUser,
    isUpdating: params.isUpdating,
    handleDeleteUser: params.handleDeleteUser,
  }),
];
