// Pages/Common/ForgotPassword.jsx
import { useNavigate } from "react-router-dom";
import ChangePasswordFlow from "../../Components/Common/ChangePasswordFlow";
import ROUTES from "../../Constants/routeConstants";

export default function ForgotPassword() {
  const navigate = useNavigate();
  return (
    <ChangePasswordFlow
      mode="standalone"
      onDone={() => navigate(ROUTES.LOGIN)}
      onCancel={() => navigate(ROUTES.LOGIN)}
    />
  );
}
