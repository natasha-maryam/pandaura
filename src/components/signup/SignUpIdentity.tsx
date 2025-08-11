
import React, { useState, useEffect } from "react";
import { useModuleState } from "../../contexts/ModuleStateContext";
import logo from "../../assets/logo.png";

const industries = ["Technology", "Finance", "Healthcare", "Education", "Other"];
const roles = ["Admin", "Engineer", "User"];


export default function SignUpIdentity({ nextStep, prevStep }: { nextStep: () => void; prevStep: () => void }) {
  const { getModuleState, setModuleState } = useModuleState();
  const signupState = getModuleState("signup");
  const [company, setCompany] = useState(signupState.company || "");
  const [industry, setIndustry] = useState(signupState.industry || "");
  const [role, setRole] = useState(signupState.role || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setModuleState("signup", { ...signupState, company, industry, role });
  }, [company, industry, role, setModuleState]);

  const handleNext = () => {
    const newErrors: { [key: string]: string } = {};
    if (!company) newErrors.company = "Company/Organization name required.";
    if (!industry) newErrors.industry = "Industry required.";
    if (!role) newErrors.role = "Role required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setModuleState("signup", { ...signupState, company, industry, role });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-fit bg-background relative overflow-hidden py-0 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-transparent" />
      </div>

      <div className="z-10 mb-8 flex flex-col items-center">
        <img
          src={logo}
          alt="Pandaura AS Logo"
          className="h-24 w-auto filter-none"
          style={{ filter: "none", imageRendering: "crisp-edges" }}
        />
      </div>

      <div className="w-[600px] max-w-lg bg-surface border border-light rounded-lg shadow-card z-10 p-8">
        <h3 className="text-xl font-semibold text-primary text-center mb-6">
          Identity Verification
        </h3>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
          autoComplete="on"
        >
          <div className="relative">
            <input
              id="company"
              name="company"
              type="text"
              required
              autoFocus
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all"
              placeholder=" "
            />
            <label
              htmlFor="company"
              className="absolute left-4 top-2 text-sm text-muted transition-all peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
            >
              Company / Organization Name
            </label>
            {errors.company && (
              <p className="text-error text-sm mt-2">{errors.company}</p>
            )}
          </div>

          <div className="relative">
            <select
              id="industry"
              name="industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            >
              <option value="" disabled hidden>
                Select Industry...
              </option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <label
              htmlFor="industry"
              className="absolute left-4 top-2 text-sm text-muted transition-all peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
            >
              Industry Sector
            </label>
            {errors.industry && (
              <p className="text-error text-sm mt-2">{errors.industry}</p>
            )}
          </div>

          <div className="relative">
            <select
              id="role"
              name="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            >
              <option value="" disabled hidden>
                Select Role...
              </option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label
              htmlFor="role"
              className="absolute left-4 top-2 text-sm text-muted transition-all peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
            >
              Role
            </label>
            {errors.role && (
              <p className="text-error text-sm mt-2">{errors.role}</p>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-muted font-medium transition-all"
              onClick={prevStep}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-md shadow-sm transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-2 font-medium"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
