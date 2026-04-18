export function normalizePnrPassenger(passenger: any | null | undefined) {
  if (!passenger) return null;
  return {
    name: passenger.name || passenger.fullName || null,
    fullName: passenger.fullName || passenger.name || null,
    email: passenger.email || null,
    phone: passenger.phone || passenger.phone_number || null,
    phone_number: passenger.phone_number || passenger.phone || null,
    date_of_birth: passenger.date_of_birth || passenger.dateOfBirth || null,
    dateOfBirth: passenger.dateOfBirth || passenger.date_of_birth || null,
    passport_number:
      passenger.passport_number ||
      passenger.passportNumber ||
      passenger.documentId ||
      null,
    documentId:
      passenger.documentId ||
      passenger.passport_number ||
      passenger.passportNumber ||
      null,
    address: passenger.address || null,
    seat: passenger.seat || null,
    class: passenger.class || passenger.classType || null,
    classType: passenger.classType || passenger.class || null,
  };
}
