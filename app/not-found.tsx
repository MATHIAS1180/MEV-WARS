export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-black text-white mb-4">404</h1>
        <p className="text-zinc-400 mb-8">Page not found</p>
        <a 
          href="/" 
          className="px-6 py-3 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-bold rounded-xl"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
