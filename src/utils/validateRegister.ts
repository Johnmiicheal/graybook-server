import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }

  if (options.adminName.length <= 2) {
    return [
      {
        field: "adminName",
        message: "length must be greater than 2",
      },
    ];
  }

  if (options.adminName.includes("@")) {
    return [
      {
        field: "adminName",
        message: "cannot include an @",
      },
    ];
  }

  if (options.phoneNumber.length < 11){
    return [
      {
        field: "phoneNumber",
        message: "Phone Number is invalid"
      }
    ]
  }

  if (options.password.length <= 2) {
    return [
      {
        field: "password",
        message: "length must be greater than 2",
      },
    ];
  }

  return null;
};

export const validateNewPass = (newPassword: string) => {
  if (newPassword.length <= 2) {
    return [
      {
        field: "newPassword",
        message: "length must be greater than 2",
      },
    ];
  }

  return null;
};
