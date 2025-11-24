import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message || "Sign In Failed");
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error.message || "Sign Up Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md bg-white/70 bg-clip-padding backdrop-blur-md backdrop-filter rounded-3xl shadow-2xl p-10 border border-gray-100 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="mb-8 text-gray-500">
          {mode === "signin"
            ? "Log in to your account"
            : "Start your journey with us"}
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 text-gray-900 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {mode === "signup" && (
            <div>
              <input
                type="text"
                placeholder="Name"
                className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 text-gray-900 text-base"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 text-gray-900 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-semibold text-lg shadow-md hover:scale-[1.025] transition-all duration-150 ease-in-out hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-95"
          >
            {loading
              ? "Processing..."
              : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        <div className="w-full flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-3 text-gray-400 font-light">or</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3 flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-lg shadow hover:bg-gray-50 transition disabled:opacity-50"
        >
          <svg width={22} height={22} fill="none" viewBox="0 0 22 22">
            <g>
              <path fill="#4285F4" d="M21.805 11.215c0-.75-.068-1.512-.209-2.245H11v4.26h6.09a5.205 5.205 0 0 1-2.26 3.41v2.825h3.63c2.13-1.885 3.345-4.672 3.345-8.25z" />
              <path fill="#34A853" d="M11 22c2.97 0 5.465-.978 7.287-2.653l-3.63-2.824c-1.008.677-2.3 1.08-3.657 1.08-2.81 0-5.187-1.904-6.042-4.455H1.243v2.884A10.998 10.998 0 0 0 11 22z"/>
              <path fill="#FBBC05" d="M4.958 13.148A6.607 6.607 0 0 1 4.319 11c0-.748.13-1.474.639-2.148V5.968H1.243A10.998 10.998 0 0 0 0 11c0 1.749.417 3.404 1.243 4.882l3.715-2.734z"/>
              <path fill="#EA4335" d="M11 4.296c1.62 0 3.063.572 4.206 1.69l3.155-3.155C16.46 1.133 13.97 0 11 0A10.998 10.998 0 0 0 1.243 5.968l3.715 2.884C5.813 6.2 8.19 4.296 11 4.296z"/>
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="mt-8 text-gray-500">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
