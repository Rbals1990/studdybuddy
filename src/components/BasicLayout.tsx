import { Outlet } from "react-router-dom";

export default function BasicLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#FFFAEF] pb-4 mt-2">
      <a href="/home">
        <img
          src="/sbmascotte.PNG"
          alt="studdybuddy logo"
          className="height-64 w-64 rounded-b-md"
        ></img>
      </a>
      <header className="text-center"></header>

      <main className="w-full max-w-3xl">
        <Outlet />
      </main>
    </div>
  );
}
