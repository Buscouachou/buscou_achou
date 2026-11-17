import { Routes, Route, Navigate } from "react-router-dom";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";
import AuthBridge from "@/components/auth/AuthBridge";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import StorePage from "@/pages/StorePage";
import AuthPage from "@/pages/AuthPage";
import CadastroEmpresa from "@/pages/CadastroEmpresa";
import PainelEmpresa from "@/pages/PainelEmpresa";
import Admin from "@/pages/Admin";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <ClerkAuthProvider>
      <AuthBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/loja/:id" element={<StorePage />} />
          <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
          <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />
          <Route path="/cadastro" element={<Navigate to="/sign-up" replace />} />
          <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
          <Route path="/painel-empresa" element={<PainelEmpresa />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </ClerkAuthProvider>
  );
}
