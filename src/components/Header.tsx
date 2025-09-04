export default function Header() {
  return (
    <header className="flex items-center justify-between bg-surface px-6 py-3 border-b">
      <div className="flex items-center">
        <button
          className="hover:opacity-80 transition-opacity font-bold text-lg text-primary"
          title="Pandaura AS"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span className="text-black">Pandaura AS</span>{" "}
          <span className="text-gray-500">v1</span>
        </button>
      </div>
    </header>
  );
}
