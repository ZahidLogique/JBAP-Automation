import { CarFormData } from "../pages/backoffice/CarFormPage";

export function generateRandom(): string {
  return Date.now().toString().slice(-6);
}

export function generateCarData(rnd: string = generateRandom()): Partial<CarFormData> {
  return {
    storageStatus: "Storage",
    carAddress: `Test Address Auto ${rnd}`,
    crNo: `CR-${rnd}`,
    plateNumber: `TP${rnd}`,
    csNumber: `CS-${rnd}`,
    bodyType: "General 4 Door",
    vehicleType: "Sedan",
    fuelType: "Gas",
    transmissionType: "Automatic",
    displacement: "1500",
    numberOfWheels: "4",
    seatingCapacity: "5",
    numberOfDoors: "4",
    color: "WHITE",
    vehicleClassification: "Public",
    chassisNumber: `AUTOCHASIS${rnd}00001`,
    engineNumber: `AUTOENGINE${rnd}00001`,
    mvFileNumber: `AUTOMVFILE${rnd}00001`,
    lastMiscTransaction: `MISC-${rnd}`,
    ownerName: `Test Owner ${rnd}`,
    ownerAddress: `Test Address ${rnd}`,
    office: `Test Office ${rnd}`,
    officeCode: `TO-${rnd}`,
    orNo: `OR-${rnd}`,
    mileage: `${10000 + parseInt(rnd)}`,
    vehicleOwnershipStatus: "Owned",
  };
}

export const EDIT_DATA: Partial<CarFormData> = {
  mileage: "55000",
  color: "WHITE",
  startPrice: "250000",
};
