import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useLogoutMutation } from "../store/api/authApi";
// import { IoChevronDown } from "react-icons/io5";

export default function RmsNavbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isHR, isAdmin, isEmployee } = useAuth();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Navbar
      className="fixed top-0 left-0 right-0 z-50 bg-background/30 backdrop-blur-lg"
      maxWidth="full"
    >
      <NavbarBrand className="flex-none">
        <NavLink to="/">
          <Logo />
        </NavLink>
      </NavbarBrand>
      <NavbarContent className="flex-1" />
      <NavbarContent justify="end" className="gap-4 flex-none">
        {isAuthenticated ? (
          <>
            <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
              <NavLink to="/home">Home</NavLink>
            </NavbarItem>
            <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
              <NavLink to="/assets">Assets</NavLink>
            </NavbarItem>
            <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
              <NavLink to="/requests">Requests</NavLink>
            </NavbarItem>
            <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
              <NavLink to="/offices">Offices</NavLink>
            </NavbarItem>
            {(isHR || isAdmin) && !isEmployee && (
              <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
                <NavLink to="/admin">Admin</NavLink>
              </NavbarItem>
            )}
            <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
              <Dropdown placement="bottom-end" backdrop="blur">
                <DropdownTrigger>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <Avatar
                      isBordered
                      color="success"
                      showFallback
                      name={user?.fullName || user?.email || "User"}
                      size="sm"
                    />
                    {/* <IoChevronDown className="w-4 h-4 text-foreground" /> */}
                  </div>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  classNames={{
                    base: "rounded-2xl",
                  }}
                >
                  <DropdownItem key="profile">
                    <p className="font-semibold truncate">
                      Hello {user?.fullName}
                    </p>
                  </DropdownItem>
                  <DropdownItem key="role">Role: {user?.role}</DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    onClick={handleLogout}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <NavLink
              to="/login"
              className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200"
            >
              Login
            </NavLink>
          </NavbarItem>
        )}
        <NavbarItem className="inline-block text-sm font-medium hover:scale-105 transition-all duration-200">
          <ThemeToggle />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
