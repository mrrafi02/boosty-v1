import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import { Login, Register, ForgotPassword } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import AddFunds from "./pages/AddFunds";
import { Transactions, Notifications, Support, Profile, PublicInfo } from "./pages/SimplePages";
import Admin from "./pages/Admin";

export default function App(){
  return <AuthProvider><Routes>
    <Route element={<PublicLayout/>}>
      <Route path="/" element={<Home/>}/>
      <Route path="/services" element={<Services/>}/>
      <Route path="/faq" element={<PublicInfo title="FAQ"/>}/>
      <Route path="/about" element={<PublicInfo title="About Boosty"/>}/>
      <Route path="/contact" element={<PublicInfo title="Contact"/>}/>
      <Route path="/terms" element={<PublicInfo title="Terms"/>}/>
      <Route path="/privacy" element={<PublicInfo title="Privacy"/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>
    </Route>
    <Route element={<ProtectedRoute/>}><Route element={<AppShell/>}>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/new-order" element={<NewOrder/>}/>
      <Route path="/services" element={<Services/>}/>
      <Route path="/orders" element={<Orders/>}/>
      <Route path="/add-funds" element={<AddFunds/>}/>
      <Route path="/transactions" element={<Transactions/>}/>
      <Route path="/support" element={<Support/>}/>
      <Route path="/notifications" element={<Notifications/>}/>
      <Route path="/profile" element={<Profile/>}/>
    </Route></Route>
    <Route element={<ProtectedRoute admin/>}><Route element={<AppShell/>}><Route path="/admin" element={<Admin/>}/></Route></Route>
    <Route path="*" element={<PublicInfo title="Page not found"/>}/>
  </Routes></AuthProvider>
}