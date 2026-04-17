import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "Engineering",
    phone: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    "Engineering", "Marketing", "Sales", "HR", 
    "Finance", "Operations", "Design", "Support"
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const user = await signup(formData);
      toast.success(`Account created successfully! Welcome, ${user.name}`);
      // Default new signups to Employee workflow naturally
      navigate("/dashboard", { replace: true });
    } catch (error) {
      // Handled by Axios interceptor globally
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 mb-4 border border-indigo-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join the HR Employee Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            name="name"
            type="text"
            label="Full Name *"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
          />
          
          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address *"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              {departments.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="1234567890"
            value={formData.phone}
            onChange={handleChange}
          />
          
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Password *"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Register
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Signup;
