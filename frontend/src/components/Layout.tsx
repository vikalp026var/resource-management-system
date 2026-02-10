import { Outlet } from "react-router-dom";
import RmsNavbar from "./RmsNavbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <RmsNavbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}
