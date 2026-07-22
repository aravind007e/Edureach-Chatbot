import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUp";
import Navbar from "./components/Navbar";
import ChatDrawer from "./components/ChatDrawer";
import { useChat } from "./context/ChatContext";

const WithNavbar = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

const ChatProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return <ChatProvider userName={user?.name?.split(" ")[0]}>{children}</ChatProvider>;
};

const ChatDrawerWrapper = () => {
  const { chatOpen, setChatOpen } = useChat();
  return <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProviderWrapper>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={
              <WithNavbar>
                <HomePage />
              </WithNavbar>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
          <ChatDrawerWrapper />
        </ChatProviderWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}