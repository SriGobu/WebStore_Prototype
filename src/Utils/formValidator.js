export const validateFields = ({ name, email, password }) => {
  const errors = {};

  if (name !== undefined) {
    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters long";
    } else if (name.length > 50) {
      errors.name = "Name must be less than 50 characters";
    }
  }

  // email is optional too now — the password-reset step only validates password
  if (email !== undefined) {
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }
  }

  if (password !== undefined) {
    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      errors.password =
      "Password must contain uppercase, lowercase, number and special character";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
