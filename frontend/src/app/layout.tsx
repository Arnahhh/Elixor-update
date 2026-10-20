import "./globals.css";

export const metadata = {
  title: "ELIXOR — AI-Assisted Healthcare & Blockchain Audit",
  description: "Web3 wallet identity, cryptographic document audit trails on Ethereum Sepolia, and AI-powered clinical decision support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#030712] text-zinc-100 antialiased relative overflow-x-hidden selection:bg-purple-600/30 selection:text-white">
        {/* Altherix-inspired Ambient Background Glows & Grid */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[130px] animate-pulse-slow" style={{ animationDelay: "4s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
