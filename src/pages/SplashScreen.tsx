
import pandauraLogo from "../assets/logo.png"; 

export default function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center space-y-6">
        <img
          src={pandauraLogo}
          alt="Pandaura Logo"
          className="h-48 w-auto animate-pulse filter-none"
          style={{ filter: 'none', imageRendering: 'crisp-edges' }}
        />
        <p className="text-primary text-lg font-semibold animate-pulse">Loading Pandaura...</p>
      </div>
    </div>
  );
}
