export const validateSchool = (schoolName: string, address: string) => {
    if (schoolName.length <= 2) {
        return [
          {
            field: "schoolName",
            message: "length must be greater than 2",
          },
        ];
      }
    
      if (schoolName.includes("@")) {
        return [
          {
            field: "schoolName",
            message: "cannot include an @",
          },
        ];
      }
    
      if (address.length <= 2) {
        return [
          {
            field: "address",
            message: "length must be greater than 2",
          },
        ];
      }
    
      return null;
}